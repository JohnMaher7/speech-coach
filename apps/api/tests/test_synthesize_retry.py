"""`synthesize` returns a report or retries once, without the real API.

The fake client replays canned responses. The bad shapes are the ones seen in
production: `walkthrough` sent as a JSON string that swallowed the fields
after it, no tool call at all, and a `max_tokens` cut-off.
"""

import json
from types import SimpleNamespace

import pytest
from anthropic.types import Usage

import app.synthesize as synth
from app.cost import usage_cost
from app.schemas import (
    Acoustic,
    Beat,
    Categories,
    CategoryScore,
    Priority,
    Synthesis,
    Walkthrough,
)
from tests.fixtures import CLEAN_PACED

_USAGE = Usage(
    input_tokens=1_500,
    output_tokens=3_000,
    cache_creation_input_tokens=0,
    cache_read_input_tokens=9_000,
)
_CALL_COST = usage_cost(synth._MODEL, _USAGE)

_EMPTY_ACOUSTIC = Acoustic(
    timeline=[], pauses=[], pitch_mean_hz=0.0, pitch_std_hz=0.0, pitch_std_st=0.0
)


def _beat(t: float) -> Beat:
    return Beat(
        start_t=t,
        end_t=t + 5.0,
        observation="obs",
        praise=None,
        critique=None,
        quote_t=None,
    )


def _valid_input() -> dict:
    five = CategoryScore(
        score=5, rationale="r", evidence=[], counts=[], applicability_reason=None
    )
    return Synthesis(
        headline="A clean, steady talk.",
        message_sentence="Small habits compound.",
        walkthrough=Walkthrough(opening=_beat(0.0), body=[], close=_beat(25.0)),
        categories=Categories(**{k: five for k in Categories.model_fields}),
        priorities=[
            Priority(
                title="t",
                observation="o",
                example_quote="q",
                example_t=1.0,
                why_it_matters="w",
                drill="d",
            )
        ],
        rewrites=[],
    ).model_dump(mode="json")


def _stringified_walkthrough_input() -> dict:
    """The 13 Nov failure: the walkthrough arrives as a string and the fields
    after it end up inside that string."""
    good = _valid_input()
    tail = {k: good[k] for k in ("walkthrough", "categories", "priorities", "rewrites")}
    return {
        "headline": good["headline"],
        "message_sentence": good["message_sentence"],
        "walkthrough": json.dumps(tail),
    }


def _tool_response(tool_input: dict, stop_reason: str = "tool_use"):
    block = SimpleNamespace(type="tool_use", name=synth._TOOL_NAME, input=tool_input)
    return SimpleNamespace(content=[block], stop_reason=stop_reason, usage=_USAGE)


def _text_response():
    block = SimpleNamespace(type="text", text="Here is my evaluation...")
    return SimpleNamespace(content=[block], stop_reason="end_turn", usage=_USAGE)


class _FakeClient:
    def __init__(self, responses: list) -> None:
        self._responses = list(responses)
        self.calls: list[dict] = []
        self.messages = self

    async def create(self, **kwargs):
        self.calls.append(kwargs)
        return self._responses.pop(0)


@pytest.fixture
def fake(monkeypatch):
    def install(*responses) -> _FakeClient:
        client = _FakeClient(list(responses))
        monkeypatch.setattr(synth, "_client", client)
        return client

    return install


async def _run(speech_type="prepared"):
    return await synth.synthesize(
        CLEAN_PACED.transcript,
        _EMPTY_ACOUSTIC,
        CLEAN_PACED.metrics,
        speech_type=speech_type,
    )


async def test_stringified_walkthrough_is_retried_into_a_report(fake):
    client = fake(
        _tool_response(_stringified_walkthrough_input()),
        _tool_response(_valid_input()),
    )

    result, cost = await _run()

    assert isinstance(result, Synthesis)
    assert result.headline == "A clean, steady talk."
    assert len(client.calls) == 2
    assert client.calls[0] == client.calls[1]  # the retry is the same request
    assert cost == pytest.approx(2 * _CALL_COST)  # both attempts are billed


@pytest.mark.parametrize(
    "first",
    [
        pytest.param(_text_response(), id="no-tool-call"),
        pytest.param(_tool_response({}, stop_reason="max_tokens"), id="max-tokens"),
    ],
)
async def test_missing_or_cut_off_tool_call_is_retried(fake, first):
    client = fake(first, _tool_response(_valid_input()))

    result, _ = await _run()

    assert isinstance(result, Synthesis)
    assert len(client.calls) == 2


async def test_two_failures_raise_synthesis_error(fake):
    client = fake(
        _tool_response(_stringified_walkthrough_input()),
        _text_response(),
    )

    with pytest.raises(synth.SynthesisError, match="after 2 attempts"):
        await _run()
    assert len(client.calls) == 2


async def test_valid_first_call_is_not_retried(fake):
    client = fake(_tool_response(_valid_input()))

    _, cost = await _run()

    assert len(client.calls) == 1
    assert cost == pytest.approx(_CALL_COST)
    request = client.calls[0]
    # Sonnet 5.5 rejects forced tool choice; strict + auto is the supported pair.
    assert request["tool_choice"] == {"type": "auto"}
    assert request["tools"] == synth._TOOLS
    assert request["system"][0]["cache_control"] == {"type": "ephemeral"}


_UNSUPPORTED_STRICT_KEYWORDS = {
    "minimum",
    "maximum",
    "exclusiveMinimum",
    "exclusiveMaximum",
    "multipleOf",
    "minLength",
    "maxLength",
    "maxItems",
    "uniqueItems",
}


def _walk(node):
    if isinstance(node, dict):
        yield node
        for value in node.values():
            yield from _walk(value)
    elif isinstance(node, list):
        for value in node:
            yield from _walk(value)


def test_tool_schema_stays_within_strict_mode_rules():
    """Guards `schemas.py` edits: strict mode 400s on these, and the API's
    complexity limits are 24 optional and 16 union-typed parameters."""
    tool = synth._TOOLS[0]
    assert tool["strict"] is True
    schema = tool["input_schema"]

    unions = 0
    for node in _walk(schema):
        assert not _UNSUPPORTED_STRICT_KEYWORDS & node.keys(), node
        if "properties" in node:
            assert node.get("additionalProperties") is False, node
            # Every field required: an optional field counts toward the limit
            # and would also reorder the output.
            assert set(node["required"]) == set(node["properties"]), node
            unions += sum(
                "anyOf" in p or isinstance(p.get("type"), list)
                for p in node["properties"].values()
            )
        if "minItems" in node:
            assert node["minItems"] in (0, 1), node
    assert unions <= 16
