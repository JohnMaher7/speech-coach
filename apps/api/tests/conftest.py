import pytest

from app.acoustic import AcousticFeatures
from app.schemas import Pause, Transcript, Word


@pytest.fixture
def short_transcript() -> Transcript:
    return Transcript(
        text="So um I think uh this works.",
        words=[
            Word(text="So", start=0.0, end=0.3, confidence=0.99),
            Word(text="um", start=0.4, end=0.6, confidence=0.95),
            Word(text="I", start=0.7, end=0.8, confidence=0.99),
            Word(text="think", start=0.9, end=1.2, confidence=0.99),
            Word(text="uh", start=1.5, end=1.7, confidence=0.95),
            Word(text="this", start=1.8, end=2.0, confidence=0.99),
            Word(text="works.", start=2.1, end=2.4, confidence=0.99),
        ],
        duration_sec=60.0,
    )


@pytest.fixture
def short_acoustic() -> AcousticFeatures:
    return AcousticFeatures(
        duration_sec=60.0,
        pitch_times=[0.0, 0.5, 1.0, 1.5, 2.0],
        pitch_values=[120.0, 122.0, None, 125.0, 121.0],
        pauses=[
            Pause(start=2.5, end=4.0),
            Pause(start=10.0, end=10.6),
        ],
        pitch_mean_hz=121.4,
        pitch_std_hz=30.0,
    )
