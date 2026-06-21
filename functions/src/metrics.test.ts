import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ADMIN_EMAIL,
  CURRICULUM_UNITS,
  TOTAL_LESSONS,
  aggregateProgress,
  buildDateKeys,
  isAuthorizedAdmin,
  parseRange,
} from './metrics';

test('accepts only supported date ranges', () => {
  assert.equal(parseRange('7d'), '7d');
  assert.throws(() => parseRange('30d'));
});

test('authorizes only the verified admin email', () => {
  assert.equal(isAuthorizedAdmin(ADMIN_EMAIL, true), true);
  assert.equal(isAuthorizedAdmin(` ${ADMIN_EMAIL.toUpperCase()} `, true), true);
  assert.equal(isAuthorizedAdmin(ADMIN_EMAIL, false), false);
  assert.equal(isAuthorizedAdmin('someone@example.com', true), false);
  assert.equal(isAuthorizedAdmin(undefined, true), false);
});

test('builds an inclusive UTC date series', () => {
  const keys = buildDateKeys('7d', new Date('2026-06-21T20:00:00Z'));
  assert.equal(keys.length, 7);
  assert.equal(keys[0], '20260615');
  assert.equal(keys[6], '20260621');
});

test('aggregates progress without returning learner identity', () => {
  const allLessons = CURRICULUM_UNITS.flatMap((unit) =>
    Array.from({length: unit.lessonCount}, (_, index) => `${unit.slug}/lesson-${index}`),
  );
  assert.equal(allLessons.length, TOTAL_LESSONS);
  const result = aggregateProgress([
    {completedLessons: ['unit-01/a', 'unit-01/b']},
    {completedLessons: allLessons},
    {completedLessons: []},
  ]);

  assert.equal(result.accountsWithProgress, 3);
  assert.equal(result.startedLearners, 2);
  assert.equal(result.fullyCompletedLearners, 1);
  assert.equal(JSON.stringify(result).includes(ADMIN_EMAIL), false);
});
