const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

const accessPolicy = read('src/telemark/accessPolicy.ts');
const navigator = read('static/simulator/navigator.html');
const docItem = read('src/theme/DocItem/index.tsx');
const rootTheme = read('src/theme/Root.tsx');
const navbarItem = read('src/theme/NavbarItem/DefaultNavbarItem/index.tsx');
const homepage = read('src/pages/index.tsx');
const searchPlugin = read('plugins/telemark-search/index.js');
const deployedSmoke = read('scripts/smoke-deployed.cjs');
const config = read('docusaurus.config.ts');
const customCss = read('src/css/custom.css');
const mechanicalData = read('src/telemark/mechanical.ts');
const tracks = read('src/telemark/tracks.ts');
const trackOverview = read('src/components/TrackOverview.tsx');
const unitOverview = read('src/components/UnitOverview.tsx');
const contentLock = read('src/components/ContentLock.tsx');
const useProgress = read('src/telemark/useProgress.ts');
const dashboard = read('src/pages/dashboard.tsx');

for (let unit = 2; unit <= 15; unit += 1) {
  const simulatorComponent = read(`src/components/Unit${unit}Simulator.tsx`);
  assert.match(
    simulatorComponent,
    /<SimulatorFrame\b/,
    `Unit ${unit} must use the shared fullscreen simulator frame`,
  );
}

assert.match(accessPolicy, /unitNumber >= 1/);
assert.match(navigator, /HOMEPAGE_DEMO_UNIT_MIN = 2/);
assert.match(navigator, /HOMEPAGE_DEMO_UNIT_MAX = 5/);
assert.match(docItem, /isProtectedUnit\(unitNumber\)/);
assert.match(rootTheme, /isPublicRoute/);
assert.match(rootTheme, /const publicUnit = unitNumber !== null && !isProtectedUnit\(unitNumber\)/);
assert.match(rootTheme, /isPublicRoute\(relativePath\) \|\| publicUnit \|\| user/);
assert.match(rootTheme, /<ContentLock/);
assert.match(navbarItem, /isAuthItem && loading[\s\S]*return null/);
assert.doesNotMatch(homepage, /useState<string>\(isNumeric \? '0'/);
assert.match(homepage, /CURRICULUM_UNIT_COUNT/);
assert.match(homepage, /CURRICULUM_LESSON_COUNT/);
assert.match(searchPlugin, /const isProtected = unit !== null && unit >= 1/);
assert.match(searchPlugin, /excerpt: isProtected \? '' : cleanExcerpt/);
assert.match(searchPlugin, /actions\.setGlobalData\(content\)/);
assert.match(deployedSmoke, /deployedMeta\.commit !== expectedCommit/);
assert.match(deployedSmoke, /cacheKey = `\$\{expectedCommit \|\| Date\.now\(\)\}-\$\{attempt\}`/);
assert.match(config, /title: 'Telemark'/);
assert.match(config, /label: 'GitHub'/);
assert.match(
  config,
  /© 2026 Telemark\. Built by FTC Team Sharp Face Robotics #30450\. Built with Docusaurus\. Not affiliated with FIRST®/,
);
assert.match(customCss, /\.telemark-navbar-center[\s\S]*left: 50%/);
assert.match(customCss, /\.footer[\s\S]*padding: 0\.85rem 1\.5rem/);

assert.equal(Number.isInteger(0) && 0 >= 1, false);
for (let unit = 1; unit <= 15; unit += 1) {
  const protectedUnit = Number.isInteger(unit) && unit >= 1;
  assert.equal(protectedUnit, true);
}

// ── Mechanical track ──────────────────────────────────────────────────────
// The mechanical track reuses the software track's components, so these
// assertions guard the shared surfaces against being narrowed back to one
// track.

assert.match(config, /id: 'mechanical'/, 'engineering docs plugin instance missing');
assert.match(config, /routeBasePath: 'mechanical'/);
assert.match(config, /to: '\/mechanical'/, 'navbar must link to the mechanical track');
assert.match(mechanicalData, /MECHANICAL_UNITS/);
assert.match(mechanicalData, /MECHANICAL_LESSONS/);

// Shared lookups must be track-aware, not curriculum-only.
assert.match(tracks, /trackForUnitSlug/);
assert.match(tracks, /unitSlug\.startsWith\('module-'\)/);
assert.match(unitOverview, /getAnyUnitBySlug/, 'UnitOverview must resolve units in either track');
assert.match(unitOverview, /getAnyLessonsForUnit/);
assert.match(useProgress, /getAnyLessonsForUnit/, 'progress must complete units in either track');
assert.match(contentLock, /getAnyUnitBySlug/, 'the lock screen must name mechanical modules');

// Gating: module-NN follows the same public-unit-0 rule as unit-NN.
assert.match(accessPolicy, /\(unit\|module\)-/);
assert.match(accessPolicy, /export function getUnitSlug/);
assert.match(rootTheme, /getUnitSlug/);
assert.match(docItem, /getUnitSlug/);

// Search indexes both tracks.
assert.match(searchPlugin, /routeBase: '\/mechanical'/);
assert.match(searchPlugin, /\(\?:unit\|module\)-/);

// Discovery surfaces.
assert.match(homepage, /TracksSection/, 'homepage must offer both tracks');
assert.match(homepage, /MECHANICAL_LESSON_COUNT/);
assert.match(trackOverview, /companionTrackId/);
assert.match(dashboard, /activeTrack/, 'dashboard must switch between tracks');

console.log('Site access, navbar, homepage demos, protected search, and mechanical track regression checks passed');

// ── Programmatic navigation must respect the base URL ───────────────────────

// history.push takes its argument literally, so a raw app path sends the
// browser to example.com/docs while the site lives at example.com/telemark/.
// Hardcoding the prefix is the same bug mirrored: correct in production, broken
// locally. Both forms shipped at once and made every quick-search result 404.
{
  const collect = (dir) =>
    fs.readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? collect(full) : [full];
    });
  const sources = collect(path.join(root, 'src')).filter(
    (file) => file.endsWith('.tsx') || file.endsWith('.ts'),
  );
  const offenders = [];
  for (const file of sources) {
    const text = fs.readFileSync(file, 'utf8');
    for (const match of text.matchAll(/history\.(?:push|replace)\(\s*([^\n)]*)/g)) {
      const argument = match[1].trim();
      if (argument.startsWith('basePath(')) continue;
      offenders.push(`${path.relative(root, file)}: history.push(${argument})`);
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `programmatic navigation must go through basePath():\n  ${offenders.join('\n  ')}`,
  );
}
