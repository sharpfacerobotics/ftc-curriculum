const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

/** Counts read from the curriculum data, so adding a module cannot leave a
    stale literal here to fail a later build. */
const tsCache = new Map();

function loadTelemark(name) {
  const file = path.resolve(__dirname, '..', 'src/telemark', `${name}.ts`);
  if (tsCache.has(file)) return tsCache.get(file);
  const {outputText} = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
  });
  const module = {};
  tsCache.set(file, module);
  new Function('exports', 'require', 'module', outputText)(
    module,
    (id) => (id.startsWith('./') ? loadTelemark(id.slice(2)) : require(id)),
    {exports: module},
  );
  return module;
}

const software = loadTelemark('curriculum');
const mechanical = loadTelemark('mechanical');

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
const softwareStat = `${software.CURRICULUM_UNIT_COUNT} units · ${software.CURRICULUM_LESSON_COUNT} lessons`;
const mechanicalStat = `${mechanical.MECHANICAL_UNIT_COUNT} modules · ${mechanical.MECHANICAL_LESSON_COUNT} lessons`;
const combinedLessons = software.CURRICULUM_LESSON_COUNT + mechanical.MECHANICAL_LESSON_COUNT;
assert.ok(homepage.includes(softwareStat), `Homepage must render "${softwareStat}"`);
assert.ok(homepage.includes(mechanicalStat), `Homepage must render "${mechanicalStat}"`);
assert.match(homepage, new RegExp(`>${combinedLessons}<`), `Homepage must render the combined lesson count ${combinedLessons}`);
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
