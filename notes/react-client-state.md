# React: client components, state, refs

## `'use client'` — what does it actually do?

### Gist
In Next.js's App Router, components are **server-rendered by default**. They run on the server, send HTML to the browser, and ship no JS for that component. Adding `'use client'` at the top of a file says: "this component needs to run in the browser too" — typically because it uses state, effects, event handlers, or browser APIs.

### When you need it
Any of these in your component → `'use client'`:
- `useState`, `useReducer`, `useEffect`, `useRef`
- `onClick`, `onChange`, `onDrop` (most event handlers)
- `window`, `document`, `localStorage`
- Custom hooks that use the above

### Mental model
Think of `'use client'` as a **boundary**, not a label. Once a file declares it, every component imported into it inherits the client side. So you put `'use client'` on the smallest *leaf* that needs interactivity, not the root layout — otherwise you ship the entire page's JS to every visitor.

---

## `useState` — the heart of React

### Gist
`useState` lets a component remember a value across renders. Calling the setter triggers a re-render with the new value.

```tsx
const [file, setFile] = useState<File | null>(null);
//      ↑ current value      ↑ initial value
```

### Pattern
- Read state directly: `if (file) { ... }`
- Update via setter: `setFile(newFile)` — React schedules a re-render.
- **Never mutate state in place.** `file.name = "x"` won't trigger a re-render. Always create a new value (`setFile({ ...file, name: "x" })` for objects).

### One state per concern
The upload form has three `useState` calls because three things change independently — the picked file, an error message, and the drag-hover state. Don't cram unrelated values into one state object; separate `useState`s are clearer and easier to update.

### TypeScript tip
Provide the type when state can be `null` or change shape:
```tsx
useState<File | null>(null)        // good — typed correctly
useState(null)                     // bad — TS infers `null`, can't hold a File
```

---

## Controlled vs uncontrolled inputs

| Type | Controlled (you set the value) | Uncontrolled (DOM owns the value) |
|---|---|---|
| `<input type="text">` | ✅ via `value={state}` + `onChange` | OK with `defaultValue` + ref |
| `<input type="file">` | ❌ **can't** be controlled | ✅ always — read via `e.target.files` |

File inputs are the one exception you'll trip on. You can't write `<input value={file} />` for security reasons (browsers won't let JS set the value of a file input). So you always **read** from the event and **reset** by setting `ref.current.value = ""` directly on the DOM node.

---

## `useRef` — when state is overkill

### Gist
`useRef` gives you a mutable container that persists across renders **without** triggering a re-render when you change it. Two main uses:

1. **DOM access**: `<input ref={inputRef} />` lets you call `inputRef.current.focus()` or read `inputRef.current.value`.
2. **Stable storage**: a value you want to remember (a timeout id, a previous prop) but that shouldn't cause a re-render when it changes.

### Mental model
- `useState` = "render me when this changes."
- `useRef` = "keep this around, don't render."

### In the upload form
We use `useRef<HTMLInputElement>` because we need a back-channel to the DOM input element to reset its value. Re-rendering for that reset would be wasteful and irrelevant — there's nothing to display differently.

---

## Event quirks worth knowing

- **Drag and drop**: `onDragOver` MUST call `e.preventDefault()` or the browser intercepts the drop and opens the file as a URL.
- **`onChange` on file input**: only fires when a *different* file is picked. If you want re-picking the same file to work, reset `ref.current.value = ""` first.
- **`e.dataTransfer.files`** vs **`e.target.files`**: drops use `dataTransfer`, picker clicks use `target`. Different objects, same `FileList` shape.

## Gotchas
- `'use client'` is **per-file**, not per-component. Splitting a file forces you to re-declare it.
- Server components can import client components but **not** vice versa for state — keep client components small and dumb when possible.
- Client components can still do server work via Server Actions, but that's a more advanced pattern we won't need yet.
