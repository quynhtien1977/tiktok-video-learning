---
name: Giáo trình kể bằng tiếng nói
description: A warm-paper lecture frame for Vietnamese software-engineering explainers, rendered by Remotion at 16:9 and 9:16.
colors:
  paper: "#F5F1EC"
  paper-deep: "#EDE6DC"
  ask-paper: "#F7EBE6"
  ink: "#2B2520"
  ink-soft: "#6B6054"
  accent: "#C8613C"
  accent-soft: "#E8D5CB"
  accent-wash: "#FBEFE9"
  ask: "#7E4F63"
  rule: "#DED5C8"
typography:
  display:
    fontFamily: "Be Vietnam Pro"
    fontSize: "96px"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Be Vietnam Pro"
    fontSize: "66px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Be Vietnam Pro"
    fontSize: "60px"
    fontWeight: 800
    lineHeight: 1.12
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Be Vietnam Pro"
    fontSize: "40px"
    fontWeight: 400
    lineHeight: 1.35
  caption:
    fontFamily: "Be Vietnam Pro"
    fontSize: "36px"
    fontWeight: 600
    lineHeight: 1.35
  secondary:
    fontFamily: "Be Vietnam Pro"
    fontSize: "28px"
    fontWeight: 400
    lineHeight: 1.35
  label:
    fontFamily: "Be Vietnam Pro"
    fontSize: "22px"
    fontWeight: 400
    letterSpacing: "3px"
rounded:
  chip: "12px"
  node: "14px"
  enclosure: "18px"
  square: "0px"
spacing:
  pad-x: "160px"
  pad-top: "162px"
  caption-bottom: "59px"
  stack-sm: "22px"
  stack-md: "30px"
  stack-lg: "52px"
components:
  running-head:
    textColor: "{colors.ink-soft}"
    typography: "{typography.label}"
  running-head-ask:
    textColor: "{colors.ask}"
    typography: "{typography.label}"
  progress-rail:
    backgroundColor: "{colors.rule}"
    height: "3px"
    width: "100%"
    rounded: "{rounded.square}"
  progress-rail-fill:
    backgroundColor: "{colors.accent}"
    height: "3px"
    rounded: "{rounded.square}"
  progress-rail-fill-ask:
    backgroundColor: "{colors.ask}"
    height: "3px"
    rounded: "{rounded.square}"
  caption-band:
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    width: "68%"
  caption-word-unspoken:
    textColor: "{colors.ink-soft}"
    typography: "{typography.caption}"
  diagram-node:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.node}"
    height: "92px"
  diagram-node-accent:
    backgroundColor: "{colors.accent-wash}"
    textColor: "{colors.accent}"
    rounded: "{rounded.node}"
  diagram-node-ask:
    backgroundColor: "{colors.ask-paper}"
    textColor: "{colors.ask}"
    rounded: "{rounded.node}"
  diagram-enclosure:
    backgroundColor: "{colors.paper-deep}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.enclosure}"
  verb-chip:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
    rounded: "{rounded.chip}"
    height: "66px"
    width: "190px"
---

# Design System: Giáo trình kể bằng tiếng nói

## Overview

**Creative North Star: "The Printed Textbook Page, Read Aloud"**

Every frame is a page of a warm-paper textbook with a lecturer's voice over it. Wide margins, ink
on cream, one earth-orange accent used as a pointer, and figures that sit on the page like book
illustrations rather than screenshots pasted onto a slide. The genre default — bullets drifting on a
dark background, every scene arriving with the same fade, glow and grid — is rejected outright: here
each scene type has its own entrance, and the figure is the protagonist, not decoration.

Density is low and deliberate. One idea per frame, at most four bullets, 15–45 seconds of speech,
and a caption band that is always lit because most of the audience watches muted on a phone. The
only persistent furniture is a running chapter head top-left, an episode/part label top-right, and a
3px progress rail hugging the bottom edge — the rail is the series' recognition mark.

There is no hover, focus, or keyboard vocabulary in this system. State means two things only: which
scene type is on screen, and who is speaking. The second speaker ("ask") swaps the whole paper to a
rose-tinted sheet and tints the rail plum instead of drawing a coloured border.

**Key Characteristics:**
- Warm cream paper, brown-black ink, no neutral grey anywhere.
- One accent (earth orange) used as a pointer, never as a fill field.
- Scene-specific entrances; a shared 10-frame in, 8-frame out on the frame itself.
- A burned-in karaoke caption on every single frame.
- Two frame sizes, one layout: 1920×1080 and 1080×1920 from the same components.

## Colors

A warm print palette: cream paper, brown-black ink, one earth-orange accent, and a plum reserved for
the questioning voice. Neutral grey is forbidden — every "grey" in the build is a warm brown.

### Primary
- **Earth Orange** (`{colors.accent}`): the pointer. Bullet and outro numerals, the title scene's
  4px opening rule, the filled portion of the progress rail, the focal node in a diagram, the REST
  verb chips, the "next episode" line. It marks what to look at; it never becomes a background field.
- **Accent Wash** (`{colors.accent-wash}`): the fill inside an accent-toned diagram node only — just
  enough tint to say "this is the node the narration is on".
- **Accent Soft** (`{colors.accent-soft}`): the reserved light-orange tint in the token file; carried
  as system vocabulary, with no current shipping usage.

### Secondary
- **Question Plum** (`{colors.ask}`): the second speaker. Question-scene type, the running head on an
  ask scene, the rail fill on an ask scene, the translator node in the in-car diagram. Plum appears
  only when someone other than the host is talking.
- **Ask Paper** (`{colors.ask-paper}`): the whole-sheet swap under an ask scene, and the fill of an
  ask-toned diagram node. The speaker change is a paper change, never a left border.

### Neutral
- **Warm Paper** (`{colors.paper}`): the sheet, and the fill of an ordinary diagram node so nodes read
  as cut from the same paper rather than as white cards.
- **Deep Paper** (`{colors.paper-deep}`): a tonal step down, used for the enclosure rectangle that
  groups nodes into one system.
- **Ink** (`{colors.ink}`): all body and display text, diagram strokes and arrowheads, spoken caption
  words at weight 700.
- **Soft Ink** (`{colors.ink-soft}`): subtitles, scene captions, diagram sub-labels, the running head,
  and unspoken caption words at weight 500.
- **Rule** (`{colors.rule}`): the unfilled progress rail, the quote scene's top/bottom rules, the outro
  divider, the enclosure stroke. Hairline structure, never a container border.

### Named Rules
**The No Neutral Grey Rule.** Every soft tone is a warm brown drawn from the ink family. Any value
with equal R/G/B is out of world.

**The Pointer Accent Rule.** Earth orange marks one thing at a time: a numeral, a rule, a single
focal node, the rail's progress. It is never the background of a block of text.

**The Speaker-Is-Paper Rule.** A speaker change is expressed by swapping the sheet (`{colors.ask-paper}`)
and the rail tint. Never by a coloured left border, never by a badge.

**The Citation Hue Rule.** A slide-quoted raster keeps the course deck's cyan and its own letterform.
That foreign hue is a declared citation, not a palette break — see Components → Image (Slide Quotation).

## Typography

**Display Font:** Be Vietnam Pro, weights 400/600/800, self-hosted via `@remotion/google-fonts`
(full Vietnamese diacritics, latin-ext).
**Body Font:** Be Vietnam Pro — one family carries the whole system.

**Character:** A contemporary Vietnamese grotesque set with tight negative tracking at display sizes
and relaxed 1.35 leading in body copy. Authoritative at 800, conversational at 400 — a textbook that
talks.

### Hierarchy
Sizes below are the 1920-wide base; every one passes through `useLayout().s()` and is multiplied by
`width/1920`, then by a further 1.72 in portrait so the vertical cut reads at arm's length.

- **Display** (800, 96px, 1.05, −0.03em): the episode title only, rising from behind an orange rule.
- **Headline** (800, 66px, 1.2, −0.02em): the question scene's single line, in plum.
- **Title** (800, 60px, 1.12, −0.02em): the shared scene heading; 700/40px when a diagram scene needs
  a quieter heading above the figure.
- **Quote / Formula** (600, 52px, 1.3): pull-quote text between two hairline rules; KaTeX display math.
- **Body** (400, 40px, 1.35): bullet lines, capped at 78% measure in landscape, 100% in portrait.
- **Caption band** (600, 36px, 1.35, centred): the burned-in subtitle. Spoken words switch to ink at
  700, unspoken stay soft ink at 500 — weight and hue carry the cue, never opacity.
- **Secondary** (400, 28–34px): title subtitle, scene captions, diagram sub-labels, hints.
- **Label** (400, 22px, +3px tracking, uppercase): the running chapter head and the episode/part label.

### Named Rules
**The 32px Floor Rule.** No running text below the equivalent of 32px at 1080p; the caption band sits
at 36px because the audience is on a phone.

**The Weight-Not-Opacity Rule.** Caption cueing is colour plus weight (ink/700 vs soft ink/500).
Nothing in the caption band is ever faded with opacity.

**The Whole-Clause Rule.** Captions advance a clause at a time, broken on sentence and clause
punctuation, up to 18 words landscape / 14 portrait — never a fixed N-word window that would split a
term across cues.

## Layout

One layout serves both frame sizes. `useLayout()` is the single source of every size: it reads
`useVideoConfig()`, derives `k = width/1920`, and returns `s()`, `padX`, `padTop`, `captionBottom` and
`captionWidth` as fractions of the live frame. Landscape margins are 8.3% of width (160px at 1920) and
portrait tightens to 7.5%; top pad is 15% / 14% of height; the caption band floats 5.5% off the bottom
in landscape and 11% in portrait, at 68% / 86% of frame width.

Content lives in a `Page` column: top pad, wide side margins, and a deep bottom reserve (18–22% of
height) kept clear so nothing ever collides with the caption band. Content is vertically centred in
that column; the title scene is the only `anchorTop` exception, placing the title on the upper third.
Diagrams get 66% of frame height in landscape, 60% in portrait, and each diagram ships a separate
portrait composition of its own rather than a scaled-down landscape one.

Timing is layout too: 30fps, scene duration comes from the audio manifest plus a 0.4s default tail,
and nothing hardcodes `durationInFrames`.

### Named Rules
**The No Raw Pixel Rule.** Nothing writes a pixel size directly. Every size, margin and gap goes
through `useLayout()` — `s()` for type and spacing, the `padX`/`padTop`/`caption*` fractions for
structure. This is what makes the portrait cut *compose* rather than shrink. The only literals in the
build are the 3px rail, the 4px title rule, SVG geometry inside a diagram's own `viewBox`, and the
1.72 portrait multiplier itself.

**The Caption Reserve Rule.** The bottom 18–22% of every frame belongs to the caption band. Layouts
fill the column above it; nothing is centred against the raw frame height.

## Elevation & Depth

The page is flat by doctrine. Depth comes from tonal layering — paper, deep paper, hairline rule — not
from shadow. Exactly one thing is allowed to lift off the sheet: a code-drawn diagram's nodes and its
enclosure rectangle, via a single soft drop shadow (`drop-shadow(0 8px 14px rgba(43,37,32,0.14))`).
The shadow is warm-tinted from the ink, offset downward, and generously blurred — the light of a book
illustration, not a UI card.

### Shadow Vocabulary
- **Node lift** (`filter: drop-shadow(0 8px 14px rgba(43, 37, 32, 0.14))`): applied to diagram node
  groups and diagram enclosure groups only.

### Named Rules
**The One Lifted Surface Rule.** Only diagram nodes and enclosures carry shadow. Arrows, labels,
headings, captions, quoted slide rasters and the frame furniture all lie flat on the paper. There are
no cards, no panels, no glass, no glow.

## Shapes

Two shape families, held apart on purpose. Diagram geometry is softly rounded: nodes at 14px, group
enclosures at 18–20px, REST verb chips at 12px, all stroked at 2–2.5px in ink or accent with a paper
fill. Frame furniture is strictly square-cut: the 3px progress rail, the 4px orange title rule, the
2px quote and outro rules. Rounding belongs to the figure; the page itself has straight edges.

### Named Rules
**The Hairline Structure Rule.** Horizontal division is a 2px rule in `{colors.rule}` spanning the
text column — never a boxed container, never a filled band.

## Components

### Frame (persistent furniture)
- **Character:** a book's running head and a reading-progress rail.
- **Running head:** uppercase label at 22px with +3px tracking, chapter title left, episode or
  `Phần n/N` right, baseline-aligned, inset by `padX`. Soft ink; plum on an ask scene.
- **Progress rail:** 3px, full bleed at the bottom edge, rule-coloured track with an accent fill at
  episode progress; the fill turns plum on an ask scene.
- **Paper:** `{colors.paper}`, swapping to `{colors.ask-paper}` for the second speaker.
- **Transition:** scene content fades in over 10 frames and out over the last 8. The furniture and the
  paper do not fade — only the content layer.

### Caption band
- **Character:** always-on karaoke subtitle, the accessibility backbone of the series.
- Centred, max 68% / 86% of frame width, 36px at 600. Spoken words ink/700, unspoken soft ink/500.
- Falls back to the scene's full narration text when no word timings exist.
- Present on every scene type without exception.

### Scene types (the state vocabulary)
Eight types, each with its own entrance; all springs use `damping: 200` except the question scene's
sharper 180.
- **Title** (26f): orange rule grows to 28% / 46% width, then the display line slides up from behind a
  clipping mask; subtitle fades in at 40% of the spring. The only top-anchored scene.
- **Bullets** (18f per line, staggered across 62% of the scene): each line slides 22px in from the left
  behind an accent numeral in a 32px gutter.
- **Formula** (static): KaTeX display math at 52px, optional heading above, soft-ink caption below.
- **Image**: see Image (Slide Quotation) below.
- **Diagram** (built over 62% of the scene): see Diagram below.
- **Quote** (24f): fades up between two 2px rules with 40px of air above and below.
- **Question** (20f): plum headline scaling 0.965 → 1 as if someone cut in; the whole sheet is already
  rose.
- **Outro** (22f): heading, numbered takeaways with accent numerals, then a "next episode" line in
  accent above a 2px rule.

### Diagram (redrawn figure)
- **Character:** the protagonist of the series — a textbook figure that assembles itself in the order
  the narration names its parts.
- Drawn in code as SVG inside a per-orientation `viewBox`; nodes fill with page paper (not white),
  stroke 2.5px, 14px radius, title 25/700 with a 20px soft-ink sub-label.
- Tones: ink (default), accent (the focal node, wash fill), ask (plum, the aside).
- Arrows draw themselves via `strokeDasharray` and only grow an arrowhead past 75% of their spring;
  labels fade in from 55%.
- Node and enclosure groups carry the node-lift shadow; arrows and labels do not.

### Image (Slide Quotation)
- **Character:** a verbatim quotation from the course deck, not an illustration.
- **Keeps the source's own look:** the slide's cyan and its original letterform are preserved, because
  students must recognise the same figure when they reopen the slides to revise.
- Lies flat — no shadow, no card, no border. The raster's white ground is removed with
  `mix-blend-mode: multiply` so the ink sits directly on the paper.
- Capped at 56% / 42% of frame height, fades up with a slow 1.035 drift over 300 frames.
- **Must carry a caption naming the source slide** (e.g. "Sơ đồ trích thẳng từ slide 13").

### Named Rules
**The Diagram Provenance Rule.** A `diagram` scene is redrawn in the series palette and lifts off the
paper with the node shadow. An `image` scene is a verbatim quotation from the course slides: it keeps
the slide's cyan and letterform, lies flat with no shadow, has its white ground removed with
`mix-blend-mode: multiply`, and must carry a caption naming the source slide. Students have to
recognise the same figure when they reopen the deck; the foreign hue is a declared citation, not a
palette break. Never recolour a quoted slide into the house palette, and never redraw a figure without
also moving it into the house palette.

**The Figure-First Rule.** When a scene's point is a structure, it is a diagram or image scene — not a
bullet list describing the structure.

## Do's and Don'ts

### Do:
- **Do** route every size, margin, gap and radius through `useLayout()` (`s()`, `padX`, `padTop`,
  `captionBottom`, `captionWidth`) so the 1080×1920 cut recomposes instead of shrinking.
- **Do** give each new scene type its own entrance and its own spring, in the existing 18–26 frame band.
- **Do** keep the caption band lit on every frame and leave the bottom 18–22% of the frame clear for it.
- **Do** express a speaker change as a paper swap to `{colors.ask-paper}` plus a plum rail.
- **Do** caption every quoted slide raster with the slide it came from, and let it keep the deck's cyan.
- **Do** fill diagram nodes with page paper so they read as cut from the sheet, and reserve the accent
  tone for the single node the narration is on.
- **Do** read scene length from the audio manifest; a scene's duration is its audio plus the tail.

### Don't:
- **Don't** write a literal pixel value in a component. The exceptions are already in the build (3px
  rail, 4px title rule, SVG geometry inside a diagram `viewBox`) and the list does not grow.
- **Don't** introduce neutral grey, gradients, glass, glow, grid overlays, or a dark background — the
  warm-paper world is pinned by the user.
- **Don't** put a shadow on anything but a diagram node or enclosure group, and never a hard offset
  shadow: the one allowed shadow is soft, downward, and ink-tinted.
- **Don't** recolour or restyle a quoted slide raster into the house palette, and don't wrap it in a
  white card — `mix-blend-mode: multiply` is how its ground disappears.
- **Don't** mark a speaker, a scene type, or an emphasis with a thick coloured left border or a badge.
- **Don't** cue captions with opacity, and don't cut them on a fixed word count mid-term.
- **Don't** add a kicker or eyebrow line above a heading. The uppercase running head is frame
  furniture at the top corners; it is not a licence for eyebrows inside the content column.
- **Don't** add a second type family. Be Vietnam Pro at 400/600/800 covers the whole ramp; KaTeX's math
  face is tolerated inside formula math only.
- **Don't** hardcode `durationInFrames` in a component or hand-edit `manifest.json`.
