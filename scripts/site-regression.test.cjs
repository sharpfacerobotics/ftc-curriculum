const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function loadTs(relative, exportName) {
  const {outputText} = ts.transpileModule(
    fs.readFileSync(path.join(root, relative), 'utf8'),
    {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}},
  );
  const module = {};
  new Function('exports', 'require', 'module', outputText)(module, require, {exports: module});
  return module[exportName];
}
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

const accessPolicy = read('src/telemark/accessPolicy.ts');
const navigator = read('static/simulator/navigator.html');
const docItem = read('src/theme/DocItem/index.tsx');
const rootTheme = read('src/theme/Root.tsx');
const navbarItem = read('src/theme/NavbarItem/DefaultNavbarItem/index.tsx');
const homepage = read('src/pages/index.tsx');
const homepageCss = read('src/pages/index.module.css');
const searchPlugin = read('plugins/telemark-search/index.js');
const deployedSmoke = read('scripts/smoke-deployed.cjs');
const config = read('docusaurus.config.ts');
const customCss = read('src/css/custom.css');
const mechanicalData = read('src/telemark/mechanical.ts');
const tracks = read('src/telemark/tracks.ts');
const trackOverview = read('src/components/TrackOverview.tsx');
const trackOverviewCss = read('src/components/TrackOverview.module.css');
const unitOverview = read('src/components/UnitOverview.tsx');
const unitOverviewCss = read('src/components/UnitOverview.module.css');
const contentLock = read('src/components/ContentLock.tsx');
const useProgress = read('src/telemark/useProgress.ts');
const dashboard = read('src/pages/dashboard.tsx');
const dashboardCss = read('src/pages/dashboard.module.css');
const loginCss = read('src/pages/login.module.css');
const markCompleteCss = read('src/components/HomepageFeatures/MarkComplete.module.css');
const simulatorFrame = read('src/components/SimulatorFrame.tsx');
const authenticatedNavigator = read('src/components/AuthenticatedSimulatorNavigator.tsx');

for (let unit = 2; unit <= 15; unit += 1) {
  const simulatorComponent = read(`src/components/Unit${unit}Simulator.tsx`);
  assert.match(
    simulatorComponent,
    /<SimulatorFrame\b/,
    `Unit ${unit} must use the shared fullscreen simulator frame`,
  );
}

assert.match(accessPolicy, /unitNumber >= FIRST_GATED_UNIT/);
assert.match(navigator, /HOMEPAGE_DEMO_UNIT_MIN = 2/);
assert.match(navigator, /HOMEPAGE_DEMO_UNIT_MAX = 5/);
assert.match(accessPolicy, /export function isUnitOverviewPath/);
assert.match(accessPolicy, /export function isProtectedLessonPath/);
assert.match(docItem, /isProtectedLessonPath\(docPath\)/);
assert.match(rootTheme, /const protectedLesson = isProtectedLessonPath\(relativePath\)/);
assert.match(rootTheme, /!protectedLesson \|\| user/);
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
assert.match(config, /favicon: 'img\/telemark\.png'/, 'the existing web icon must remain the favicon');
assert.match(config, /src: 'img\/telemark_logo\.png'/, 'the transparent logo must be used in the navbar');
assert.match(config, /to: '\/docs\/unit-00\/classes-and-objects'[\s\S]{0,80}label: 'Software'/);
assert.match(config, /to: '\/mechanical\/module-00\/design-cycle'[\s\S]{0,80}label: 'Mechanical'/);
assert.match(config, /theme: prismThemes\.github/);
assert.match(config, /darkTheme: prismThemes\.dracula/);
assert.match(
  config,
  /© 2026 Telemark\. Built by FTC Team Sharp Face Robotics #30450\. Built with Docusaurus\. Not affiliated with FIRST®/,
);
assert.match(customCss, /\.telemark-navbar-center[\s\S]*left: 50%/);
assert.match(customCss, /\.footer[\s\S]*padding: 0\.85rem 1\.5rem/);

// Light mode must use the same shared surfaces and readable action colours on
// the exact pages that previously retained hard-coded dark styling.
assert.match(unitOverviewCss, /\.hero[\s\S]{0,220}background: var\(--tm-surface-1\)/);
assert.match(unitOverviewCss, /\.lessonCard[\s\S]{0,320}background: var\(--tm-surface-3\)/);
assert.match(markCompleteCss, /\.unmarkBtn[\s\S]{0,180}border-radius: var\(--tm-r-pill\)/);
assert.match(dashboardCss, /\.resumeBtn[\s\S]{0,260}color: var\(--tm-text-on-accent\) !important/);
assert.match(loginCss, /\[data-theme='light'\] \.card\s*\{\s*background: #fff/);
assert.match(loginCss, /\.googleBtn[\s\S]{0,300}background: #fff;[\s\S]{0,80}color: #111820/);
assert.match(loginCss, /\[data-theme='light'\] \.privacy\s*\{\s*color: #111820/);

for (const frameSource of [simulatorFrame, authenticatedNavigator]) {
  assert.match(frameSource, /useColorMode/);
  assert.match(frameSource, /telemark:simulator-theme-state/);
  assert.match(frameSource, /contentWindow\?\.postMessage|contentWindow\.postMessage/);
}

// The gate is exercised against the real policy rather than a copy of the rule,
// so moving the boundary cannot leave this test asserting the old one.
{
  const policy = loadTs('src/telemark/accessPolicy.ts', 'isProtectedUnit');
  const protectedLesson = loadTs('src/telemark/accessPolicy.ts', 'isProtectedLessonPath');
  const overview = loadTs('src/telemark/accessPolicy.ts', 'isUnitOverviewPath');
  const firstGated = loadTs('src/telemark/accessPolicy.ts', 'FIRST_GATED_UNIT');
  assert.equal(typeof firstGated, 'number');
  for (let unit = 0; unit < firstGated; unit += 1) {
    assert.equal(policy(unit), false, `unit ${unit} should be open`);
  }
  for (let unit = firstGated; unit <= 15; unit += 1) {
    assert.equal(policy(unit), true, `unit ${unit} should need an account`);
  }
  assert.equal(overview('/docs/unit-05'), true);
  assert.equal(overview('/mechanical/module-12/'), true);
  assert.equal(overview('/docs/unit-05/if-statements'), false);
  assert.equal(protectedLesson('/docs/unit-05'), false, 'gated unit overview should stay public');
  assert.equal(protectedLesson('/mechanical/module-12'), false, 'gated module overview should stay public');
  assert.equal(protectedLesson('/docs/unit-05/if-statements'), true);
  assert.equal(protectedLesson('/mechanical/module-12/hole-standards'), true);
  assert.equal(protectedLesson('/docs/official-docs'), false);
  assert.equal(protectedLesson('/mechanical/learning-paths'), false);
}

// ── Mechanical track ──────────────────────────────────────────────────────
// The mechanical track reuses the software track's components, so these
// assertions guard the shared surfaces against being narrowed back to one
// track.

assert.match(config, /id: 'mechanical'/, 'engineering docs plugin instance missing');
assert.match(config, /routeBasePath: 'mechanical'/);
assert.match(config, /to: '\/mechanical\/module-00\/design-cycle'/, 'navbar must start the mechanical track');
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
// Asserted as reachability rather than by component name: what matters is that
// a visitor can get into either track from the homepage, not which component
// happens to render the link this month.
assert.match(homepage, /units=\{CURRICULUM_UNITS\}/, 'homepage must list software units');
assert.match(homepage, /units=\{MECHANICAL_UNITS\}/, 'homepage must list mechanical modules');
assert.ok(
  homepage.includes('/docs/unit-00/') && homepage.includes('/mechanical/module-00/'),
  'homepage must link into the start of both tracks',
);
assert.match(homepage, /MECHANICAL_LESSON_COUNT/);
assert.match(trackOverview, /companionTrackId/);
assert.match(dashboard, /activeTrack/, 'dashboard must switch between tracks');
assert.doesNotMatch(trackOverview, /signInWithGoogle/, 'track cards should open public overviews, not sign in');
assert.doesNotMatch(homepage, /homepage_\$\{id\}_card/, 'homepage unit cards should not trigger sign in');
assert.match(homepage, /MOBILE_CURRICULUM_PREVIEW_COUNT/);
assert.match(trackOverview, /MOBILE_UNIT_PREVIEW_COUNT/);
assert.match(homepageCss, /\.mobileCurriculumExtra\s*\{\s*display: none/);
assert.match(trackOverviewCss, /\.mobileCurriculumExtra\s*\{\s*display: none !important/);

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
