# Telemark

Telemark is Sharp Face Robotics' Docusaurus-based FTC curriculum. It has two
parallel tracks:

- **Software** (`docs/`, served at `/docs`): 16 units and 70 lessons of FTC
  Java, from classes and OpModes through sensors, vision, and autonomous, with
  a browser simulator on most lessons.
- **Mechanical** (`mechanical/`, served at `/mechanical`): 12 modules and 60
  lessons covering the design process, the notebook, shop work, materials, CAD,
  power transmission, drivetrains, mechanisms, wiring, testing, and competition
  readiness, with 12 interactive design calculators.

Both tracks share the same unit and lesson shape, defined by `CurriculumUnit`
and `CurriculumLesson` in `src/telemark/curriculum.ts`. The software track's
data lives in that file; the mechanical track's lives in
`src/telemark/mechanical.ts`. Components that must work for both read through
`src/telemark/tracks.ts` rather than importing one track directly.

Access gating is identical across tracks: unit 0 and module 0 are public, and
everything numbered 1 or above requires a Google account.

### Adding an mechanical module

1. Add a seed to `MODULE_SEEDS` in `src/telemark/mechanical.ts`.
2. Create `mechanical/module-NN/` with `_category_.json`, an overview that
   renders `<UnitOverview unitSlug="module-NN" />`, four lessons, and a mastery
   quiz.
3. Run `npm run test:mechanical`, which verifies the data model and the MDX
   files agree, and that every lesson records progress under the right id.

### Engineering calculators and visuals

The mechanical track uses calculators and diagrams the way the software track
uses simulators.

- **Math** lives in `src/telemark/mechanicalMath.ts` as pure functions with no
  React or DOM dependency. The calculator components collect numbers and render
  results; they contain no arithmetic of their own.
- **Tests** are in `scripts/mechanical-math.test.cjs`, which transpiles that
  module in memory and asserts against hand-checked reference values, known
  closed forms, and edge cases such as division by zero. Run with
  `npm run test:mechanical`.
- **Interactive visuals** in `src/components/mechanical/visuals/` are SVG
  figures driven by the same numbers the calculator displays, so the picture and
  the readout cannot disagree. Every calculator has one.
- **Static lesson diagrams** are in
  `src/components/mechanical/EngineeringDiagrams.tsx`.

### Cross-track links

The two tracks describe one robot, so lessons link to their counterpart: gear
ratios points at encoder tick conversion, odometry pod mounting points at path
following, and so on in both directions. `npm run test:mechanical` fails if
those links fall below the expected count, so they cannot silently rot.

### PDFs

```bash
npm run pdf:software
npm run pdf:mechanical
```

Both write a PDF to the repo root, which is gitignored. The script looks for
Chrome in the usual Linux and macOS locations; set `CHROME_PATH` to override.

`npm run check:content` fails if a calculator, visual, or diagram is not
reachable from a lesson, and if any figure is missing the `description` used as
its accessible label.

### Scored quizzes

Each module's mastery quiz ends with an auto-graded multiple choice section.
Questions live in `src/telemark/mechanicalQuizzes.ts`, keyed by module slug,
and are rendered by `ScoredQuiz`. Grading happens in the browser; passing offers
to record the lesson through the same progress store the rest of the site uses.
`npm run test:mechanical` validates every question: answer indices in range,
no duplicate options, and a real explanation on each.

### CAD practice

`mechanical/cad-practice.mdx` holds graded exercises with hard numbers and
self-check lists, rendered by `CadExercise`. Each exercise names the mistake it
is designed to provoke, so a student can tell whether they passed without a
mentor.

### Photographs

Lessons use `<LessonPhoto>`, which renders a labelled shot request until a real
photograph is supplied. Nothing is illustrated or generated: a real stripped
thread teaches faster than a drawing of one, so the slots describe exactly what
to shoot.

```bash
npm run photos:shotlist
```

regenerates `PHOTO-SHOTLIST.md` from those slots. To fill one, drop the file in
`static/img/mechanical/` and add `src` to the slot.

### Animation and interactivity

Animation is explanatory, never decorative: the arm sweeps through its range to
make the cosine relationship visible, the gear train turns at true relative
speeds, the slide extends so cascade multiplication can be watched rather than
read. Because it is explanatory it is also optional.

- `useAnimation.ts` provides `usePrefersReducedMotion()` and `useSweep()`.
  Nothing autoplays; the student presses play.
- Under `prefers-reduced-motion`, sweeps stop, `PlayControl` renders disabled
  with an explanation rather than vanishing, and declarative SVG animation is
  not rendered at all. CSS `animation-play-state` does not affect SMIL, so it
  is gated in JavaScript instead.
- `RangeField` pairs a slider with an exact number box, so dragging is
  available without losing precise entry.
- `Presets` load a configuration in one click, including ones that fail
  instructively: an under-geared drivetrain that stalls, an arm that cannot
  lift itself at horizontal, a cascading slide that is fast and too weak.

`npm run test:mechanical` asserts that every animated component honours
reduced motion, that sweep-driven motion has a play control, that every slider
has an exact number entry beside it, and that SMIL is guarded.

### Design system

All styling flows from tokens defined at the top of `src/css/custom.css`:
surfaces, ink, accent and its washes, semantic colours, borders, a type scale,
a 4px spacing scale, radii, elevation, and motion. Component stylesheets
reference tokens rather than repeating literals.

This exists because the site had drifted badly: 237 distinct colour literals
across 641 uses, 77 border-radius values, and 67 font sizes, all expressing a
handful of intentions in slightly different ways. After the migration:

| | Before | After |
| --- | --- | --- |
| Colour literals (uses) | 641 | 143 |
| Token references | 61 | 960 |
| Distinct border-radius values | 77 | 19 |
| Distinct font-size values | 67 | 26 |

`npm run test:design` enforces it: every required token must be defined, tokens
must outnumber literals, no single stylesheet may lean on more than 30
literals, the radius and font-size scales must stay small, reduced motion must
neutralise the duration tokens, and no stylesheet may write `-var(...)`, which
is invalid CSS that silently does nothing.

Two notes on intent. The slightly irregular corner radius
(`--tm-r-hand`) is deliberate, not a mistake, and there are two variants so
alternating cards do not look mechanically identical. And `custom.css` styles
the Docusaurus doc chrome directly, because lessons are where students spend
nearly all their time and should not look like a default theme inside a
themed shell.

### Design review

`PRODUCT.md` and `DESIGN.md` at the repo root hold the design context: users,
tone, anti-references, strategic principles, and the token system with the
reasoning behind the theme and colour strategy. They are the reference for any
future UI work.

A review against those rules found and fixed:

- **12 side-stripe borders.** A thick coloured accent on one arbitrary edge of
  a callout, card, or alert. All rewritten as a full border with a background
  tint, so the whole element is marked rather than one side of it.
- **The hero-metric bar.** Four big numbers with small labels is the SaaS
  template. The same facts now read as one sentence with the figures
  emphasised, which also stops them competing with the headline above.
- **An identical icon-card grid.** Four same-sized tiles of icon, heading, and
  text. Rewritten as a definition list whose rows differ in length, so it
  reads as prose about the product.
- **Accent-coloured custom scrollbars.** Restyling a standard affordance.
  Thinned and neutralised instead.
- **Em dashes in app copy.** The lesson rule already banned them; it now
  applies sitewide.

`npm run test:design` enforces all of it, across every stylesheet and
component.

### Site interactivity

`src/components/ui/` holds the sitewide interactive layer.

- **Command palette** (`CommandPalette.tsx`), opened with `Cmd/Ctrl+K` or `/`.
  It searches both tracks from any page, reusing the index the search plugin
  already builds rather than shipping a second one. Arrow keys move, Enter
  opens, Escape closes. It exists because 130 lessons across two sidebars meant
  finding one required knowing which track it lived in.
- **Reading progress** (`ReadingProgress.tsx`), a bar showing position through a
  lesson. Rendered only on lesson routes and exposed as a real `progressbar`
  with `aria-valuenow`.
- **Reveal and count-up** (`useReveal.ts`), scroll-triggered entrance animation
  and animated statistics. The observer disconnects after firing, so nothing
  re-animates on every scroll past.

Two details worth keeping. `useCountUp` initialises to its target so server
rendered HTML carries the real figure: a visitor without JavaScript, and any
crawler, sees `157`, not `0`. And it skips the animation when the element was
already on screen at mount, since counting up then means visibly resetting a
number the reader has already seen.

The lock screen carries its own navigation links. A locked page replaces the
entire app shell, navbar included, so without them it is a dead end reachable
only by the browser back button.

### Keeping the two tracks consistent

The tracks teach different subjects, so their lesson content differs by design.
What must not differ is the furniture: a student moving between them should
meet the same landing page, the same assessment, and the same navigation.

They had already drifted, and the fixes were:

- **One landing component.** The software landing was a bespoke page with its
  own 317 line stylesheet while the mechanical landing rendered
  `TrackOverview`. Both now render `TrackOverview`, which absorbed the sign-in
  gating the software page used to own.
- **The same track-level pages.** Both tracks have `getting-started.mdx` and
  `learning-paths.mdx`.
- **The same assessment.** All 26 mastery quizzes across both tracks end with a
  scored section: 70 software questions in `softwareQuizzes.ts` and 60
  mechanical questions in `mechanicalQuizzes.ts`.

- **The same shell.** Both landings are docs index pages owning their track
  root (`/docs` and `/engineering`), so each opens with its own sidebar and
  identical chrome. `/curriculum` survives as a redirect for old links, and is
  public so the redirect can actually run rather than being intercepted by the
  auth gate.
- **One navbar.** The homepage used to hand roll its own `<nav>`, so it had
  different chrome from every other page and the command palette was
  unreachable there. It now renders inside the shared `Layout`.

`npm run test:parity` enforces all of it, validates every one of the 130
questions for answer index range, duplicate options, and a real explanation,
and fails if any page stops using the shared shell or grows its own navbar.

Legitimate differences remain: software lessons carry browser simulators and
mechanical lessons carry calculators, because a mechanism's behaviour is
decided by numbers you compute before cutting anything, while code is checked
by running it.

### Simulator theming

The 47 simulator pages under `static/simulator/` are iframes, so they cannot
inherit the site's design tokens through the cascade. `telemark-sim.css`
restates the tokens and maps them onto the variable names those pages already
use, and is linked after each page's inline `<style>` so it wins on equal
specificity. That themes all of them without rewriting any.

### Public routes

Most of the site requires an account, but four routes do not, and each for a
reason:

| Route | Why it is public |
| --- | --- |
| `/` | The homepage has to be readable before signing up |
| `/login` | Obviously |
| `/search` | Titles are indexed for every lesson but excerpts of protected ones are redacted, so browsing signed out is safe and is the only way to judge whether an account is worth making |
| `/simulator` | The design calculators compute from numbers the student types and hold no lesson content; the Java simulators on the page gate themselves |
| `/curriculum`, `/engineering` | Redirects to the renamed routes, which cannot run if the gate intercepts them |

`/search` and `/simulator` were previously gated, which meant the navbar had
two links that led to a lock screen.

### Tests

| Command | Covers |
| --- | --- |
| `npm run typecheck` | Types across the site |
| `npm run check:content` | Prose rules, and that every calculator, visual, diagram, quiz, and photo slot is reachable |
| `npm run test:site` | Access gating, design tokens, design rules, track parity, track data model, 127 math assertions, component render smoke tests |
| `npm run test:simulator` | Software track simulator runtimes |
| `npm run functions:test` | Analytics backend. Requires `npm ci` inside `functions/` first, which is easy to miss: without it every import resolves to `any` and the type errors look like code faults |
| `npm run verify:build` | Built routes, homepage counts, and every internal cross-track link |

Run `verify:build` after `build`; it is the only check that sees the built
output, and it is what catches a doc whose `id` frontmatter silently moved its
route.

## Local development

```bash
npm ci
npm start
```

Production checks:

```bash
npm run typecheck
npm run build
npm run check:content
npm run test:site
npm run test:simulator
npm run functions:test
```

`test:site` runs the site regression checks and the mechanical track
consistency test. `check:content` enforces the prose rules for both tracks and
verifies every mechanical calculator is reachable from a lesson.

## Analytics administration

The private dashboard is available at `/telemark/admin`. Google login is visible
to everyone, but both the browser and the callable backend restrict metrics to
`sharpfacerobotics@gmail.com`. The backend returns aggregate values only.

See [ANALYTICS_SETUP.md](./ANALYTICS_SETUP.md) for the required one-time Google
Analytics, Firebase, IAM, and GitHub Actions configuration.
