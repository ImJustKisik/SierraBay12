<!-- SIERRA-ADD - SUI - NTOS UI design guidance -->
# NTOS UI Design Guide

This document defines the visual and interaction rules for modernized NTOS interfaces in SUI.

Reference implementations:
- `nano/js/sui_ntosmainmenu.js`
- `nano/js/sui_filemanager.js`
- `nano/js/sui_computerconfigurator.js`
- `nano/js/sui.js` (program shell header)

The goal is consistency across all NTOS programs: dense, utilitarian, desktop-first sci-fi UI with low visual noise and strong information hierarchy.

---

## Design Goals

- Preserve the classic SS13 NTOS feeling.
- Keep layouts compact and desktop-oriented.
- Reduce clutter without making the UI look modern-mobile or consumer-app-like.
- Use a single shared visual language across NTOS programs.
- Make primary actions obvious and destructive actions unmistakable.

---

## Core Principles

### 1. Dense Desktop Layout

- Prefer compact vertical rhythm.
- Avoid large empty gaps and oversized controls.
- Optimize for fixed-width desktop program windows, not responsive mobile layouts.

### 2. Square Geometry

- Use square corners or almost-square corners only.
- Default: `borderRadius: 0`
- Acceptable exception: `2px` on small buttons only.
- Do not use soft cards, pills, or large rounded surfaces.

### 3. Low-Noise Contrast

- Use contrast to create hierarchy, not decoration.
- Panels should be separated by thin muted borders.
- Avoid heavy gradients, glows, deep shadows, and ornamental chrome.

### 4. Primary Action Clarity

- One clearly dominant primary action per row or cluster.
- Secondary actions should not compete visually with the primary action.
- Destructive actions must be visually calm at rest and clearly dangerous on hover.

---

## Color Tokens

Use these as the default NTOS token set unless a screen has a good reason to vary slightly.

```js
var NTOS_THEME = {
  pageBackground: "#151b23",
  panelBackground: "#1b1b1c",
  cardBackground: "#10161d",
  panelBorder: "#374151",
  rowBorder: "#243142",
  rowHover: "#1f2937",
  text: "#f8fafc",
  muted: "#94a3b8",
  subtle: "#7c8a9d",
  title: "#93c5fd",
  primary: "#2563eb",
  primaryHover: "#1d4ed8",
  primaryText: "#f8fbff",
  good: "#4ade80",
  warn: "#fbbf24",
  bad: "#f87171"
}
```

Usage:
- Page background: `pageBackground`
- Section/panel background: `panelBackground`
- Dense row/card background: `cardBackground`
- Borders/dividers: `panelBorder`, `rowBorder`
- Primary actions: `primary`
- Titles and section labels: `title`
- Body text: `text`
- Meta labels, sizes, secondary info: `muted`, `subtle`
- Status and health indicators: `good`, `warn`, `bad`

---

## Typography

Preferred stack:

```js
fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
```

Rules:
- Program title in shell header: `13px`, bold
- Secondary shell text like time: `10px`
- Section titles: `11px`, uppercase, letter-spaced
- Row titles / file names / component names: `13px`, semibold or bold
- Metadata and labels: `10px` to `12px`
- Avoid oversized numeric readouts unless the screen is explicitly telemetry-focused

Hierarchy:
- White for the main subject
- Blue-tinted label color only for section headings and NTOS shell metadata
- Gray-blue muted text for support information

---

## Window Shell

All NTOS program windows should use the same shell language.

### Header Structure

Left:
- Square NTOS badge with `N`
- Program title
- Small time metadata below title

Right:
- Compact shell buttons such as `NTNET: LAN`, `MINIMIZE`, `EXIT`

### Header Rules

- Vertically align title/time with the badge and action buttons
- Keep the badge square
- Use thin borders and dark background
- `EXIT` should remain ghost by default and become red only on hover when appropriate

### Shell Button Rules

- Small height
- Square corners
- Thin border
- No large icons
- Readable uppercase text

---

## Sections

Each major block should use the same section container.

### Section Container

- Background: `panelBackground`
- Border: `1px solid panelBorder`
- Radius: `0`
- Padding: `10px 12px`

### Section Title Pattern

Use a centered uppercase title with horizontal divider lines on both sides.

Visual intent:
- Feels like terminal instrumentation
- Separates zones without large headers
- Works consistently across list, form, and detail views

---

## Buttons

### Primary Buttons

Use for:
- Main row action like `VIEW`, `OPEN`
- Core screen action like `TERMINAL`
- Positive configuration actions like `ENABLE`

Style:
- Solid blue background
- White text
- No extra outline
- Small square corners
- Compact height

### Secondary/Ghost Buttons

Use for:
- Non-destructive support actions
- Shell controls
- Edit language, print, minimize, export, etc.

Style:
- Transparent background
- Thin muted border
- Muted text at rest
- Slight lighter fill on hover

### Icon-Only Utility Buttons

Use for:
- Rename
- Clone
- Delete
- Import/export in dense tables

Style:
- Square ghost buttons
- No text
- Thin border
- Gray icon at rest
- White on hover

### Destructive Buttons

At rest:
- Calm, not screaming red
- Thin border, muted icon/text

On hover:
- Border becomes red
- Background gets subtle red fill
- Destructive intent becomes obvious

Important:
- If inline styles are used, destructive hover CSS must override them with `!important`

---

## Tables and Dense Lists

### Table Layout

Use CSS grid for precise alignment.

Typical file table pattern:

```js
gridTemplateColumns: "minmax(0, 1.7fr) 90px 90px 200px"
```

Rules:
- Column titles: `10px`, uppercase, muted
- Rows: compact padding, typically `8px 6px`
- Hover: `rowHover`
- Row dividers: `rowBorder`
- Actions aligned right

### Name Column

- File/component icon on the left
- Main item name in white
- Keep the name truncatable if needed

### Metadata Columns

- Type, size, power, state metadata should be muted
- Avoid oversized, bright metadata

---

## Cards and Component Rows

Use compact dark strips/cards for repeated items like:
- hardware components
- installed programs
- file records
- downloader programs

Rules:
- Border: `1px solid rowBorder`
- Background: `cardBackground`
- Padding: `8px 10px` or `10px`
- Hover may slightly brighten background
- Avoid heavy inner shadows

---

## Indicators and Status

### Dot Status

Use for:
- enabled/disabled
- running/idle

Rules:
- Small dot plus uppercase text
- No button-like appearance
- Use green/blue/gray accents sparingly

### Progress Indicators

Use two patterns only:

1. Linear meter
- For narrow inline usage
- Thin rectangular track with filled bar

2. Circular meter
- For compact summary panels
- Best for battery, disk usage, or capacity summaries

Do not mix multiple progress styles in the same screen unless there is a strong functional reason.

---

## Layout Patterns by Screen Type

### 1. Menu Screen

Example:
- `sui_ntosmainmenu.js`

Pattern:
- status summary
- action strip
- dense list of installed programs

### 2. File/List Screen

Example:
- `sui_filemanager.js`

Pattern:
- top action block
- dense data table
- primary row action + icon-only utilities

### 3. Config/Settings Screen

Example:
- `sui_computerconfigurator.js`

Pattern:
- compact summary panels
- key/value rows
- toggle actions
- dense component list

### 4. Viewer/Detail Screen

Pattern:
- small action bar at top
- content area inside bordered dark panel
- avoid decorative layout changes

---

## Icon Rules

Use the existing NanoUI sprite icon classes where possible to stay compatible with the current stack.

Guidelines:
- Prefer one icon per item, not multiple decorative icons
- Keep icons small
- Remove icons from secondary text buttons when the row becomes noisy
- Keep icons on primary buttons where they improve scanability

Examples:
- `gear` for `.PRG` or system tools
- `document` for `.CFG`
- `search` for `VIEW`
- `trash` for delete

---

## Interaction Rules

- Hover states should be subtle but visible
- Avoid large motion or animation
- Buttons must clearly express disabled state with reduced opacity
- Destructive hover must read immediately
- Tooltips are fine for icon-only actions if the screen is dense

---

## Do / Don't

### Do

- Keep panels square and compact
- Use thin muted borders
- Use one primary action per cluster
- Use ghost utility icons for secondary table actions
- Use centered divider-style section titles
- Keep alignment rigid and grid-based

### Don't

- Do not use mobile-style spacing
- Do not use rounded cards or pills
- Do not mix multiple unrelated visual idioms
- Do not make every action blue
- Do not place long labels in narrow two-column summaries without restructuring
- Do not use large decorative shadows or glows

---

## Implementation Checklist

When migrating another NTOS screen:

1. Use the shared NTOS color tokens.
2. Match the shell header style from `sui.js`.
3. Replace rounded sections with square bordered panels.
4. Convert section headers to centered divider titles.
5. Reduce spacing to dense desktop rhythm.
6. Keep one primary action per row/group.
7. Convert noisy secondary text buttons to ghost buttons or icon-only controls.
8. Align repeated content with grid or strict flex layouts.
9. Use muted metadata and strong white titles.
10. Verify destructive hover is visible.

---

## Recommended Base Components

For future interfaces, prefer extracting or reusing local patterns equivalent to:

- `SectionBlock`
- dense `PrimaryButton`
- ghost `IconButton`
- `KeyValueRow`
- `StatusBadge`
- `CircularMeter` or thin `Meter`

If a new NTOS screen needs custom widgets, build them from these patterns first before inventing a new visual language.

---

## Current Reference Screens

These should be treated as the current style baseline:

- Main menu: `nano/js/sui_ntosmainmenu.js`
- File manager: `nano/js/sui_filemanager.js`
- Computer configuration: `nano/js/sui_computerconfigurator.js`

If future screens diverge, bring them back toward these references unless the screen has a strong domain-specific reason not to.
