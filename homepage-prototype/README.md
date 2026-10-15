# SpeakGrade homepage prototype

A standalone homepage concept, made on the `homepage-prototype` branch. All work is contained in this directory. The existing app is untouched. Nothing has been merged, published, or deployed.

## Open it

**No setup:** open `C:\Speech_App\homepage-prototype\index.html` in Chrome, Edge, Firefox, or Safari. Double-clicking the file in File Explorer is sufficient. Relative assets and interactions work directly from disk, with no internet connection.

**Optional local server:** from this directory, run:

```powershell
npm start
```

Then visit <http://127.0.0.1:4173>. No `npm install` or build is required. Stop with Ctrl+C. Set `PORT` if port 4173 is in use.

## Review the experience

- Follow the main trial button to pricing.
- Switch between the four report dimensions. The advice and chart change; Structure shows a narrative outline. Arrow keys, Home, and End also work.
- Toggle monthly/yearly billing and open the trial preview. The chosen plan carries into the dialog. This is a local handoff demonstration, with no account creation or payment processing.
- Expand the questions; on a narrow screen, try the menu.

This is a marketing homepage prototype, not a replacement for the speech-analysis app. The report and phrasing examples are explicitly illustrative. There is no upload processing, microphone capture, checkout, analytics, external API, or data collection.

## Deliverables

| File | Purpose |
| --- | --- |
| `index.html`, `styles.css`, `app.js` | Standalone homepage |
| `blender/voice-to-feedback.blend` | Editable original Blender scene, including packed font, models, materials, lights, and camera |
| `blender/create_scene.py` | Reproducible scene generator |
| `assets/voice-to-feedback.png` | Full-resolution transparent render |
| `assets/voice-to-feedback-800.webp` | Optimized smaller-screen image |
| `assets/voice-to-feedback-1500.webp` | Optimized larger-screen image |
| `screenshots/desktop.png` | Desktop viewport, 1440 × 1000 |
| `screenshots/desktop-full.png` | Complete desktop page |
| `screenshots/mobile.png` | Phone viewport, 390 × 844 |
| `screenshots/mobile-full.png` | Complete phone page |
| `screenshots/mobile-report.png` | Phone sample-report detail |
| `screenshots/qa-results.json` | Browser checks and actual asset sizes |
| `DESIGN-NOTES.md` | Concept, conversion rationale, sources, and implementation choices |

## Rebuild the artwork

The source was made with Blender 5.2.2 LTS. Open the `.blend` file and press F12 to render. All scene elements are individually named and editable. Alternatively, regenerate everything from the original procedural source:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --python .\blender\create_scene.py
node .\tools\optimize-art.cjs
```

The optimizer uses `sharp`. It discovers the bundled runtime on this machine; elsewhere, set `SHARP_PATH` to a locally installed `sharp` package. Optimization is only needed after changing the artwork. The website itself has no dependencies.

## Checks

Browser QA covers responsive widths from 320 to 1440 pixels, tabs and keyboard navigation, billing consistency, trial modal dismissal and focus, FAQ behavior, mobile navigation, reduced motion, broken anchors, loaded artwork, direct-file opening, and absence of external runtime requests or JavaScript errors. The browser checks use desktop Chrome with phone viewport emulation; they are not a physical-device or Safari certification.

To repeat the checks with the optional server running:

```powershell
node .\tools\qa.cjs
```

On another machine, set `PLAYWRIGHT_PATH` to a local Playwright package and install Chrome. The page requires a current browser supporting native `<dialog>` and `<details>`.
