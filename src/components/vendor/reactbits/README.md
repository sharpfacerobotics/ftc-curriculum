# Vendored React Bits components

Copied from [React Bits](https://reactbits.dev) (MIT), which is distributed to
be copied rather than installed. The published npm bundle is a single barrel
that pulls in eighteen peer dependencies, including three.js, react-three-fiber,
rapier and matter-js, to use any one component. These two are copied in
instead, so the site carries what it actually uses.

- `SpotlightCard` — a highlight that follows the pointer across a card.
  Restyled onto the theme tokens; the stock version hardcodes a dark surface
  and disappears on a light page.
- `CountUp` — counts a number to its value when it scrolls into view. Used on
  the lesson total, which is a real figure.

- `Aurora` — a WebGL wash behind the hero. Given the site's own blues rather
  than the stock purple and green, held at half opacity under a mask, and
  hidden entirely for reduced motion.
- `ShinyText` — a shimmer across the hero line.
- `ClickSpark` — sparks at the pointer on click, wrapping the whole app.
- `TiltedCard` — the screenshots on the homepage, which tilt toward the
  pointer.

Fixes applied to the copies, since they are ours once vendored:

- `SpotlightCard` hardcodes a #111 card on a #222 border and vanishes on a
  light page; its surface reads from the theme tokens.
- `CountUp` finished on the wrong number. A spring settles by approaching its
  value, so the last frame sits under the target and formats down: 173 lessons
  displayed as 172. The exact figure is written when the animation ends.
- `Aurora` and `ShinyText` are required inside BrowserOnly rather than
  imported at the top of the page. A static import is evaluated in the server
  pass even when the component only renders in the browser, and their
  stylesheet imports fail there, which broke the build outright.
- `TiltedCard` sizes its figure to a fixed 300px and places the image itself,
  so a 1600px screenshot sat across the neighbouring column. Pinned to the grid
  column and clipped, since pinning the width alone still left it proud by the
  card's own offset.
- `ClickSpark` sizes its canvas from its own wrapper, so it has to contain the
  page. Rendered as a sibling it collapsed to nothing and drew no sparks.

`SplitText` was wanted and could not be used: it depends on GSAP's SplitText
plugin, which is not free.
