import React, {useState} from 'react';
import Link from '@docusaurus/Link';
import {useHistory} from '@docusaurus/router';
import {useAuth} from '@site/src/telemark/useAuth';
import {useProgress} from '@site/src/telemark/useProgress';
import {signInWithGoogle} from '@site/src/telemark/googleAuth';
import {trackEvent} from '@site/src/telemark/analytics';
import {isProtectedUnit} from '@site/src/telemark/accessPolicy';
import {getTrack, type TrackId} from '@site/src/telemark/tracks';
import type {Tier} from '@site/src/telemark/curriculum';
import Reveal from '@site/src/components/ui/Reveal';
import styles from './TrackOverview.module.css';
import {useBasePath} from '@site/src/telemark/useBasePath';

const TIER_CLASS: Record<Tier, string> = {
  Beginner: styles.tagBeginner,
  Intermediate: styles.tagIntermediate,
  Advanced: styles.tagAdvanced,
};

interface TrackOverviewProps {
  trackId: TrackId;
  /** Optional pointer to the other track, rendered at the bottom of the page. */
  companionTrackId?: TrackId;
  companionNote?: string;
}

/**
 * Landing grid for an entire track, rendered inside the docs layout so the
 * sidebar stays available. Shows per-unit progress once the student is signed
 * in.
 */
export default function TrackOverview({
  trackId,
  companionTrackId,
  companionNote,
}: TrackOverviewProps): React.JSX.Element {
  const track = getTrack(trackId);
  const companion = companionTrackId ? getTrack(companionTrackId) : null;
  const {user, loading} = useAuth();
  const {isComplete} = useProgress(user);
  const history = useHistory();
  const basePath = useBasePath();
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const noun = trackId === 'mechanical' ? 'Module' : 'Unit';

  async function unlock(unit: (typeof track.units)[number]) {
    const unitNumber = Number.parseInt(unit.slug.replace(/\D+/g, ''), 10);
    setUnlocking(unit.slug);
    setUnlockError(null);
    trackEvent('content_unlock_attempt', {
      unit_number: unitNumber,
      surface: `${trackId}_track_card`,
    });
    try {
      await signInWithGoogle();
      trackEvent('content_unlock_success', {
        unit_number: unitNumber,
        surface: `${trackId}_track_card`,
      });
      history.push(basePath(unit.overviewPath));
    } catch (error) {
      console.error('Telemark unlock failed:', error);
      setUnlockError('Sign-in did not finish. Select a locked card to try again.');
    } finally {
      setUnlocking(null);
    }
  }

  const completedLessons = track.lessons.filter((lesson) =>
    isComplete(lesson.id),
  ).length;

  const firstIncomplete = track.lessons.find((lesson) => !isComplete(lesson.id));

  return (
    <>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>// {track.id}.track</p>
        <h1 className={styles.title}>{track.label}</h1>
        <p className={styles.subtitle}>{track.tagline}</p>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{track.unitCount}</span>
            <span className={styles.statLabel}>{noun}s</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{track.lessonCount}</span>
            <span className={styles.statLabel}>Lessons</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{completedLessons}</span>
            <span className={styles.statLabel}>Completed</span>
          </div>
        </div>

        <div className={styles.actions}>
          <Link
            to={firstIncomplete?.path ?? track.units[0].startPath}
            className={styles.primaryAction}
          >
            {firstIncomplete && completedLessons > 0
              ? `Resume ${firstIncomplete.label}`
              : `Start ${track.units[0].label}`}
          </Link>
          <Link to="/dashboard" className={styles.secondaryAction}>
            Open Dashboard
          </Link>
        </div>
      </section>

      <h2 className={styles.sectionTitle}>{noun}s</h2>

      <div className={styles.grid}>
        {track.units.map((unit, index) => {
          const unitLessons = track.lessons.filter(
            (lesson) => lesson.unitSlug === unit.slug,
          );
          const done = unitLessons.filter((lesson) =>
            isComplete(lesson.id),
          ).length;
          const status =
            done === 0
              ? null
              : done === unitLessons.length
                ? 'Complete'
                : `${done} of ${unitLessons.length} done`;

          const unitNumber = Number.parseInt(unit.slug.replace(/\D+/g, ''), 10);
          const gated = isProtectedUnit(unitNumber);
          const checking = loading && gated;
          const locked = !loading && !user && gated;

          const body = (
            <>
              <span className={styles.cardNum}>{unit.label}</span>
              <span className={styles.cardTitle}>{unit.title}</span>
              <span className={styles.cardDesc}>{unit.desc}</span>
              <span className={styles.cardMeta}>
                <span
                  className={`${styles.tag} ${
                    locked || checking ? styles.tagLocked : TIER_CLASS[unit.tier]
                  }`}
                >
                  {checking ? 'Checking access' : locked ? 'Account required' : unit.tier}
                </span>
                <span className={`${styles.tag} ${styles.tagProgress}`}>
                  {unit.lessonCount} lessons
                </span>
                {status && (
                  <span
                    className={`${styles.tag} ${
                      status === 'Complete' ? styles.tagDone : styles.tagProgress
                    }`}
                  >
                    {status}
                  </span>
                )}
              </span>
            </>
          );

          return (
            <Reveal key={unit.id} delayMs={Math.min(index, 8) * 45}>
              {locked || checking ? (
                <button
                  type="button"
                  className={`${styles.card} ${styles.cardLocked}`}
                  disabled={checking || unlocking === unit.slug}
                  aria-label={
                    checking
                      ? `Checking access to ${unit.label}: ${unit.title}`
                      : `Sign in to unlock ${unit.label}: ${unit.title}`
                  }
                  onClick={() => {
                    if (!checking) unlock(unit);
                  }}
                >
                  {body}
                </button>
              ) : (
                <Link to={unit.overviewPath} className={styles.card}>
                  {body}
                </Link>
              )}
            </Reveal>
          );
        })}
      </div>
      {unlockError && <p className={styles.unlockError}>{unlockError}</p>}

      {companion && (
        <div className={styles.switcher}>
          <p className={styles.switcherTitle}>Looking for the {companion.shortLabel.toLowerCase()} side?</p>
          <p className={styles.switcherDesc}>
            {companionNote ?? companion.tagline}
          </p>
          <Link to={companion.indexPath} className={styles.secondaryAction}>
            Open the {companion.label}
          </Link>
        </div>
      )}
    </>
  );
}
