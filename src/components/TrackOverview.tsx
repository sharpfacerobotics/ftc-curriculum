import React, {useState} from 'react';
import Link from '@docusaurus/Link';
import {useAuth} from '@site/src/telemark/useAuth';
import {useProgress} from '@site/src/telemark/useProgress';
import {isProtectedUnit} from '@site/src/telemark/accessPolicy';
import {getTrack, type TrackId} from '@site/src/telemark/tracks';
import type {Tier} from '@site/src/telemark/curriculum';
import Reveal from '@site/src/components/ui/Reveal';
import styles from './TrackOverview.module.css';

const MOBILE_UNIT_PREVIEW_COUNT = 5;

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
  const [showAllMobile, setShowAllMobile] = useState(false);

  const noun = trackId === 'mechanical' ? 'Module' : 'Unit';

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

      <div className={styles.grid} id={`${track.id}-unit-list`}>
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
          const locked = !loading && !user && gated;

          const body = (
            <>
              <span className={styles.cardNum}>{unit.label}</span>
              <span className={styles.cardTitle}>{unit.title}</span>
              <span className={styles.cardDesc}>{unit.desc}</span>
              <span className={styles.cardMeta}>
                <span
                  className={`${styles.tag} ${
                    locked ? styles.tagLocked : TIER_CLASS[unit.tier]
                  }`}
                >
                  {locked ? 'Lessons require account' : unit.tier}
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
            <Reveal
              key={unit.id}
              delayMs={Math.min(index, 8) * 45}
              className={
                index >= MOBILE_UNIT_PREVIEW_COUNT && !showAllMobile
                  ? styles.mobileCurriculumExtra
                  : ''
              }
            >
              <Link
                to={unit.overviewPath}
                className={`${styles.card} ${locked ? styles.cardLocked : ''}`}
              >
                {body}
              </Link>
            </Reveal>
          );
        })}
      </div>
      {track.units.length > MOBILE_UNIT_PREVIEW_COUNT && (
        <button
          type="button"
          className={styles.mobileCurriculumToggle}
          aria-expanded={showAllMobile}
          aria-controls={`${track.id}-unit-list`}
          onClick={() => setShowAllMobile((current) => !current)}
        >
          {showAllMobile
            ? `Show fewer ${noun.toLowerCase()}s`
            : `Show all ${track.unitCount} ${noun.toLowerCase()}s`}
        </button>
      )}

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
