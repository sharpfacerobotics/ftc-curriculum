import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './firebase';
import { trackEvent } from './analytics';
import { getAnyLessonsForUnit } from './tracks';

export interface ProgressData {
  completedLessons: string[];
  skippedLessons: string[];
  reviewingUnits: string[];
  lastLesson: string | null;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === 'string'))];
}

function normalizeProgress(value: Partial<ProgressData> | undefined): ProgressData {
  const skippedLessons = stringArray(value?.skippedLessons);
  return {
    completedLessons: [
      ...new Set([...stringArray(value?.completedLessons), ...skippedLessons]),
    ],
    skippedLessons,
    reviewingUnits: stringArray(value?.reviewingUnits),
    lastLesson: typeof value?.lastLesson === 'string' ? value.lastLesson : null,
  };
}

function unitSlugForLessons(lessonIds: string[]): string | null {
  return lessonIds[0]?.split('/')[0] ?? null;
}

export function useProgress(user: User | null) {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!user) {
      setProgress(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ref = doc(db, 'users', user.uid, 'telemark', 'progress');
    getDoc(ref).then((snap) => {
      if (snap.exists()) {
        setProgress(normalizeProgress(snap.data() as Partial<ProgressData>));
      } else {
        const initial = normalizeProgress(undefined);
        setDoc(ref, initial);
        setProgress(initial);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [user]);

  const saveProgress = useCallback(async (nextProgress: ProgressData) => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid, 'telemark', 'progress');
    const payload = JSON.parse(JSON.stringify(nextProgress));
    await setDoc(ref, payload, {merge: true});
    setProgress(nextProgress);
  }, [user]);

  const markComplete = useCallback(async (lessonId: string) => {
    if (!user || !progress) return;
    const alreadyComplete = progress.completedLessons.includes(lessonId);
    const wasSkipped = progress.skippedLessons.includes(lessonId);
    if (alreadyComplete && !wasSkipped) return;

    const newCompleted = alreadyComplete
      ? progress.completedLessons
      : [...progress.completedLessons, lessonId];
    const unitSlug = lessonId.split('/')[0];
    const unitLessonIds = getAnyLessonsForUnit(unitSlug).map((lesson) => lesson.id);
    const unitNowComplete = unitLessonIds.length > 0
      && unitLessonIds.every((id) => newCompleted.includes(id));
    const nextProgress: ProgressData = {
      completedLessons: newCompleted,
      skippedLessons: progress.skippedLessons.filter((id) => id !== lessonId),
      reviewingUnits: unitNowComplete
        ? progress.reviewingUnits.filter((slug) => slug !== unitSlug)
        : progress.reviewingUnits,
      lastLesson: lessonId,
    };
    await saveProgress(nextProgress);
    trackEvent('lesson_complete', {
      lesson_id: lessonId,
      unit_slug: unitSlug,
    });
  }, [user, progress, saveProgress]);

  const markManyComplete = useCallback(async (lessonIds: string[]) => {
    if (!user || !progress || lessonIds.length === 0) return;

    const additions = lessonIds.filter((lessonId) => !progress.completedLessons.includes(lessonId));
    const skippedToComplete = lessonIds.some((lessonId) => progress.skippedLessons.includes(lessonId));
    if (additions.length === 0 && !skippedToComplete) return;

    const newCompleted = [...progress.completedLessons, ...additions];
    const lastLesson = lessonIds[lessonIds.length - 1];
    const unitSlug = unitSlugForLessons(lessonIds);
    const nextProgress: ProgressData = {
      completedLessons: newCompleted,
      skippedLessons: progress.skippedLessons.filter((lessonId) => !lessonIds.includes(lessonId)),
      reviewingUnits: unitSlug
        ? progress.reviewingUnits.filter((slug) => slug !== unitSlug)
        : progress.reviewingUnits,
      lastLesson,
    };

    await saveProgress(nextProgress);
    additions.forEach((lessonId) => {
      trackEvent('lesson_complete', {
        lesson_id: lessonId,
        unit_slug: lessonId.split('/')[0] ?? 'unknown',
      });
    });
    trackEvent('unit_complete', {
      unit_slug: unitSlug ?? 'unknown',
      lessons_completed: additions.length,
    });
  }, [user, progress, saveProgress]);

  const markManySkipped = useCallback(async (lessonIds: string[]) => {
    if (!user || !progress || lessonIds.length === 0) return;
    const unitSlug = unitSlugForLessons(lessonIds);
    const completedLessons = [
      ...progress.completedLessons,
      ...lessonIds.filter((lessonId) => !progress.completedLessons.includes(lessonId)),
    ];
    const skippedLessons = [
      ...progress.skippedLessons,
      ...lessonIds.filter((lessonId) => !progress.skippedLessons.includes(lessonId)),
    ];
    await saveProgress({
      completedLessons,
      skippedLessons,
      reviewingUnits: unitSlug
        ? progress.reviewingUnits.filter((slug) => slug !== unitSlug)
        : progress.reviewingUnits,
      lastLesson: lessonIds[lessonIds.length - 1],
    });
    trackEvent('unit_skip', {
      unit_slug: unitSlug ?? 'unknown',
      lessons_skipped: lessonIds.length,
    });
  }, [user, progress, saveProgress]);

  const reviewMany = useCallback(async (lessonIds: string[]) => {
    if (!user || !progress || lessonIds.length === 0) return;
    const unitSlug = unitSlugForLessons(lessonIds);
    await saveProgress({
      completedLessons: progress.completedLessons.filter((lessonId) => !lessonIds.includes(lessonId)),
      skippedLessons: progress.skippedLessons.filter((lessonId) => !lessonIds.includes(lessonId)),
      reviewingUnits: unitSlug && !progress.reviewingUnits.includes(unitSlug)
        ? [...progress.reviewingUnits, unitSlug]
        : progress.reviewingUnits,
      lastLesson: lessonIds[0],
    });
    trackEvent('unit_review', {unit_slug: unitSlug ?? 'unknown'});
  }, [user, progress, saveProgress]);

  const unmarkMany = useCallback(async (lessonIds: string[]) => {
    if (!user || !progress || lessonIds.length === 0) return;
    const unitSlug = unitSlugForLessons(lessonIds);
    await saveProgress({
      completedLessons: progress.completedLessons.filter((lessonId) => !lessonIds.includes(lessonId)),
      skippedLessons: progress.skippedLessons.filter((lessonId) => !lessonIds.includes(lessonId)),
      reviewingUnits: unitSlug
        ? progress.reviewingUnits.filter((slug) => slug !== unitSlug)
        : progress.reviewingUnits,
      lastLesson: lessonIds[0],
    });
    trackEvent('unit_unmark', {unit_slug: unitSlug ?? 'unknown'});
  }, [user, progress, saveProgress]);

  const unmarkComplete = useCallback(async (lessonId: string) => {
    if (!user || !progress) return;
    const unitSlug = lessonId.split('/')[0];
    await saveProgress({
      completedLessons: progress.completedLessons.filter((id) => id !== lessonId),
      skippedLessons: progress.skippedLessons.filter((id) => id !== lessonId),
      reviewingUnits: progress.reviewingUnits.filter((slug) => slug !== unitSlug),
      lastLesson: lessonId,
    });
    trackEvent('lesson_unmark', {lesson_id: lessonId, unit_slug: unitSlug});
  }, [user, progress, saveProgress]);

  const isComplete = useCallback(
    (lessonId: string) => progress?.completedLessons.includes(lessonId) ?? false,
    [progress],
  );

  const isSkipped = useCallback(
    (lessonId: string) => progress?.skippedLessons.includes(lessonId) ?? false,
    [progress],
  );

  const isReviewingUnit = useCallback(
    (unitSlug: string) => progress?.reviewingUnits.includes(unitSlug) ?? false,
    [progress],
  );

  return {
    progress,
    loading,
    markComplete,
    markManyComplete,
    markManySkipped,
    reviewMany,
    unmarkMany,
    unmarkComplete,
    isComplete,
    isSkipped,
    isReviewingUnit,
  };
}
