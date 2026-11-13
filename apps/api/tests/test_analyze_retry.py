"""`POST /analyze` keeps the audio when a failure is ours, so "Try again" can
re-run the same key, and deletes it on success or on bad input.

Auth, billing, the DB session, R2 and the slow pipeline steps are stubbed; the
metrics, scoring and verification steps run for real.
"""

import pytest
from fastapi import Request
from fastapi.testclient import TestClient

import app.main as main
from app.auth import get_current_user
from app.billing import require_active_plan
from app.db import get_session
from app.rate_limit import limiter
from app.schemas import Synthesis, Transcript
from app.synthesize import SynthesisError
from tests.fixtures import CLEAN_PACED
from tests.test_synthesize_retry import _valid_input

_KEY = "uploads/test-key"


class _FakeSession:
    def __init__(self) -> None:
        self.added: list = []

    def add(self, row) -> None:
        self.added.append(row)

    async def commit(self) -> None:
        pass


async def _user(request: Request) -> str:
    request.state.user_id = "user_test"
    return "user_test"


async def _plan() -> None:
    return None


def _parse_sse(body: str) -> list[tuple[str, dict]]:
    import json

    events = []
    for block in body.strip().split("\n\n"):
        lines = dict(line.split(": ", 1) for line in block.splitlines())
        events.append((lines["event"], json.loads(lines["data"])))
    return events


@pytest.fixture
def api(monkeypatch, short_acoustic):
    """A client plus knobs: `state["synth"]` is what `synthesize` does next,
    `state["transcript"]` what `transcribe` returns, `state["deleted"]` the
    keys passed to `delete_audio`."""
    session = _FakeSession()
    state: dict = {
        "synth": [],
        "transcript": CLEAN_PACED.transcript,
        "deleted": [],
    }

    async def get_fake_session():
        yield session

    async def transcribe(_key):
        return state["transcript"]

    async def run_acoustic(_key):
        return short_acoustic

    async def run_lexical_fillers(_transcript):
        return [], 0.0

    async def synthesize(*_args, **_kwargs):
        outcome = state["synth"].pop(0)
        if isinstance(outcome, Exception):
            raise outcome
        return outcome, 0.04

    monkeypatch.setattr(main, "audio_size", lambda _key: 1_000)
    monkeypatch.setattr(main, "delete_audio", state["deleted"].append)
    monkeypatch.setattr(main, "transcribe", transcribe)
    monkeypatch.setattr(main, "run_acoustic", run_acoustic)
    monkeypatch.setattr(main, "run_lexical_fillers", run_lexical_fillers)
    monkeypatch.setattr(main, "synthesize", synthesize)
    monkeypatch.setattr(limiter, "enabled", False)
    main.app.dependency_overrides.update(
        {
            get_current_user: _user,
            require_active_plan: _plan,
            get_session: get_fake_session,
        }
    )
    # No `with`: skips the lifespan, which would connect to Postgres.
    client = TestClient(main.app)

    def analyze() -> list[tuple[str, dict]]:
        res = client.post("/analyze", json={"key": _KEY, "speech_type": "prepared"})
        assert res.status_code == 200
        return _parse_sse(res.text)

    yield analyze, state, session
    main.app.dependency_overrides.clear()


def _good() -> Synthesis:
    return Synthesis.model_validate(_valid_input())


def test_unexpected_failure_keeps_audio_and_is_retryable(api):
    analyze, state, session = api
    state["synth"] = [SynthesisError("no valid submit_evaluation call")]

    events = analyze()

    name, data = events[-1]
    assert name == "error"
    assert data["retryable"] is True
    assert "SynthesisError" not in data["message"]  # internals stay in the log
    assert state["deleted"] == []
    assert session.added == []


def test_try_again_with_the_same_key_produces_a_report(api):
    analyze, state, session = api
    state["synth"] = [SynthesisError("first run fails"), _good()]

    first = analyze()
    second = analyze()

    assert first[-1][0] == "error" and first[-1][1]["retryable"] is True
    name, data = second[-1]
    assert name == "done" and data["report_id"]
    assert state["deleted"] == [_KEY]  # deleted once, after the report saved
    assert len(session.added) == 1


def test_bad_input_deletes_audio_and_is_not_retryable(api):
    analyze, state, _ = api
    state["transcript"] = Transcript(text="Hi.", words=[], duration_sec=4.0)

    events = analyze()

    name, data = events[-1]
    assert name == "error"
    assert data["retryable"] is False
    assert "shorter than" in data["message"]
    assert state["deleted"] == [_KEY]
