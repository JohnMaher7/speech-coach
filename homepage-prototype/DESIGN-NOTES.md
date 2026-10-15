# Your voice. At its best.

## Concept and visual direction

A warm, quiet editorial page with forest-green type, ivory space, sage accents, and one apricot voice waveform. The headline speaks to the visitor's ambition; the sentence immediately below explains the actual product: upload or record, receive AI feedback, know what to try next.

The original Blender sculpture is a small physical explanation of the product. Audio rises from a recording tray, passes along a directional dotted connection, and becomes a report with four dimensions and a concrete next step. It is a product diagram rather than an unrelated decorative object. HTML captions reinforce “your recording” and “your way forward,” and accessible alternative text explains the relationship without relying on the image.

The Felix Rieseberg reference informed the care put into original 3D assets. Its room exploration, navigation, visual density, and scene composition are not reused.

## Decisions and intended effect on sales

| Decision | Why it should help |
| --- | --- |
| One unmistakable primary action: a 7-day trial | Visitors know what clicking means. Repeated actions lead to the same pricing decision. |
| An input-to-report sculpture above the fold | Makes an abstract AI service tangible before visitors read a feature list. |
| Rendered Blender art, responsive WebP assets | Keeps the visual quality without WebGL startup, a model download, camera controls, battery use, or video playback. |
| A hands-on report sample before pricing | Lets visitors inspect the value of feedback before being asked to buy. Each dimension reveals a specific next action. |
| Plain-language, timestamped examples | Answers “What would I actually do with this?” and makes the coaching practical. |
| Before/after phrasing | Demonstrates an understandable benefit in one glance. |
| Monthly billing selected initially; yearly savings visible | Offers a lower-commitment entry point while making the annual option easy to compare. |
| Trial length, card requirement, renewal amount, and cancellation terms near the action | Reduces uncertainty and avoids a surprise at checkout. |
| Privacy and timing close to the hero | Addresses common objections when a visitor is considering sharing a recording. |
| No invented testimonials, customer logos, or improvement guarantees | Builds the case through the product rather than unsupported social proof. |
| A clean, stacked mobile layout | Keeps the explanation, trial button, and sample usable on a small screen; no hover-dependent content. |

These are conversion hypotheses, not a claim of measured sales improvement. A future production experiment should compare trial starts, completed checkout, sample engagement, and mobile abandonment against the current homepage.

## Page progression

1. Understand the product and the trial.
2. See the three-step workflow.
3. Explore concrete sample feedback.
4. See an example of a stronger sentence.
5. Compare billing periods and choose a trial.
6. Resolve remaining questions.
7. Return to the same clear next step.

## Blender and implementation

The sculpture was modeled and rendered in Blender 5.2.2 LTS using Cycles, an orthographic camera, three soft studio lights, bevelled ceramic forms, and a transparent background. The `.blend` includes the scene and packed font. The Python generator recreates the geometry, materials, labels, lighting and camera. The full PNG is retained for future editing; browsers that support WebP request one optimized size, not the PNG.

The frontend uses semantic HTML, local CSS, and a small local JavaScript file. It has no framework runtime, external fonts, third-party scripts, or analytics. Image width/height and an explicit stage ratio reserve space while loading. No animation is required to understand anything. Reduced-motion preferences are respected for the small hover and scrolling transitions.

Report controls use tab semantics, arrow-key navigation, and visible focus. FAQs use native details. The native modal traps focus and supports Escape. The report preview has local illustrative values, not a live AI response. The Structure panel shows a three-part outline rather than inventing an acoustic structure metric.

## Verified content and scope

Reference pages checked on 15 October 2026:

- [Current SpeakGrade homepage](https://www.speakgrade.com/): input methods, four feedback dimensions, recording limits, processing estimate, temporary audio handling, rewrites, language support, report retention, and trial terms.
- [SpeakGrade pricing](https://www.speakgrade.com/pricing): €12.99 monthly, €70 yearly, approximately €5.83/month when billed yearly, 55% rounded annual savings, unlimited analyses, 7-day trial, card required, and cancellation before charging. Dynamic prices were verified in the live browser.
- [Felix Rieseberg](https://felixrieseberg.com/): visual craft reference only.

The displayed prices are a dated prototype snapshot, not a live billing integration. Production would read the billing source of truth and preserve the selected plan through sign-up. The local modal deliberately ends before that integration. Existing app files were not edited, and no branch was merged or deployed.
