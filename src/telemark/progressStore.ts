export interface ProgressData {
  completedLessons: string[];
  skippedLessons: string[];
  reviewingUnits: string[];
  lastLesson: string | null;
}

interface ProgressExport {
  format: 'telemark-progress';
  version: 1;
  exportedAt: string;
  progress: ProgressData;
}

export const PROGRESS_STORAGE_KEY = 'telemark:progress:v1';
export const PROGRESS_CHANGED_EVENT = 'telemark:progress-changed';

export function emptyProgress(): ProgressData {
  return {
    completedLessons: [],
    skippedLessons: [],
    reviewingUnits: [],
    lastLesson: null,
  };
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => (
    typeof item === 'string' && item.trim().length > 0
  )))];
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

export function normalizeProgress(value: unknown): ProgressData {
  const source = record(value);
  const skippedLessons = stringArray(source?.skippedLessons);
  return {
    completedLessons: [
      ...new Set([...stringArray(source?.completedLessons), ...skippedLessons]),
    ],
    skippedLessons,
    reviewingUnits: stringArray(source?.reviewingUnits),
    lastLesson: typeof source?.lastLesson === 'string' && source.lastLesson.trim()
      ? source.lastLesson
      : null,
  };
}

/**
 * Progress is merged instead of replaced so importing a backup or signing in
 * cannot erase work that exists in only one place. The more recent source gets
 * to choose the resume point while completion state is the union of both.
 */
export function mergeProgress(existing: unknown, incoming: unknown): ProgressData {
  const left = normalizeProgress(existing);
  const right = normalizeProgress(incoming);
  return normalizeProgress({
    completedLessons: [...left.completedLessons, ...right.completedLessons],
    skippedLessons: [...left.skippedLessons, ...right.skippedLessons],
    reviewingUnits: [...left.reviewingUnits, ...right.reviewingUnits],
    lastLesson: right.lastLesson ?? left.lastLesson,
  });
}

export function readLocalProgress(): ProgressData {
  if (typeof window === 'undefined') return emptyProgress();
  try {
    const stored = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    return stored ? normalizeProgress(JSON.parse(stored)) : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function writeLocalProgress(progress: unknown): ProgressData {
  const normalized = normalizeProgress(progress);
  if (typeof window === 'undefined') return normalized;
  try {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent(PROGRESS_CHANGED_EVENT, {detail: normalized}));
  } catch (error) {
    console.warn('Telemark could not save progress in this browser:', error);
  }
  return normalized;
}

export function serializeProgress(progress: unknown): string {
  const payload: ProgressExport = {
    format: 'telemark-progress',
    version: 1,
    exportedAt: new Date().toISOString(),
    progress: normalizeProgress(progress),
  };
  return `${JSON.stringify(payload, null, 2)}\n`;
}

export function parseProgressExport(source: string): ProgressData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    throw new Error('That file is not valid JSON.');
  }

  const envelope = record(parsed);
  if (!envelope) throw new Error('That file does not contain Telemark progress.');

  if (envelope.format !== undefined) {
    if (envelope.format !== 'telemark-progress' || envelope.version !== 1) {
      throw new Error('That Telemark progress file uses an unsupported format.');
    }
    const progress = record(envelope.progress);
    if (!progress) throw new Error('That file does not contain Telemark progress.');
    return normalizeProgress(progress);
  }

  // Accept a raw ProgressData object from early/manual backups as well.
  const hasProgressField = ['completedLessons', 'skippedLessons', 'reviewingUnits', 'lastLesson']
    .some((key) => key in envelope);
  if (!hasProgressField) throw new Error('That file does not contain Telemark progress.');
  return normalizeProgress(envelope);
}
