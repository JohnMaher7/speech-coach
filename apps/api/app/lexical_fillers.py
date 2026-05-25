"""Haiku-powered lexical filler detector.

Token-based detection (in `metrics._detect_fillers`) catches the obvious
interjections — `um`, `uh`, `er`. Many common fillers are real English words
used as discourse markers: `like`, `you know`, `kind of`, `sort of`,
`basically`, `actually`. Distinguishing those from their literal uses
("flew like a bird") is a judgement call, not a regex problem — so we ask
Claude Haiku 4.5 to do it.

Runs concurrently with `transcribe` and `analyze_audio` in `main.analyze`.
If it fails or times out, the pipeline continues with token-only fillers
(see the gather call there).
"""

import json
import logging

from anthropic import AsyncAnthropic
from pydantic import BaseModel, ConfigDict

from app.config import settings
from app.cost import usage_cost
from app.schemas import FillerCategory, FillerHit, Transcript

logger = logging.getLogger(__name__)

_client = AsyncAnthropic(api_key=settings.anthropic_api_key)

_MODEL = "claude-haiku-4-5"

# Words sent to the model are timestamped, so the model can return a `t` that
# resolves to the exact word it flagged. We deliberately do not pass the joined
# transcript text; the per-word table is enough and forces the model to commit
# to a specific timestamp rather than paraphrasing.
_SYSTEM_PROMPT = """You are a speech-coach assistant. You read a timestamped list of words from one speaker and identify *lexical fillers*: words used as discourse padding rather than for their literal meaning.

Flag a token only if it is functioning as a filler in context.

# Categories
- `hedge`: softens or weakens a claim. Examples: `kind of`, `sort of`, `basically`, `actually`, `pretty`, `just`. Only flag when the speaker is hedging — `actually` in "we actually shipped it" is a filler; in "is that actually true?" it is content.
- `verbal_pause`: stalls while the speaker thinks. Examples: `like`, `you know`, `I mean`, `right`, `so` (sentence-initial). `like` is a filler in "we were like ready to go"; it is content in "she ran like a deer".
- `tic`: a speaker-specific repeated phrase that is clearly habitual (same phrase 3+ times). Use sparingly.

Do NOT flag:
- The pure interjections `um`, `uh`, `er`, `ah`, `hmm`, `uhm` — those are caught upstream.
- Words used for their literal meaning (comparison, emphasis with intent, content adverbs).
- The first occurrence of a discourse marker if it is clearly intentional rhetoric.

# Output
Return ONLY JSON matching the schema. Each hit references one token from the input by its `t` value (the word's start time). Use the word's surface form as it appears in the input."""


class _LexicalHit(BaseModel):
    """Single Haiku-flagged token. Mirrors FillerHit but with stricter
    structured-output enforcement. `t` carries no `ge=0` constraint because
    Anthropic structured outputs rejects numeric `minimum`/`maximum`."""

    model_config = ConfigDict(extra="forbid")
    word: str
    t: float
    category: FillerCategory


class _LexicalFillerResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    fillers: list[_LexicalHit]


_OUTPUT_CONFIG = {
    "format": {
        "type": "json_schema",
        "schema": _LexicalFillerResponse.model_json_schema(),
    }
}


async def detect_lexical_fillers(
    transcript: Transcript,
) -> tuple[list[FillerHit], float]:
    """Ask Haiku to flag discourse-marker fillers. Returns (hits, cost_usd).

    Raises on API failure — the caller in `main.analyze` swallows the
    exception so the pipeline keeps running with token-only fillers.
    """

    if not transcript.words:
        return [], 0.0

    word_lines = "\n".join(
        f"t={w.start:.2f}  {w.text}" for w in transcript.words
    )
    user_content = f"Words from one speaker:\n{word_lines}"

    response = await _client.messages.create(
        model=_MODEL,
        max_tokens=2048,
        system=[
            {
                "type": "text",
                "text": _SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        output_config=_OUTPUT_CONFIG,
        messages=[{"role": "user", "content": user_content}],
    )

    usage = response.usage
    cost = usage_cost(_MODEL, usage)
    logger.info(
        "lexical_fillers usage: input=%d cache_create=%s cache_read=%s output=%d cost=$%.5f",
        usage.input_tokens,
        usage.cache_creation_input_tokens,
        usage.cache_read_input_tokens,
        usage.output_tokens,
        cost,
    )

    for block in response.content:
        if block.type == "text":
            parsed = _LexicalFillerResponse.model_validate(json.loads(block.text))
            hits = [
                FillerHit(
                    word=h.word.strip().lower().rstrip(".,!?;:"),
                    t=round(h.t, 3),
                    category=h.category,
                )
                for h in parsed.fillers
            ]
            return hits, cost

    raise RuntimeError(
        f"Haiku did not return a text block. stop_reason={response.stop_reason}"
    )
