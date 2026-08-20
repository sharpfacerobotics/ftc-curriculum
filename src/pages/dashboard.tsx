import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useHistory } from '@docusaurus/router';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { signOut } from 'firebase/auth';
import { auth } from '../telemark/firebase';
import { useAuth } from '../telemark/useAuth';
import { useProgress } from '../telemark/useProgress';
import { getTrack, TRACKS, type TrackId } from '../telemark/tracks';
import styles from './dashboard.module.css';
import {useBasePath} from '@site/src/telemark/useBasePath';

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage(): React.JSX.Element {
  const { user, loading }          = useAuth();
  const {
    progress,
    loading: progressLoading,
    isComplete,
    isSkipped,
    isReviewingUnit,
    markManyComplete,
    markManySkipped,
    reviewMany,
    unmarkMany,
  } = useProgress(user);
  const history                    = useHistory();
  const basePath = useBasePath();
  const [activeTrack, setActiveTrack] = useState<TrackId>('software');
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [savingUnit, setSavingUnit] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const previousStatusesRef = useRef<Record<string, string>>({});

  // Redirect to login if not signed in
  useEffect(() => {
    if (!loading && !user) {
      history.push(basePath('/login'));
    }
  }, [user, loading, history]);

  const track = getTrack(activeTrack);
  const trackLessons = track.lessons;
  const trackUnits = track.units;

  const handled    = trackLessons.filter((lesson) => isComplete(lesson.id)).length;
  const skipped    = trackLessons.filter((lesson) => isSkipped(lesson.id)).length;
  const completed  = handled - skipped;
  const total      = trackLessons.length;
  const percentage = Math.round((handled / total) * 100);
  const lastOpenLesson = progress?.lastLesson
    ? trackLessons.find(
        (lesson) => lesson.id === progress.lastLesson && !isComplete(lesson.id),
      )
    : undefined;
  const nextLesson = lastOpenLesson
    ?? trackLessons.find((lesson) => !isComplete(lesson.id));
  const fallbackUnit = trackUnits[trackUnits.length - 1];
  const units = useMemo(() => {
    return trackUnits.map((unit) => {
      const lessons = trackLessons.filter((lesson) => lesson.unitSlug === unit.slug);
      const completedCount = lessons.filter((lesson) => isComplete(lesson.id)).length;
      const skippedCount = lessons.filter((lesson) => isSkipped(lesson.id)).length;
      const reviewing = isReviewingUnit(unit.slug);
      const status =
        reviewing
          ? 'reviewing'
          : skippedCount === lessons.length
            ? 'skipped'
            : completedCount === lessons.length
          ? 'complete'
          : completedCount === 0
            ? 'untouched'
            : 'in-progress';
      const unitNextLesson = lessons.find((lesson) => !isComplete(lesson.id));

      return {
        ...unit,
        lessons,
        completedCount,
        skippedCount,
        reviewing,
        status,
        unitNextLesson,
      };
    });
  }, [isComplete, isSkipped, isReviewingUnit, trackUnits, trackLessons]);

  useEffect(() => {
    if (!openActionMenu) return undefined;

    function closeMenu(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Element && !target.closest('[data-progress-action-menu]')) {
        setOpenActionMenu(null);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenActionMenu(null);
    }

    document.addEventListener('pointerdown', closeMenu);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeMenu);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [openActionMenu]);

  useEffect(() => {
    setExpandedUnits((prev) => {
      const next = {...prev};

      units.forEach((unit) => {
        const previousStatus = previousStatusesRef.current[unit.slug];
        if (
          previousStatus
          && previousStatus !== unit.status
          && next[unit.slug] !== true
        ) {
          delete next[unit.slug];
        }
      });

      previousStatusesRef.current = Object.fromEntries(
        units.map((unit) => [unit.slug, unit.status]),
      );

      return next;
    });
  }, [units]);

  async function handleSignOut() {
    await signOut(auth);
    history.push(basePath('/'));
  }

  function toggleUnit(unitSlug: string, nextValue: boolean) {
    setExpandedUnits((prev) => ({
      ...prev,
      [unitSlug]: nextValue,
    }));
  }

  async function handleUnitAction(
    unit: (typeof units)[number],
    action: 'complete' | 'skip' | 'review' | 'unmark',
  ) {
    const lessonIds = unit.lessons.map((lesson) => lesson.id);
    setSavingUnit(unit.slug);
    setActionError(null);

    try {
      if (action === 'complete') await markManyComplete(lessonIds);
      if (action === 'skip') await markManySkipped(lessonIds);
      if (action === 'review') await reviewMany(lessonIds);
      if (action === 'unmark') await unmarkMany(lessonIds);
      setOpenActionMenu(null);
      setExpandedUnits((prev) => ({...prev, [unit.slug]: action === 'review' || action === 'unmark'}));
    } catch (error) {
      console.error(`Telemark ${action} action failed:`, error);
      setActionError(`Could not update ${unit.label}. Please try again.`);
    } finally {
      setSavingUnit(null);
    }
  }

  if (loading || progressLoading || !user || !progress) {
    return (
      <Layout title="Dashboard · Telemark" noFooter>
        <main className={styles.page}>
          <div className={styles.loading}>
            <span className={styles.loadingText}>Loading your curriculum progress...</span>
          </div>
        </main>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard · Telemark" noFooter>

      <main className={styles.page}>
        <div className={styles.content}>

          {/* ── Header ── */}
          <div className={styles.header}>
            <div>
              <p className={styles.eyebrow}>// telemark.dashboard</p>
              <h1 className={styles.title}>
                Welcome back,{' '}
                <span className={styles.name}>
                  {user.displayName?.split(' ')[0] ?? 'teammate'}
                </span>
              </h1>
            </div>
            <div className={styles.headerActions}>
              <Link to={nextLesson?.path ?? fallbackUnit.overviewPath} className={styles.resumeBtn}>
                {nextLesson ? `Resume → ${nextLesson.label}` : `Review ${fallbackUnit.label} ✓`}
              </Link>
              <button className={styles.signOutBtn} onClick={handleSignOut}>
                Sign Out
              </button>
            </div>
          </div>

          {/* ── Track switcher ── */}
          <div className={styles.trackSwitcher} role="group" aria-label="Choose a track">
            {TRACKS.map((option) => {
              const optionHandled = option.lessons.filter((lesson) =>
                isComplete(lesson.id),
              ).length;
              return (
                <button
                  key={option.id}
                  type="button"
                  className={`${styles.trackTab} ${
                    activeTrack === option.id ? styles.trackTabActive : ''
                  }`}
                  aria-pressed={activeTrack === option.id}
                  onClick={() => setActiveTrack(option.id)}
                >
                  <span className={styles.trackTabName}>{option.shortLabel}</span>
                  <span className={styles.trackTabMeta}>
                    {optionHandled} / {option.lessons.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Progress overview ── */}
          <div className={styles.overviewGrid}>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{completed}</span>
              <span className={styles.statLabel}>Lessons Complete</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{skipped}</span>
              <span className={styles.statLabel}>Skipped</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{total - handled}</span>
              <span className={styles.statLabel}>Remaining</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{percentage}%</span>
              <span className={styles.statLabel}>Overall Progress</span>
            </div>
          </div>

          {/* ── Progress bar ── */}
          <div className={styles.progressSection}>
            <div className={styles.progressHeader}>
              <span className={styles.progressLabel}>
                {trackUnits.length}{' '}
                {activeTrack === 'mechanical' ? 'modules' : 'live units'} ·{' '}
                {total} lessons
              </span>
              <span className={styles.progressPct}>{percentage}%</span>
            </div>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* ── Lesson list ── */}
          <div className={styles.lessonList}>
            <p className={styles.listLabel}>// progress.byUnit</p>
            {actionError && <p className={styles.actionError} role="alert">{actionError}</p>}
            {units.map((unit) => {
              const isExpanded = expandedUnits[unit.slug]
                ?? (unit.status === 'in-progress' || unit.status === 'reviewing');
              const statusLabel =
                unit.status === 'reviewing'
                  ? 'Reviewing'
                  : unit.status === 'skipped'
                    ? 'Skipped'
                    : unit.status === 'complete'
                  ? 'Unit Complete'
                  : unit.status === 'untouched'
                    ? 'Not Started'
                    : 'In Progress';
              const unitBusy = savingUnit === unit.slug;

              return (
                <section
                  key={unit.slug}
                  className={`${styles.unitGroup} ${unit.status === 'skipped' ? styles.unitSkipped : ''} ${unit.status === 'reviewing' ? styles.unitReviewing : ''}`}
                >
                  <div className={styles.unitHeader}>
                    <button
                      type="button"
                      className={styles.unitToggle}
                      onClick={() => toggleUnit(unit.slug, !isExpanded)}
                    >
                      <span className={styles.unitToggleIcon} aria-hidden="true">
                        {isExpanded ? '▾' : '▸'}
                      </span>
                      <span className={styles.unitHeaderInfo}>
                        <span className={styles.unitHeaderTitle}>
                          {unit.label}: {unit.title}
                        </span>
                        <span className={styles.unitHeaderMeta}>
                          {unit.completedCount}/{unit.lessons.length} handled
                          {unit.skippedCount > 0 && ` · ${unit.skippedCount} skipped`}
                          {' · '}
                          <span className={styles.unitState}>{statusLabel}</span>
                        </span>
                      </span>
                    </button>

                    <div className={styles.unitHeaderActions}>
                      <Link to={unit.overviewPath} className={styles.unitHeaderLink}>
                        Overview
                      </Link>
                      <Link
                        to={unit.unitNextLesson?.path ?? unit.startPath}
                        className={styles.unitHeaderLink}
                      >
                        {unit.status === 'reviewing'
                          ? 'Resume review'
                          : unit.unitNextLesson
                            ? 'Resume'
                            : 'Open'}
                      </Link>
                      <div className={styles.actionMenu} data-progress-action-menu>
                        <button
                          type="button"
                          className={styles.actionMenuTrigger}
                          aria-haspopup="menu"
                          aria-expanded={openActionMenu === unit.slug}
                          aria-label={`Progress options for ${unit.label}`}
                          onClick={() => setOpenActionMenu((current) => current === unit.slug ? null : unit.slug)}
                          disabled={unitBusy}
                        >
                          <span aria-hidden="true">•••</span>
                          <span>{unitBusy ? 'Saving' : 'Options'}</span>
                        </button>
                        {openActionMenu === unit.slug && (
                          <div className={styles.actionMenuPopover} role="menu">
                            <p className={styles.actionMenuLabel}>{unit.label} progress</p>
                            {(unit.completedCount < unit.lessons.length || unit.skippedCount > 0) && (
                              <button
                                type="button"
                                role="menuitem"
                                className={styles.actionMenuItem}
                                onClick={() => handleUnitAction(unit, 'complete')}
                                disabled={unitBusy}
                              >
                                <span className={styles.actionMenuIcon} aria-hidden="true">✓</span>
                                <span><strong>Mark done</strong><small>Count every lesson as completed.</small></span>
                              </button>
                            )}
                            {unit.status !== 'skipped' && (
                              <button
                                type="button"
                                role="menuitem"
                                className={styles.actionMenuItem}
                                onClick={() => handleUnitAction(unit, 'skip')}
                                disabled={unitBusy}
                              >
                                <span className={`${styles.actionMenuIcon} ${styles.skipIcon}`} aria-hidden="true">→</span>
                                <span><strong>Skip unit</strong><small>Treat it as done, with a skipped indicator.</small></span>
                              </button>
                            )}
                            {(unit.completedCount > 0 || unit.reviewing) && (
                              <button
                                type="button"
                                role="menuitem"
                                className={styles.actionMenuItem}
                                onClick={() => handleUnitAction(unit, 'review')}
                                disabled={unitBusy}
                              >
                                <span className={`${styles.actionMenuIcon} ${styles.reviewIcon}`} aria-hidden="true">↺</span>
                                <span><strong>{unit.reviewing ? 'Restart review' : 'Review unit'}</strong><small>Reopen it while remembering it was done before.</small></span>
                              </button>
                            )}
                            {(unit.completedCount > 0 || unit.reviewing) && (
                              <button
                                type="button"
                                role="menuitem"
                                className={`${styles.actionMenuItem} ${styles.unmarkItem}`}
                                onClick={() => handleUnitAction(unit, 'unmark')}
                                disabled={unitBusy}
                              >
                                <span className={styles.actionMenuIcon} aria-hidden="true">○</span>
                                <span><strong>Unmark unit</strong><small>Clear its progress and make it current.</small></span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={styles.unitProgressTrack} aria-hidden="true">
                    <div
                      className={styles.unitProgressFill}
                      data-skipped={unit.status === 'skipped' ? 'true' : undefined}
                      style={{width: `${Math.round((unit.completedCount / unit.lessons.length) * 100)}%`}}
                    />
                  </div>

                  {isExpanded && (
                    <div className={styles.unitLessonRows}>
                      {unit.lessons.map((lesson) => {
                        const done = isComplete(lesson.id);
                        const lessonSkipped = isSkipped(lesson.id);
                        return (
                          <Link
                            key={lesson.id}
                            to={lesson.path}
                            className={`${styles.lessonRow} ${done ? styles.lessonDone : ''} ${lessonSkipped ? styles.lessonSkipped : ''} ${unit.reviewing && !done ? styles.lessonReviewing : ''}`}
                          >
                            <div className={styles.lessonCheck} aria-hidden="true">
                              {lessonSkipped ? '→' : done ? '✓' : unit.reviewing ? '↺' : '○'}
                            </div>
                            <div className={styles.lessonInfo}>
                              <span className={styles.lessonLabel}>{lesson.label}</span>
                              <span className={styles.lessonUnit}>{lesson.title}</span>
                            </div>
                            <span className={styles.lessonStatus}>
                              {lessonSkipped ? 'Skipped' : done ? 'Complete' : unit.reviewing ? 'Review' : 'Incomplete'}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>

        </div>
      </main>
    </Layout>
  );
}
