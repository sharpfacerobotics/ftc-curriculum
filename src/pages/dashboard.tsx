import React, { useEffect } from 'react';
import { useHistory } from '@docusaurus/router';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { signOut } from 'firebase/auth';
import { auth } from '../telemark/firebase';
import { useAuth } from '../telemark/useAuth';
import { useProgress } from '../telemark/useProgress';
import { CURRICULUM_LESSONS, CURRICULUM_UNITS } from '../telemark/curriculum';
import styles from './dashboard.module.css';

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage(): React.JSX.Element {
  const { user, loading }          = useAuth();
  const { progress, loading: progressLoading, isComplete } = useProgress(user);
  const history                    = useHistory();

  // Redirect to login if not signed in
  useEffect(() => {
    if (!loading && !user) {
      history.push('/ftc-curriculum/login');
    }
  }, [user, loading, history]);

  if (loading || progressLoading || !user || !progress) {
    return (
      <Layout title="Dashboard — Telemark" noFooter>
        <main className={styles.page}>
          <div className={styles.loading}>
            <span className={styles.loadingText}>Loading Telemark...</span>
          </div>
        </main>
      </Layout>
    );
  }

  const completed  = CURRICULUM_LESSONS.filter((lesson) => isComplete(lesson.id)).length;
  const total      = CURRICULUM_LESSONS.length;
  const percentage = Math.round((completed / total) * 100);
  const nextLesson = CURRICULUM_LESSONS.find((lesson) => !isComplete(lesson.id));
  const fallbackUnit = CURRICULUM_UNITS[CURRICULUM_UNITS.length - 1];

  async function handleSignOut() {
    await signOut(auth);
    history.push('/ftc-curriculum/');
  }

  return (
    <Layout title="Dashboard — Telemark" noFooter>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&family=Share+Tech+Mono&family=Exo+2:wght@300;400;600&display=swap"
        rel="stylesheet"
      />

      <main className={styles.page}>
        <div className={styles.gridBg}   aria-hidden="true" />
        <div className={styles.scanline} aria-hidden="true" />

        <div className={styles.content}>

          {/* ── Header ── */}
          <div className={styles.header}>
            <div>
              <p className={styles.eyebrow}>// telemark.dashboard</p>
              <h1 className={styles.title}>
                Welcome back,{' '}
                <span className={styles.name}>
                  {user.displayName?.split(' ')[0] ?? 'Cadet'}
                </span>
              </h1>
            </div>
            <div className={styles.headerActions}>
              <Link to={nextLesson?.path ?? fallbackUnit.categoryPath} className={styles.resumeBtn}>
                {nextLesson ? `Resume → ${nextLesson.label}` : `Review ${fallbackUnit.label} ✓`}
              </Link>
              <button className={styles.signOutBtn} onClick={handleSignOut}>
                Sign Out
              </button>
            </div>
          </div>

          {/* ── Progress overview ── */}
          <div className={styles.overviewGrid}>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{completed}</span>
              <span className={styles.statLabel}>Lessons Complete</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{total - completed}</span>
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
                {CURRICULUM_UNITS.length} live units · {total} lessons
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
            <p className={styles.listLabel}>// lesson.progress[]</p>
            {CURRICULUM_LESSONS.map((lesson) => {
              const done = isComplete(lesson.id);
              return (
                <Link
                  key={lesson.id}
                  to={lesson.path}
                  className={`${styles.lessonRow} ${done ? styles.lessonDone : ''}`}
                >
                  <div className={styles.lessonCheck} aria-hidden="true">
                    {done ? '✓' : '○'}
                  </div>
                  <div className={styles.lessonInfo}>
                    <span className={styles.lessonLabel}>{lesson.label}</span>
                    <span className={styles.lessonUnit}>
                      {lesson.unitLabel}: {lesson.unitTitle}
                    </span>
                  </div>
                  <span className={styles.lessonStatus}>
                    {done ? 'Complete' : 'Incomplete'}
                  </span>
                </Link>
              );
            })}
          </div>

        </div>
      </main>
    </Layout>
  );
}
