import React, { useState } from 'react';
import Link from '@docusaurus/Link';
import { useHistory } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Head from '@docusaurus/Head';
import styles from './index.module.css';
import { signOut } from 'firebase/auth';
import { auth } from '../telemark/firebase';
import { useAuth } from '../telemark/useAuth';
import { trackEvent } from '../telemark/analytics';
import { signInWithGoogle } from '../telemark/googleAuth';
import { isProtectedUnit } from '../telemark/accessPolicy';
import AuthenticatedSimulatorNavigator from '../components/AuthenticatedSimulatorNavigator';
import SimulatorWorkflow from '../components/SimulatorWorkflow';
import {
  CURRICULUM_LESSON_COUNT,
  CURRICULUM_UNIT_COUNT,
  CURRICULUM_UNITS,
  type Tier,
} from '../telemark/curriculum';

const STATS = [
  { num: String(CURRICULUM_UNIT_COUNT),   label: 'Curriculum Units'  },
  { num: String(CURRICULUM_LESSON_COUNT), label: 'Lessons'           },
  { num: 'Java',                          label: 'Primary Language'  },
  { num: 'FTC SDK',                       label: 'Framework'         },
];

const FEATURES = [
  {
    title: 'Embedded Simulator',
    desc:  'Run lesson code against simulated FTC hardware in your browser.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="2" y="6" width="28" height="20" rx="2" stroke="#38BDF8" strokeWidth="1.5" />
        <path d="M10 14l4 4-4 4M16 22h6" stroke="#22D3EE" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Progress Tracking',
    desc:  'Sign in to save completed lessons and resume where you stopped.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M16 4L28 10V22L16 28L4 22V10L16 4Z" stroke="#38BDF8" strokeWidth="1.5" />
        <path d="M16 12v8M12 16h8" stroke="#22D3EE" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Tiered Challenges',
    desc:  'Move from guided examples to problems that require your own solution.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="16" cy="16" r="10" stroke="#38BDF8" strokeWidth="1.5" />
        <path d="M16 10v6l4 4" stroke="#22D3EE" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Open Source',
    desc:  'Read the source, adapt it for your team, or contribute a fix.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M6 26L14 6l8 12 4-6 4 14" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="26" cy="26" r="3" stroke="#22D3EE" strokeWidth="1.5" />
      </svg>
    ),
  },
];

const TIER_CLASS: Record<Tier, string> = {
  Beginner:     'tagBasic',
  Intermediate: 'tagInter',
  Advanced:     'tagAdv',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavLogo(): React.JSX.Element {
  return (
    <img
      src="/telemark/img/telemark.png"
      alt="Telemark Logo"
      style={{ width: '36px', height: '36px', borderRadius: '50%' }}
    />
  );
}

function Divider(): React.JSX.Element {
  return <div className={styles.divider} aria-hidden="true" />;
}

function Stat({ num, label }: { num: string; label: string }): React.JSX.Element {
  return (
    <div className={styles.statItem}>
      <span className={styles.statNum}>{num}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

// ─── Page sections ────────────────────────────────────────────────────────────

function HeroSection(): React.JSX.Element {
  return (
    <section className={styles.hero}>
      <div className={styles.heroBadge}>
        <span className={styles.badgeDot} aria-hidden="true" />
        <span>Student-built FTC Java curriculum</span>
      </div>

      <h1 className={styles.heroTitle}>
        <span className={styles.titleLine1}>Master FTC</span>
        <span className={styles.titleLine2}>Programming</span>
      </h1>

      <p className={styles.heroSub}>
        Student-built lessons and browser simulators for learning how FTC robots are programmed.
      </p>

      <div className={styles.terminalLine} aria-hidden="true">
        <span className={styles.terminalPrompt}>telemetry &gt;</span>
        <span>FTC Java ready </span>
        <span className={styles.cursor} />
      </div>

      <div className={styles.heroActions}>
        <Link to="/docs/unit-00/classes-and-objects" className={styles.btnPrimary}>
          Begin Unit 0
        </Link>
        <Link to="/curriculum" className={styles.btnSecondary}>
          View All Units
        </Link>
      </div>
    </section>
  );
}

function StatsBar(): React.JSX.Element {
  return (
    <div className={styles.statsBar}>
      {STATS.map((s) => (
        <Stat key={s.label} num={s.num} label={s.label} />
      ))}
    </div>
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
      <p className={styles.sectionLabel}>Curriculum</p>
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
      <h2 className={styles.sectionTitle}>Learn, test, and keep moving</h2>
      <p className={styles.sectionDesc}>
        Designed to keep the learning path practical, organized, and easy to resume.
      </p>

      <div className={styles.featuresGrid}>
        {FEATURES.map((f) => (
          <div key={f.title} className={styles.featureCard}>
            <div className={styles.featureIcon}>{f.icon}</div>
            <h3 className={styles.featureTitle}>{f.title}</h3>
            <p className={styles.featureDesc}>{f.desc}</p>
          </div>
        ))}
      </div>
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
          Begin in the browser, then choose the deployment tools that fit your team.
        </p>
        <Link to="/docs/unit-00/classes-and-objects" className={styles.btnPrimary}>
          Begin Unit 0 →
        </Link>
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
    <>
      <Head>
        <title>{siteConfig.title}</title>
        <meta
          name="description"
          content="Telemark is a student-built FTC Java curriculum with browser simulators, from setup and fundamentals through hardware, vision, and autonomous."
        />
        <meta name="telemark-build-commit" content={buildCommit} />
      </Head>
    
      {/* Google Fonts — non-blocking preconnect */}
      <link
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
        rel="stylesheet"
      />

      <main className={styles.lp}>
        {/* ── Custom navbar ── */}
        <nav className={styles.navbar} aria-label="Site navigation">
          <div className={styles.navBrand}>
            <NavLogo />
            <span className={styles.navBrandText}>Telemark</span>
          </div>

          <ul className={styles.navLinks}>
            <li><Link to="/curriculum">Curriculum</Link></li>
            <li><Link to="/simulator">Simulator</Link></li>
            <li><Link to="/search">Search</Link></li>
            <li>
              <a
                href="https://github.com/sharpfacerobotics/ftc-curriculum"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </li>
          </ul>

          {loading ? (
            <div className={styles.navAuthPlaceholder} aria-hidden="true" />
          ) : user ? (
            <div className={styles.navUser}>
              <Link to="/dashboard" className={styles.navCta}>
                Dashboard
              </Link>
              <button
                className={styles.navSignOut}
                onClick={() => signOut(auth)}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link to="/login" className={styles.navCta}>
              Sign In
            </Link>
          )}
        </nav>

        {/* ── Sections ── */}
        <HeroSection />
        <StatsBar />
        <Divider />
        <CurriculumSection signedIn={Boolean(user)} authLoading={loading} />
        <Divider />
        <SimulatorSection />
        <Divider />
        <FeaturesSection />
        <CtaSection />

        {/* ── Footer ── */}
        <footer className={styles.footer}>
          <span>
            © 2026 Telemark. Built by FTC Team Sharp Face Robotics #30450.
            {' '}Built with Docusaurus. Not affiliated with FIRST®
          </span>
        </footer>
      </main>
    </>
  );
}
