import {
  CURRICULUM_LESSONS,
  CURRICULUM_LESSON_COUNT,
  CURRICULUM_UNITS,
  CURRICULUM_UNIT_COUNT,
  getLessonsForUnit,
  getUnitBySlug,
  type CurriculumLesson,
  type CurriculumUnit,
} from './curriculum';
import {
  MECHANICAL_LESSONS,
  MECHANICAL_LESSON_COUNT,
  MECHANICAL_UNITS,
  MECHANICAL_UNIT_COUNT,
  getMechanicalLessonsForUnit,
  getMechanicalUnitBySlug,
} from './mechanical';

/**
 * Track-aware lookups.
 *
 * Telemark has two parallel tracks that share the same unit and lesson shape:
 * the software curriculum (unit-NN) and the engineering track (module-NN).
 * Components that work for both should read from here so a new track does not
 * require touching every call site.
 */

export type TrackId = 'software' | 'mechanical';

export interface Track {
  id: TrackId;
  label: string;
  shortLabel: string;
  tagline: string;
  /** Landing page listing every unit in the track. */
  indexPath: string;
  units: CurriculumUnit[];
  lessons: CurriculumLesson[];
  unitCount: number;
  lessonCount: number;
}

export const SOFTWARE_TRACK: Track = {
  id: 'software',
  label: 'Software Track',
  shortLabel: 'Software',
  tagline: 'FTC Java, from setup to autonomous.',
  indexPath: '/docs',
  units: CURRICULUM_UNITS,
  lessons: CURRICULUM_LESSONS,
  unitCount: CURRICULUM_UNIT_COUNT,
  lessonCount: CURRICULUM_LESSON_COUNT,
};

export const MECHANICAL_TRACK: Track = {
  id: 'mechanical',
  label: 'Mechanical Track',
  shortLabel: 'Mechanical',
  tagline: 'Design, build, and fabricate the robot the code runs on.',
  indexPath: '/mechanical',
  units: MECHANICAL_UNITS,
  lessons: MECHANICAL_LESSONS,
  unitCount: MECHANICAL_UNIT_COUNT,
  lessonCount: MECHANICAL_LESSON_COUNT,
};

export const TRACKS: Track[] = [SOFTWARE_TRACK, MECHANICAL_TRACK];

export const TOTAL_UNIT_COUNT = CURRICULUM_UNIT_COUNT + MECHANICAL_UNIT_COUNT;
export const TOTAL_LESSON_COUNT = CURRICULUM_LESSON_COUNT + MECHANICAL_LESSON_COUNT;

/** Engineering slugs are module-NN; everything else belongs to the software track. */
export function trackForUnitSlug(unitSlug: string): TrackId {
  return unitSlug.startsWith('module-') ? 'mechanical' : 'software';
}

export function getTrack(trackId: TrackId): Track {
  return trackId === 'mechanical' ? MECHANICAL_TRACK : SOFTWARE_TRACK;
}

/** Look up a unit in either track. */
export function getAnyUnitBySlug(unitSlug: string): CurriculumUnit | undefined {
  return trackForUnitSlug(unitSlug) === 'mechanical'
    ? getMechanicalUnitBySlug(unitSlug)
    : getUnitBySlug(unitSlug);
}

/** Look up a unit's lessons in either track. */
export function getAnyLessonsForUnit(unitSlug: string): CurriculumLesson[] {
  return trackForUnitSlug(unitSlug) === 'mechanical'
    ? getMechanicalLessonsForUnit(unitSlug)
    : getLessonsForUnit(unitSlug);
}

/** Every lesson across both tracks, used by dashboard and progress summaries. */
export function getAllLessons(): CurriculumLesson[] {
  return [...CURRICULUM_LESSONS, ...MECHANICAL_LESSONS];
}

/** Every unit across both tracks. */
export function getAllUnits(): CurriculumUnit[] {
  return [...CURRICULUM_UNITS, ...MECHANICAL_UNITS];
}
