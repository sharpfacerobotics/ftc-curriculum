const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const buildRoot = path.resolve(__dirname, '../build');

function findRoute(route) {
  const clean = route.replace(/^\/+|\/+$/g, '');
  const candidates = [
    path.join(buildRoot, `${clean}.html`),
    path.join(buildRoot, clean, 'index.html'),
  ];
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  assert.ok(found, `Missing built route /${clean}`);
  return fs.readFileSync(found, 'utf8');
}

function walk(directory) {
  return fs.readdirSync(directory, {withFileTypes: true}).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

const homepage = fs.readFileSync(path.join(buildRoot, 'index.html'), 'utf8');
// The homepage must render real counts from the curriculum data, not stale
// hardcoded numbers. Both tracks are represented: the software unit and lesson
// counts, the mechanical module and lesson counts, and the combined total in
// the stats bar.
assert.match(homepage, />16</, 'Homepage must render the 16 software units');
assert.match(homepage, /16 units · 97 lessons/, 'Homepage must render the software lesson count');
assert.match(homepage, /13 modules · 65 lessons/, 'Homepage must render the mechanical module and lesson counts');
assert.match(homepage, />162</, 'Homepage stats bar must render the combined lesson count');
assert.match(homepage, />2</, 'Homepage stats bar must render the track count');
assert.match(homepage, /telemark-build-commit/);

findRoute('/curriculum');
findRoute('/simulator');
findRoute('/search');
findRoute('/docs/unit-00');
findRoute('/docs/unit-00/classes-and-objects');
findRoute('/docs/unit-01/prerequisites');
findRoute('/docs/unit-06/opmode-active');

findRoute('/docs/unit-10/get-current-position');
const builtJavaScript = walk(path.join(buildRoot, 'assets/js'))
  .filter((file) => file.endsWith('.js'))
  .map((file) => fs.readFileSync(file, 'utf8'))
  .join('\n');
assert.match(
  builtJavaScript,
  /still cannot see wheel slip, backlash, loose couplers, or a mechanism that stalls/,
);

// ── Cross-track and internal link audit ────────────────────────────────────
// Docusaurus's onBrokenLinks check did not catch a doc whose `id` frontmatter
// silently moved its route away from the path other lessons linked to, so the
// built routes are compared against every internal link written in source.

const repoRoot = path.resolve(__dirname, '..');

const builtRoutes = new Set();
for (const file of walk(buildRoot).filter((name) => name.endsWith('.html'))) {
  const relative = path.relative(buildRoot, file).replaceAll(path.sep, '/');
  builtRoutes.add(`/${relative.slice(0, -'.html'.length)}`);
  if (relative.endsWith('index.html')) {
    builtRoutes.add(`/${relative.slice(0, -'index.html'.length).replace(/\/$/, '')}`);
  }
}

const sourceDirs = ['mechanical', 'docs']
  .map((name) => path.join(repoRoot, name))
  .filter((directory) => fs.existsSync(directory));

const brokenLinks = [];
let linksChecked = 0;

for (const file of sourceDirs.flatMap(walk).filter((name) => name.endsWith('.mdx'))) {
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(/\]\((\/(?:mechanical|docs)[^)#\s]*)\)/g)) {
    linksChecked += 1;
    const route = match[1].replace(/\/+$/, '');
    if (!builtRoutes.has(route)) {
      brokenLinks.push(`${path.relative(repoRoot, file)} -> ${route}`);
    }
  }
}

assert.equal(
  brokenLinks.length,
  0,
  `Broken internal links:\n  ${brokenLinks.join('\n  ')}`,
);
assert.ok(linksChecked >= 20, `expected at least 20 internal links, found ${linksChecked}`);

const buildMeta = JSON.parse(
  fs.readFileSync(path.join(buildRoot, 'build-meta.json'), 'utf8'),
);
assert.match(buildMeta.commit, /^[0-9a-f]{7,40}$/i);
assert.ok(buildMeta.builtAt);

console.log(
  `Build verification passed for commit ${buildMeta.commit.slice(0, 12)}, `
  + `${linksChecked} internal links resolved`,
);
