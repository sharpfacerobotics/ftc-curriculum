# Telemark design system

Tokens live at the top of `src/css/custom.css`. Component stylesheets
reference them rather than repeating literals. See the README section
"Design system" for the enforcement test.

## Theme

Dark, and not by category reflex.

The scene: a student on a school Chromebook in a fluorescent-lit workshop,
screen angled away from overhead glare, reading between build tasks; and the
same student in a competition venue where the house lights are down and the
field is the brightest thing in the room. The venue case forces it. A
near-black page does not blow out in a dim hall, and the dark surface keeps
the amber and red states in the calculators legible as warnings rather than
decoration.

## Color strategy

**Restrained.** Tinted neutrals carry the surface; aqua is the single accent
and stays under roughly 10% of any view. Blue is a secondary used to separate
the two tracks, not a second brand color.

Every neutral is tinted toward the aqua hue rather than being pure grey, and
neither `#000` nor `#fff` appears anywhere.

| Role | Token | Value |
| --- | --- | --- |
| Page | `--tm-bg` | `#05080d` |
| Card | `--tm-surface-1` | `#080d13` |
| Panel | `--tm-surface-2` | `#0b1118` |
| Control | `--tm-surface-3` | `#0d151e` |
| Raised | `--tm-surface-4` | `#111b25` |
| Heading | `--tm-text-strong` | `#effbff` |
| Body | `--tm-text` | `rgba(221, 241, 249, 0.82)` |
| Accent | `--tm-accent` | `#22d3ee` |
| Secondary | `--tm-blue-soft` | `#60a5fa` |
| Success | `--tm-success` | `#4ade80` |
| Warning | `--tm-warn` | `#fbbf24` |
| Danger | `--tm-danger` | `#f87171` |

Semantic colors appear only in calculator verdicts and quiz grading, where
they carry meaning. They are never used decoratively.

## Typography

- **Display** Rajdhani, for headings and large numerals.
- **Body** Exo 2, for prose.
- **Label** Share Tech Mono, uppercase with wide tracking, for eyebrows, tags,
  table headers, and figure captions. This is where the instrument-panel
  character lives.
- **Code** JetBrains Mono.

Scale runs `--tm-fs-2xs` through `--tm-fs-3xl` with at least a 1.25 ratio
between adjacent steps. Body measure is capped at 68ch by
`.theme-doc-markdown p`.

## Spacing and radius

4px base scale, `--tm-sp-1` through `--tm-sp-8`.

Radii are `--tm-r-sm` 8px, `--tm-r-md` 12px, `--tm-r-lg` 16px, and
`--tm-r-pill`. Plus `--tm-r-hand`, a deliberately uneven four-value corner
used on cards and figures, with an alternate so adjacent cards do not look
mechanically identical. It is the one signature flourish and it is used
sparingly.

## Motion

All durations come from `--tm-dur-fast`, `--tm-dur`, `--tm-dur-slow`, which
collapse to near zero under `prefers-reduced-motion`, so the entire motion
layer disables itself from one place.

Animation is explanatory: an arm sweeping its range shows the cosine
relationship, a gear train turns at true relative speeds. Nothing autoplays.
Entrance reveals fire once and disconnect their observer.

## Components

Cards are used for units and modules because the content genuinely is a
repeated set of peers. Everywhere else, prefer plain sections with rules.
Never nest a card in a card.
