# Market Spike design notes

## What makes the Duolingo UI work (observed on duolingo.com, Oct 2026)

- **Flat colour only.** One saturated colour per section on white; text is a warm neutral (`#4B4B4B`). No gradients, glass or glows.
- **The pressable button.** Flat fill + a solid darker "underside" (~4px) that disappears on press. 15px, bold, UPPERCASE, 0.8px tracking, 12-16px radius. Secondary buttons are white with a 2px grey border and the same underside.
- **A mascot carries the personality**, not effects. Big, simple shapes, big eyes.
- **Lowercase, rounded display headlines** in the section's colour; short plain body copy in grey.
- **Alternating illustration / text rows**, lots of whitespace, one full-bleed colour block (with a wavy edge) to close.
- **The product is the pitch.** Lesson UI (progress bar, hearts, check/continue bar that turns green/red) is shown rather than described.

## Rules for this app

- Tokens live in `src/index.css`. Brand kept: indigo `#6366f1`, gold, teal, rose, Outfit + Spike the bull. Fredoka is the display face (h1-h3).
- Pressable surfaces: `.btn-3d` (+ `is-secondary|accent|success|danger|outline|white`) and `.card-3d`. `<Button>` maps onto them.
- Green is for success/gain only. Gold is for XP/coins. Indigo is the brand/primary action.
- No gradients, no `backdrop-blur`, no emoji as UI art (use `SpikeMascot` / `SpikeEmoji`).
- Copy: plain and specific. No fake testimonials, ticker stats or unsourced numbers.
- Motion: springs for entrances and feedback; everything respects `prefers-reduced-motion`.
