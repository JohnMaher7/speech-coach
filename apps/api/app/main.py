import asyncio
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from typing import Annotated
from uuid import uuid4

import sentry_sdk
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from slowapi.errors import RateLimitExceeded
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.acoustic import AcousticFeatures, analyze_audio
from app.auth import CurrentUser, RequireActivePlan
from app.config import settings
from app.db import get_session, init_db
from app.errors import (
    MAX_DURATION_SEC,
    MIN_DURATION_SEC,
    MIN_WORDS,
    AnalysisError,
)
from app.lexical_fillers import detect_lexical_fillers
from app.metrics import build_acoustic, compute_metrics
from app.models import ReportRow
from app.r2 import audio_exists, download_to_tempfile, presign_put
from app.rate_limit import limiter, rate_limit_handler
from app.schemas import (
    AnalyzeRequest,
    DashboardReport,
    FillerHit,
    HealthResponse,
    LlmCost,
    Report,
    SignRequest,
    SignResponse,
    Transcript,
)
from app.scoring import compute_overall
from app.sse import sse_event
from app.synthesize import synthesize
from app.transcribe import transcribe
from app.verify import verify

logger = logging.getLogger("uvicorn.error")

# Sentry init runs at import time (before `app = FastAPI(...)`). When
# SENTRY_DSN is unset (local dev) `init` is a no-op — no network calls, no
# events captured. In prod the FastAPI integration auto-installs from the
# `[fastapi]` extra and the logging integration turns every `logger.exception`
# into a Sentry event with stack trace + request context.
if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment="production",
        traces_sample_rate=0.1,
        send_default_pii=False,
    )


async def run_acoustic(key: str) -> AcousticFeatures:
    async with download_to_tempfile(key) as audio_path:
        return await asyncio.to_thread(analyze_audio, audio_path)


async def run_lexical_fillers(
    transcript: Transcript,
) -> tuple[list[FillerHit], float]:
    """Wrap `detect_lexical_fillers` so a Haiku failure never breaks the
    pipeline — we log and fall back to token-only fillers."""

    try:
        return await detect_lexical_fillers(transcript)
    except Exception:
        logger.exception("lexical filler pass failed; continuing without it")
        return [], 0.0


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    await init_db()
    yield


app = FastAPI(title="Speech Coach API", lifespan=lifespan)

# slowapi attaches the limiter to app.state and registers a 429 handler. The
# `Request` parameter on each decorated route is how slowapi gets at the IP.
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://speakgrade.com",
        "https://www.speakgrade.com",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["content-type", "authorization"],
)


SessionDep = Annotated[AsyncSession, Depends(get_session)]


@app.get("/health")
async def health() -> HealthResponse:
    return HealthResponse(status="ok")


@app.get("/warmup")
async def warmup(session: SessionDep, user: CurrentUser) -> HealthResponse:
    await session.execute(select(1))
    return HealthResponse(status="ok")


@app.post("/uploads/sign")
@limiter.limit("30/minute")
async def sign_upload(
    request: Request, req: SignRequest, user: CurrentUser, _plan: RequireActivePlan
) -> SignResponse:
    url, key, expires_at = presign_put(req.content_type)
    return SignResponse(url=url, key=key, expires_at=expires_at)


@app.post("/analyze")
@limiter.limit("5/hour;20/day")
async def analyze(
    request: Request,
    req: AnalyzeRequest,
    session: SessionDep,
    user: CurrentUser,
    _plan: RequireActivePlan,
) -> StreamingResponse:
    if not await asyncio.to_thread(audio_exists, req.key):
        raise HTTPException(
            status_code=404,
            detail="Audio file not found. Your upload may have expired — please upload again.",
        )

    async def stream() -> AsyncIterator[str]:
        try:
            yield sse_event("started", {})

            transcribe_task = asyncio.create_task(transcribe(req.key))
            acoustic_task = asyncio.create_task(run_acoustic(req.key))
            # Lexical fillers needs the transcript text, so it's chained off
            # `transcribe_task` and added to `pending` as soon as that
            # resolves — effectively a third fan-out task.
            lexical_task: asyncio.Task[tuple[list[FillerHit], float]] | None = None

            transcript: Transcript | None = None
            features: AcousticFeatures | None = None
            lex_hits: list[FillerHit] = []
            lex_cost = 0.0

            pending: set[asyncio.Task] = {transcribe_task, acoustic_task}
            while pending:
                done, pending = await asyncio.wait(
                    pending, return_when=asyncio.FIRST_COMPLETED
                )
                for task in done:
                    if task is transcribe_task:
                        transcript = task.result()
                        yield sse_event(
                            "transcribed",
                            {
                                "words": len(transcript.words),
                                "duration_sec": transcript.duration_sec,
                            },
                        )
                        lexical_task = asyncio.create_task(
                            run_lexical_fillers(transcript)
                        )
                        pending.add(lexical_task)
                    elif task is acoustic_task:
                        features = task.result()
                        yield sse_event(
                            "acoustic_done",
                            {"pitch_mean_hz": round(features.pitch_mean_hz, 1)},
                        )
                    elif task is lexical_task:
                        lex_hits, lex_cost = task.result()
                        yield sse_event(
                            "lexical_done", {"fillers": len(lex_hits)}
                        )

            assert transcript is not None and features is not None

            if transcript.duration_sec > MAX_DURATION_SEC:
                raise AnalysisError(
                    f"Audio is longer than {int(MAX_DURATION_SEC // 60)} minutes. "
                    "Please upload a shorter clip."
                )
            if transcript.duration_sec < MIN_DURATION_SEC:
                raise AnalysisError(
                    f"Audio is shorter than {int(MIN_DURATION_SEC)} seconds. "
                    "Please upload a longer recording."
                )
            if len(transcript.words) < MIN_WORDS:
                raise AnalysisError(
                    "We couldn't hear any clear speech in this recording. "
                    "Please check the audio and try again."
                )

            acoustic = build_acoustic(transcript, features)
            metrics = compute_metrics(
                transcript,
                features,
                segments=acoustic.segments,
                lexical_fillers=lex_hits,
            )
            yield sse_event(
                "metrics_done",
                {
                    "wpm": metrics.wpm,
                    "fillers": len(metrics.fillers),
                    "long_pauses": metrics.long_pauses,
                },
            )

            synthesis, synth_cost = await synthesize(
                transcript, acoustic, metrics, speech_type=req.speech_type
            )
            yield sse_event(
                "synthesis_done", {"priorities": len(synthesis.priorities)}
            )

            overall = compute_overall(synthesis.categories, req.speech_type)
            verification = verify(synthesis, transcript)
            if not verification.passed:
                logger.warning(
                    "verification flagged %d issue(s) for report; "
                    "persisting anyway (non-blocking).",
                    len(verification.issues),
                )

            cost = LlmCost(
                total_usd=round(synth_cost + lex_cost, 6),
                synthesis_usd=round(synth_cost, 6),
                lexical_fillers_usd=round(lex_cost, 6),
            )
            logger.info(
                "report cost: total=$%.5f synthesis=$%.5f lexical=$%.5f",
                cost.total_usd,
                cost.synthesis_usd,
                cost.lexical_fillers_usd,
            )

            report = Report(
                report_id=str(uuid4()),
                audio_key=req.key,
                created_at=datetime.now(UTC),
                duration_sec=transcript.duration_sec,
                speech_type=req.speech_type,
                transcript=transcript,
                acoustic=acoustic,
                metrics=metrics,
                synthesis=synthesis,
                verification=verification,
                overall=overall,
                cost=cost,
            )
            row = ReportRow(
                report_id=report.report_id,
                audio_key=report.audio_key,
                user_id=user,
                created_at=report.created_at,
                duration_sec=report.duration_sec,
                payload=report.model_dump(mode="json"),
            )
            session.add(row)
            await session.commit()

            yield sse_event("saving_report", {})
            yield sse_event("done", {"report_id": report.report_id})

        except AnalysisError as exc:
            yield sse_event("error", {"message": exc.user_message})
        except Exception:
            logger.exception("analyze stream failed for key=%s", req.key)
            yield sse_event(
                "error",
                {"message": "Something went wrong analyzing your speech. Please try again."},
            )

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/reports")
async def list_reports(session: SessionDep, user: CurrentUser) -> list[DashboardReport]:
    """The signed-in user's reports, newest first — for the dashboard.

    Selects only the handful of fields the dashboard shows, reaching into
    the JSONB `payload` for the headline and overall score. Pulling whole
    `ReportRow`s would drag every transcript and timeline across the wire."""

    stmt = (
        select(
            ReportRow.report_id,
            ReportRow.created_at,
            ReportRow.duration_sec,
            ReportRow.payload["speech_type"].astext,
            ReportRow.payload["synthesis"]["headline"].astext,
            ReportRow.payload["overall"]["score"].astext,
        )
        .where(ReportRow.user_id == user)
        .order_by(ReportRow.created_at.desc())
    )
    result = await session.execute(stmt)
    return [
        DashboardReport(
            report_id=report_id,
            created_at=created_at,
            duration_sec=duration_sec,
            speech_type=speech_type,
            headline=headline or "Untitled speech",
            overall_score=float(score) if score is not None else 0.0,
        )
        for report_id, created_at, duration_sec, speech_type, headline, score in result.all()
    ]


@app.get("/reports/{report_id}")
async def get_report(
    report_id: str, session: SessionDep, user: CurrentUser
) -> Report:
    row = await session.get(ReportRow, report_id)
    # A report the caller doesn't own is reported as 404, not 403 — a 403
    # would confirm the id exists.
    if row is None or row.user_id != user:
        raise HTTPException(status_code=404, detail="Report not found")
    # Older payloads are rejected with 410 Gone; the report shape changes enough
    # between schema bumps that a compatibility shim is not useful yet.
    if row.payload.get("schema_version") != 5:
        raise HTTPException(
            status_code=410,
            detail=(
                "This report was generated by an older version of SpeakGrade "
                "and is no longer viewable. Please record a new speech."
            ),
        )
    return Report.model_validate(row.payload)


@app.delete("/reports/{report_id}", status_code=204)
async def delete_report(
    report_id: str, session: SessionDep, user: CurrentUser
) -> Response:
    row = await session.get(ReportRow, report_id)
    if row is None or row.user_id != user:
        raise HTTPException(status_code=404, detail="Report not found")
    await session.delete(row)
    await session.commit()
    return Response(status_code=204)
