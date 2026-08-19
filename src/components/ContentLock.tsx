import React, {useEffect, useRef, useState} from 'react';
import Link from '@docusaurus/Link';
import {signInWithGoogle} from '@site/src/telemark/googleAuth';
import {trackEvent} from '@site/src/telemark/analytics';
import {getAnyUnitBySlug, trackForUnitSlug} from '@site/src/telemark/tracks';
import styles from './ContentLock.module.css';

interface ContentLockProps {
  unitNumber?: number;
  /**
   * Canonical slug such as 'unit-03' or 'module-07'. Supplied by callers that
   * know which track the locked page belongs to. Falls back to the software
   * track when omitted.
   */
  unitSlug?: string | null;
  loading?: boolean;
  contentType?: 'lesson' | 'simulator' | 'site';
}

export default function ContentLock({
  unitNumber,
  unitSlug: unitSlugProp,
  loading = false,
  contentType = 'lesson',
}: ContentLockProps): React.JSX.Element {
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const viewTrackedRef = useRef(false);
  const unitSlug = unitSlugProp
    ?? (unitNumber === undefined
      ? null
      : `unit-${String(unitNumber).padStart(2, '0')}`);
  const unit = unitSlug ? getAnyUnitBySlug(unitSlug) : undefined;
  const track = unitSlug ? trackForUnitSlug(unitSlug) : 'software';
  const engineering = track === 'mechanical';
  const unitNoun = engineering ? 'Module' : 'Unit';
  const surface = contentType === 'simulator'
    ? 'simulator_page'
    : contentType === 'site'
      ? 'protected_page'
      : 'curriculum_document';
  const analyticsParameters = unitNumber === undefined
    ? {surface}
    : {unit_number: unitNumber, surface};

  const unlockedTitle = contentType === 'simulator'
    ? 'Sign in to use the Telemark Simulator'
    : contentType === 'site'
      ? 'Sign in to access Telemark'
      : `Sign in to unlock ${unit?.label ?? `${unitNoun} ${unitNumber}`}`;
  const unlockedDescription = contentType === 'simulator'
    ? 'The complete simulator library is included with your free Telemark account. Sign in to write, run, and debug FTC Java in your browser.'
    : contentType === 'site'
      ? 'This page is included with your free Telemark account. Sign in with Google to continue.'
      : `${unit?.title ?? 'This lesson'} is included with your free Telemark account. Sign in to continue and save lesson progress across devices.`;

  useEffect(() => {
    if (loading || viewTrackedRef.current) return;
    viewTrackedRef.current = true;
    trackEvent('content_lock_view', analyticsParameters);
  }, [loading, unitNumber, surface]);

  async function handleSignIn() {
    setSigningIn(true);
    setError(null);
    trackEvent('content_unlock_attempt', analyticsParameters);

    try {
      await signInWithGoogle();
      trackEvent('content_unlock_success', analyticsParameters);
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
        {loading
          ? '// checking.access'
          : unitSlug
            ? `// ${unitSlug}.locked`
            : `// ${contentType}.locked`}
      </p>
      <h1 className={styles.title}>
        {loading
          ? 'Checking your Telemark access'
          : unlockedTitle}
      </h1>
      <p className={styles.description}>
        {loading
          ? 'This page will open automatically when the access check is complete.'
          : unlockedDescription}
      </p>

      {!loading && (
        <>
          <div className={styles.benefits}>
            <span>
              {contentType === 'site'
                ? 'Unlock both tracks'
                : engineering
                  ? 'Unlock Modules 1-11'
                  : 'Unlock Units 1-15'}
            </span>
            <span>
              {contentType === 'site'
                ? 'Simulators and design calculators'
                : engineering
                  ? 'Use every design calculator'
                  : 'Use every simulator'}
            </span>
            <span>Track completed lessons</span>
          </div>

          <button
            type="button"
            className={styles.signInButton}
            onClick={handleSignIn}
            disabled={signingIn}
          >
            {signingIn ? 'Signing in…' : 'Sign in with Google to Continue'}
          </button>

          {error && <p className={styles.error}>{error}</p>}
          <p className={styles.trialNote}>
            The home page and its demo simulators remain available without an account.
          </p>

          {/* A locked page replaces the whole app shell, navbar included, so
              without these it is a dead end reachable only by the back button. */}
          <nav className={styles.escapeHatch} aria-label="Go elsewhere">
            <Link to="/">Home</Link>
            <Link to="/docs/unit-00/classes-and-objects">Free software lesson</Link>
            <Link to="/mechanical/module-00/design-cycle">Free engineering lesson</Link>
          </nav>
        </>
      )}
    </section>
  );
}
