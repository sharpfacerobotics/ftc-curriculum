import { useEffect, useState, useCallback } from 'react';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './firebase';

export interface ProgressData {
  completedLessons: string[];   // e.g. ['unit-01/choosing-your-tool']
  lastLesson: string | null;    // last lesson the user was on
  updatedAt: unknown;
}

export function useProgress(user: User | null) {
  const [progress, setProgress]   = useState<ProgressData | null>(null);
  const [loading, setLoading]     = useState(false);

  // Load progress from Firestore when user changes
  useEffect(() => {
    if (!user) {
      setProgress(null);
      return;
    }
    setLoading(true);
    const ref = doc(db, 'users', user.uid, 'telemark', 'progress');
    getDoc(ref).then((snap) => {
      if (snap.exists()) {
        setProgress(snap.data() as ProgressData);
      } else {
        // First time user — create their progress doc
        const initial: ProgressData = {
          completedLessons: [],
          lastLesson: null,
          updatedAt: serverTimestamp(),
        };
        setDoc(ref, initial);
        setProgress(initial);
      }
      setLoading(false);
    });
  }, [user]);

  // Mark a lesson complete
  const markComplete = useCallback(
    async (lessonId: string) => {
      if (!user || !progress) return;
      if (progress.completedLessons.includes(lessonId)) return;

      const newCompleted = [...progress.completedLessons, lessonId];

      // Send to Firestore with server timestamp
      const ref = doc(db, 'users', user.uid, 'telemark', 'progress');
      await updateDoc(ref, {
        completedLessons: newCompleted,
        lastLesson: lessonId,
        updatedAt: serverTimestamp(),
      } as unknown as Record<string, unknown>);

      // Update local state without the sentinel value
      setProgress({
        completedLessons: newCompleted,
        lastLesson: lessonId,
        updatedAt: null,
      });
    },
    [user, progress],
  );

  // Update last visited lesson
  const setLastLesson = useCallback(
    async (lessonId: string) => {
      if (!user || !progress) return;
      const ref = doc(db, 'users', user.uid, 'telemark', 'progress');
      await updateDoc(ref, { lastLesson: lessonId, updatedAt: serverTimestamp() });
      setProgress((prev) => prev ? { ...prev, lastLesson: lessonId } : prev);
    },
    [user, progress],
  );

  const isComplete = useCallback(
    (lessonId: string) => progress?.completedLessons.includes(lessonId) ?? false,
    [progress],
  );

  return { progress, loading, markComplete, setLastLesson, isComplete };
}