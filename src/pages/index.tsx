import React, { useState } from 'react';
import Link from '@docusaurus/Link';
import { useHistory } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import styles from './index.module.css';
import { useAuth } from '../telemark/useAuth';
import { trackEvent } from '../telemark/analytics';
import { signInWithGoogle } from '../telemark/googleAuth';
import { isProtectedUnit } from '../telemark/accessPolicy';
import AuthenticatedSimulatorNavigator from '../components/AuthenticatedSimulatorNavigator';
import Reveal from '../components/ui/Reveal';
import {useCountUp, useReveal} from '../components/ui/useReveal';
import SimulatorWorkflow from '../components/SimulatorWorkflow';
import {
  CURRICULUM_LESSON_COUNT,
  CURRICULUM_UNIT_COUNT,
  CURRICULUM_UNITS,
  type Tier,
} from '../telemark/curriculum';
import {
  MECHANICAL_LESSON_COUNT,
  MECHANICAL_UNIT_COUNT,
} from '../telemark/mechanical';
import {TOTAL_LESSON_COUNT} from '../telemark/tracks';

const TRACKS_SUMMARY = [
  {
    id: 'software',
    eyebrow: 'Track 01',
    title: 'Software',
    desc: 'FTC Java from classes and OpModes through sensors, vision, and full autonomous routines, with a browser simulator on every lesson.',
    stat: `${CURRICULUM_UNIT_COUNT} units · ${CURRICULUM_LESSON_COUNT} lessons`,
    to: '/docs',
    cta: 'Open the software track',
  },
  {
    id: 'mechanical',
    eyebrow: 'Track 02',
    title: 'Mechanical',
    desc: 'Build the robot the code runs on: the design process, CAD, materials, power transmission, mechanisms, wiring, and competition readiness.',
    stat: `${MECHANICAL_UNIT_COUNT} modules · ${MECHANICAL_LESSON_COUNT} lessons`,
    to: '/mechanical',
    cta: 'Open the mechanical track',
  },
];

const FEATURES = [
  {
    title: 'Browser simulator',
    desc: 'Write the lesson\'s Java, run the FTC lifecycle against simulated hardware, and read the telemetry back. On 47 software lessons.',
  },
  {
    title: 'Design calculators',
    desc: 'Twelve of them, covering gear ratios, arm torque, drivetrain limits, slide rigging, wire gauge, and beam deflection. Each one draws the result, not just the number.',
  },
  {
    title: 'Progress that follows you',
    desc: 'Sign in and completed lessons are recorded across both tracks and every device. No streaks, no badges.',
  },
  {
    title: 'Open source',
    desc: 'Read it, adapt it for your team, or send a fix. Built by FTC team 30450.',
  },
];

const TIER_CLASS: Record<Tier, string> = {
  Beginner:     'tagBasic',
  Intermediate: 'tagInter',
  Advanced:     'tagAdv',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Divider(): React.JSX.Element {
  return <div className={styles.divider} aria-hidden="true" />;
}

// ─── Page sections ────────────────────────────────────────────────────────────

function HeroSection(): React.JSX.Element {
  return (
    <section className={styles.hero}>
      <div className={styles.heroBadge}>
        <span className={styles.badgeDot} aria-hidden="true" />
        <span>Student-built FTC software and engineering curriculum</span>
      </div>

      <h1 className={styles.heroTitle}>
        <span className={styles.titleLine1}>Master FTC</span>
        <span className={styles.titleLine2}>Robotics</span>
      </h1>

      <p className={styles.heroSub}>
        Two tracks, one robot. Lessons and browser simulators for how FTC robots
        are programmed, and lessons and design calculators for how they are built.
      </p>

      <div className={styles.terminalLine} aria-hidden="true">
        <span className={styles.terminalPrompt}>telemetry &gt;</span>
        <span>FTC Java ready </span>
        <span className={styles.cursor} />
      </div>

      <div className={styles.heroActions}>
        <Link to="/docs/unit-00/classes-and-objects" className={styles.btnPrimary}>
          Begin Software
        </Link>
        <Link to="/mechanical/module-00/design-cycle" className={styles.btnSecondary}>
          Begin Engineering
        </Link>
      </div>
    </section>
  );
}

function StatsBar(): React.JSX.Element {
  const {ref, revealed} = useReveal<HTMLParagraphElement>({threshold: 0.4});
  const lessons = useCountUp(TOTAL_LESSON_COUNT, {start: revealed});

  return (
    <p className={styles.summaryLine} ref={ref}>
      <span className={styles.summaryFigure}>{lessons}</span> lessons across
      {' '}<span className={styles.summaryFigure}>2</span> tracks, written in
      Java against the FTC SDK, with simulators on one side and design
      calculators on the other.
    </p>
  );
}

function TracksSection(): React.JSX.Element {
  return (
    <section className={styles.section} id="tracks">
      <p className={styles.sectionLabel}>Two tracks</p>
      <h2 className={styles.sectionTitle}>Both halves of the robot</h2>
      <p className={styles.sectionDesc}>
        A team needs people who can write the code and people who can build the
        machine it runs on. Telemark teaches both, and each track stands on its
        own.
      </p>

      <div className={styles.trackGrid}>
        {TRACKS_SUMMARY.map((track, index) => (
          <Reveal key={track.id} delayMs={index * 90}>
            <Link to={track.to} className={styles.trackCard}>
            <span className={styles.trackEyebrow}>{track.eyebrow}</span>
            <h3 className={styles.trackTitle}>{track.title}</h3>
            <p className={styles.trackDesc}>{track.desc}</p>
            <span className={styles.trackStat}>{track.stat}</span>
              <span className={styles.trackCta}>{track.cta} →</span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function CurriculumSection({
  signedIn,
  authLoading,
}: {
  signedIn: boolean;
  authLoading: boolean;
}): React.JSX.Element {
  const history = useHistory();
  const [unlockingUnit, setUnlockingUnit] = useState<string | null>(null);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  async function unlockUnit(unit: (typeof CURRICULUM_UNITS)[number]) {
    const unitNumber = Number.parseInt(unit.slug.replace('unit-', ''), 10);
    setUnlockingUnit(unit.slug);
    setUnlockError(null);
    trackEvent('content_unlock_attempt', {
      unit_number: unitNumber,
      surface: 'homepage_curriculum_card',
    });

    try {
      await signInWithGoogle();
      trackEvent('content_unlock_success', {
        unit_number: unitNumber,
        surface: 'homepage_curriculum_card',
      });
      history.push(unit.overviewPath);
    } catch (signInError) {
      console.error('Telemark unit unlock failed:', signInError);
      setUnlockError('Sign-in did not finish. Select a locked unit to try again.');
    } finally {
      setUnlockingUnit(null);
    }
  }

  return (
    <section className={styles.section} id="curriculum">
      <p className={styles.sectionLabel}>Software track</p>
      <h2 className={styles.sectionTitle}>{CURRICULUM_UNIT_COUNT} units that grow with your team</h2>
      <p className={styles.sectionDesc}>
        Follow the sequence or jump to the topic your team needs.
      </p>

      <div className={styles.curriculumGrid}>
        {CURRICULUM_UNITS.map((unit) => {
          const unitNumber = Number.parseInt(unit.slug.replace('unit-', ''), 10);
          const protectedUnit = isProtectedUnit(unitNumber);
          const checking = authLoading && protectedUnit;
          const locked = !authLoading && !signedIn && protectedUnit;
          const cardContent = (
            <>
            <div className={styles.unitNum}>{unit.label}</div>
            <div className={styles.unitTitle}>{unit.title}</div>
            <div className={styles.unitDesc}>{unit.desc}</div>
            <span className={`${styles.unitTag} ${(locked || checking) ? styles.tagLocked : styles[TIER_CLASS[unit.tier]]}`}>
              {locked && <i className="fa-solid fa-lock" aria-hidden="true" />}
              {' '}
              {checking ? 'Checking access' : locked ? 'Account required' : unit.tier}
            </span>
            </>
          );

          if (locked || checking) {
            return (
              <button
                type="button"
                key={unit.id}
                className={`${styles.unitCard} ${styles.unitCardLocked}`}
                onClick={() => {
                  if (!checking) unlockUnit(unit);
                }}
                disabled={checking || unlockingUnit === unit.slug}
                aria-label={checking
                  ? `Checking access to ${unit.label}: ${unit.title}`
                  : `Sign in to unlock ${unit.label}: ${unit.title}`}
              >
                {cardContent}
              </button>
            );
          }

          return (
            <Link
              to={unit.overviewPath}
              key={unit.id}
              className={styles.unitCard}
            >
              {cardContent}
            </Link>
          );
        })}
      </div>
      {unlockError && <p className={styles.unlockError}>{unlockError}</p>}
    </section>
  );
}

function FeaturesSection(): React.JSX.Element {
  return (
    <section className={styles.section}>
      <p className={styles.sectionLabel}>Why Telemark</p>
      <h2 className={styles.sectionTitle}>Learn it, then check it</h2>

      <dl className={styles.featureList}>
        {FEATURES.map((f) => (
          <Reveal key={f.title} as="div" className={styles.featureRow}>
            <dt className={styles.featureTerm}>{f.title}</dt>
            <dd className={styles.featureDesc}>{f.desc}</dd>
          </Reveal>
        ))}
      </dl>
    </section>
  );
}

function SimulatorSection(): React.JSX.Element {
  return (
    <section className={styles.section}>
      <p className={styles.sectionLabel}>Browser simulator</p>
      <h2 className={styles.sectionTitle}>Run Java in the browser</h2>
      <p className={styles.sectionDesc}>
        Write lesson code, run the FTC lifecycle, and debug the result with
        telemetry, requirement checks, and simulated hardware.
      </p>
      <SimulatorWorkflow
        className={styles.simulatorWorkflow}
        itemClassName={styles.simulatorStep}
        taskClassName={styles.simulatorTasks}
      />
      <p className={styles.simulatorLimit}>
        The browser can test code and simulated behavior. A physical robot is
        recommended to verify wiring, motor direction, friction, and tuning.
      </p>
      <AuthenticatedSimulatorNavigator
        simulatorId="homepage_navigator"
        wrapperClassName={styles.simulatorWrapper}
        toolbarClassName={styles.simulatorToolbar}
        toolbarButtonClassName={styles.simulatorToolbarButton}
        allowHomepageDemos
      />
    </section>
  );
}

function CtaSection(): React.JSX.Element {
  return (
    <div className={styles.ctaSection}>
      <div className={styles.ctaBox}>
        <p className={styles.sectionLabel} style={{ marginBottom: '1.5rem' }}>
          Start here
        </p>
        <h2 className={styles.ctaTitle}>
          Start with the fundamentals.<br />Build toward competition.
        </h2>
        <p className={styles.ctaSub}>
          Write the code in the browser, design the robot with the calculators,
          and bring both to the field.
        </p>
        <div className={styles.heroActions}>
          <Link to="/docs/unit-00/classes-and-objects" className={styles.btnPrimary}>
            Begin Unit 0 →
          </Link>
          <Link to="/mechanical/module-00/design-cycle" className={styles.btnSecondary}>
            Begin Module 0 →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

export default function Home(): React.JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  const { user, loading } = useAuth();
  const buildCommit = String(siteConfig.customFields?.buildCommit ?? 'unknown');

  return (
    <Layout
      title={siteConfig.title}
      description="Telemark is a student-built FTC curriculum with two tracks: Java programming with browser simulators, and mechanical engineering with design calculators."
      wrapperClassName={styles.homeWrapper}
    >
      <Head>
        <meta name="telemark-build-commit" content={buildCommit} />
      </Head>

      {/* Font Awesome is used by the lock icons on gated unit cards */}
      <link
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
        rel="stylesheet"
      />

      <main className={styles.lp}>
        <HeroSection />
        <StatsBar />
        <Divider />
        <TracksSection />
        <Divider />
        <CurriculumSection signedIn={Boolean(user)} authLoading={loading} />
        <Divider />
        <SimulatorSection />
        <Divider />
        <FeaturesSection />
        <CtaSection />
      </main>
    </Layout>
  );
}
