# Environment variable conventions

## Gist
Commit `.env.example` (the schema). Never commit `.env` (the values). Hosts (Vercel, Modal, Neon) inject the real values at deploy time.

## Why it matters
- Secrets in git history are forever — even if you delete the file later, the commit still has them.
- `.env.example` doubles as **onboarding docs**: a new dev reads it and instantly knows every external service the app talks to.
- Production env vars are set in the host's dashboard, not files. Same code, different env per environment.

## The pattern
```
.env.example   ← committed, has placeholders
.env           ← gitignored, has real values (local only)
```

In your shell or app, libraries auto-load `.env`:
- Python: `pydantic-settings` reads `.env` into a typed `Settings` object.
- Next.js: `.env.local` is auto-loaded; vars prefixed `NEXT_PUBLIC_` are exposed to the browser, all others stay server-side.

## Mental model
Think of `.env.example` as a **type signature** for your runtime config. The values live wherever they must (your laptop, Vercel, Modal); the *shape* is checked in.

## Gotchas
- `NEXT_PUBLIC_*` vars are bundled into the JS that ships to users — never put a secret behind that prefix.
- After editing `.env`, restart the dev server. Most loaders cache at startup.
- Add new secrets to `.env.example` the same commit you use them — otherwise teammates' builds break silently.
