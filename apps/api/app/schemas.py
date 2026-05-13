from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class HealthResponse(BaseModel):
    status: str = Field(description="Always 'ok' if the process is up.")


class SignRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    content_type: str = Field(
        description="MIME type of the file the browser will upload, e.g. 'audio/mpeg'.",
        min_length=1,
    )


class SignResponse(BaseModel):
    url: str = Field(description="Presigned PUT URL the browser uploads bytes to.")
    key: str = Field(description="R2 object key the file will live at.")
    expires_at: datetime = Field(description="UTC timestamp at which the URL stops working.")


class AnalyzeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    key: str = Field(description="R2 object key returned by /uploads/sign.", min_length=1)


class AnalyzeResponse(BaseModel):
    report_id: str = Field(description="Identifier the client uses to fetch the finished report.")


class Word(BaseModel):
    text: str
    start: float = Field(ge=0, description="Seconds from start of audio.")
    end: float = Field(ge=0)
    confidence: float = Field(ge=0, le=1, description="Deepgram per-word confidence, 0..1.")

    @model_validator(mode="after")
    def _end_after_start(self) -> "Word":
        if self.end < self.start:
            raise ValueError("Word.end must be >= Word.start")
        return self


class Transcript(BaseModel):
    text: str = Field(description="Full joined transcript text.")
    words: list[Word]
    duration_sec: float = Field(ge=0)


class TimelinePoint(BaseModel):
    t: float = Field(ge=0, description="Seconds since start of audio.")
    pitch_hz: float | None = Field(default=None, description="None during silence/unvoiced.")
    wpm_local: float = Field(ge=0, description="Rolling words-per-minute around this point.")


class Pause(BaseModel):
    start: float = Field(ge=0)
    end: float = Field(ge=0)

    @model_validator(mode="after")
    def _end_after_start(self) -> "Pause":
        if self.end < self.start:
            raise ValueError("Pause.end must be >= Pause.start")
        return self


class Acoustic(BaseModel):
    timeline: list[TimelinePoint]
    pauses: list[Pause]
    pitch_mean_hz: float = Field(ge=0)
    pitch_std_hz: float = Field(ge=0)


class FillerHit(BaseModel):
    word: str
    t: float = Field(ge=0)


class Metrics(BaseModel):
    wpm: float = Field(ge=0, description="Average words per minute over the whole speech.")
    fillers: list[FillerHit]
    filler_per_min: float = Field(ge=0)
    long_pauses: int = Field(ge=0, description="Count of pauses longer than the threshold.")
    monotone_score: float = Field(
        ge=0, le=1, description="0 = lots of pitch variation, 1 = flat monotone."
    )


# The four models below are the LLM's structured output. `extra="forbid"` forces
# `additionalProperties: false` in the generated JSON Schema — required by
# Anthropic's structured-outputs feature (server-side schema enforcement).
class CategoryScore(BaseModel):
    model_config = ConfigDict(extra="forbid")
    # Literal generates `enum: [1,2,3,4,5]` in the JSON schema — supported by
    # Anthropic structured outputs (unlike `minimum`/`maximum` from `Field(ge,le)`).
    score: Literal[1, 2, 3, 4, 5] = Field(description="1 = needs work, 5 = excellent.")
    rationale: str


class Action(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str
    detail: str


class Rewrite(BaseModel):
    """A line-level rewrite suggestion grounded in a specific phrasing the speaker used."""

    model_config = ConfigDict(extra="forbid")
    original: str = Field(description="A short verbatim phrasing from the transcript.")
    suggested: str = Field(description="A sharper rewrite of `original` in the speaker's voice.")
    why: str = Field(description="One sentence explaining what the rewrite fixes.")


class Synthesis(BaseModel):
    model_config = ConfigDict(extra="forbid")
    fillers: CategoryScore
    pacing: CategoryScore
    vocal_variety: CategoryScore
    structure: CategoryScore
    top_actions: list[Action] = Field(description="Top 3 prioritised improvement suggestions.")
    rewrites: list[Rewrite] = Field(
        description="2-4 line-level rewrites: quote a specific phrasing the speaker used (verbatim) and propose a sharper alternative."
    )
    summary: str


class LlmCost(BaseModel):
    """USD cost of the LLM calls for one report."""

    total_usd: float = Field(ge=0)


class Report(BaseModel):
    report_id: str
    audio_key: str
    created_at: datetime
    duration_sec: float = Field(ge=0)
    transcript: Transcript
    acoustic: Acoustic
    metrics: Metrics
    synthesis: Synthesis
    cost: LlmCost | None = None
