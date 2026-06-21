import React, {useEffect, useRef, useState} from 'react';
import {signInWithGoogle} from '@site/src/telemark/googleAuth';
import {trackEvent} from '@site/src/telemark/analytics';
import {getUnitBySlug} from '@site/src/telemark/curriculum';
import styles from './ContentLock.module.css';

interface ContentLockProps {
  unitNumber: number;
  loading?: boolean;
}

export default function ContentLock({
  unitNumber,
  loading = false,
}: ContentLockProps): React.JSX.Element {
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const viewTrackedRef = useRef(false);
  const unitSlug = `unit-${String(unitNumber).padStart(2, '0')}`;
  const unit = getUnitBySlug(unitSlug);

  useEffect(() => {
    if (loading || viewTrackedRef.current) return;
    viewTrackedRef.current = true;
    trackEvent('content_lock_view', {
      unit_number: unitNumber,
      surface: 'curriculum_document',
    });
  }, [loading, unitNumber]);

  async function handleSignIn() {
    setSigningIn(true);
    setError(null);
    trackEvent('content_unlock_attempt', {
      unit_number: unitNumber,
      surface: 'curriculum_document',
    });

    try {
      await signInWithGoogle();
      trackEvent('content_unlock_success', {
        unit_number: unitNumber,
        surface: 'curriculum_document',
      });
    } catch (signInError) {
      console.error('Telemark content unlock failed:', signInError);
      setError('Sign-in did not finish. Please try again.');
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <section className={styles.shell} aria-live="polite">
      <span className={`${styles.corner} ${styles.topLeft}`} aria-hidden="true" />
      <span className={`${styles.corner} ${styles.bottomRight}`} aria-hidden="true" />

      <div className={styles.lockIcon} aria-hidden="true">
        {loading ? (
          <span className={styles.spinner} />
        ) : (
          <svg width="30" height="34" viewBox="0 0 30 34" fill="none">
            <rect x="3" y="14" width="24" height="17" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M8 14V9a7 7 0 0 1 14 0v5" stroke="currentColor" strokeWidth="2" />
            <circle cx="15" cy="22" r="2" fill="currentColor" />
          </svg>
        )}
      </div>

      <p className={styles.eyebrow}>
        {loading ? '// checking.access' : `// ${unitSlug}.locked`}
      </p>
      <h1 className={styles.title}>
        {loading
          ? 'Checking your Telemark access'
          : `Sign in to unlock ${unit?.label ?? `Unit ${unitNumber}`}`}
      </h1>
      <p className={styles.description}>
        {loading
          ? 'Your lesson will open automatically when the access check is complete.'
          : `${unit?.title ?? 'This curriculum unit'} is included with a free Telemark account. Sign in to continue and save lesson progress across devices.`}
      </p>

      {!loading && (
        <>
          <div className={styles.benefits}>
            <span>Unlock Units 6–15</span>
            <span>Track completed lessons</span>
            <span>Resume from your dashboard</span>
          </div>

          <button
            type="button"
            className={styles.signInButton}
            onClick={handleSignIn}
            disabled={signingIn}
          >
            {signingIn ? 'Signing in…' : 'Sign in with Google to Unlock'}
          </button>

          {error && <p className={styles.error}>{error}</p>}
          <p className={styles.trialNote}>
            Units 1–5 and their simulators remain available without an account.
          </p>
        </>
      )}
    </section>
  );
}
