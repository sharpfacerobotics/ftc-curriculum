import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './firebase';

export interface ProgressData {
  completedLessons: string[];
  lastLesson: string | null;
}

export function useProgress(user: User | null) {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!user) { setProgress(null); return; }
    setLoading(true);
    const ref = doc(db, 'users', user.uid, 'telemark', 'progress');
    getDoc(ref).then((snap) => {
      if (snap.exists()) {
        setProgress(snap.data() as ProgressData);
      } else {
        const initial: ProgressData = { completedLessons: [], lastLesson: null };
        setDoc(ref, initial);
        setProgress(initial);
      }
      setLoading(false);
    });
  }, [user]);

  const markComplete = useCallback(async (lessonId: string) => {
    if (!user || !progress) return;
    if (progress.completedLessons.includes(lessonId)) return;
    const updated: ProgressData = {
      completedLessons: [...progress.completedLessons, lessonId],
      lastLesson: lessonId,
    };
    const ref = doc(db, 'users', user.uid, 'telemark', 'progress');
    await updateDoc(ref, { ...updated });
    setProgress(updated);
  }, [user, progress]);

  const isComplete = useCallback(
    (lessonId: string) => progress?.completedLessons.includes(lessonId) ?? false,
    [progress],
  );

  return { progress, loading, markComplete, isComplete };
}