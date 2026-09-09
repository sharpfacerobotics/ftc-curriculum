const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {JSDOM} = require('jsdom');
const java = require('../static/simulator/telemark-java.js');

const projectSource = fs.readFileSync('static/simulator/telemark-project.js', 'utf8');
const masterySource = fs.readFileSync('static/simulator/mastery_challenge.js', 'utf8');
const projectKey = 'telemark:decode-project:v1';

function createPage(saved = {}) {
  const dom = new JSDOM('<div><div><textarea id="code-editor"></textarea></div></div>', {
    url: 'https://telemark.test/simulator/unit2.mastery.html',
    runScripts: 'outside-only',
  });
  const window = dom.window;
  window.TelemarkJava = java;
  window.eval(fs.readFileSync('static/simulator/telemark-editor.js', 'utf8'));
  Object.entries(saved).forEach(([key, value]) => window.localStorage.setItem(key, value));
  window.eval(projectSource);
  return {dom, window, editor: window.document.querySelector('textarea')};
}

const mainStarter = `package org.firstinspires.ftc.teamcode;
public class Unit2Mastery extends OpMode {
  public void init() {}
  public void loop() {}
}`;
const teleOpStarter = `package org.firstinspires.ftc.teamcode;
public class CompetitionTeleOp {
  public void init() {}
  public void loop() {}
}`;

const first = createPage();
first.editor.value = mainStarter;
const firstProject = first.window.TelemarkProject.attach(first.editor, null, {
  key: projectKey,
  initialFiles: [
    {name: 'Unit2Mastery.java', source: mainStarter},
    {name: 'CompetitionTeleOp.java', source: teleOpStarter},
  ],
  preferredActiveFile: 'Unit2Mastery.java',
  preferredEntry: 'org.firstinspires.ftc.teamcode.Unit2Mastery',
  preserveProjectOnReset: true,
  snapshotsOnly: true,
  enableSnapshots: true,
  stage: {id: 'unit-02/mastery-coding-challenge', title: 'Unit 2 mastery', files: ['Unit2Mastery.java', 'CompetitionTeleOp.java']},
});
assert.equal(firstProject.key, projectKey);
assert.deepEqual(Array.from(firstProject.stages()), ['unit-02/mastery-coding-challenge']);
assert.equal(java.compile(firstProject.source()).ok, true, 'the whole multi-file project compiles');

first.editor.value = first.editor.value.replace('void init() {}', 'void init() { telemetry.addData("saved", true); }');
first.editor.dispatchEvent(new first.window.Event('input'));
const initialSnapshot = firstProject.saveSnapshot();
assert.equal(initialSnapshot.saved, true);
first.editor.value += '\n// later edit';
first.editor.dispatchEvent(new first.window.Event('input'));
assert.equal(firstProject.saveSnapshot().saved, false, 'the first passing snapshot is immutable');
assert.doesNotMatch(firstProject.listSnapshots()[0].files[0].source, /later edit/);
assert.equal(first.window.localStorage.getItem('telemark:java-library:v1'), null, 'snapshot stages do not expose editable lesson-library copies');
const snapshotButton = [...first.window.document.querySelectorAll('button')].find(button => button.textContent === 'Snapshots');
assert.ok(snapshotButton, 'cumulative projects expose their snapshot viewer');
snapshotButton.click();
assert.match(first.window.document.querySelector('dialog').textContent, /Unit 2 mastery/);

const savedProject = first.window.localStorage.getItem(projectKey);
const savedSnapshots = first.window.localStorage.getItem(first.window.TelemarkProject.SNAPSHOT_KEY);
first.dom.window.close();

const second = createPage({[projectKey]: savedProject, 'telemark:java-snapshots:v1': savedSnapshots});
second.editor.value = 'public class Unit3Mastery extends OpMode { public void loop() {} }';
const secondProject = second.window.TelemarkProject.attach(second.editor, null, {
  key: projectKey,
  initialFiles: [
    {name: 'Unit3Mastery.java', source: second.editor.value},
    {name: 'CompetitionTeleOp.java', source: 'public class CompetitionTeleOp { /* supplied replacement */ }'},
    {name: 'RobotConfig.java', source: 'public class RobotConfig {}'},
  ],
  preferredActiveFile: 'Unit3Mastery.java',
  preferredEntry: 'org.firstinspires.ftc.teamcode.Unit3Mastery',
  preserveProjectOnReset: true,
  stage: {id: 'unit-03/mastery-coding-challenge', title: 'Unit 3 mastery', files: ['Unit3Mastery.java', 'RobotConfig.java']},
  prerequisites: [
    {file: 'CompetitionTeleOp.java', className: 'CompetitionTeleOp', methods: ['init', 'loop']},
  ],
});
assert.ok(secondProject.files().some(file => file.name === 'RobotConfig.java'), 'a new stage appends its missing scaffold');
assert.match(secondProject.files().find(file => file.name === 'Unit2Mastery.java').source, /saved/, 'later stages preserve learner code');
assert.doesNotMatch(secondProject.files().find(file => file.name === 'CompetitionTeleOp.java').source, /supplied replacement/, 'supplied scaffolds never overwrite existing files');
assert.deepEqual(Array.from(secondProject.stages()), ['unit-02/mastery-coding-challenge', 'unit-03/mastery-coding-challenge']);
assert.equal(secondProject.prerequisiteDiagnostics().length, 0);

const beforeReset = secondProject.files().length;
secondProject.reset(second.editor.value);
assert.equal(secondProject.files().length, beforeReset, 'reset keeps the rest of a cumulative project');

const robotTab = [...second.window.document.querySelectorAll('.telemark-project-tab')].find(button => button.textContent === 'RobotConfig.java');
robotTab.click();
const deleteButton = second.window.document.querySelector('[aria-label="Delete RobotConfig.java"]');
deleteButton.click();
[...second.window.document.querySelectorAll('dialog button')].find(button => button.textContent === 'Delete file').click();
assert.ok(!secondProject.files().some(file => file.name === 'RobotConfig.java'));
const afterDelete = second.window.localStorage.getItem(projectKey);
second.dom.window.close();

const revisit = createPage({[projectKey]: afterDelete});
revisit.editor.value = 'public class Unit3Mastery extends OpMode { public void loop() {} }';
const revisitProject = revisit.window.TelemarkProject.attach(revisit.editor, null, {
  key: projectKey,
  initialFiles: [
    {name: 'Unit3Mastery.java', source: revisit.editor.value},
    {name: 'RobotConfig.java', source: 'public class RobotConfig {}'},
  ],
  stage: {id: 'unit-03/mastery-coding-challenge', title: 'Unit 3 mastery', files: ['Unit3Mastery.java', 'RobotConfig.java']},
  prerequisites: [{file: 'RobotConfig.java', className: 'RobotConfig'}],
});
assert.ok(!revisitProject.files().some(file => file.name === 'RobotConfig.java'), 'revisiting a stage does not repair a file the learner deleted');
assert.match(revisitProject.prerequisiteDiagnostics()[0].message, /needs RobotConfig\.java/);
const deletedProject = revisit.window.localStorage.getItem(projectKey);
revisit.dom.window.close();

const later = createPage({[projectKey]: deletedProject});
later.editor.value = 'public class Unit4Mastery extends OpMode { public void loop() {} }';
const laterProject = later.window.TelemarkProject.attach(later.editor, null, {
  key: projectKey,
  initialFiles: [
    {name: 'Unit4Mastery.java', source: later.editor.value},
    {name: 'RobotConfig.java', source: 'public class RobotConfig {}'},
    {name: 'Drivetrain.java', source: 'public class Drivetrain {}'},
  ],
  stage: {id: 'unit-04/mastery-coding-challenge', title: 'Unit 4 mastery', files: ['Unit4Mastery.java', 'Drivetrain.java']},
});
assert.ok(laterProject.files().some(file => file.name === 'Drivetrain.java'), 'a later stage adds files introduced by that stage');
assert.ok(!laterProject.files().some(file => file.name === 'RobotConfig.java'), 'a later stage does not repair a deleted file from an earlier stage');
later.dom.window.close();

const masteryContext = {document: {currentScript: null}};
masteryContext.window = masteryContext;
vm.createContext(masteryContext);
vm.runInContext(masterySource, masteryContext, {filename: 'mastery_challenge.js'});
const mastery = masteryContext.TelemarkMasteryChallenge;
const expectedFiles = [
  'CompetitionTeleOp.java', 'RobotConfig.java', 'Drivetrain.java', 'Intake.java',
  'Transfer.java', 'Launcher.java', 'ArtifactSensors.java', 'PoweredMechanism.java',
  'RobotHardware.java', 'Vision.java', 'FullAutonomous.java',
];
const activeFiles = {
  2: 'CompetitionTeleOp.java', 3: 'RobotConfig.java', 4: 'Drivetrain.java',
  5: 'Intake.java', 6: 'CompetitionTeleOp.java', 7: 'Launcher.java',
  8: 'Drivetrain.java', 9: 'Launcher.java', 10: 'Launcher.java',
  11: 'ArtifactSensors.java', 12: 'Drivetrain.java', 13: 'RobotHardware.java',
  14: 'Vision.java', 15: 'FullAutonomous.java',
};
for (let unit = 2; unit <= 15; unit += 1) {
  assert.equal(mastery.configs[unit].starter, undefined, `Unit ${unit} must not expose a throwaway mastery starter`);
  assert.equal(mastery.configs[unit].starterFiles, undefined, `Unit ${unit} must not expose legacy mastery files`);
  const options = mastery.decodeProjectOptions(unit, mastery.configs[unit]);
  assert.equal(options.key, projectKey);
  assert.equal(options.stage.id, `unit-${String(unit).padStart(2, '0')}/mastery-coding-challenge`);
  assert.equal(options.preserveProjectOnReset, true);
  assert.equal(options.enableSnapshots, true);
  assert.equal(options.preferredActiveFile, activeFiles[unit]);
  assert.equal(options.preferredEntry, `org.firstinspires.ftc.teamcode.${unit === 15 ? 'FullAutonomous' : 'CompetitionTeleOp'}`);
  assert.ok(options.stage.files.includes(activeFiles[unit]), `Unit ${unit} snapshot must include its active file`);
  assert.ok(options.initialFiles.every(file => !/Unit\d+Mastery\.java/.test(file.name)));
  const compilation = java.compileProject(Array.from(options.initialFiles));
  assert.equal(compilation.ok, true, `Unit ${unit} starter project compiles: ${compilation.diagnostics?.[0]?.message || ''}`);
}
const finalNames = Array.from(mastery.decodeProjectOptions(15, mastery.configs[15]).initialFiles, file => file.name);
expectedFiles.forEach(name => assert.ok(finalNames.includes(name), `Unit 15 cumulative project is missing ${name}`));
assert.deepEqual(finalNames, expectedFiles, 'the DECODE project has the planned file set and no lift');

console.log('Cumulative DECODE project persistence and snapshot checks passed.');
