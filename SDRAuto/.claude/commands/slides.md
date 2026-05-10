---
name: slides
description: Converts a markdown file into a polished, self-contained web-based slide deck (HTML). Use when the user wants to create a presentation from a markdown file.
argument-hint: "[path-to-markdown-file]"
---

## Instructions

When the user runs `/slides <path>`, convert the markdown file at `<path>` into a single self-contained HTML slide deck. If no path is given, ask the user which markdown file to use.

### 1. Read the source markdown

- Read the file at `$ARGUMENTS` (or the path the user provides).
- Split on `---` horizontal rules to identify individual slides.
- Each `## Slide N — Title` heading marks a new slide. Adapt if the user uses a different heading convention (e.g., `## Title` or `# Title` separated by `---`).

### 2. Design the HTML slide deck

Create a **single self-contained HTML file** (no external dependencies beyond a Google Fonts import) with these characteristics:

#### Visual design
- Dark theme: near-black background (`#0f1117`), dark surface cards (`#1a1d27`), light text (`#e4e4e7`).
- Accent color: indigo/purple (`#6366f1`) used for highlights, progress bar, numbered badges, and interactive elements.
- Use the `Inter` font from Google Fonts. Fallback to `system-ui, sans-serif`.
- Responsive: adapt layout for mobile (single-column grids, hide non-essential metadata).

#### Slide structure — map markdown elements to HTML components
- **Title slide**: Large gradient heading (`h1`), subtitle paragraph, and tag pills if tags are present.
- **Stat tables** (tables with numeric data): Render as stat cards in a grid — large number, label, description.
- **Ordered lists with bold titles**: Render as numbered step cards with a colored circle number, bold title, and description.
- **Data tables** (with many columns): Render as styled HTML tables. If a column contains percentages, add a colored inline bar proportional to the value (green >70%, yellow 40-70%, red <40%).
- **Difficulty/risk badges**: Render Easy/Medium/Hard or Low/Med/High as small colored badges (green/yellow/red).
- **Two-section content** (e.g., "Foundational" + "Strategic", "High Risk" + "Watch Out"): Render as a two-column grid layout.
- **Callouts/blockquotes** (`>`): Render as styled callout boxes with left accent border and muted background.
- **Phase/timeline content**: Render as horizontal phase cards with a phase label, time range, and description.
- **Level/spectrum tables** (e.g., autonomy levels): Render as stacked row cards with badges. Highlight the recommended option.

#### Navigation & UX
- Arrow key navigation (left/right), spacebar to advance, and swipe gestures for touch.
- Previous/Next buttons fixed in the bottom-right corner (circular, styled).
- Progress bar at the top of the viewport (colored gradient, animates on slide change).
- Slide counter in the bottom-left (e.g., "3 / 9").
- Slide transitions: fade + subtle horizontal translate (incoming slides from right, exiting slides to left).

#### CSS architecture
- All styles embedded in a `<style>` block — no external CSS files.
- Use CSS custom properties (`:root` vars) for colors so the theme is easy to tweak.
- Use `clamp()` for responsive font sizing.

#### JavaScript
- All JS embedded in a `<script>` block at the end of `<body>`.
- Minimal: just slide navigation state, keyboard/touch handlers, and progress bar updates.
- No frameworks or libraries.

### 3. Write the output

- Write the HTML file to the same directory as the source markdown, with the same base name but `.html` extension. For example, `slides.md` becomes `slides.html`.
- Open the file in the user's browser using `open <path>` (macOS) or inform the user of the file path.

### 4. Adapt intelligently

The design above is the baseline. Adapt to the content:
- If slides have more content, use smaller fonts or scrollable slide areas.
- If there are fewer slides, give each more visual breathing room.
- If content doesn't fit the patterns above (e.g., images, code blocks), render them cleanly with appropriate styling (code blocks in monospace with dark background, images centered and responsive).
- Always preserve all content from the source markdown — do not summarize or omit anything.
