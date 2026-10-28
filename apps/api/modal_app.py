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
    .uv_sync(extra_options="--no-dev")
    .add_local_python_source("app")
)
# Dependencies come from uv.lock (exact pins, prod deps only), so `uv add` is the
# only place a new package needs to be declared.

app = modal.App("speech-coach-api", image=image)


# `min_containers=0` scales the app to zero when idle, so it bills nothing
# between visits. The tradeoff is a 1–3 s cold start on the first request
# after the app has been idle — acceptable for a low-traffic portfolio app.
# Secrets are applied in order: later entries override earlier ones, so the
# named prod secrets always beat whatever the local .env holds at deploy time.
@app.function(
    secrets=[
        modal.Secret.from_dotenv(),
        modal.Secret.from_name("speech-coach-clerk-prod"),
        modal.Secret.from_name("speech-coach-stripe-prod"),
        modal.Secret.from_dict({"WEB_BASE_URL": "https://speakgrade.com"}),
    ],
    min_containers=0,
)
@modal.asgi_app()
def web():
    import logging

    # Modal doesn't run uvicorn, so nothing configures logging: without this,
    # the app's INFO lines (Stripe syncs, cache tokens) never reach the logs.
    # Libraries stay at WARNING so httpx doesn't log every request.
    logging.basicConfig(format="%(levelname)s %(name)s: %(message)s")
    for name in ("app", "uvicorn.error"):
        logging.getLogger(name).setLevel(logging.INFO)

    from app.main import app as fastapi_app

    return fastapi_app
