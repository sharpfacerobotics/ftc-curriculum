import React, { useEffect, useRef, useState } from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Head from '@docusaurus/Head';
import styles from './index.module.css';
import { signOut } from 'firebase/auth';
import { auth } from '../telemark/firebase';
import { useAuth } from '../telemark/useAuth';
import { trackEvent } from '../telemark/analytics';
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
    desc:  'Use the browser-based simulator alongside the lessons to test ideas and build intuition without leaving the curriculum.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="2" y="6" width="28" height="20" rx="2" stroke="#00BFFF" strokeWidth="1.5" />
        <path d="M10 14l4 4-4 4M16 22h6" stroke="#39FF14" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Progress Tracking',
    desc:  'Sign in with Google to save completed lessons, monitor progress, and return to the next unfinished page from the dashboard.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M16 4L28 10V22L16 28L4 22V10L16 4Z" stroke="#00BFFF" strokeWidth="1.5" />
        <path d="M16 12v8M12 16h8" stroke="#39FF14" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Tiered Challenges',
    desc:  'Work from guided templates into harder problems that ask you to apply the idea instead of just repeating syntax.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="16" cy="16" r="10" stroke="#00BFFF" strokeWidth="1.5" />
        <path d="M16 10v6l4 4" stroke="#39FF14" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Open Source',
    desc:  'Built on Docusaurus and published openly so teams can study it, extend it, and improve it together.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M6 26L14 6l8 12 4-6 4 14" stroke="#00BFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="26" cy="26" r="3" stroke="#39FF14" strokeWidth="1.5" />
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
  return (
    <div className={styles.divider} aria-hidden="true">
      <div className={styles.dividerLine} />
      <div className={styles.dividerDiamond} />
      <div className={styles.dividerLine} />
    </div>
  );
}

/** Counts up from 0 to a numeric target once the element enters the viewport. */
function AnimatedStat({ num, label }: { num: string; label: string }): React.JSX.Element {
  const isNumeric = !isNaN(parseInt(num, 10));
  const target    = isNumeric ? parseInt(num, 10) : 0;
  const suffix    = isNumeric ? num.replace(String(target), '') : '';

  const [display, setDisplay] = useState<string>(isNumeric ? '0' + suffix : num);
  const ref                   = useRef<HTMLDivElement>(null);
  const animated              = useRef(false);

  useEffect(() => {
    if (!isNumeric) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          const duration = 900;
          const start    = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const ease     = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(ease * target) + suffix);
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.5 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [isNumeric, target, suffix]);

  return (
    <div className={styles.statItem} ref={ref}>
      <span className={styles.statNum}>{display}</span>
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
        <span>Student-Built FTC Curriculum · Open Source</span>
      </div>

      <h1 className={styles.heroTitle}>
        <span className={styles.titleLine1}>Master FTC</span>
        <span className={styles.titleLine2}>Programming</span>
      </h1>

      <p className={styles.heroSub}>
        A structured FTC Java curriculum written by students for students.
        We start with environment setup and fundamentals, then build through hardware,
        motion control, sensors, vision, and full autonomous integration.
      </p>

      <div className={styles.terminalLine} aria-hidden="true">
        <span className={styles.terminalPrompt}>~/ftc $</span>
        <span>git clone https://github.com/sharpfacerobotics/telemark </span>
        <span className={styles.cursor} />
      </div>

      <div className={styles.heroActions}>
        <Link to="/docs/unit-01/prerequisites" className={styles.btnPrimary}>
          Begin Unit 1
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
        <AnimatedStat key={s.label} num={s.num} label={s.label} />
      ))}
    </div>
  );
}

function CurriculumSection(): React.JSX.Element {
  return (
    <section className={styles.section} id="curriculum">
      <p className={styles.sectionLabel}>// curriculum.units[]</p>
      <h2 className={styles.sectionTitle}>{CURRICULUM_UNIT_COUNT} Structured Units. One Clear Path.</h2>
      <p className={styles.sectionDesc}>
        Each unit builds on the last, and the lesson order on the site matches the sequence we would use when teaching a new teammate.
      </p>

      <div className={styles.curriculumGrid}>
        {CURRICULUM_UNITS.map((unit) => (
          <Link
            to={unit.overviewPath}
            key={unit.id}
            className={styles.unitCard}
          >
            <div className={styles.unitNum}>{unit.label}</div>
            <div className={styles.unitTitle}>{unit.title}</div>
            <div className={styles.unitDesc}>{unit.desc}</div>
            <span className={`${styles.unitTag} ${styles[TIER_CLASS[unit.tier]]}`}>
              {unit.tier}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function FeaturesSection(): React.JSX.Element {
  return (
    <section className={styles.section}>
      <p className={styles.sectionLabel}>// platform.features[]</p>
      <h2 className={styles.sectionTitle}>Built for Real Learning</h2>
      <p className={styles.sectionDesc}>
        The platform is designed to keep the learning path practical, organized,
        and easy to pick back up between meetings.
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
  const simulatorRef = useRef<HTMLDivElement>(null);
  const launchTrackedRef = useRef(false);

  const openFullscreen = () => {
    if (document.fullscreenElement === simulatorRef.current) {
      document.exitFullscreen();
      return;
    }
    simulatorRef.current?.requestFullscreen();
    trackEvent('simulator_fullscreen', { simulator: 'homepage_navigator' });
  };

  const trackLaunch = () => {
    if (launchTrackedRef.current) return;
    launchTrackedRef.current = true;
    trackEvent('simulator_launch', { simulator: 'homepage_navigator' });
  };

  return (
    <section className={styles.section}>
      <p className={styles.sectionLabel}>// simulator.live[]</p>
      <h2 className={styles.sectionTitle}>Try It Right Now</h2>
      <p className={styles.sectionDesc}>
        Open the simulator in the browser and experiment with robot behavior while you work through the lessons.
      </p>
      <div className={styles.simulatorToolbar}>
        <button
          type="button"
          className={styles.simulatorToolbarButton}
          onClick={openFullscreen}
        >
          <i className="fa-solid fa-expand" aria-hidden="true" />
          Fullscreen Simulator
        </button>
      </div>
      <div className={styles.simulatorWrapper} ref={simulatorRef}>
        <iframe
          src="/telemark/simulator/navigator.html"
          allowFullScreen
          allow="fullscreen"
          title="Telemark Simulator"
          scrolling="yes"
          onLoad={trackLaunch}
        />
      </div>
    </section>
  );
}

function CtaSection(): React.JSX.Element {
  return (
    <div className={styles.ctaSection}>
      <div className={styles.ctaBox}>
        <p className={styles.sectionLabel} style={{ marginBottom: '1.5rem' }}>
          // start.here
        </p>
        <h2 className={styles.ctaTitle}>
          Start with the fundamentals.<br />Build toward competition.
        </h2>
        <p className={styles.ctaSub}>
          Begin with Unit 1. We will get the toolchain working first, then move step by step into hardware, control systems, vision, and advanced autonomous routines.
        </p>
        <Link to="/docs/unit-01/prerequisites" className={styles.btnPrimary}>
          Begin Unit 1 →
        </Link>
      </div>
    </div>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

export default function Home(): React.JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  const { user } = useAuth();

  return (
    <>
      <Head>
        <title>{siteConfig.title}</title>
        <meta
          name="description"
          content="Telemark by EHS Robotics — an open-source FTC Java curriculum built by students, covering environment setup, hardware, sensors, control, vision, and advanced autonomous systems."
        />
      </Head>
    
      {/* Google Fonts — non-blocking preconnect */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&family=Exo+2:wght@300;400;600;700&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
        rel="stylesheet"
      />

      <main className={styles.lp}>
        {/* ── Decorative chrome ── */}
        <div className={styles.gridBg}   aria-hidden="true" />
        <div className={styles.scanline} aria-hidden="true" />
        <div className={`${styles.cornerAccent} ${styles.tl}`} aria-hidden="true" />
        <div className={`${styles.cornerAccent} ${styles.tr}`} aria-hidden="true" />
        <div className={`${styles.cornerAccent} ${styles.bl}`} aria-hidden="true" />
        <div className={`${styles.cornerAccent} ${styles.br}`} aria-hidden="true" />

        {/* ── Custom navbar ── */}
        <nav className={styles.navbar} aria-label="Site navigation">
          <div className={styles.navBrand}>
            <NavLogo />
            <span className={styles.navBrandText}>Telemark</span>
          </div>

          <ul className={styles.navLinks}>
            <li><Link to="/curriculum">Curriculum</Link></li>
            <li><Link to="/simulator">Simulator</Link></li>
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

          {user ? (
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
        <CurriculumSection />
        <Divider />
        <SimulatorSection />
        <Divider />
        <FeaturesSection />
        <CtaSection />

        {/* ── Footer ── */}
        <footer className={styles.footer}>
          <span>TEAM 30450 · TELEMARK · OPEN SOURCE</span>
          <span className={styles.footerRight}>BUILT WITH DOCUSAURUS V3</span>
        </footer>
      </main>
    </>
  );
}
