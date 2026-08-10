const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
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

  const inlineScripts = source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi);
  let inlineIndex = 0;
  for (const script of inlineScripts) {
    inlineIndex += 1;
    const attributes = script[1];
    if (/\bsrc\s*=|\btype\s*=\s*["']module["']/i.test(attributes)) continue;
    assert.doesNotThrow(
      () => new vm.Script(script[2], {filename: `${name}:inline-${inlineIndex}`}),
      `${name} inline script ${inlineIndex} must parse`,
    );
  }

  if (/^unit\d/.test(name)) {
    assert.match(source, /telemark-editor\.js/, `${name} must load the shared editor behavior`);
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

    const convertsAndExecutesJava =
      /TelemarkJava\s*\.\s*(?:compile|transpileBody)\s*\(/.test(source)
      || /\btranspileAndRun\s*\(/.test(source)
      || /\b_simTranspile\s*\(/.test(source)
      || (/\b(?:eval|new Function)\s*\(/.test(source) && /\b(?:transpil|compileStudent)/i.test(source));
    assert.equal(
      convertsAndExecutesJava,
      true,
      `${name} must convert student Java and execute the result in the browser`,
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

for (const name of [
  'unit2.html',
  'unit3.html',
  'unit4.html',
  'unit5.html',
  'unit6.html',
  'unit7.html',
  'unit8.1.html',
  'unit8.2.html',
  'unit8.3.html',
  'unit8.4.html',
  'unit8.5.html',
]) {
  const source = fs.readFileSync(path.join(simulatorRoot, name), 'utf8');
  assert.match(source, /TelemarkEditor\.attach\s*\(/, `${name} must attach the shared textarea editor`);
}

const codeMirrorSource = fs.readFileSync(path.join(simulatorRoot, 'unit9.1.html'), 'utf8');
assert.match(codeMirrorSource, /closeOrOvertype/, 'unit9.1.html must overtype paired CodeMirror closers');
assert.match(
  codeMirrorSource,
  /shouldIndentUnbracedControl/,
  'unit9.1.html must indent unbraced Java control bodies',
);

for (const name of [
  'unit11.1.html',
  'unit11.2.html',
  'unit11.3.html',
  'unit11.4.html',
  'unit11.5.html',
]) {
  const source = fs.readFileSync(path.join(simulatorRoot, name), 'utf8');
  const initIndex = source.indexOf('window.onInit =');
  const startIndex = source.indexOf('window.onStart =');
  const stopIndex = source.indexOf('window.onStop =');
  assert.ok(initIndex >= 0 && startIndex > initIndex, `${name} must prepare student code during Init`);
  assert.ok(stopIndex > startIndex, `${name} must expose a separate Start lifecycle hook`);

  const initSection = source.slice(initIndex, startIndex);
  const startSection = source.slice(startIndex, stopIndex);
  assert.match(
    initSection,
    /new Function\s*\(|compileStudentCode\s*\(/,
    `${name} must compile student code before Start`,
  );
  assert.match(initSection, /preparedLoopRunner\s*=/, `${name} must prepare its loop during Init`);
  assert.doesNotMatch(initSection, /sim\.running\s*=\s*true/, `${name} must not run during Init`);
  assert.match(startSection, /sim\.running\s*=\s*true/, `${name} must activate on Start`);
  assert.match(startSection, /preparedLoopRunner\s*\(/, `${name} must run only the prepared loop on Start`);
  assert.doesNotMatch(
    startSection,
    /new Function\s*\(|compileStudentCode\s*\(/,
    `${name} must not defer compilation until Start`,
  );
}

const unit115Source = fs.readFileSync(path.join(simulatorRoot, 'unit11.5.html'), 'utf8');
assert.match(
  unit115Source,
  /function updateRequirementStates\s*\(\)[\s\S]*window\.setRequirement\(index,passed\)/,
  'unit11.5.html must publish its validation results to the shared requirement UI',
);

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
