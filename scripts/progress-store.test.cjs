const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync(
  path.resolve(__dirname, '../src/telemark/progressStore.ts'),
  'utf8',
);
const {outputText} = ts.transpileModule(source, {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
});
const progressStore = {exports: {}};
new Function('exports', 'require', 'module', outputText)(
  progressStore.exports,
  require,
  progressStore,
);

const {
  mergeProgress,
  normalizeProgress,
  parseProgressExport,
  serializeProgress,
} = progressStore.exports;

assert.deepEqual(
  normalizeProgress({
    completedLessons: ['unit-01/a', 'unit-01/a', 12],
    skippedLessons: ['unit-01/b'],
    reviewingUnits: ['unit-01', 'unit-01'],
    lastLesson: 'unit-01/b',
  }),
  {
    completedLessons: ['unit-01/a', 'unit-01/b'],
    skippedLessons: ['unit-01/b'],
    reviewingUnits: ['unit-01'],
    lastLesson: 'unit-01/b',
  },
);

const merged = mergeProgress(
  {completedLessons: ['unit-01/a'], lastLesson: 'unit-01/a'},
  {completedLessons: ['module-02/b'], skippedLessons: ['unit-03/c'], lastLesson: 'module-02/b'},
);
assert.deepEqual(merged.completedLessons, ['unit-01/a', 'module-02/b', 'unit-03/c']);
assert.deepEqual(merged.skippedLessons, ['unit-03/c']);
assert.equal(merged.lastLesson, 'module-02/b');

const exported = serializeProgress(merged);
assert.match(exported, /"format": "telemark-progress"/);
assert.deepEqual(parseProgressExport(exported), merged);
assert.deepEqual(parseProgressExport(JSON.stringify(merged)), merged);
assert.throws(() => parseProgressExport('{bad json'), /not valid JSON/);
assert.throws(() => parseProgressExport('{"format":"something-else"}'), /unsupported format/);

console.log('Progress normalization, merge, export, and import checks passed');
