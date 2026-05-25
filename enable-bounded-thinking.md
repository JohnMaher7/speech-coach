# Skill: Enable bounded extended thinking on `synthesize`

**Goal.** Turn extended thinking back on for the Sonnet synthesis call in `apps/api/app/synthesize.py` so the model reasons before producing the report — without re-introducing the `stop_reason=max_tokens` truncation bug that adaptive thinking caused.

## Why bounded, not adaptive

- `thinking={"type": "adaptive"}` lets the model burn an unbounded slice of `max_tokens` on reasoning, then truncate the tool call. That is what broke synthesis previously.
- `thinking={"type": "enabled", "budget_tokens": N}` caps thinking at N tokens. Same reasoning capability, predictable budget.
- Anthropic disallows combining **any** form of thinking with `tool_choice={"type": "tool"}` or `{"type": "any"}`. You must use `tool_choice={"type": "auto"}` when thinking is on.

## Required changes (all in `apps/api/app/synthesize.py`)

Inside the `_client.messages.create(...)` call:

1. **Add bounded thinking:**
   ```python
   thinking={"type": "enabled", "budget_tokens": 2048},
   ```
   `budget_tokens` must be ≥ 1024. 2048 is a sensible default for this task; raise toward 4096 if eval reports look shallow.

2. **Loosen `tool_choice`** from forced to auto:
   ```python
   tool_choice={"type": "auto"},
   ```
   (was `{"type": "tool", "name": _TOOL_NAME}`).

3. **Raise `max_tokens`** so thinking + JSON output both fit:
   ```python
   max_tokens=12288,
   ```
   Rule of thumb: `max_tokens` ≥ `budget_tokens` + 8192 (the JSON output needs ~3–5K with comfortable headroom).

## Do NOT change

- The tool definition (`_TOOLS`) and tool name (`_TOOL_NAME`).
- Prompt caching on the system prompt.
- The `tool_use` block parsing loop and the `RuntimeError` fallback — that fallback is the safety net for the rare case the model returns text under `tool_choice=auto`. Keep it.
- The closing system-prompt instruction telling the model to call `submit_evaluation` exactly once — it's what makes `auto` behave like forced in practice.

## Verify

1. `cd apps/api && uv run pytest` — non-eval suite must stay green.
2. `cd apps/api && uv run pytest -m eval` — hits the real Claude API; this is the test that catches LLM-call regressions. Costs a few cents per run.
3. Upload a real speech via the UI end-to-end and confirm the report renders without hitting the `RuntimeError` or `BadRequestError` paths.

## Rollback

If `pytest -m eval` truncates again or quality dips: revert the three lines above (drop `thinking`, restore `tool_choice={"type": "tool", "name": _TOOL_NAME}`, set `max_tokens=8192`). That returns to the current known-good shape.
