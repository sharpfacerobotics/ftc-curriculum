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

Deliberately not used: the splash cursors, aurora and iridescence backgrounds,
metaballs and blob effects. The complaint that prompted this work was that the
interface looked generated, and those are the components that look that way.
