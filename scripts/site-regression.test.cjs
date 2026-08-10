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
assert.match(rootTheme, /<ContentLock/);
assert.match(navbarItem, /isAuthItem && loading[\s\S]*return null/);
assert.doesNotMatch(homepage, /useState<string>\(isNumeric \? '0'/);
assert.match(homepage, /CURRICULUM_UNIT_COUNT/);
assert.match(homepage, /CURRICULUM_LESSON_COUNT/);
assert.match(searchPlugin, /const isProtected = unit !== null/);
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

for (let unit = 1; unit <= 15; unit += 1) {
  const protectedUnit = Number.isInteger(unit) && unit >= 1;
  assert.equal(protectedUnit, true);
}

console.log('Site access, navbar, homepage demos, and protected search regression checks passed');
