"""Print the section-level volume metric for local audio clips.

Use this to CALIBRATE the vocal-variety thresholds in `app/synthesize.py`
(the `volume_range_db` cutoffs: flat < 1.5, modest 1.5-4, strong >= 4 dB). It
runs Deepgram transcription + acoustic analysis + `compute_metrics`, but NOT the
Claude synthesis tail — so each clip costs one Deepgram call and zero Anthropic
credits.

Usage (run from apps/api/):
    # Pass clips directly:
    uv run python scripts/calibrate_volume.py clip_monotone.mp3 clip_lively.wav

    # ...or drop clips into ./calibration_samples/ and run with no arguments:
    uv run python scripts/calibrate_volume.py

For each clip it prints `volume_range_db` (the number the prompt thresholds
judge), `monotone_score`, and the per-phrase loudness values — so you can line
up clips you can judge by ear against the cutoffs and move them to where they
actually separate flat from expressive.
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

# Make `import app` work when invoked as `python scripts/calibrate_volume.py`
# (apps/api is the project root, two levels up from this file).
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.acoustic import analyze_audio  # noqa: E402
from app.metrics import build_segments, compute_metrics  # noqa: E402
from app.pipeline import _transcribe_from_path  # noqa: E402

# Deepgram + ffmpeg between them handle every common container. wav/flac/ogg and
# (usually) mp3 decode natively; m4a/mp4/aac/webm need ffmpeg on PATH.
AUDIO_EXTS = {
    ".mp3", ".wav", ".m4a", ".aac", ".flac",
    ".ogg", ".oga", ".opus", ".webm", ".mp4",
}
DEFAULT_DIR = Path("calibration_samples")


async def _report_one(path: Path) -> None:
    transcript = await _transcribe_from_path(path)
    features = await asyncio.to_thread(analyze_audio, str(path))
    segments = build_segments(transcript, features)
    metrics = compute_metrics(transcript, features, segments=segments)

    loud = sorted(s.intensity_mean_db for s in segments if s.intensity_mean_db > 0)
    note = (
        ""
        if metrics.volume_range_db is not None
        else "  (None — fewer than 3 voiced phrases; use a longer clip)"
    )

    print(f"\n=== {path.name} ===")
    print(
        f"  {transcript.duration_sec:6.1f}s   {len(segments)} segments "
        f"({len(loud)} with measured loudness)"
    )
    print(
        f"  volume_range_db : {metrics.volume_range_db}{note}"
        "   <- the number the prompt thresholds judge"
    )
    print(
        f"  monotone_score  : {metrics.monotone_score}"
        "   (0 = expressive pitch, 1 = flat)"
    )
    if loud:
        print(
            "  phrase loudness : "
            + ", ".join(f"{v:.1f}" for v in loud)
            + " dB (low -> high)"
        )


def _collect(args: list[str]) -> list[Path]:
    if args:
        return [Path(a) for a in args]
    if DEFAULT_DIR.is_dir():
        return sorted(
            p for p in DEFAULT_DIR.iterdir() if p.suffix.lower() in AUDIO_EXTS
        )
    return []


async def _main() -> int:
    paths = _collect(sys.argv[1:])
    if not paths:
        DEFAULT_DIR.mkdir(exist_ok=True)
        print(
            f"No audio found. Drop clips into '{DEFAULT_DIR.resolve()}/' and "
            "re-run, or pass file paths as arguments:\n"
            "  uv run python scripts/calibrate_volume.py clip1.mp3 clip2.wav"
        )
        return 2

    for path in paths:
        if not path.exists():
            print(f"\n=== {path} ===\n  SKIPPED — file not found")
            continue
        try:
            await _report_one(path)
        except Exception as exc:  # one bad clip shouldn't abort the batch
            print(f"\n=== {path.name} ===\n  ERROR — {exc}")

    print("\n" + "-" * 68)
    print(
        "Current cutoffs in app/synthesize.py:  "
        "flat < 1.5 | modest 1.5-4 | strong >= 4 dB"
    )
    print("If a clip you hear as MONOTONE lands above 1.5, raise the flat cutoff.")
    print("If a clip you hear as EXPRESSIVE lands below 4, lower the strong cutoff.")
    print("Then update all three speech-type blocks AND the five few-shot numbers.")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(_main()))
