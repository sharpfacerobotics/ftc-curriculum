import React, { useEffect, useState } from 'react';
import Link from '@docusaurus/Link';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '@site/src/telemark/firebase';
import { useAuth } from '@site/src/telemark/useAuth';
import { useProgress } from '@site/src/telemark/useProgress';
import { getLessonsForUnit, getUnitBySlug } from '@site/src/telemark/curriculum';
import styles from '@site/src/components/HomepageFeatures/MarkComplete.module.css';

interface MarkUnitCompleteProps {
  unitSlug: string;
}

export default function MarkUnitComplete({
  unitSlug,
}: MarkUnitCompleteProps): React.JSX.Element | null {
  const unit = getUnitBySlug(unitSlug);
  const lessons = getLessonsForUnit(unitSlug);
  const lessonIds = lessons.map((lesson) => lesson.id);

  const { user } = useAuth();
  const { isComplete, markManyComplete } = useProgress(user);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(lessonIds.every((lessonId) => isComplete(lessonId)));

  useEffect(() => {
    setDone(lessonIds.every((lessonId) => isComplete(lessonId)));
  }, [isComplete, lessonIds]);

  if (!unit) {
    return null;
  }

  async function handleMarkAllComplete() {
    setSaving(true);
    try {
      await markManyComplete(lessonIds);
      setDone(true);
    } catch (e) {
      console.error('Telemark unit save failed:', e);
      setDone(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleSignIn() {
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error(e);
    }
  }

  if (done) {
    return (
      <div className={styles.successBox}>
        <div className={styles.successHeader}>
          <span className={styles.successIcon} aria-hidden="true">✓</span>
          <span className={styles.successTitle}>{unit.label} Complete</span>
          {user && <span className={styles.savedBadge}>saved to Telemark</span>}
        </div>
        <p className={styles.successMsg}>
          This unit is marked complete. Move on when you are ready.
        </p>
        <Link to={unit.nextPath} className={styles.nextBtn}>
          Proceed to {unit.nextLabel} →
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.completeBox}>
        <div className={styles.completeInner}>
          <div className={styles.completeText}>
            <p className={styles.completeTitle}>Need to skip ahead?</p>
            <p className={styles.completeDesc}>
              Sign in to mark every lesson in this unit complete, or continue
              to the next unit without saving.
            </p>
          </div>
          <div className={styles.completeActions}>
            <button className={styles.signInBtn} onClick={handleSignIn}>
              Sign in to Save
            </button>
            <Link to={unit.nextPath} className={styles.nextBtn}>
              Skip Ahead
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.completeBox}>
      <div className={styles.completeInner}>
        <div className={styles.completeText}>
          <p className={styles.completeTitle}>Need to move faster?</p>
          <p className={styles.completeDesc}>
            Mark every lesson in {unit.label} complete and jump straight to {unit.nextLabel}.
          </p>
        </div>
        <button
          className={styles.completeBtn}
          onClick={handleMarkAllComplete}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Mark All Complete'}
        </button>
      </div>
    </div>
  );
}
