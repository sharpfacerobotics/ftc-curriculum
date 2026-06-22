const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const TelemarkJava = require('../static/simulator/telemark-java.js');

const simulatorRoot = path.resolve(__dirname, '../static/simulator');
const htmlFiles = fs.readdirSync(simulatorRoot)
  .filter((name) => name.endsWith('.html'))
  .sort();
const lessonFiles = htmlFiles.filter((name) => /^unit\d/.test(name));

assert.equal(htmlFiles.length, 47, 'Expected 47 simulator HTML pages');
assert.equal(lessonFiles.length, 46, 'Expected 46 lesson simulator pages');

let starterCount = 0;
for (const name of htmlFiles) {
  const source = fs.readFileSync(path.join(simulatorRoot, name), 'utf8');
  assert.match(source, /telemark-java\.js/, `${name} must load TelemarkJava`);

  if (/^unit\d/.test(name)) {
    assert.match(
      source,
      /simulator_base\.js|TelemarkJava\.|window\.TelemarkJava/,
      `${name} must execute through the shared Java runtime or compiler`,
    );
    assert.match(
      source,
      /telemetry|setRequirement|requirements|addHint|visual/i,
      `${name} must expose student feedback`,
    );
  }

  const starter = source.match(
    /(?:const|let|var)\s+starterCode\s*=\s*`([\s\S]*?)`;?/,
  );
  if (!starter) continue;

  starterCount += 1;
  const result = TelemarkJava.compile(starter[1]);
  assert.equal(
    result.ok,
    true,
    `${name} starter code failed: ${result.diagnostics?.[0]?.message}`,
  );
}

assert.equal(starterCount, 34, 'Expected 34 embedded starter-code fixtures');

const baseSource = fs.readFileSync(
  path.join(simulatorRoot, 'simulator_base.js'),
  'utf8',
);
for (const api of [
  'setFaultModes',
  'getActiveFault',
  'isFaultActive',
  'createSeededRandom',
  'evaluateChallengeHints',
]) {
  assert.match(baseSource, new RegExp(`window\\.${api}`), `Missing ${api} API`);
}

for (const [file, faultId] of [
  ['unit10.3.html', 'lift-stall'],
  ['unit11.5.html', 'threshold-noise'],
  ['unit12.2.html', 'imu-drift'],
  ['unit14.2.html', 'stale-detections'],
]) {
  const source = fs.readFileSync(path.join(simulatorRoot, file), 'utf8');
  assert.match(source, new RegExp(faultId), `${file} is missing ${faultId}`);
}

assert.doesNotMatch(
  fs.readFileSync(path.join(simulatorRoot, 'unit14.2.html'), 'utf8'),
  /Math\.random\(\)/,
  'Unit 14.2 random scenarios must be seeded',
);

console.log(
  `Simulator audit passed for ${lessonFiles.length} lesson pages and ${starterCount} starter fixtures`,
);
