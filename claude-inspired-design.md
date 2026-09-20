# Claude-Inspired Design System — Implementation Spec

**Purpose of this file:** a design reference for a coding agent to restyle a personal sleep-tracking / N1 longitudinal research tool. It describes the visual language of Anthropic's Claude.ai interface — the "warm, calm, editorial" feel — broken down into concrete, implementable tokens (colors, type, spacing, components).

**Honesty note before we start:** Anthropic has not published an official public design-token spec, and the exact values Anthropic's engineers use internally aren't something I have direct access to. What follows is a close, well-informed reconstruction based on the *visible characteristics* of the interface — the same way any designer would reverse-engineer a look by studying it closely. Treat the hex values and pixel numbers as "very close starting points," not gospel. A coding agent should implement these as a real, working token system and you (or it) can nudge individual values to taste.

On the "is this legal" question: general aesthetic characteristics — a warm color temperature, a serif/sans pairing, generous whitespace, soft corners — are not the kind of thing copyright protects (copyright protects specific creative expression like text, code, or images, not a "vibe"). Trade dress law *can* apply to distinctive commercial branding, but that's a concern for someone launching a competing commercial product that could confuse customers, not for a personal, non-commercial research tool that happens to be inspired by an interface you like. I'm not a lawyer, but you're on very safe ground here.

---

## 1. Design Philosophy

The core feeling Claude's interface goes for is **"a quiet, well-made room to think in"** — not a SaaS dashboard, not a chat app, more like a nicely typeset document you happen to be having a conversation inside of. Three principles drive almost every decision:

1. **Warmth over neutrality.** Nothing is pure white or pure gray. Every "neutral" color has a slight warm (cream/sand) cast, like paper instead of a screen.
2. **Restraint over decoration.** One accent color, used sparingly. No gradients, no drop-shadows-for-the-sake-of-it, no bright saturated UI chrome. Color is a tool for hierarchy, not decoration.
3. **Typography carries the hierarchy**, not boxes and borders. A heading is a bigger/different font, not a bigger/different box. Whitespace, not dividers, separates sections wherever possible.

For a sleep-tracking tool specifically, this philosophy is a great fit: you want something that feels calm and unintimidating to open every morning, not clinical or alarm-heavy (avoid red/urgent colors for normal data; reserve strong color only for genuine outliers).

---

## 2. Color System

The palette is a warm neutral "paper" scale plus one terracotta/clay accent, used very sparingly.

### Light mode

```
--canvas:            #faf9f5   /* main app background — warm off-white, not #fff */
--surface:            #ffffff  /* cards, panels sitting "above" the canvas */
--surface-raised:     #f5f4ee  /* subtly recessed panels, code blocks, input fields */

--text-primary:       #2b2a26  /* near-black, warm-tinted, not pure #000 */
--text-secondary:     #6b6a63  /* muted warm gray for metadata, captions, labels */
--text-tertiary:       #9c9a91 /* placeholder text, disabled, timestamps */

--border-default:     #e8e6dc  /* hairline borders, dividers */
--border-strong:       #d1cfc5 /* hover/focus borders, emphasized containment */

--accent:              #c96442  /* the "clay/terracotta" — primary buttons, active states, links */
--accent-hover:        #b8542f
--accent-soft:          #f3e4dc  /* tinted background for accent-colored badges/highlights */

--success:             #5a8c5a
--success-soft:        #e6efe2
--warning:              #b58a3c
--warning-soft:         #fbf3df
--danger:               #b54a3c
--danger-soft:          #fbe8e3
--info:                 #5a708c
--info-soft:            #e9edf3
```

### Dark mode

```
--canvas:              #262625   /* warm charcoal, not pure black */
--surface:              #30302e
--surface-raised:        #3a3937

--text-primary:          #f2f0e9
--text-secondary:         #b8b6ac
--text-tertiary:          #83817a

--border-default:         #40403c
--border-strong:           #504f4a

--accent:                  #d97757   /* slightly brighter clay for dark backgrounds */
--accent-hover:             #e08765
--accent-soft:               #4a352c

--success:                  #7fb37f
--danger:                    #d97060
--warning:                    #d1a656
--info:                        #7d95b3
```

### Rules for using color

- **The accent color appears in at most one or two places per screen** — the primary action button, an active nav item, a link. It should never be the background of a large area.
- Semantic colors (success/warning/danger) are for actual status (e.g. "goal met," "missed entry," "outlier night") — never for decoration.
- Body text is never pure black; UI chrome is never pure white/gray. Everything sits on the warm scale above.

---

## 3. Typography

Claude pairs a **serif for the AI's "voice"** with a **sans for UI/interface chrome**. For your tool, a useful adaptation: **serif for anything reflective/narrative (insights, summaries, notes)**, **sans for everything structural (nav, labels, data, forms, numbers)**.

```
--font-serif: "Source Serif Pro", "Georgia", "Iowan Old Style", "Times New Roman", serif;
--font-sans:  "Inter", "Söhne", system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
--font-mono:  "JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace;
```

(Claude's actual production fonts are the licensed **Tiempos** (serif, Klim Type Foundry) and **Styrene** (sans, Commercial Type) — both are paid commercial fonts, so for an open implementation, Source Serif Pro / Georgia and Inter are the closest free equivalents in shape and warmth.)

### Type scale

| Role | Family | Size | Weight | Line-height | Notes |
|---|---|---|---|---|---|
| Display / page title | serif | 32–40px | 400–500 | 1.15 | Only one per screen |
| Section heading | sans | 20–22px | 600 | 1.3 | |
| Card title | sans | 16px | 600 | 1.4 | |
| Body / paragraph | serif or sans | 15–16px | 400 | 1.6–1.7 | Serif for narrative notes, sans for UI text |
| Data label / caption | sans | 12–13px | 500 | 1.4 | Often --text-secondary, sometimes uppercase w/ letter-spacing 0.04em |
| Numeric data (big stat) | sans | 28–36px | 500–600 | 1.1 | Tabular figures if available |
| Monospace (raw data, timestamps) | mono | 13px | 400 | 1.5 | |

General rule: **generous line-height, generous line-length control** (cap paragraph width around 65–75 characters) — this is a big part of why the interface feels calm rather than dense.

---

## 4. Spacing & Layout

An 8px base spacing scale, used consistently everywhere (no arbitrary one-off values):

```
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-5: 24px
--space-6: 32px
--space-7: 48px
--space-8: 64px
```

- Card internal padding: `--space-5` (24px) minimum. Claude's UI is never cramped — err toward more padding than feels necessary.
- Section-to-section vertical rhythm: `--space-7` or `--space-8`.
- Max content width for a reading/detail column: ~720–760px, centered. Dashboards/grids can go wider (1100–1200px) but individual text blocks stay narrow.
- Sidebar (if you have one for nav between "Today / Trends / Log / Settings"): fixed width ~260–280px, own subtly-different background (`--surface-raised`), no heavy border — just a 1px `--border-default` divider.

---

## 5. Radius & Elevation

Rounded, but not "bubbly." Corners are soft, not pill-shaped, except for small tags/badges.

```
--radius-sm: 6px    /* inputs, small buttons, tags */
--radius-md: 10px   /* cards, panels */
--radius-lg: 16px   /* large containers, modals */
--radius-full: 999px /* pills, avatar circles, toggle switches */
```

Shadows are extremely subtle — more like a hairline border with faint lift than a "card floating in space":

```
--shadow-sm: 0 1px 2px rgba(43, 42, 38, 0.06);
--shadow-md: 0 2px 8px rgba(43, 42, 38, 0.08);
--shadow-lg: 0 8px 24px rgba(43, 42, 38, 0.12);   /* modals, popovers only */
```

Most cards should rely on a `--border-default` hairline rather than shadow at all. Reserve shadow for things that are genuinely "floating" above content — modals, dropdowns, tooltips.

---

## 6. Borders & Dividers

- Default border: `1px solid var(--border-default)`, used for card outlines, table rows, input fields.
- Avoid double-borders (a card with both a border AND a shadow AND a different background) — pick one method of separation per element.
- Dividers between list items: prefer a 1px `--border-default` line over a gap+background approach, for a denser "document" feel where appropriate (e.g. a log of nightly entries).

---

## 7. Motion

Calm and fast, never bouncy or springy. Nothing should call attention to itself.

```
--motion-fast: 120ms
--motion-base: 200ms
--motion-slow: 320ms
--ease-standard: cubic-bezier(0.2, 0, 0, 1)
```

- Hover states: background/border color fade only, `--motion-fast`.
- Panel/modal open: fade + very slight upward slide (8px), `--motion-base`.
- No parallax, no bounce/elastic easing, no auto-playing animation loops. If in doubt, cut the animation shorter and simpler.

---

## 8. Iconography

- Outline style, ~1.5px stroke weight, not filled/solid icons.
- Sizes: 16px (inline with text), 20px (default UI), 24px (feature/empty-state icons).
- Icons inherit the surrounding text color (`--text-secondary` for muted UI icons, `--text-primary` for emphasized ones) — icons are almost never accent-colored except a small set of true "primary action" icons.
- Recommended free icon set matching this style: **Lucide** (outline, consistent stroke width, large library).

---

## 9. Component Patterns for a Sleep-Tracking Dashboard

Mapping the above system onto your actual screens:

**Today / entry view**
- One serif-titled headline at top (e.g. "Last night") in `--font-serif`, `display` scale.
- A big numeric stat (hours slept, sleep score) in the large sans numeric style, `--accent` used only if it's a genuinely notable value (e.g. a personal best), otherwise `--text-primary`.
- Supporting metrics (latency, wake count, efficiency %) as small labeled stat blocks: `--text-secondary` label above, `--text-primary` value below, no boxes needed — whitespace separates them.

**Trend charts (the core of an N1 longitudinal view)**
- Line/area charts: use `--text-primary` or `--accent` for the single data line — avoid rainbow multi-color unless comparing genuinely distinct series, and even then keep the palette muted (accent, info, success, warning — not saturated defaults).
- Gridlines: `--border-default`, very light, or omit entirely and rely on axis labels.
- Background: `--surface`, not a contrasting chart-library default.
- Annotate outliers with a small `--danger` or `--warning` dot + soft-colored tooltip rather than a jarring red bar.

**Nightly log list**
- Each entry as a row with a hairline `--border-default` bottom divider (not individual boxed cards) — reads more like a ledger/journal, fitting the "N1 research log" framing.
- Date in `--text-secondary` sans, small; a one-line serif "note" field if you let yourself jot subjective notes (mood, caffeine, etc.) — this is where the serif/reflective pairing earns its keep.

**Data-entry forms**
- Inputs: `--surface-raised` background, `1px solid var(--border-default)`, `--radius-sm`, focus state = `--border-strong` + a soft 2–3px `--accent-soft` outer ring (no harsh blue browser-default focus ring).
- Labels above inputs, `--text-secondary`, 13px, sans, medium weight.
- Primary submit button: solid `--accent` background, white text, `--radius-sm`, no gradient, subtle `--shadow-sm` only.
- Secondary buttons: transparent background, `--border-default` outline, `--text-primary` text.

**Tags / quality badges** (e.g. "Good night," "Interrupted," "Outlier")
- `--radius-full` pill, small text (12px, medium weight), background = the relevant semantic `-soft` token, text = the relevant semantic solid token (e.g. `--success-soft` bg + `--success` text).

**Empty states** (e.g. no data logged yet for a given week)
- Centered, generous vertical padding (`--space-8`), one muted outline icon (24px, `--text-tertiary`), one line of `--text-secondary` sans body text, one small text-link-style action — never a big illustrated graphic or a loud call-to-action button.

**Navigation**
- Left sidebar (or top bar on mobile), `--surface-raised` background, items in sans 14–15px, `--text-secondary` default → `--text-primary` on hover → `--accent` + subtle `--accent-soft` background pill on active/selected.

---

## 10. Voice & Microcopy

Not strictly visual, but part of why the interface "feels" the way it does: short, plain, warm sentences. No exclamation points, no forced enthusiasm, no corporate jargon. "You logged 6.5 hours" rather than "Great job logging your sleep! 🎉". Empty/error states are matter-of-fact and helpful rather than cute.

---

## 11. Ready-to-Use CSS Variables Block

```css
:root {
  /* color — light */
  --canvas: #faf9f5;
  --surface: #ffffff;
  --surface-raised: #f5f4ee;
  --text-primary: #2b2a26;
  --text-secondary: #6b6a63;
  --text-tertiary: #9c9a91;
  --border-default: #e8e6dc;
  --border-strong: #d1cfc5;
  --accent: #c96442;
  --accent-hover: #b8542f;
  --accent-soft: #f3e4dc;
  --success: #5a8c5a; --success-soft: #e6efe2;
  --warning: #b58a3c; --warning-soft: #fbf3df;
  --danger: #b54a3c;  --danger-soft: #fbe8e3;
  --info: #5a708c;    --info-soft: #e9edf3;

  /* type */
  --font-serif: "Source Serif Pro", Georgia, serif;
  --font-sans: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;

  /* spacing */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 24px; --space-6: 32px; --space-7: 48px; --space-8: 64px;

  /* radius */
  --radius-sm: 6px; --radius-md: 10px; --radius-lg: 16px; --radius-full: 999px;

  /* shadow */
  --shadow-sm: 0 1px 2px rgba(43,42,38,0.06);
  --shadow-md: 0 2px 8px rgba(43,42,38,0.08);
  --shadow-lg: 0 8px 24px rgba(43,42,38,0.12);

  /* motion */
  --motion-fast: 120ms;
  --motion-base: 200ms;
  --motion-slow: 320ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
}

[data-theme="dark"] {
  --canvas: #262625;
  --surface: #30302e;
  --surface-raised: #3a3937;
  --text-primary: #f2f0e9;
  --text-secondary: #b8b6ac;
  --text-tertiary: #83817a;
  --border-default: #40403c;
  --border-strong: #504f4a;
  --accent: #d97757;
  --accent-hover: #e08765;
  --accent-soft: #4a352c;
  --success: #7fb37f;
  --danger: #d97060;
  --warning: #d1a656;
  --info: #7d95b3;
}
```

---

## Instructions for the coding agent

1. Wire these CSS variables into the project's global stylesheet (or Tailwind config as custom colors/spacing/radius tokens if the project uses Tailwind).
2. Replace hard-coded colors, font sizes, and spacing values throughout the existing components with these tokens — don't introduce new one-off values.
3. Apply the component patterns in Section 9 to the existing screens without changing functional logic — this is a visual-only refactor.
4. Respect the "one accent color used sparingly" rule above all else — this is the single biggest lever for making the UI feel like the reference rather than a generic dashboard.
5. Add `[data-theme="dark"]` support if the project doesn't already have a theme toggle; otherwise wire the dark tokens into the existing toggle.
