from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, computed_field, model_validator


class HealthResponse(BaseModel):
    status: str = Field(description="Always 'ok' if the process is up.")


class SignRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    content_type: str = Field(
        description="MIME type of the file the browser will upload, e.g. 'audio/mpeg'.",
        min_length=1,
    )


class SignResponse(BaseModel):
    url: str = Field(
        description="Presigned PUT URL the browser uploads bytes to.")
    key: str = Field(description="R2 object key the file will live at.")
    expires_at: datetime = Field(
        description="UTC timestamp at which the URL stops working.")


SpeechType = Literal["prepared", "impromptu", "presentation"]


class AnalyzeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    key: str = Field(
        description="R2 object key returned by /uploads/sign.", min_length=1)
    speech_type: SpeechType | None = Field(
        default=None,
        description="Optional hint from the upload form. Drives weighting of "
        "the overall score (e.g. impromptu drops `closing`) and the prompt's "
        "scoring anchors. `None` means the server falls back to 'prepared'.",
    )


class AnalyzeResponse(BaseModel):
    report_id: str = Field(
        description="Identifier the client uses to fetch the finished report.")


class Word(BaseModel):
    text: str
    start: float = Field(ge=0, description="Seconds from start of audio.")
    end: float = Field(ge=0)
    confidence: float = Field(
        ge=0, le=1, description="Deepgram per-word confidence, 0..1.")

    @model_validator(mode="after")
    def _end_after_start(self) -> "Word":
        if self.end < self.start:
            raise ValueError("Word.end must be >= Word.start")
        return self


class Utterance(BaseModel):
    """Deepgram-provided sentence boundary. Empty list if utterances/paragraphs
    were unavailable — `build_segments` falls back to punctuation or pauses."""

    start: float = Field(ge=0)
    end: float = Field(ge=0)
    text: str

    @model_validator(mode="after")
    def _end_after_start(self) -> "Utterance":
        if self.end < self.start:
            raise ValueError("Utterance.end must be >= Utterance.start")
        return self


class Transcript(BaseModel):
    text: str = Field(description="Full joined transcript text.")
    words: list[Word]
    duration_sec: float = Field(ge=0)
    utterances: list[Utterance] = Field(
        default_factory=list,
        description="Sentence-level boundaries from Deepgram (when `paragraphs=true`).",
    )


class TimelinePoint(BaseModel):
    t: float = Field(ge=0, description="Seconds since start of audio.")
    pitch_hz: float | None = Field(
        default=None, description="None during silence/unvoiced.")
    pitch_st: float | None = Field(
        default=None,
        description="Pitch in semitones relative to the speaker's voiced mean. None during silence/unvoiced.",
    )
    wpm_local: float = Field(
        ge=0, description="Rolling words-per-minute around this point.")


class Pause(BaseModel):
    start: float = Field(ge=0)
    end: float = Field(ge=0)
    prev_word: str | None = Field(
        default=None, description="Last spoken word ending before the pause; None if none."
    )
    next_word: str | None = Field(
        default=None, description="First spoken word starting after the pause; None if none."
    )

    @model_validator(mode="after")
    def _end_after_start(self) -> "Pause":
        if self.end < self.start:
            raise ValueError("Pause.end must be >= Pause.start")
        return self

    @computed_field
    @property
    def duration_sec(self) -> float:
        return round(self.end - self.start, 3)


BoundaryTone = Literal["rising", "falling", "flat"]


class ProminentWord(BaseModel):
    """The single word inside a segment that carries the most emphasis,
    chosen by combining a local pitch peak with an intensity peak."""

    text: str
    t: float = Field(
        ge=0, description="Word start time, seconds from audio start.")


class Segment(BaseModel):
    """One sentence or clause with placement-aware prosody."""

    start: float = Field(ge=0)
    end: float = Field(ge=0)
    text: str
    word_indices: list[int] = Field(
        description="Indices into Transcript.words covered by this segment."
    )
    pitch_mean_st: float | None = Field(
        default=None,
        description="Segment mean pitch in semitones relative to the speaker's voiced mean. "
        "None when no voiced frames fall in the window.",
    )
    pitch_range_st: float = Field(
        ge=0, description="Max-minus-min voiced pitch in semitones within the segment."
    )
    intensity_mean_db: float
    intensity_peak_db: float
    wpm_local: float = Field(ge=0)
    boundary_tone: BoundaryTone | None = Field(
        default=None,
        description="Terminal pitch contour (rising/falling/flat). None when the "
        "segment has too few voiced frames near its tail to classify.",
    )
    prominent_word: ProminentWord | None = Field(
        default=None,
        description="Most emphasised word in the segment, or None if no voiced "
        "or intensity peak rises above the segment baseline.",
    )

    @model_validator(mode="after")
    def _end_after_start(self) -> "Segment":
        if self.end < self.start:
            raise ValueError("Segment.end must be >= Segment.start")
        return self


class Acoustic(BaseModel):
    timeline: list[TimelinePoint]
    pauses: list[Pause]
    pitch_mean_hz: float = Field(ge=0)
    pitch_std_hz: float = Field(ge=0)
    pitch_std_st: float = Field(
        ge=0,
        description="Standard deviation of voiced pitch in semitones. Speaker-"
        "uniform (a 12-st octave reads the same at 100 Hz and 200 Hz). Drives "
        "Metrics.monotone_score.",
    )
    segments: list[Segment] = Field(default_factory=list)


FillerCategory = Literal["interjection", "hedge", "verbal_pause", "tic"]


class FillerHit(BaseModel):
    word: str
    t: float = Field(ge=0)
    category: FillerCategory = Field(
        default="interjection",
        description="`interjection` for token-matched um/uh/er. `hedge` "
        "(kind of, sort of), `verbal_pause` (like, you know), and `tic` "
        "(speaker-specific repeated phrases) come from the Haiku pass.",
    )


class Metrics(BaseModel):
    wpm: float = Field(
        ge=0, description="Average words per minute over the whole speech.")
    fillers: list[FillerHit]
    filler_per_min: float = Field(ge=0)
    long_pauses: int = Field(
        ge=0, description="Count of pauses longer than the threshold.")
    monotone_score: float = Field(
        ge=0, le=1, description="0 = lots of pitch variation, 1 = flat monotone."
    )


# The models below are the LLM's structured output. `extra="forbid"` forces
# `additionalProperties: false` in the generated JSON Schema — required by
# Anthropic's structured-outputs feature (server-side schema enforcement).
# Anthropic also requires every property to appear in the schema's `required`
# array, so none of these fields carry defaults; nullable fields use `X | None`
# without a default so they stay required AND can be set to null.

CategoryScoreValue = Literal[1, 2, 3, 4, 5, "n/a"]


class Evidence(BaseModel):
    """A verbatim phrase the speaker said, anchored to its time in the audio."""

    model_config = ConfigDict(extra="forbid")
    quote: str
    # No `ge=0` here — Anthropic structured outputs rejects `minimum`/`maximum`
    # on numeric fields. Same applies to every `_t` field in this module that
    # appears in a structured-output schema.
    t: float = Field(description="Seconds from start of audio.")


class CategoryScore(BaseModel):
    """One of the eight rubric categories. Sub-5 scores must cite ≥1 piece of
    evidence; `"n/a"` requires an `applicability_reason`."""

    model_config = ConfigDict(extra="forbid")
    score: CategoryScoreValue = Field(
        description="1 = needs work, 5 = excellent, or 'n/a' for categories "
        "that do not apply to this speech (e.g. closing on a snippet)."
    )
    rationale: str
    evidence: list[Evidence]
    applicability_reason: str | None = Field(
        description="Required when score == 'n/a'; null otherwise."
    )

    @model_validator(mode="after")
    def _check_evidence_and_applicability(self) -> "CategoryScore":
        if self.score == "n/a":
            if not self.applicability_reason:
                raise ValueError(
                    "CategoryScore with score='n/a' requires applicability_reason"
                )
        elif isinstance(self.score, int) and self.score < 5 and not self.evidence:
            raise ValueError(
                "CategoryScore with score < 5 requires at least one Evidence quote"
            )
        return self


class Beat(BaseModel):
    """One moment in the walk-through. `praise` and `critique` are independent —
    a single beat can hold both, either, or just `observation` on its own."""

    model_config = ConfigDict(extra="forbid")
    start_t: float
    end_t: float
    observation: str
    praise: str | None
    critique: str | None
    quote_t: float | None = Field(
        description="Timestamp of a key word/phrase in this beat, or null."
    )


class Walkthrough(BaseModel):
    model_config = ConfigDict(extra="forbid")
    opening: Beat
    body: list[Beat]
    close: Beat


class Categories(BaseModel):
    """The eight-category rubric. `closing` is the one most likely to come back
    as `'n/a'` (e.g. on a 30-second impromptu clip)."""

    model_config = ConfigDict(extra="forbid")
    hook: CategoryScore
    message_focus: CategoryScore
    structure: CategoryScore
    closing: CategoryScore
    pacing: CategoryScore
    pauses: CategoryScore
    vocal_variety: CategoryScore
    language: CategoryScore


class HabitCountItem(BaseModel):
    model_config = ConfigDict(extra="forbid")
    label: str
    count: int


class HabitSection(BaseModel):
    """Deep-dive on one delivery habit. UI renders this only when the
    surrounding `delivery_habits.<key>` is non-null."""

    model_config = ConfigDict(extra="forbid")
    score: CategoryScoreValue
    summary: str
    examples: list[Evidence]
    counts: list[HabitCountItem] = Field(
        description="Optional numeric breakdown — e.g. {'um': 12, 'like': 8}. "
        "Empty list when no useful counts apply."
    )


class DeliveryHabits(BaseModel):
    """Each field is null when its category scored 5 (nothing to coach on).
    Stage 32 will render only the non-null sections."""

    model_config = ConfigDict(extra="forbid")
    fillers: HabitSection | None
    pauses: HabitSection | None
    pace: HabitSection | None
    vocal_variety: HabitSection | None
    language: HabitSection | None


class Priority(BaseModel):
    """One of the 2-3 ranked actions. Each must quote the speaker and give a
    drill that's specific to what was observed."""

    model_config = ConfigDict(extra="forbid")
    title: str
    observation: str
    example_quote: str
    example_t: float
    why_it_matters: str
    drill: str


class Rewrite(BaseModel):
    """A line-level rewrite suggestion grounded in a specific phrasing the speaker used."""

    model_config = ConfigDict(extra="forbid")
    original: str = Field(
        description="A short verbatim phrasing from the transcript.")
    suggested: str = Field(
        description="A sharper rewrite of `original` in the speaker's voice.")
    why: str = Field(
        description="One sentence explaining what the rewrite fixes.")


class Synthesis(BaseModel):
    """Schema v2 — Stage 29. Layered: a headline, a chronological walk-through,
    eight rubric categories (each with evidence), conditional deep-dive
    `delivery_habits`, 2-3 ranked priorities, and 0-4 rewrites."""

    model_config = ConfigDict(extra="forbid")
    headline: str = Field(
        description="One short sentence that captures the speech's character.")
    message_sentence: str | None = Field(
        description="A single sentence that states the speech's core idea, "
        "or null if no clear thesis is findable. Do not stretch to fill"
    )
    walkthrough: Walkthrough
    categories: Categories
    delivery_habits: DeliveryHabits
    priorities: list[Priority] = Field(
        description="2 or 3 ranked actions, highest-impact first."
    )
    rewrites: list[Rewrite] = Field(
        description="0-4 line-level rewrites of weak phrasings the speaker used."
    )


class LlmCost(BaseModel):
    """USD cost of the LLM calls for one report."""

    total_usd: float = Field(ge=0)
    synthesis_usd: float = Field(default=0.0, ge=0)
    lexical_fillers_usd: float = Field(default=0.0, ge=0)


VerificationIssueKind = Literal[
    "quote_not_found",
    "timestamp_out_of_range",
    "missing_evidence",
]


class VerificationIssue(BaseModel):
    """One concrete grounding problem found in `Synthesis` after the model
    returned. `location` is a dotted path (e.g. `categories.pacing.evidence[0]`,
    `priorities[1]`) so the UI/logs can point to the exact field."""

    kind: VerificationIssueKind
    location: str
    detail: str


class Verification(BaseModel):
    """Result of the post-synthesis grounding check. Non-blocking — the report
    is still persisted when `passed=False`; the field exists so the harness in
    Stage 33 can track pass-rate over time, and so the UI can later surface
    weak evidence to the user."""

    passed: bool
    issues: list[VerificationIssue] = Field(default_factory=list)


class Overall(BaseModel):
    """Server-computed weighted overall score. Replaces the client-side average
    of four cards used through Stage 30. `weights_version` lets the harness in
    Stage 33 detect when a regression is caused by a weight change rather than
    a prompt change. `applicable_categories` lists the categories that
    actually contributed — anything scored `"n/a"` is excluded and its weight
    redistributed proportionally across the remainder."""

    score: float = Field(ge=0, le=5)
    weights_version: int
    weights: dict[str, float]
    applicable_categories: list[str]


class Report(BaseModel):
    report_id: str
    audio_key: str
    created_at: datetime
    duration_sec: float = Field(ge=0)
    # Bumped from implicit v1 to explicit v2 in Stage 29. Bumped to v3 in
    # Stage 31 when the prosody pipeline added robust pitch. Bumped to v4
    # within Stage 31 when intensity dynamics were dropped — phonetic
    # variation and recording-level confounds made the metric unreliable;
    # `vocal_variety` now scores on pitch alone. The `/reports/{id}`
    # endpoint returns 410 Gone for any persisted payload at an older version.
    schema_version: Literal[4] = 4
    speech_type: SpeechType | None = None
    transcript: Transcript
    acoustic: Acoustic
    metrics: Metrics
    synthesis: Synthesis
    verification: Verification
    overall: Overall
    cost: LlmCost | None = None


class DashboardReport(BaseModel):
    """A one-line summary of a report for the user's dashboard list.

    Deliberately small — the full `Report` payload carries the whole
    transcript and timeline, far too heavy to fetch dozens at a time."""

    report_id: str
    created_at: datetime
    duration_sec: float
    speech_type: SpeechType | None = None
    headline: str
    overall_score: float
