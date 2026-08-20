import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './firebase';
import { trackEvent } from './analytics';

export interface ProgressData {
  completedLessons: string[];
  lastLesson: string | null;
  skippedLessons: string[];
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
        const data = snap.data() as Partial<ProgressData>;
        setProgress({
          completedLessons: data.completedLessons ?? [],
          skippedLessons: data.skippedLessons ?? [],
          lastLesson: data.lastLesson ?? null,
        });
      } else {
        const initial: ProgressData = {completedLessons: [], skippedLessons: [], lastLesson: null};
        setDoc(ref, initial);
        setProgress(initial);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [user]);

  const markComplete = useCallback(async (lessonId: string) => {
    if (!user || !progress) return;
    if (progress.completedLessons.includes(lessonId)) return;

    const newCompleted = [...progress.completedLessons, lessonId];
    const ref = doc(db, 'users', user.uid, 'telemark', 'progress');

    const newSkipped = progress.skippedLessons.filter((id) => id !== lessonId);
    const payload = {completedLessons: newCompleted, skippedLessons: newSkipped, lastLesson: lessonId};
    await setDoc(ref, payload, { merge: true });
    setProgress({completedLessons: newCompleted, skippedLessons: newSkipped, lastLesson: lessonId});
    trackEvent('lesson_complete', {
      lesson_id: lessonId,
      unit_slug: lessonId.split('/')[0] ?? 'unknown',
    });
  }, [user, progress]);

  const unmarkComplete = useCallback(async (lessonId: string) => {
    if (!user || !progress || !progress.completedLessons.includes(lessonId)) return;
    const newCompleted = progress.completedLessons.filter((id) => id !== lessonId);
    const ref = doc(db, 'users', user.uid, 'telemark', 'progress');
    await setDoc(ref, { completedLessons: newCompleted }, { merge: true });
    setProgress({ ...progress, completedLessons: newCompleted });
  }, [user, progress]);

  const markSkipped = useCallback(async (lessonId: string) => {
    if (!user || !progress || progress.skippedLessons.includes(lessonId)) return;
    const newCompleted = progress.completedLessons.filter((id) => id !== lessonId);
    const newSkipped = [...progress.skippedLessons, lessonId];
    const ref = doc(db, 'users', user.uid, 'telemark', 'progress');
    await setDoc(ref, { completedLessons: newCompleted, skippedLessons: newSkipped }, { merge: true });
    setProgress({ ...progress, completedLessons: newCompleted, skippedLessons: newSkipped });
  }, [user, progress]);

  const unskip = useCallback(async (lessonId: string) => {
    if (!user || !progress || !progress.skippedLessons.includes(lessonId)) return;
    const newSkipped = progress.skippedLessons.filter((id) => id !== lessonId);
    const ref = doc(db, 'users', user.uid, 'telemark', 'progress');
    await setDoc(ref, { skippedLessons: newSkipped }, { merge: true });
    setProgress({ ...progress, skippedLessons: newSkipped });
  }, [user, progress]);

  const markManyComplete = useCallback(async (lessonIds: string[]) => {
    if (!user || !progress || lessonIds.length === 0) return;

    const additions = lessonIds.filter((lessonId) => !progress.completedLessons.includes(lessonId));
    if (additions.length === 0) return;

    const newCompleted = [...progress.completedLessons, ...additions];
    const newSkipped = progress.skippedLessons.filter((id) => !lessonIds.includes(id));
    const lastLesson = lessonIds[lessonIds.length - 1];
    const ref = doc(db, 'users', user.uid, 'telemark', 'progress');
    const payload = {completedLessons: newCompleted, skippedLessons: newSkipped, lastLesson};

    await setDoc(ref, payload, { merge: true });
    setProgress({completedLessons: newCompleted, skippedLessons: newSkipped, lastLesson});
    additions.forEach((lessonId) => {
      trackEvent('lesson_complete', {
        lesson_id: lessonId,
        unit_slug: lessonId.split('/')[0] ?? 'unknown',
      });
    });
    trackEvent('unit_complete', {
      unit_slug: lastLesson.split('/')[0] ?? 'unknown',
      lessons_completed: additions.length,
    });
  }, [user, progress]);

  const isComplete = useCallback(
    (lessonId: string) => progress?.completedLessons.includes(lessonId) ?? false,
    [progress],
  );

  const isSkipped = useCallback(
    (lessonId: string) => progress?.skippedLessons.includes(lessonId) ?? false,
    [progress],
  );

  return {progress, loading, markComplete, markManyComplete, unmarkComplete, markSkipped, unskip, isComplete, isSkipped};
}
