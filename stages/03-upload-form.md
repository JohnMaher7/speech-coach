# Stage 03 — Upload form UI (no backend wiring)

## Concept
Interactive UI requires a **client component** (`'use client'` directive). State (`useState`) is React's way of saying "when this value changes, re-render." Browser-side validation = fast feedback, never a security boundary.

## Build unit
- `apps/web/components/upload-form.tsx` — client component with three state values (`file`, `error`, `dragOver`) and a `useRef` on the hidden `<input type="file">`.
- A `<label>` wraps the hidden input — clicking anywhere on the styled drop zone triggers the file picker; `onDrop` captures dropped files via `dataTransfer.files`.
- Validation: MIME prefix `audio/` and ≤100 MB. Errors render inline.
- Submit currently `console.log`s the file — backend wiring comes in Stage 07/08.
- `apps/web/app/page.tsx` updated to mount `<UploadForm />` under the hero copy.

## Walkthrough
The hidden input does the actual file-picking work; the label is the styled chrome around it. Three pieces of state because three things can change independently: the chosen file, an error message, and whether the drop zone is highlighted from a drag-over. The `inputRef` exists for one reason: after clicking "Remove," we need to reset the underlying input's `.value` so picking the *same* file again still triggers `onChange`.

## Notes / surprises
- File inputs in React are tricky — they're inherently uncontrolled. You read from `e.target.files`, you can't set their value to a string from React. That's why `inputRef.current.value = ""` (DOM-level reset) is the standard "clear the picker" pattern.
- `dataTransfer.files[0]` may be undefined → use `?? null`.
- Calling `e.preventDefault()` on `onDragOver` is mandatory — without it, the browser's default drop behavior (open the file as a URL) takes over.

## Docs to skim
- [React — `'use client'` directive](https://react.dev/reference/rsc/use-client)
- [React — `useState`](https://react.dev/reference/react/useState)
- [MDN — `<input type="file">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file)

## Verification
- `pnpm dev` → drop a `.mp3`/`.wav`/`.m4a` → filename + size renders.
- Drop a `.txt` → error: "Please upload an audio file…".
- Drop a >100 MB file → size error.
- Click "Remove" → state clears, error clears, picker resets.
- Click "Analyze speech" → check browser console: `submit: File { ... }`.
