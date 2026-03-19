import React, { useEffect, useRef, useState } from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, provider } from '../telemark/firebase';
import { useAuth } from '../telemark/useAuth';

// ─── Data ─────────────────────────────────────────────────────────────────────

type Tier = 'Beginner' | 'Intermediate' | 'Advanced';

interface Unit {
  id: string;
  title: string;
  desc: string;
  tier: Tier;
  slug: string;
}

const UNITS: Unit[] = [
  { id: 'UNIT_01', title: 'Choosing Your Tool',        desc: 'Blocks vs OnBot Java vs Android Studio',     tier: 'Beginner',     slug: 'unit-01' },
  { id: 'UNIT_02', title: 'OpMode Structure',           desc: 'Annotations, init(), loop() lifecycle',      tier: 'Beginner',     slug: 'unit-02' },
  { id: 'UNIT_03', title: 'Java Variables',             desc: 'int, double, boolean, String types',         tier: 'Beginner',     slug: 'unit-03' },
  { id: 'UNIT_04', title: 'Gamepad Input',              desc: 'Reading buttons, joysticks & triggers',      tier: 'Beginner',     slug: 'unit-04' },
  { id: 'UNIT_05', title: 'Logic & Decisions',          desc: 'if / else if / else chains',                 tier: 'Beginner',     slug: 'unit-05' },
  { id: 'UNIT_06', title: 'Loops & Iteration',          desc: 'while, for, opModeIsActive()',               tier: 'Beginner',     slug: 'unit-06' },
  { id: 'UNIT_07', title: 'Hardware Mapping',           desc: 'hardwareMap.get() and configuration',        tier: 'Intermediate', slug: 'unit-07' },
  { id: 'UNIT_08', title: 'DC Motor Control',           desc: 'setPower, direction, ZeroPowerBehavior',     tier: 'Intermediate', slug: 'unit-08' },
  { id: 'UNIT_09', title: 'Servo Control',              desc: 'Position, scaleRange, direction',            tier: 'Intermediate', slug: 'unit-09' },
  { id: 'UNIT_10', title: 'Encoders & Precision',       desc: 'Tick counts, RunMode, RUN_TO_POSITION',      tier: 'Intermediate', slug: 'unit-10' },
  { id: 'UNIT_11', title: 'Digital & Analog Sensors',   desc: 'Touch sensors, potentiometers, Range.scale', tier: 'Intermediate', slug: 'unit-11' },
  { id: 'UNIT_12', title: 'IMU & Rotation',             desc: 'Yaw, pitch, roll, AngleUnit',                tier: 'Intermediate', slug: 'unit-12' },
  { id: 'UNIT_13', title: 'OOP & Inheritance',          desc: 'Classes, objects, extends, @Override',       tier: 'Advanced',     slug: 'unit-13' },
  { id: 'UNIT_14', title: 'Computer Vision',            desc: 'AprilTags, VisionPortal, detections',        tier: 'Advanced',     slug: 'unit-14' },
  { id: 'UNIT_15', title: 'Advanced Integration',       desc: 'Limelight, Pedro Pathing, Bézier curves',   tier: 'Advanced',     slug: 'unit-15' },
];

const STATS = [
  { num: '15',      label: 'Curriculum Units'  },
  { num: '45+',     label: 'Practice Problems' },
  { num: 'Java',    label: 'Primary Language'  },
  { num: 'FTC SDK', label: 'Framework'         },
];

const FEATURES = [
  {
    title: 'Embedded Simulator',
    desc:  'Run FTC code directly in your browser via the Virtual Robot Simulator. No setup, no Android Studio required to start practising.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="2" y="6" width="28" height="20" rx="2" stroke="#00BFFF" strokeWidth="1.5" />
        <path d="M10 14l4 4-4 4M16 22h6" stroke="#39FF14" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Gated Progression',
    desc:  'Each unit is locked behind a validation code. Solve the challenge, enter the code, unlock the next level — just like FTC scoring.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M16 4L28 10V22L16 28L4 22V10L16 4Z" stroke="#00BFFF" strokeWidth="1.5" />
        <path d="M16 12v8M12 16h8" stroke="#39FF14" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Tiered Challenges',
    desc:  'Simple fill-in-the-blank templates to build confidence, followed by hard problems that require real understanding to solve.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="16" cy="16" r="10" stroke="#00BFFF" strokeWidth="1.5" />
        <path d="M16 10v6l4 4" stroke="#39FF14" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Open Source',
    desc:  'Built on Docusaurus, hosted on GitHub Pages. Fork it, contribute lessons, and help other FTC teams across the world.',
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
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-label="EHS hex logo">
      <path
        d="M18 2L32 10V26L18 34L4 26V10L18 2Z"
        stroke="url(#navGrad)"
        strokeWidth="1.5"
        fill="rgba(0,191,255,0.05)"
      />
      <text
        x="18" y="22"
        textAnchor="middle"
        fontFamily="Rajdhani, sans-serif"
        fontWeight="700"
        fontSize="11"
        fill="#00BFFF"
      >
        EHS
      </text>
      <defs>
        <linearGradient id="navGrad" x1="4" y1="2" x2="32" y2="34">
          <stop stopColor="#00BFFF" />
          <stop offset="1" stopColor="#39FF14" />
        </linearGradient>
      </defs>
    </svg>
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
        <span>FTC Season 2025–2026 · Open Source</span>
      </div>

      <h1 className={styles.heroTitle}>
        <span className={styles.titleLine1}>Master FTC</span>
        <span className={styles.titleLine2}>Programming</span>
      </h1>

      <p className={styles.heroSub}>
        A structured, level-gated curriculum built by student engineers.
        From Blocks to Bézier curves — every concept hands-on, every unit
        unlocked by proof of understanding.
      </p>

      <div className={styles.terminalLine} aria-hidden="true">
        <span className={styles.terminalPrompt}>~/ftc $</span>
        <span>git clone ehs-robotics/ftc-curriculum</span>
        <span className={styles.cursor} />
      </div>

      <div className={styles.heroActions}>
        <Link to="/docs/unit-01/choosing-your-tool" className={styles.btnPrimary}>
          Begin Unit 1
        </Link>
        <Link to="/docs/intro" className={styles.btnSecondary}>
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
    <section className={styles.section}>
      <p className={styles.sectionLabel}>// curriculum.units[]</p>
      <h2 className={styles.sectionTitle}>15 Units. Zero Fluff.</h2>
      <p className={styles.sectionDesc}>
        Each unit gates the next. Submit the correct validation code to advance
        — just like FTC auto-scores.
      </p>

      <div className={styles.curriculumGrid}>
        {UNITS.map((unit) => (
          <Link
            to={`/docs/${unit.slug}/intro`}
            key={unit.id}
            className={styles.unitCard}
          >
            <div className={styles.unitNum}>{unit.id}</div>
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
        Not just another tutorial site. Every feature exists to make you a
        better FTC programmer.
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

function CtaSection(): React.JSX.Element {
  return (
    <div className={styles.ctaSection}>
      <div className={styles.ctaBox}>
        <p className={styles.sectionLabel} style={{ marginBottom: '1.5rem' }}>
          // ready.to.build?
        </p>
        <h2 className={styles.ctaTitle}>
          Your robot won't<br />program itself.
        </h2>
        <p className={styles.ctaSub}>
          Start with Unit 1 — no prior programming experience required. By
          Unit 15, you'll be writing autonomous routines with Bézier curve
          pathing.
        </p>
        <Link to="/docs/unit-01/choosing-your-tool" className={styles.btnPrimary}>
          Launch Unit 1 →
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
    <Layout
      title={siteConfig.title}
      description="Telemark by EHS Robotics — level-gated, open source, built by students."
      noFooter
    >
      {/* Google Fonts — non-blocking preconnect */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&family=Exo+2:wght@300;400;600;700&display=swap"
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
            <span className={styles.navBrandText}>EHS Robotics</span>
          </div>

          <ul className={styles.navLinks}>
            <li><Link to="/docs/intro">Curriculum</Link></li>
            <li><Link to="/docs/simulator">Simulator</Link></li>
            <li>
              <a
                href="https://github.com/sharpfacerobotics/ftc-curriculum"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </li>
            <li><Link to="/docs/team">Team</Link></li>
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
        <FeaturesSection />
        <CtaSection />

        {/* ── Footer ── */}
        <footer className={styles.footer}>
          <span>EHS ROBOTICS · TELEMARK · OPEN SOURCE</span>
          <span className={styles.footerRight}>BUILT WITH DOCUSAURUS V3</span>
        </footer>
      </main>
    </Layout>
  );
}