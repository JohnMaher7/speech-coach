"""Eval harness for the SpeakGrade pipeline.

Run with: ``uv run speakgrade-eval``

Reads ``labels.json`` from this directory, runs each labelled case through the
pipeline three times, computes MAE, test-retest variance, and the
evidence-pass rate, prints a table, and writes a detailed JSON to
``results/<UTC-isoformat>.json``.

Exits non-zero if any threshold fails. See ``notes/eval-harness-deep-dive.md``
for what each metric means and how to read a failure.
"""

from __future__ import annotations

import asyncio
import json
import logging
import statistics
import sys
from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError

from app.schemas import (
    Acoustic,
    CategoryScoreValue,
    Report,
    SpeechType,
    Synthesis,
    Transcript,
    Verification,
)
from app.scoring import compute_overall
from app.synthesize import synthesize
from app.verify import verify
from app.pipeline import run_pipeline

logger = logging.getLogger("speakgrade.eval")


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

EVAL_DIR = Path(__file__).resolve().parent
LABELS_PATH = EVAL_DIR / "labels.json"
RESULTS_DIR = EVAL_DIR / "results"

RUNS_PER_CASE = 3

# Failing thresholds — documented in BUILD_STAGES.md and the deep-dive notes.
MAX_MAE = 1.0
MAX_VARIANCE = 1.0
MIN_EVIDENCE_PASS = 0.95

CATEGORIES: tuple[str, ...] = (
    "hook",
    "message_focus",
    "structure",
    "closing",
    "pacing",
    "pauses",
    "vocal_variety",
    "language",
)


# ---------------------------------------------------------------------------
# Pydantic models for labels.json
# ---------------------------------------------------------------------------


class HumanLabel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    graded_by: str
    graded_at: str | None = None
    categories: dict[str, CategoryScoreValue]
    notes: str | None = None


class Case(BaseModel):
    """One row in labels.json."""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(pattern=r"^[a-z0-9_]+$")
    source: Literal["fixture", "audio"]
    fixture_name: str | None = None
    audio_path: str | None = None
    speech_type: SpeechType
    human_label: HumanLabel

    def validate_source_fields(self) -> None:
        if self.source == "fixture" and not self.fixture_name:
            raise ValueError(f"case {self.id!r} has source=fixture but no fixture_name")
        if self.source == "audio" and not self.audio_path:
            raise ValueError(f"case {self.id!r} has source=audio but no audio_path")


# ---------------------------------------------------------------------------
# Per-run result
# ---------------------------------------------------------------------------


@dataclass
class RunResult:
    case_id: str
    run_idx: int
    skipped: bool
    skip_reason: str | None
    model_scores: dict[str, CategoryScoreValue]  # empty if skipped
    overall_score: float | None
    verification_passed: bool
    verification_issue_count: int
    cost_usd: float
    headline: str | None

    @classmethod
    def skipped_run(cls, case_id: str, run_idx: int, reason: str) -> RunResult:
        return cls(
            case_id=case_id,
            run_idx=run_idx,
            skipped=True,
            skip_reason=reason,
            model_scores={},
            overall_score=None,
            verification_passed=False,
            verification_issue_count=0,
            cost_usd=0.0,
            headline=None,
        )


# ---------------------------------------------------------------------------
# Aggregate results
# ---------------------------------------------------------------------------


@dataclass
class EvalResults:
    timestamp_utc: str
    runs: list[RunResult]
    # MAE per category, averaged across all non-skipped runs of all cases.
    mae_by_category: dict[str, float]
    # stddev per (case_id, category) across the 3 runs of that case.
    variance_by_case_category: dict[str, dict[str, float]]
    # Fraction of non-skipped runs where verification.passed.
    evidence_pass_rate: float
    total_cost_usd: float
    n_skipped: int
    n_completed: int
    passed: bool
    failure_reasons: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Loading and validation
# ---------------------------------------------------------------------------


def load_labels(path: Path = LABELS_PATH) -> list[Case]:
    """Read labels.json and return validated Case objects."""

    try:
        raw = json.loads(path.read_text())
    except FileNotFoundError:
        raise SystemExit(f"labels.json not found at {path}")
    except json.JSONDecodeError as exc:
        raise SystemExit(f"labels.json is not valid JSON: {exc}")

    if not isinstance(raw, list):
        raise SystemExit("labels.json must be a JSON array of case objects")

    try:
        cases = [Case.model_validate(item) for item in raw]
    except ValidationError as exc:
        raise SystemExit(f"labels.json failed validation:\n{exc}")

    for case in cases:
        case.validate_source_fields()

    ids = [c.id for c in cases]
    if len(ids) != len(set(ids)):
        raise SystemExit(f"labels.json has duplicate case ids: {ids}")

    return cases


# ---------------------------------------------------------------------------
# Running a single case
# ---------------------------------------------------------------------------


def _empty_acoustic() -> Acoustic:
    """Acoustic stub used for the synthetic path. `build_annotated_transcript`
    falls back to raw transcript when segments are empty, so synthesise still
    receives a usable input — it just has no per-segment prosody."""

    return Acoustic(
        timeline=[],
        pauses=[],
        pitch_mean_hz=0.0,
        pitch_std_hz=0.0,
        pitch_std_st=0.0,
    )


def _materialise_fixture(fixture_name: str) -> tuple[Transcript, Acoustic, Any]:
    """Pull a GoldenCase from tests/fixtures.py by symbol name and return the
    triple the synthesis path needs."""

    from tests import fixtures as fx

    if not hasattr(fx, fixture_name):
        raise SystemExit(
            f"fixture {fixture_name!r} not found in tests.fixtures. "
            "Add it to tests/fixtures.py or fix the labels.json entry."
        )
    case = getattr(fx, fixture_name)
    return case.transcript, _empty_acoustic(), case.metrics


def _model_scores_from_synthesis(synth: Synthesis) -> dict[str, CategoryScoreValue]:
    return {name: getattr(synth.categories, name).score for name in CATEGORIES}


async def _run_fixture_case(case: Case, run_idx: int) -> RunResult:
    assert case.fixture_name is not None
    transcript, acoustic, metrics = _materialise_fixture(case.fixture_name)
    synthesis, synth_cost = await synthesize(
        transcript, acoustic, metrics, speech_type=case.speech_type
    )
    compute_overall(synthesis.categories, case.speech_type)  # validate weight calc
    verification: Verification = verify(synthesis, transcript)
    overall = compute_overall(synthesis.categories, case.speech_type)
    return RunResult(
        case_id=case.id,
        run_idx=run_idx,
        skipped=False,
        skip_reason=None,
        model_scores=_model_scores_from_synthesis(synthesis),
        overall_score=overall.score,
        verification_passed=verification.passed,
        verification_issue_count=len(verification.issues),
        cost_usd=round(synth_cost, 6),
        headline=synthesis.headline,
    )


async def _run_audio_case(case: Case, run_idx: int) -> RunResult:
    assert case.audio_path is not None
    audio_path = EVAL_DIR / case.audio_path
    if not audio_path.exists():
        return RunResult.skipped_run(
            case.id, run_idx, f"audio file missing: {case.audio_path}"
        )

    report: Report = await run_pipeline(
        audio_path=audio_path, speech_type=case.speech_type
    )
    return RunResult(
        case_id=case.id,
        run_idx=run_idx,
        skipped=False,
        skip_reason=None,
        model_scores=_model_scores_from_synthesis(report.synthesis),
        overall_score=report.overall.score,
        verification_passed=report.verification.passed,
        verification_issue_count=len(report.verification.issues),
        cost_usd=report.cost.total_usd if report.cost else 0.0,
        headline=report.synthesis.headline,
    )


async def _run_case_once(case: Case, run_idx: int) -> RunResult:
    try:
        if case.source == "fixture":
            return await _run_fixture_case(case, run_idx)
        else:
            return await _run_audio_case(case, run_idx)
    except Exception as exc:
        logger.exception("case %s run %d crashed", case.id, run_idx)
        return RunResult.skipped_run(case.id, run_idx, f"exception: {exc}")


async def _run_all_cases(cases: list[Case]) -> list[RunResult]:
    runs: list[RunResult] = []
    for case in cases:
        print(f"\n=== {case.id} ({case.source}) ===", flush=True)
        for i in range(1, RUNS_PER_CASE + 1):
            print(f"  run {i}/{RUNS_PER_CASE}...", end=" ", flush=True)
            result = await _run_case_once(case, i)
            runs.append(result)
            if result.skipped:
                print(f"SKIPPED ({result.skip_reason})", flush=True)
            else:
                print(
                    f"overall={result.overall_score:.2f} "
                    f"verify={'PASS' if result.verification_passed else 'FAIL'} "
                    f"cost=${result.cost_usd:.4f}",
                    flush=True,
                )
    return runs


# ---------------------------------------------------------------------------
# Analysis
# ---------------------------------------------------------------------------


def _score_to_int(score: CategoryScoreValue) -> int | None:
    """Drop 'n/a' from MAE/variance math. The label and the model both have to
    have an integer for a given (case, category) to contribute."""

    return score if isinstance(score, int) else None


def _analyze(runs: list[RunResult], cases: list[Case]) -> EvalResults:
    label_by_id = {c.id: c.human_label for c in cases}

    completed = [r for r in runs if not r.skipped]
    n_skipped = len(runs) - len(completed)

    # MAE per category — average |model - human| across all completed runs.
    mae_by_category: dict[str, float] = {}
    for cat in CATEGORIES:
        diffs: list[float] = []
        for r in completed:
            human = label_by_id[r.case_id].categories.get(cat)
            model = r.model_scores.get(cat)
            h = _score_to_int(human) if human is not None else None
            m = _score_to_int(model) if model is not None else None
            if h is None or m is None:
                continue
            diffs.append(abs(m - h))
        mae_by_category[cat] = round(statistics.fmean(diffs), 3) if diffs else 0.0

    # Variance per (case, category) — stddev across the 3 runs of the same case.
    variance_by_case_category: dict[str, dict[str, float]] = {}
    for case in cases:
        case_runs = [r for r in completed if r.case_id == case.id]
        cat_var: dict[str, float] = {}
        for cat in CATEGORIES:
            scores: list[int] = []
            for r in case_runs:
                m = _score_to_int(r.model_scores.get(cat)) if r.model_scores.get(cat) is not None else None
                if m is not None:
                    scores.append(m)
            if len(scores) >= 2:
                cat_var[cat] = round(statistics.stdev(scores), 3)
            else:
                cat_var[cat] = 0.0
        variance_by_case_category[case.id] = cat_var

    # Evidence-pass rate.
    if completed:
        evidence_pass_rate = round(
            sum(1 for r in completed if r.verification_passed) / len(completed), 3
        )
    else:
        evidence_pass_rate = 0.0

    total_cost = round(sum(r.cost_usd for r in completed), 4)

    failure_reasons: list[str] = []
    max_mae = max(mae_by_category.values(), default=0.0)
    if max_mae > MAX_MAE:
        worst = max(mae_by_category, key=lambda k: mae_by_category[k])
        failure_reasons.append(
            f"max category MAE = {max_mae:.2f} > {MAX_MAE} (worst: {worst})"
        )
    max_var = max(
        (v for case_vars in variance_by_case_category.values() for v in case_vars.values()),
        default=0.0,
    )
    if max_var > MAX_VARIANCE:
        failure_reasons.append(
            f"max (case, category) variance = {max_var:.2f} > {MAX_VARIANCE}"
        )
    if completed and evidence_pass_rate < MIN_EVIDENCE_PASS:
        failure_reasons.append(
            f"evidence-pass rate = {evidence_pass_rate:.2%} < {MIN_EVIDENCE_PASS:.0%}"
        )

    return EvalResults(
        timestamp_utc=datetime.now(UTC).isoformat(),
        runs=runs,
        mae_by_category=mae_by_category,
        variance_by_case_category=variance_by_case_category,
        evidence_pass_rate=evidence_pass_rate,
        total_cost_usd=total_cost,
        n_skipped=n_skipped,
        n_completed=len(completed),
        passed=not failure_reasons,
        failure_reasons=failure_reasons,
    )


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------


def _format_table(results: EvalResults, cases: list[Case]) -> str:
    lines: list[str] = []
    lines.append("")
    lines.append("=" * 78)
    lines.append(f"  SpeakGrade eval — {results.timestamp_utc}")
    lines.append("=" * 78)

    # Per-category MAE
    lines.append("")
    lines.append("MAE per category (lower is better; threshold > 1.0 fails):")
    for cat in CATEGORIES:
        v = results.mae_by_category[cat]
        flag = "  ✗" if v > MAX_MAE else "  ·"
        lines.append(f"  {cat:<16} {v:>6.2f}{flag}")

    # Per-(case, category) variance
    lines.append("")
    lines.append("Variance across runs per (case, category) (threshold > 1.0 fails):")
    header = "  " + " " * 18 + "  ".join(f"{c.id[:12]:>12}" for c in cases)
    lines.append(header)
    for cat in CATEGORIES:
        row = f"  {cat:<16}  "
        cells: list[str] = []
        for c in cases:
            v = results.variance_by_case_category.get(c.id, {}).get(cat, 0.0)
            flag = " ✗" if v > MAX_VARIANCE else "  "
            cells.append(f"{v:>10.2f}{flag}")
        row += "  ".join(cells)
        lines.append(row)

    # Evidence-pass
    lines.append("")
    lines.append(
        f"Evidence-pass rate: {results.evidence_pass_rate:.0%}  "
        f"(threshold ≥ {MIN_EVIDENCE_PASS:.0%})"
    )

    # Run summary
    lines.append("")
    lines.append(
        f"Runs: {results.n_completed} completed, {results.n_skipped} skipped  "
        f"Total cost: ${results.total_cost_usd:.4f}"
    )

    # Per-run detail (overall scores, verify pass)
    lines.append("")
    lines.append("Per-run detail:")
    for r in results.runs:
        if r.skipped:
            lines.append(f"  {r.case_id:<18} run {r.run_idx}  SKIPPED  ({r.skip_reason})")
        else:
            v = "PASS" if r.verification_passed else f"FAIL ({r.verification_issue_count})"
            lines.append(
                f"  {r.case_id:<18} run {r.run_idx}  "
                f"overall={r.overall_score:.2f}  verify={v}  "
                f"cost=${r.cost_usd:.4f}"
            )

    # Final verdict
    lines.append("")
    lines.append("=" * 78)
    if results.passed:
        lines.append("  RESULT: PASS")
    else:
        lines.append("  RESULT: FAIL")
        for reason in results.failure_reasons:
            lines.append(f"    - {reason}")
    lines.append("=" * 78)
    lines.append("")

    return "\n".join(lines)


def _write_results_json(results: EvalResults) -> Path:
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    stamp = results.timestamp_utc.replace(":", "-").replace(".", "-")
    path = RESULTS_DIR / f"{stamp}.json"
    payload: dict[str, Any] = {
        "timestamp_utc": results.timestamp_utc,
        "passed": results.passed,
        "failure_reasons": results.failure_reasons,
        "mae_by_category": results.mae_by_category,
        "variance_by_case_category": results.variance_by_case_category,
        "evidence_pass_rate": results.evidence_pass_rate,
        "total_cost_usd": results.total_cost_usd,
        "n_completed": results.n_completed,
        "n_skipped": results.n_skipped,
        "thresholds": {
            "max_mae": MAX_MAE,
            "max_variance": MAX_VARIANCE,
            "min_evidence_pass": MIN_EVIDENCE_PASS,
            "runs_per_case": RUNS_PER_CASE,
        },
        "runs": [asdict(r) for r in results.runs],
    }
    path.write_text(json.dumps(payload, indent=2, default=str))
    return path


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


def main() -> int:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    cases = load_labels()
    print(f"Loaded {len(cases)} case(s) from {LABELS_PATH}")

    runs = asyncio.run(_run_all_cases(cases))
    results = _analyze(runs, cases)

    print(_format_table(results, cases))

    out_path = _write_results_json(results)
    print(f"Results written to {out_path}")

    return 0 if results.passed else 1


if __name__ == "__main__":
    sys.exit(main())
