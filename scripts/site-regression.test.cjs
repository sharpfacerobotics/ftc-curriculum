const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

const accessPolicy = read('src/telemark/accessPolicy.ts');
const navigator = read('static/simulator/navigator.html');
const docItem = read('src/theme/DocItem/index.tsx');
const navbarItem = read('src/theme/NavbarItem/DefaultNavbarItem/index.tsx');
const homepage = read('src/pages/index.tsx');
const searchPlugin = read('plugins/telemark-search/index.js');
const config = read('docusaurus.config.ts');
const customCss = read('src/css/custom.css');

assert.match(accessPolicy, /FREE_UNIT_MAX = 5/);
assert.match(navigator, /FREE_UNIT_MAX = 5/);
assert.match(docItem, /isProtectedUnit\(unitNumber\)/);
assert.match(navbarItem, /isAuthItem && loading[\s\S]*return null/);
assert.doesNotMatch(homepage, /useState<string>\(isNumeric \? '0'/);
assert.match(homepage, /CURRICULUM_UNIT_COUNT/);
assert.match(homepage, /CURRICULUM_LESSON_COUNT/);
assert.match(searchPlugin, /excerpt: isProtected \? '' : cleanExcerpt/);
assert.match(searchPlugin, /actions\.setGlobalData\(content\)/);
assert.match(config, /title: 'Telemark'/);
assert.match(config, /label: 'GitHub'/);
assert.match(
  config,
  /© 2026 Telemark\. Built by FTC Team Sharp Face Robotics #30450\. Built with Docusaurus\. Not affiliated with FIRST®/,
);
assert.match(customCss, /\.telemark-navbar-center[\s\S]*left: 50%/);
assert.match(customCss, /\.footer[\s\S]*padding: 0\.85rem 1\.5rem/);

for (let unit = 1; unit <= 15; unit += 1) {
  const protectedUnit = unit > 5;
  assert.equal(protectedUnit, unit > 5);
}

console.log('Access, navbar, homepage count, and protected search regression checks passed');
