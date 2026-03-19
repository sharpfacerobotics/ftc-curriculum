import React, { useEffect } from 'react';
import { useHistory } from '@docusaurus/router';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { signOut } from 'firebase/auth';
import { auth } from '../telemark/firebase';
import { useAuth } from '../telemark/useAuth';
import { useProgress } from '../telemark/useProgress';
import styles from './dashboard.module.css';

// ─── All lessons in order ─────────────────────────────────────────────────────

interface Lesson {
  id: string;
  label: string;
  path: string;
  unit: string;
}

const LESSONS: Lesson[] = [
  { id: 'unit-01/choosing-your-tool',    label: '1.1 · Choosing Your Tool',       path: '/docs/unit-01/choosing-your-tool',    unit: 'Unit 1' },
  { id: 'unit-01/opmode-and-telemetry',  label: '1.2 · OpMode & Telemetry',       path: '/docs/unit-01/opmode-and-telemetry',  unit: 'Unit 1' },
  { id: 'unit-01/java-variables',        label: '1.3 · Variables & Data Types',   path: '/docs/unit-01/java-variables',        unit: 'Unit 1' },
  { id: 'unit-01/conditionals',          label: '1.4 · Conditionals',             path: '/docs/unit-01/conditionals',          unit: 'Unit 1' },
  { id: 'unit-01/loops',                 label: '1.5 · Loops',                    path: '/docs/unit-01/loops',                 unit: 'Unit 1' },
  { id: 'unit-01/state-machines',        label: '1.6 · State Machines',           path: '/docs/unit-01/state-machines',        unit: 'Unit 1' },
  { id: 'unit-01/functions',             label: '1.7 · Functions & Methods',      path: '/docs/unit-01/functions',             unit: 'Unit 1' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage(): React.JSX.Element {
  const { user, loading }          = useAuth();
  const { progress, isComplete }   = useProgress(user);
  const history                    = useHistory();

  // Redirect to login if not signed in
  useEffect(() => {
    if (!loading && !user) {
      history.push('/ftc-curriculum/login');
    }
  }, [user, loading, history]);

  if (loading || !user || !progress) {
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

  const completed  = LESSONS.filter((l) => isComplete(l.id)).length;
  const total      = LESSONS.length;
  const percentage = Math.round((completed / total) * 100);

  // Find next incomplete lesson
  const nextLesson = LESSONS.find((l) => !isComplete(l.id));

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
              <Link to="/docs/unit-01/choosing-your-tool" className={styles.resumeBtn}>
                {nextLesson ? `Resume → ${nextLesson.label}` : 'All lessons complete ✓'}
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
              <span className={styles.progressLabel}>Unit 1: The Basics</span>
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
            {LESSONS.map((lesson) => {
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
                    <span className={styles.lessonUnit}>{lesson.unit}</span>
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