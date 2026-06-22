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
assert.match(homepage, />15</, 'Homepage must render 15 in static HTML');
assert.match(homepage, />95</, 'Homepage must render 95 in static HTML');
assert.match(homepage, /telemark-build-commit/);

findRoute('/curriculum');
findRoute('/simulator');
findRoute('/search');
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

const buildMeta = JSON.parse(
  fs.readFileSync(path.join(buildRoot, 'build-meta.json'), 'utf8'),
);
assert.match(buildMeta.commit, /^[0-9a-f]{7,40}$/i);
assert.ok(buildMeta.builtAt);

console.log(`Build verification passed for commit ${buildMeta.commit.slice(0, 12)}`);
