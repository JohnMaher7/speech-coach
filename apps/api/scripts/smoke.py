"""Post-deploy smoke test against the live API.

Hits the two cheapest endpoints and asserts shape. Catches the "deploy
succeeded but config drifted / secrets are wrong / something panics on import"
failure mode without spending Deepgram or Claude credits.

Usage:
    uv run python scripts/smoke.py https://<workspace>--speech-coach-api-web.modal.run

Exit codes: 0 = healthy, 1 = a check failed, 2 = bad invocation.
"""
import json
import sys
import urllib.error
import urllib.request


def _get(url: str) -> tuple[int, dict]:
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status, json.loads(r.read())


def _post(url: str, body: dict) -> tuple[int, dict]:
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        url,
        data=data,
        headers={"content-type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status, json.loads(r.read())


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: smoke.py <api-base-url>", file=sys.stderr)
        return 2
    base = sys.argv[1].rstrip("/")

    print(f"→ GET  {base}/health")
    status, body = _get(f"{base}/health")
    if status != 200 or body != {"status": "ok"}:
        print(f"  ✗ unexpected: {status} {body}", file=sys.stderr)
        return 1
    print(f"  ✓ {status} {body}")

    print(f"→ POST {base}/uploads/sign")
    status, body = _post(f"{base}/uploads/sign", {"content_type": "audio/mpeg"})
    required = {"url", "key", "expires_at"}
    if status != 200 or not required.issubset(body):
        print(f"  ✗ unexpected: {status} {body}", file=sys.stderr)
        return 1
    print(f"  ✓ {status} key={body['key']}")

    print("\nsmoke ok")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except urllib.error.HTTPError as exc:
        print(f"  ✗ HTTP {exc.code}: {exc.read().decode(errors='replace')}", file=sys.stderr)
        raise SystemExit(1) from exc
    except urllib.error.URLError as exc:
        print(f"  ✗ network error: {exc.reason}", file=sys.stderr)
        raise SystemExit(1) from exc
