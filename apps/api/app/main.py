import asyncio
import logging
from collections.abc import AsyncIterator, Awaitable
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from typing import Annotated, TypeVar
from uuid import uuid4

import sentry_sdk
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from slowapi.errors import RateLimitExceeded
from sqlalchemy.ext.asyncio import AsyncSession

from app.acoustic import AcousticFeatures, analyze_audio
from app.config import settings
from app.db import get_session, init_db
from app.errors import (
    MAX_DURATION_SEC,
    MIN_DURATION_SEC,
    MIN_WORDS,
    AnalysisError,
)
from app.metrics import build_acoustic, compute_metrics
from app.models import ReportRow
from app.r2 import audio_exists, download_to_tempfile, presign_put
from app.rate_limit import limiter, rate_limit_handler
from app.schemas import (
    AnalyzeRequest,
    HealthResponse,
    LlmCost,
    Report,
    SignRequest,
    SignResponse,
)
from app.sse import sse_event
from app.synthesize import synthesize
from app.transcribe import transcribe

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


T = TypeVar("T")


async def _tagged(name: str, coro: Awaitable[T]) -> tuple[str, T]:
    return name, await coro


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
    allow_origins=["http://localhost:3000"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_methods=["GET", "POST"],
    allow_headers=["content-type"],
)


SessionDep = Annotated[AsyncSession, Depends(get_session)]


@app.get("/health")
async def health() -> HealthResponse:
    return HealthResponse(status="ok")


@app.post("/uploads/sign")
@limiter.limit("30/minute")
async def sign_upload(request: Request, req: SignRequest) -> SignResponse:
    url, key, expires_at = presign_put(req.content_type)
    return SignResponse(url=url, key=key, expires_at=expires_at)


@app.post("/analyze")
@limiter.limit("5/hour;20/day")
async def analyze(
    request: Request, req: AnalyzeRequest, session: SessionDep
) -> StreamingResponse:
    if not await asyncio.to_thread(audio_exists, req.key):
        raise HTTPException(
            status_code=404,
            detail="Audio file not found. Your upload may have expired — please upload again.",
        )

    async def stream() -> AsyncIterator[str]:
        try:
            yield sse_event("started", {})

            tasks = [
                asyncio.create_task(_tagged("transcript", transcribe(req.key))),
                asyncio.create_task(_tagged("acoustic", run_acoustic(req.key))),
            ]
            results: dict[str, AcousticFeatures | object] = {}
            for fut in asyncio.as_completed(tasks):
                name, value = await fut
                results[name] = value
                if name == "transcript":
                    yield sse_event(
                        "transcribed",
                        {"words": len(value.words), "duration_sec": value.duration_sec},
                    )
                else:
                    yield sse_event(
                        "acoustic_done",
                        {"pitch_mean_hz": round(value.pitch_mean_hz, 1)},
                    )

            transcript = results["transcript"]
            features = results["acoustic"]

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

            metrics = compute_metrics(transcript, features)
            acoustic = build_acoustic(transcript, features)
            yield sse_event(
                "metrics_done",
                {
                    "wpm": metrics.wpm,
                    "fillers": len(metrics.fillers),
                    "long_pauses": metrics.long_pauses,
                },
            )

            synthesis, synth_cost = await synthesize(transcript, metrics)
            yield sse_event("synthesis_done", {"actions": len(synthesis.top_actions)})

            cost = LlmCost(total_usd=round(synth_cost, 6))
            logger.info("report cost: total=$%.5f", cost.total_usd)

            report = Report(
                report_id=str(uuid4()),
                audio_key=req.key,
                created_at=datetime.now(UTC),
                duration_sec=transcript.duration_sec,
                transcript=transcript,
                acoustic=acoustic,
                metrics=metrics,
                synthesis=synthesis,
                cost=cost,
            )
            row = ReportRow(
                report_id=report.report_id,
                audio_key=report.audio_key,
                created_at=report.created_at,
                duration_sec=report.duration_sec,
                payload=report.model_dump(mode="json"),
            )
            session.add(row)
            await session.commit()

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


@app.get("/reports/{report_id}")
async def get_report(report_id: str, session: SessionDep) -> Report:
    row = await session.get(ReportRow, report_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return Report.model_validate(row.payload)
