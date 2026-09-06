/**
 * What has changed on Telemark, for people who have been here before.
 *
 * Written by hand rather than generated from commits. A student does not care
 * that a lockfile was repaired; they care that the mastery challenges exist and
 * that their editor now completes SDK names. Only entries that change what
 * somebody can do belong here.
 *
 * Newest first. Dates are the day the change reached the live site.
 */

export type ChangeKind = 'curriculum' | 'simulator' | 'tools' | 'site';

export interface ChangeEntry {
  /** ISO date, the day it went live. Used to decide what is new to a reader. */
  readonly date: string;
  readonly kind: ChangeKind;
  readonly title: string;
  /** One or two sentences. What they can now do that they could not before. */
  readonly body: string;
  /** Where to go and try it, when there is somewhere. */
  readonly href?: string;
}

export const CHANGELOG: readonly ChangeEntry[] = [
  {
    date: '2026-08-27',
    kind: 'simulator',
    title: 'The editor completes as you type',
    body:
      'SDK names, annotations, and the classes and methods you have written yourself. It matches case, because Java does: dcmotor will not offer you DcMotor. Ctrl+Space opens it on demand.',
    href: '/simulator',
  },
  {
    date: '2026-08-27',
    kind: 'simulator',
    title: 'Team robots in the challenge simulators',
    body:
      'The mastery challenges now drive imported team CAD instead of a stand-in: the KG-SFR competition robot and FTC 17438’s input/output robot, with the wheel rigs corrected so they turn the way your code says.',
    href: '/docs/unit-02/mastery-coding-challenge',
  },
  {
    date: '2026-08-25',
    kind: 'simulator',
    title: 'Challenge robots run your code',
    body:
      'What moves on screen in a mastery challenge is driven by the OpMode you wrote, not a scripted animation.',
  },
  {
    date: '2026-08-23',
    kind: 'curriculum',
    title: 'Mastery coding challenges, units 2 to 15',
    body:
      'Every software unit ends with a full challenge: a real requirement list, the SDK class shell, and checks that read your code rather than your output.',
    href: '/docs/unit-02/mastery-coding-challenge',
  },
  {
    date: '2026-08-23',
    kind: 'tools',
    title: 'Ask shows its reasoning past the sources',
    body:
      'Answers that go beyond what the curriculum cites are now shown under their own line instead of being dropped. Above the line is held up by a source; below it is the assistant applying it to your robot.',
  },
  {
    date: '2026-08-22',
    kind: 'site',
    title: 'A homepage that shows the site',
    body:
      'Screenshots of the running tools rather than a wall of text, and a gallery where every picture opens the thing it shows.',
    href: '/',
  },
];

/** The most recent change, used to decide whether anything is new. */
export const LATEST_CHANGE = CHANGELOG[0]?.date ?? '';

/**
 * Entries a reader has not seen.
 *
 * `since` is the date they last looked. A reader who has never been here gets
 * nothing: a changelog is only interesting once you have a version of the site
 * in your head to compare it against, and showing it to a first-time visitor
 * is just an unexplained list of things they have no memory of.
 */
export function changesSince(
  since: string | null,
  entries: readonly ChangeEntry[] = CHANGELOG,
): readonly ChangeEntry[] {
  if (!since) return [];
  return entries.filter((entry) => entry.date > since);
}

/**
 * Storage this site writes when somebody actually uses it.
 *
 * `telemark:progress:v1` is the progress store; the editor writes a draft per
 * simulator under its own prefix. Either one means this browser has been here
 * and done something, whatever the changelog happens to know about it.
 */
export const PRIOR_USE_KEY = 'telemark:progress:v1';
export const PRIOR_USE_PREFIX = 'telemark.editor.v1:';

/**
 * Whether this browser has used the site before.
 *
 * Needed because the card records the date of a reader's first visit, and
 * every reader the site already had has no such record: the key did not exist
 * until the card shipped. Judged on that alone they all look new, so nobody
 * who was already using Telemark would ever see a change announced, which is
 * exactly backwards. Their saved progress and drafts say otherwise.
 */
export function hasUsedSiteBefore(storage: Storage | null | undefined): boolean {
  if (!storage) return false;
  try {
    if (storage.getItem(PRIOR_USE_KEY)) return true;
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key && key.startsWith(PRIOR_USE_PREFIX)) return true;
    }
  } catch {
    // Blocked site data. Treated as a new reader, which shows nothing.
  }
  return false;
}

/** A readable date, without depending on the reader's locale for ordering. */
export function formatChangeDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
