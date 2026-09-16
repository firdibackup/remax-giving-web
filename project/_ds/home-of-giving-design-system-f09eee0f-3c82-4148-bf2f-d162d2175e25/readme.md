# REMAX Home of Giving — Design System

**Brand:** REMAX Home of Giving, the corporate-social/charity arm of REMAX Indonesia. Warm, human, optimistic, trustworthy, modern — a corporate real-estate brand's identity (REMAX blue/red) softened into a charity voice with a handwritten accent.

**Sources provided for this build:**
- Brand brief (pasted text, Bahasa Indonesia) — colors, typography, button/card specs, section-by-section website content plan.
- `uploads/logo.svg` — the real REMAX Home of Giving logo lockup (REMAX wordmark + handwritten "Home of Giving" mark with heart/sparkle accents). Copied to `assets/logo.svg`.
- 3 photographs (`uploads/P1172139.JPG`, `P1172183.JPG`, `P1172228.JPG`) of volunteers and children in community/education activities. Copied to `assets/photos/`.
- No Figma file, codebase, or existing website was attached — this system and the website UI kit are built directly from the brief + assets, not from live product code.

## Index
- `styles.css` — root stylesheet, imports all tokens (colors, typography, spacing, effects).
- `tokens/` — CSS custom properties.
- `assets/` — logo + photography.
- `components/core/` — Button, Badge, ProgressBar, StatCounter.
- `components/cards/` — CampaignCard.
- `components/layout/` — Navbar, Footer.
- `ui_kits/website/` — homepage recreation (`index.html`, `Homepage.jsx`).
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing, Brand).
- `SKILL.md` — portable skill file for use in Claude Code / other agent tools.

## Components
- **Button** — primary (red CTA) / secondary (blue outline) / dark (blue solid).
- **Badge** — small uppercase category/status pill (blue or red tone).
- **ProgressBar** — red-fill donation progress track.
- **StatCounter** — big number + label impact stat.
- **CampaignCard** — full donation-program card (photo, category, title, progress, CTA).
- **Navbar** — site header with nav links + Donasi Sekarang CTA.
- **Footer** — navy footer with logo, nav, legal line.

### Intentional additions
None beyond the brief — every component above is named explicitly in the source brief (buttons, card, progress bar, navbar, footer, impact counter).

## CONTENT FUNDAMENTALS
- **Language:** Bahasa Indonesia for all UI copy and CTAs (e.g. "Donasi Sekarang", "Lihat Program", "Terkumpul", "Target"). English is used only for a few emotive taglines that mirror the logo's English wordmark ("Giving Starts From Home", "Together We Give").
- **Voice:** warm, direct, communal — "kita" (we/us) framing rather than corporate "kami" distance; short declarative headlines in imperative or collective voice ("Bersama Menciptakan Dampak Nyata" — "Together we create real impact").
- **Casing:** hero/section headlines are frequently set in full uppercase for weight ("GIVING STARTS FROM HOME", "BERSAMA MENCIPTAKAN DAMPAK NYATA"); body copy and card titles stay in normal sentence case.
- **CTAs:** imperative, action-first, often paired with an arrow — "Donasi Sekarang →". Primary donation CTAs are never phrased as questions or soft suggestions.
- **Tone toward beneficiaries:** dignified and optimistic, not pity-driven — the brief explicitly avoids "foto kesedihan berlebihan" (excessive sadness). Copy favors words like "dampak", "harapan", "kebaikan" (impact, hope, goodness) over crisis language.
- **Numbers:** statistics are stated plainly and confidently (e.g. "12.500+ Penerima Manfaat", "Rp2,4 M Donasi Tersalurkan") — Indonesian number formatting (period as thousands separator, comma as decimal).
- **Emoji:** not used. The brand's warmth comes from photography and the handwritten accent font, not emoji.

## VISUAL FOUNDATIONS
- **Color balance:** deliberately not a 50/50 red-blue split. Target composition is ~60% white/soft-white, ~25% REMAX blue, ~10% REMAX red, ~5% supporting navy. Backgrounds are white or `--color-bg-soft` (#F7F9FC) by default.
- **Color roles:** blue (`#003DA5`) is structural — navigation, headings, footer, statistic numbers, secondary buttons. Red (`#E21B2D`) is reserved for attention/emotion — the donate CTA, progress-bar fill, key numbers, heart icon, highlighted words. Dark navy (`#062E61`) is used for the footer and heading text color, not as a third "loud" brand color.
- **Type:** Plus Jakarta Sans (ExtraBold/Bold/SemiBold/Medium/Regular) is the workhorse for all UI, headings and body. Caveat (SemiBold/Bold) is reserved for short handwritten "eyebrow" accents above a bold headline (e.g. "Program & Target Donasi" in Caveat, directly above "BERSAMA MENCIPTAKAN DAMPAK NYATA" in Plus Jakarta Sans ExtraBold) — never for full paragraphs or long strings, to protect readability.
- **Spacing:** 4px base scale (4/8/16/24/32/48/64/80/96px) via `tokens/spacing.css`; section padding is generous (64–96px vertical) to keep the "white-dominant" feel from the brief.
- **Backgrounds:** flat color fields (white / soft background / blue) alternate section-to-section as visual breaks — no gradients, no repeating textures or patterns, no illustration backdrops. Photography, when used, is full-bleed within a rounded container, never as a page-wide background.
- **Imagery:** natural, warm, human — volunteers and children in real community/education settings, genuine smiles, natural light, natural skin tones. Explicitly not staged-sad "poverty" imagery. No black & white treatment, no heavy grain/filter.
- **Animation:** minimal — short (120–200ms) ease-standard (`cubic-bezier(.4,0,.2,1)`) transitions only, for hover/press feedback. No bouncy/springy motion, no page-load choreography.
- **Hover states:** buttons lift 1px (`translateY(-1px)`); cards raise their shadow from `--shadow-card` to `--shadow-card-hover`. No color-darkening hovers on the primary red CTA — the lift + shadow carries the feedback.
- **Press states:** rely on the same lift/shadow system; no scale-down "press" effect defined in the brief, so components stay conservative rather than inventing one.
- **Borders:** cards use a single hairline border `#E8EBF0`, never a colored accent border. Secondary buttons use a 1.5px solid blue border, not a subtle gray one — the border itself carries brand color when it's a button, not when it's a card.
- **Shadows:** soft, blue-tinted (`rgba(6,46,97,…)`), never black — `--shadow-card` for resting cards, `--shadow-card-hover` on hover, `--shadow-button` (red-tinted) under the primary CTA.
- **Corner radii:** buttons 10–12px ("sedikit rounded tetap friendly tapi profesional" — a little rounded stays friendly but professional, deliberately not the very round style of children's apps); cards 16–20px; pills (badges, progress track/fill) fully rounded.
- **Cards:** white surface, hairline border, 16–20px radius, soft shadow, photo-dominant top, small category label, bold heading, progress bar, CTA — no extra red/blue ornament layered on top.
- **Transparency/blur:** not used in the source brief — surfaces stay opaque and flat.
- **Layout:** centered max-width containers (1200px) with generous side padding; no fixed/sticky decorative elements described in the brief beyond a standard top navbar.

## ICONOGRAPHY
- The brief specifies a **simple, rounded, outline, modern** icon style (explicitly *not* a heavy corporate-illustration style) — no icon set or icon font was provided in the source materials, so no icon library has been copied into `assets/`.
- Suggested subjects from the brief: donation/heart, home, environment/leaf, education, health/plus — default to blue, switching to red only as a highlight.
- **No emoji are used** anywhere in the brand's UI copy.
- **Recommendation / open item:** if the team has a preferred icon library (e.g. Lucide/Heroicons, which match the "simple rounded outline" description well), attach it and it can be wired in directly; until then, treat icon glyphs as a placeholder gap rather than inventing bespoke icon SVGs.

## Fonts
- **Plus Jakarta Sans** and **Caveat** are loaded from Google Fonts via `tokens/typography.css` (`@import url('https://fonts.googleapis.com/...')`) — both are exact matches to the brief's named fonts, not substitutions, so no font files needed to be sourced or flagged.
