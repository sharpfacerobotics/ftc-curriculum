const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const failures = [];

function walk(directory) {
  return fs.readdirSync(directory, {withFileTypes: true}).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

for (const file of walk(path.join(root, 'docs')).filter((name) => name.endsWith('.mdx'))) {
  const text = fs.readFileSync(file, 'utf8');
  if (text.includes('—')) failures.push(`${path.relative(root, file)} contains an em dash`);
  if (text.includes('Open the simulator in fullscreen before you start')) {
    failures.push(`${path.relative(root, file)} contains the retired simulator boilerplate`);
  }
}

const checkedSource = [
  path.join(root, 'src/pages/index.tsx'),
  path.join(root, 'src/telemark/curriculum.ts'),
  path.join(root, 'docusaurus.config.ts'),
].map((file) => fs.readFileSync(file, 'utf8')).join('\n');

for (const stale of [
  'Each unit builds on the last',
  'A structured FTC Java curriculum written by students for students',
  'Blocks to Bezier',
]) {
  if (checkedSource.includes(stale)) failures.push(`Stale copy remains: ${stale}`);
}

const simulatorFiles = walk(path.join(root, 'static/simulator'))
  .filter((name) => name.endsWith('.html'));
for (const file of simulatorFiles) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes('telemark-java.js')) {
    failures.push(`${path.relative(root, file)} does not load TelemarkJava`);
  }
}

const guideCount = walk(path.join(root, 'docs'))
  .filter((name) => name.endsWith('.mdx'))
  .filter((file) => fs.readFileSync(file, 'utf8').includes('<SimulatorRunGuide />'))
  .length;
if (guideCount !== 70) {
  failures.push(`Expected 70 lessons to use SimulatorRunGuide, found ${guideCount}`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Content checks passed for ${simulatorFiles.length} simulator pages`);
