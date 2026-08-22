import React, { useEffect, useState } from 'react';
import Link from '@docusaurus/Link';
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
  const { isComplete, isSkipped, markComplete, markSkipped, unmarkComplete, unskip } = useProgress(user);
  const [saving, setSaving]          = useState(false);
  const [done, setDone]              = useState(isComplete(lessonId));
  const [skipped, setSkipped]        = useState(isSkipped(lessonId));

  useEffect(() => {
    setDone(isComplete(lessonId));
    setSkipped(isSkipped(lessonId));
  }, [isComplete, isSkipped, lessonId]);

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

  async function handleUnmark() {
    setSaving(true);
    try {
      await unmarkComplete(lessonId);
      setDone(false);
    } catch (e) {
      console.error('Telemark unmark failed:', e);
    } finally {
      setSaving(false);
    }
  }

  async function handleSkip() {
    setSaving(true);
    try {
      await markSkipped(lessonId);
      setSkipped(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleUnskip() {
    setSaving(true);
    try {
      await unskip(lessonId);
      setSkipped(false);
    } finally {
      setSaving(false);
    }
  }

  // ── Completed ─────────────────────────────────────────────
  if (done) {
    return (
      <div className={styles.successBox}>
        <div className={styles.successHeader}>
          <span className={styles.successIcon} aria-hidden="true">✓</span>
          <span className={styles.successTitle}>Lesson Complete</span>
          <span className={styles.savedBadge}>
            {user ? 'synced to your account' : 'saved on this device'}
          </span>
        </div>
        <p className={styles.successMsg}>
          Nice work. Hold yourself to it: there are no shortcuts in competition.
        </p>
        <div className={styles.successActions}>
          <Link to={nextUnit} className={styles.nextBtn}>Proceed to {nextUnitName} →</Link>
          <button className={styles.actionBtn} onClick={handleUnmark} disabled={saving}>Unmark</button>
        </div>
      </div>
    );
  }

  if (skipped) {
    return (
      <div className={styles.successBox}>
        <div className={styles.successHeader}>
          <span className={styles.successTitle}>Section Skipped</span>
          <span className={styles.savedBadge}>
            {user ? 'synced to your account' : 'saved on this device'}
          </span>
        </div>
        <p className={styles.successMsg}>You can come back to this section whenever you are ready.</p>
        <div className={styles.successActions}>
          <Link to={nextUnit} className={styles.nextBtn}>Continue to {nextUnitName} →</Link>
          <button className={styles.actionBtn} onClick={handleUnskip} disabled={saving}>Resume section</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.completeBox}>
      <div className={styles.completeInner}>
        <div className={styles.completeText}>
          <p className={styles.completeTitle}>Ready to move on?</p>
          <p className={styles.completeDesc}>
            Only mark complete if you genuinely understand the material.
            Your progress will be {user ? 'synced to your account' : 'saved in this browser'}.
          </p>
        </div>
        <button
          className={styles.completeBtn}
          onClick={handleComplete}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Mark as Complete'}
        </button>
        <button className={styles.actionBtn} onClick={handleSkip} disabled={saving}>
          Skip section
        </button>
      </div>
    </div>
  );
}
