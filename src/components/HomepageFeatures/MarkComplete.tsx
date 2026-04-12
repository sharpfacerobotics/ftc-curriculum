import React, { useEffect, useState } from 'react';
import Link from '@docusaurus/Link';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '@site/src/telemark/firebase';
import { useAuth } from '@site/src/telemark/useAuth';
import { useProgress } from '@site/src/telemark/useProgress';
import styles from './MarkComplete.module.css';

interface MarkCompleteProps {
  lessonId: string;       // e.g. 'unit-01/prerequisites'
  nextUnit: string;       // e.g. '/docs/unit-01/install-jdk'
  nextUnitName: string;   // e.g. 'Section 2: Installing JDK 17'
}

export default function MarkComplete({
  lessonId,
  nextUnit,
  nextUnitName,
}: MarkCompleteProps): React.JSX.Element {
  const { user }                     = useAuth();
  const { isComplete, markComplete } = useProgress(user);
  const [saving, setSaving]          = useState(false);
  const [done, setDone]              = useState(isComplete(lessonId));

  useEffect(() => {
    if (isComplete(lessonId)) {
      setDone(true);
    }
  }, [isComplete, lessonId]);

  async function handleComplete() {
    setSaving(true);
    try {
      await markComplete(lessonId);
      setDone(true);
    } catch (e) {
      console.error('Telemark save failed:', e);
      // Still let the user proceed even if save fails
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
  
  // ── Completed ─────────────────────────────────────────────
  if (done) {
    return (
      <div className={styles.successBox}>
        <div className={styles.successHeader}>
          <span className={styles.successIcon} aria-hidden="true">✓</span>
          <span className={styles.successTitle}>Lesson Complete</span>
          {user && <span className={styles.savedBadge}>saved to Telemark</span>}
        </div>
        <p className={styles.successMsg}>
          Nice work. Hold yourself to it — there are no shortcuts in competition.
        </p>
        <Link to={nextUnit} className={styles.nextBtn}>
          Proceed to {nextUnitName} →
        </Link>
      </div>
    );
  }

  // ── Not signed in ─────────────────────────────────────────
  if (!user) {
    return (
      <div className={styles.completeBox}>
        <div className={styles.completeInner}>
          <div className={styles.completeText}>
            <p className={styles.completeTitle}>Ready to move on?</p>
            <p className={styles.completeDesc}>
              Sign in with Google to save your progress with Telemark, or
              continue without saving.
            </p>
          </div>
          <div className={styles.completeActions}>
            <button className={styles.signInBtn} onClick={handleSignIn}>
              Sign in with Google
            </button>
            <button className={styles.completeBtn} onClick={() => setDone(true)}>
              Continue without saving
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Signed in ─────────────────────────────────────────────
  return (
    <div className={styles.completeBox}>
      <div className={styles.completeInner}>
        <div className={styles.completeText}>
          <p className={styles.completeTitle}>Ready to move on?</p>
          <p className={styles.completeDesc}>
            Only mark complete if you genuinely understand the material.
            Your progress will be saved to Telemark.
          </p>
        </div>
        <button
          className={styles.completeBtn}
          onClick={handleComplete}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Mark as Complete'}
        </button>
      </div>
    </div>
  );
}
