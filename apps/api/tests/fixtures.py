from dataclasses import dataclass

from app.schemas import FillerHit, Metrics, Transcript, Word


@dataclass
class GoldenCase:
    name: str
    transcript: Transcript
    metrics: Metrics


def _words_from_text(text: str, duration: float) -> list[Word]:
    tokens = text.split()
    step = duration / max(len(tokens), 1)
    return [
        Word(
            text=t,
            start=round(i * step, 3),
            end=round((i + 1) * step - 0.05, 3),
            confidence=0.95,
        )
        for i, t in enumerate(tokens)
    ]


_FILLERY_FAST_TEXT = (
    "So um basically I want to talk about, like, why our team is, you know, "
    "kind of struggling with shipping things on time. Uh, the thing is, we "
    "have, like, way too many meetings, you know, and not enough actual "
    "coding time. So um yeah I think we should, like, cancel half our "
    "standups, you know, and just send Slack updates instead. And uh another "
    "thing is, like, we keep getting pulled into, you know, random fire "
    "drills that aren't really, like, urgent."
)

FILLERY_FAST = GoldenCase(
    name="fillery_fast",
    transcript=Transcript(
        text=_FILLERY_FAST_TEXT,
        words=_words_from_text(_FILLERY_FAST_TEXT, 30.0),
        duration_sec=30.0,
    ),
    metrics=Metrics(
        wpm=182.0,
        fillers=[
            FillerHit(word="um", t=0.5),
            FillerHit(word="like", t=4.1),
            FillerHit(word="like", t=8.2),
            FillerHit(word="uh", t=11.0),
            FillerHit(word="like", t=14.5),
            FillerHit(word="um", t=18.0),
            FillerHit(word="like", t=21.2),
            FillerHit(word="uh", t=24.0),
            FillerHit(word="like", t=27.5),
        ],
        filler_per_min=18.0,
        long_pauses=0,
        monotone_score=0.74,
    ),
)


_CLEAN_PACED_TEXT = (
    "Three weeks ago, my five-year-old asked me what I do at work. I said I "
    "write software. She thought for a second and asked, what does software "
    "want? That question stopped me. Today I want to share three things her "
    "question taught me about building products. First, every product wants "
    "an audience. Second, every product wants to be used, not admired. And "
    "third, every product wants to be told what it is for."
)

CLEAN_PACED = GoldenCase(
    name="clean_paced",
    transcript=Transcript(
        text=_CLEAN_PACED_TEXT,
        words=_words_from_text(_CLEAN_PACED_TEXT, 32.0),
        duration_sec=32.0,
    ),
    metrics=Metrics(
        wpm=143.0,
        fillers=[],
        filler_per_min=0.0,
        long_pauses=3,
        monotone_score=0.32,
    ),
)


_MONOTONE_STRUCTURED_TEXT = (
    "Today I will explain how compound interest works. There are three "
    "ideas to understand. First, interest earns interest, so this year's "
    "gains earn next year's gains. Second, time is the strongest lever, "
    "because each year multiplies the last. Third, small steady "
    "contributions beat a single large one started late, since the early "
    "dollars have the most years to grow. So remember this: start now, "
    "stay steady, and let time do the work."
)

MONOTONE_STRUCTURED = GoldenCase(
    name="monotone_structured",
    transcript=Transcript(
        text=_MONOTONE_STRUCTURED_TEXT,
        words=_words_from_text(_MONOTONE_STRUCTURED_TEXT, 30.0),
        duration_sec=30.0,
    ),
    metrics=Metrics(
        wpm=140.0,
        fillers=[],
        filler_per_min=0.0,
        long_pauses=2,
        monotone_score=0.82,
    ),
)


GOLDEN_SET: list[GoldenCase] = [FILLERY_FAST, CLEAN_PACED, MONOTONE_STRUCTURED]
