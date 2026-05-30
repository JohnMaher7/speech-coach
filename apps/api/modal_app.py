"""Modal deployment of the Speech Coach FastAPI app.

One-time auth:    uv run modal token new
Deploy:           uv run modal deploy modal_app.py
Tail logs:        uv run modal app logs speech-coach-api
Tear down:        uv run modal app stop speech-coach-api
"""
import modal

image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("ffmpeg")
    .uv_pip_install(
        "fastapi[standard]>=0.136.1",
        "pydantic-settings>=2.14.0",
        "boto3>=1.43.3",
        "deepgram-sdk>=7.0.0",
        "anthropic>=0.99.0",
        "sqlmodel>=0.0.38",
        "asyncpg>=0.31.0",
        "librosa>=0.11.0",
        "praat-parselmouth>=0.4.7",
        "slowapi>=0.1.9",
        "sentry-sdk[fastapi]>=2.20.0",
        "clerk-backend-api>=5.0.6",
        "rapidfuzz>=3.10.0",
    )
    .add_local_python_source("app")
)

app = modal.App("speech-coach-api", image=image)


# `min_containers=0` scales the app to zero when idle, so it bills nothing
# between visits. The tradeoff is a 1–3 s cold start on the first request
# after the app has been idle — acceptable for a low-traffic portfolio app.
@app.function(secrets=[modal.Secret.from_dotenv()], min_containers=0)
@modal.asgi_app()
def web():
    from app.main import app as fastapi_app

    return fastapi_app
