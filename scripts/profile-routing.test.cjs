const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/telemark/profile.ts'), 'utf8');
const {outputText} = ts.transpileModule(source, {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
});
const loaded = {exports: {}};
function stubRequire(id) {
  if (id === 'firebase/firestore') return {
    doc: () => ({}), getDoc: () => {}, serverTimestamp: () => ({}), setDoc: () => {},
  };
  if (id === './firebase') return {db: {}};
  return require(id);
}
new Function('exports', 'require', 'module', outputText)(loaded.exports, stubRequire, loaded);
const {normalizeLearnerProfile, profileDestination} = loaded.exports;

const make = (selectedTracks, softwareLevel, extra = {}) => normalizeLearnerProfile({
  version: 1,
  selectedTracks,
  ...(softwareLevel ? {softwareLevel} : {}),
  onboardingComplete: true,
  ...extra,
});

assert.equal(make([], undefined), null);
assert.equal(make(['software'], undefined), null);
assert.equal(make(['unknown'], undefined), null);
assert.equal(make(['mechanical'], undefined).blocksPlacement, undefined);
assert.equal(profileDestination(make(['mechanical'], undefined)), '/mechanical');

for (const [level, placement, destination] of [
  ['complete_beginner', 'required', '/blocks'],
  ['block_experience', 'auto_completed', '/docs'],
  ['text_experience', 'auto_completed', '/docs'],
]) {
  const software = make(['software'], level);
  assert.equal(software.blocksPlacement, placement);
  assert.equal(profileDestination(software), destination);
  const both = make(['mechanical', 'software', 'software'], level);
  assert.deepEqual(both.selectedTracks, ['mechanical', 'software']);
  assert.equal(profileDestination(both), destination);
}

assert.equal(make(['software'], 'complete_beginner', {postBlocksChoice: 'python'}).postBlocksChoice, 'python');
assert.equal(make(['software'], 'complete_beginner', {postBlocksChoice: 'java'}).postBlocksChoice, 'java');
assert.equal(make(['software'], 'complete_beginner', {postBlocksChoice: 'fll'}).postBlocksChoice, 'fll');
assert.equal(make(['software'], 'complete_beginner', {postBlocksChoice: 'invalid'}).postBlocksChoice, undefined);

const authSource = fs.readFileSync(path.join(root, 'src/telemark/googleAuth.ts'), 'utf8');
assert.ok(authSource.indexOf('!result.user.emailVerified') < authSource.indexOf('syncLocalProgressWithUser(result.user)'));
assert.match(authSource, /await signOut\(auth\)/);

const gateSource = fs.readFileSync(path.join(root, 'src/components/PersonalizationGate.tsx'), 'utf8');
assert.match(
  gateSource,
  /withoutTrailingSlash\(location\.pathname\) === withoutTrailingSlash\(basePath\('\/'\)\)/,
  'the homepage waits for a learner to choose a track before starting personalization',
);

const rules = fs.readFileSync(path.join(root, 'firestore.rules'), 'utf8');
assert.match(rules, /request\.auth\.uid == userId/);
assert.match(rules, /request\.auth\.token\.email_verified == true/);
assert.match(rules, /match \/users\/\{userId\}\/telemark\/\{documentId\}/);

console.log('Profile normalization, routing, verification, and Firestore rule checks passed');
