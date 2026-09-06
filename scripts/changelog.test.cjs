const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

/**
 * Tests for the changelog and the card built on it.
 *
 * The card is shown to returning readers only, so the failures worth guarding
 * are showing it to somebody who has never been here, showing it when nothing
 * has changed, and letting the entries fall out of order, which would silently
 * hide a change from everyone whose last visit sits between two entries.
 */
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/telemark/changelog.ts'), 'utf8');
const {outputText} = ts.transpileModule(source, {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
});
const mod = {};
new Function('exports', 'require', 'module', outputText)(mod, require, {exports: mod});

const {
  CHANGELOG, LATEST_CHANGE, changesSince, formatChangeDate,
  hasUsedSiteBefore, PRIOR_USE_KEY, PRIOR_USE_PREFIX,
} = mod;

assert.ok(CHANGELOG.length > 0, 'there is a changelog');

// Newest first, and every date real. Out of order, a reader whose last visit
// falls between two entries silently misses one.
const dates = CHANGELOG.map((e) => e.date);
assert.deepEqual([...dates].sort().reverse(), dates, 'entries run newest first');
dates.forEach((date) => {
  assert.match(date, /^\d{4}-\d{2}-\d{2}$/, `${date} is an ISO date`);
  assert.ok(!Number.isNaN(new Date(`${date}T00:00:00Z`).getTime()), `${date} is real`);
});
assert.equal(LATEST_CHANGE, dates[0]);

// Every entry says something, and any link is site-relative.
CHANGELOG.forEach((entry) => {
  assert.ok(entry.title && entry.title.length > 4, 'a title');
  assert.ok(entry.body && entry.body.length > 20, `${entry.title} has a body`);
  assert.ok(
    ['curriculum', 'simulator', 'tools', 'site'].includes(entry.kind),
    `${entry.title} has a known kind`,
  );
  if (entry.href) {
    assert.ok(entry.href.startsWith('/'), `${entry.title} links within the site`);
  }
});

// ── Who sees it ─────────────────────────────────────────────────────────────
// Never been here: nothing. A list of changes means nothing without a version
// of the site to compare it against.
assert.deepEqual(changesSince(null), []);
assert.deepEqual(changesSince(''), []);

// Up to date: nothing.
assert.deepEqual(changesSince(LATEST_CHANGE), []);

// Came back after everything: all of it.
assert.equal(changesSince('2000-01-01').length, CHANGELOG.length);

// Came back mid-way: only what landed after.
const middle = dates[Math.floor(dates.length / 2)];
const after = changesSince(middle);
assert.ok(after.length > 0 && after.length < CHANGELOG.length);
assert.ok(after.every((entry) => entry.date > middle));

// A stored date from the future does not resurface old entries.
assert.deepEqual(changesSince('2999-01-01'), []);

// ── Dates ───────────────────────────────────────────────────────────────────
// Read in UTC, so a reader west of Greenwich does not see the day before.
assert.equal(formatChangeDate('2026-08-27'), 'August 27, 2026');
assert.equal(formatChangeDate('not-a-date'), 'not-a-date');

// ── Telling a new reader from an old one ────────────────────────────────────
// The card stores the date of a first visit, so every reader the site already
// had has no record and looks new. Judged on that alone, nobody who was
// already using Telemark would ever be shown a change, which is backwards.
const fakeStorage = (entries) => {
  const keys = Object.keys(entries);
  return {
    length: keys.length,
    getItem: (key) => (key in entries ? entries[key] : null),
    key: (index) => keys[index] ?? null,
  };
};

assert.equal(hasUsedSiteBefore(null), false, 'no storage is not evidence');
assert.equal(hasUsedSiteBefore(fakeStorage({})), false, 'an empty browser is a new reader');
assert.equal(
  hasUsedSiteBefore(fakeStorage({[PRIOR_USE_KEY]: '{"lessons":{}}'})),
  true,
  'saved progress means they have been here',
);
assert.equal(
  hasUsedSiteBefore(fakeStorage({[PRIOR_USE_PREFIX + 'abc:code-editor']: '{}'})),
  true,
  'a saved draft means they have been here',
);
assert.equal(
  hasUsedSiteBefore(fakeStorage({theme: 'dark', 'some.other.key': '1'})),
  false,
  'unrelated keys are not evidence',
);

// Storage that throws on access is treated as a new reader, not a crash.
assert.equal(
  hasUsedSiteBefore({
    get length() { throw new Error('blocked'); },
    getItem() { throw new Error('blocked'); },
    key() { throw new Error('blocked'); },
  }),
  false,
  'blocked site data does not throw',
);

console.log('Changelog tests passed (%d cases)', 22);
