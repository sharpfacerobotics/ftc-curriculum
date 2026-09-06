import React, {useState} from 'react';
import Link from '@docusaurus/Link';
import BrowserOnly from '@docusaurus/BrowserOnly';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useColorMode} from '@docusaurus/theme-common';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import {TOOL_CATALOG} from '@site/src/components/mechanical/toolCatalog';
import WhatsNew from '@site/src/components/ui/WhatsNew';
import styles from './index.module.css';
import AuthenticatedSimulatorNavigator from '../components/AuthenticatedSimulatorNavigator';
import SimulatorWorkflow from '../components/SimulatorWorkflow';
import {
  CURRICULUM_LESSON_COUNT,
  CURRICULUM_UNIT_COUNT,
  CURRICULUM_UNITS,
  type CurriculumUnit,
  type Tier,
} from '../telemark/curriculum';
import {
  MECHANICAL_LESSON_COUNT,
  MECHANICAL_UNITS,
  MECHANICAL_UNIT_COUNT,
} from '../telemark/mechanical';
import {
  BLOCKS_LESSON_COUNT,
} from '../telemark/blocksCurriculum';
import {TOTAL_LESSON_COUNT, TOTAL_UNIT_COUNT} from '../telemark/tracks';
import CountUp from '@site/src/components/vendor/reactbits/CountUp';
import SpotlightCard from '@site/src/components/vendor/reactbits/SpotlightCard';

const MOBILE_CURRICULUM_PREVIEW_COUNT = 4;

const TIER_CLASS: Record<Tier, string> = {
  Beginner:     'tagBasic',
  Intermediate: 'tagInter',
  Advanced:     'tagAdv',
};

const BLOCKS_FOUNDATION_CARD: CurriculumUnit = {
  id: 'BLOCKS_FOUNDATIONS',
  label: 'Blocks',
  title: 'Programming Foundations',
  desc: 'Learn variables, decisions, loops, functions, lists, and debugging before Java.',
  tier: 'Beginner',
  slug: 'blocks',
  overviewPath: '/blocks',
  startPath: '/blocks/blocks-unit-00/workspace-and-run-controls',
  nextPath: '/docs/unit-00',
  nextLabel: 'Java Unit 0',
  lessonCount: BLOCKS_LESSON_COUNT,
  overview: 'Six block-coding units that prepare a new programmer for the Java curriculum.',
  outcomes: [],
};

const SOFTWARE_HOME_UNITS = [BLOCKS_FOUNDATION_CARD, ...CURRICULUM_UNITS];

// ─── Sub-components ───────────────────────────────────────────────────────────

function Divider(): React.JSX.Element {
  return <div className={styles.divider} aria-hidden="true" />;
}

// ─── Page sections ────────────────────────────────────────────────────────────

/** A few tools that show the range, not a catalogue dump. */
/** Screenshots of the actual tools and pages, not mockups. */
const SHOWCASE = [
  {image: 'img/showcase/slide-calculator.jpg', text: 'Linear slide sizing', url: '/simulator#slide', height: 520,
   alt: 'The linear slide calculator, with extension, spool diameter and cable force filled in.'},
  {image: 'img/showcase/unit-8-2-simulator.jpg', text: 'Unit 8.2 simulator', url: '/docs/unit-08/set-direction', height: 660,
   alt: 'The Unit 8.2 simulator: a mecanum drivetrain in a 3D field, the checklist of requirements it has to meet, the OpMode being written, and a gamepad.'},
  {image: 'img/showcase/unit-2-mastery.jpg', text: 'Unit 2 mastery challenge', url: '/docs/unit-02/mastery-coding-challenge', height: 600,
   alt: 'The Unit 2 mastery challenge: a competition TeleOp being written against seven checks, with the team\u2019s own CAD robot in the field beside it.'},
  {image: 'img/showcase/unit-6-mastery.jpg', text: 'Autonomous, without sleep', url: '/docs/unit-06/mastery-coding-challenge', height: 580,
   alt: 'The Unit 6 mastery challenge: a non-blocking autonomous LinearOpMode, with FTC team 17438\u2019s imported robot in the field.'},
  {image: 'img/showcase/cad-check.jpg', text: 'CAD file check', url: '/simulator#cad-check', height: 620,
   alt: 'The CAD check reporting measured wall thickness and hole sizes from an uploaded STEP file.'},
  {image: 'img/showcase/arm-simulator.jpg', text: 'Arm simulator', url: '/simulator#arm-sim', height: 560,
   alt: 'The arm simulator running a time-stepped arm and plotting whether it holds.'},
  {image: 'img/showcase/gear-ratio.jpg', text: 'Gear ratio', url: '/simulator#arm-torque', height: 480,
   alt: 'The gear ratio calculator working a reduction from a required output torque.'},
  {image: 'img/showcase/beam-deflection.jpg', text: 'Beam deflection', url: '/simulator', height: 600,
   alt: 'The beam deflection calculator showing how far a given extrusion sags under load.'},
  {image: 'img/showcase/weight-budget.jpg', text: 'Weight budget', url: '/simulator#weight', height: 500,
   alt: 'The weight budget, with the robot mass split across named subsystems.'},
  {image: 'img/showcase/lesson.jpg', text: 'A lesson', url: '/docs/unit-00/classes-and-objects', height: 640,
   alt: 'A lesson page, with the explanation running beside a worked example.'},
  {image: 'img/showcase/cad-practice.jpg', text: 'CAD practice', url: '/mechanical/module-00/design-cycle', height: 540,
   alt: 'A CAD practice exercise stating the dimensions a submitted model has to hit.'},
];

const HOME_TOOLS = [
  {name: 'CAD file check', path: '/simulator#cad-check', desc: 'Upload a STEP or STL export and compare its measured geometry with the exercise requirements.'},
  {name: 'Arm gravity torque', path: '/simulator#arm-torque', desc: 'Calculate the torque at the arm\u2019s worst angle and the reduction needed to supply it.'},
  {name: 'Linear slide sizing', path: '/simulator#slide', desc: 'Check extension, spool diameter, and cable force for a proposed slide.'},
  {name: 'Arm simulator', path: '/simulator#arm-sim', desc: 'Run a time-stepped arm with your measurements and inspect its motion and load.'},
  {name: 'Tap drill and clearance', path: '/simulator#tap-drill', desc: 'Look up standard tap-drill and clearance-hole sizes.'},
  {name: 'Weight budget', path: '/simulator#weight', desc: 'Assign and track the robot\u2019s mass by subsystem.'},
];

/** The product reel sits beside the copy, like Chrome's wide hero demo. */
function HeroVideo(): React.JSX.Element {
  const darkSrc = useBaseUrl('/video/telemark-hero.mp4');
  const lightSrc = useBaseUrl('/video/telemark-hero-light.mp4');
  const {colorMode} = useColorMode();
  const src = colorMode === 'light' ? lightSrc : darkSrc;
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const playbackPositionRef = React.useRef(0);
  const playbackSourceRef = React.useRef('');

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const resumeAt = playbackPositionRef.current;

    const resumePlayback = () => {
      video.muted = true;
      if (resumeAt > 0 && Number.isFinite(video.duration)) {
        video.currentTime = Math.min(resumeAt, Math.max(0, video.duration - 0.1));
      }
      playbackSourceRef.current = video.currentSrc;
      void video.play().catch(() => {
        // The autoplay attribute remains the fallback if a browser delays play.
      });
    };

    video.addEventListener('loadedmetadata', resumePlayback, {once: true});
    video.load();
    return () => video.removeEventListener('loadedmetadata', resumePlayback);
  }, [src]);

  const rememberPlaybackPosition = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    if (video.currentSrc === playbackSourceRef.current) {
      playbackPositionRef.current = video.currentTime;
    }
  };

  return (
    <div className={styles.heroVideoFrame}>
      <video
        ref={videoRef}
        className={styles.heroVideo}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        onTimeUpdate={rememberPlaybackPosition}
        aria-label="Telemark curriculum and robot simulator preview"
      >
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );
}

function HeroSection(): React.JSX.Element {
  return (
    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <div className={styles.heroBadge}>
          <span className={styles.badgeDot} aria-hidden="true" />
          <span>Student-built FTC software and mechanical curriculum</span>
        </div>

        <h1 className={styles.heroTitle}>
          <span className={styles.titleLine1}>Master FTC</span>
          <span className={styles.titleLine2}>Robotics</span>
        </h1>

        <p className={styles.heroSub}>
          Learn to program an FTC robot and run your code in the browser, or learn
          to design one and check your numbers before you build.
        </p>

        <div className={styles.heroActions}>
          <Link to="/docs/unit-00/classes-and-objects" className={styles.btnPrimary}>
            Begin Software
          </Link>
          <Link to="/mechanical/module-00/design-cycle" className={styles.btnTrackAlt}>
            Begin Mechanical
          </Link>
        </div>
      </div>

      <HeroVideo />
    </section>
  );
}

const FIGURES = [
  {value: TOTAL_LESSON_COUNT, label: 'Lessons', count: true},
  {value: TOTAL_UNIT_COUNT, label: 'Units and modules', count: true},
  {value: TOOL_CATALOG.length, label: 'Calculators and checks', count: true},
];

/**
 * The size of the thing, in figures.
 *
 * This was one sentence with the lesson count buried in it, which is a hard
 * way to answer the only question a visitor has in the first few seconds:
 * whether there is enough here to be worth starting.
 */
function StatsBar(): React.JSX.Element {
  return (
    <div className={styles.figures}>
      <div className={styles.figureRow}>
      {FIGURES.map((figure) => (
        <div key={figure.label} className={styles.figure}>
          <span className={styles.figureValue}>
            <BrowserOnly fallback={<>{figure.value}</>}>
              {() => <CountUp to={figure.value} duration={1.1} />}
            </BrowserOnly>
          </span>
          <span className={styles.figureLabel}>{figure.label}</span>
        </div>
      ))}
      </div>
      <p className={styles.figuresNote}>
        Practice FTC Java in browser simulators and check mechanical designs
        with focused calculators.
      </p>
    </div>
  );
}

function CurriculumSection({
  units,
  label,
  id,
  heading,
  blurb,
  stat,
}: {
  units: CurriculumUnit[];
  label: string;
  id: string;
  heading: string;
  blurb: string;
  /** The track's size, which the removed tracks section used to carry. */
  stat: string;
}): React.JSX.Element {
  const [showAllMobile, setShowAllMobile] = useState(false);

  return (
    <section className={styles.section} id={id}>
      <p className={styles.sectionLabel}>{label}</p>
      <h2 className={styles.sectionTitle}>{heading}</h2>
      <p className={styles.sectionDesc}>{blurb}</p>
      <p className={styles.trackStat}>{stat}</p>

      <div className={styles.curriculumGrid} id={`${id}-curriculum-list`}>
        {units.map((unit, index) => {
          const cardContent = (
            <>
            <div className={styles.unitNum}>{unit.label}</div>
            <div className={styles.unitTitle}>{unit.title}</div>
            <span className={`${styles.unitTag} ${styles[TIER_CLASS[unit.tier]]}`}>
              {unit.tier}
            </span>
            <div className={styles.unitDesc}>{unit.desc}</div>
            </>
          );

          return (
            <Link
              to={unit.overviewPath}
              key={unit.id}
              className={`${styles.unitCard} ${
                index >= MOBILE_CURRICULUM_PREVIEW_COUNT && !showAllMobile
                  ? styles.mobileCurriculumExtra
                  : ''
              }`}
            >
              {cardContent}
            </Link>
          );
        })}
      </div>
      {units.length > MOBILE_CURRICULUM_PREVIEW_COUNT && (
        <button
          type="button"
          className={styles.mobileCurriculumToggle}
          aria-expanded={showAllMobile}
          aria-controls={`${id}-curriculum-list`}
          onClick={() => setShowAllMobile((current) => !current)}
        >
          {showAllMobile ? 'Show fewer' : `Show all ${units.length}`}
        </button>
      )}
    </section>
  );
}

/**
 * The small rounded tile that marks a feature.
 *
 * A heading on its own gives a reader nothing to aim at when they are skimming
 * a long page; the tile is the thing the eye lands on first.
 */
function FeatureMark({tone, children}: {tone: string; children: React.ReactNode}): React.JSX.Element {
  return (
    <span className={styles.featureMark} data-tone={tone} aria-hidden="true">
      {children}
    </span>
  );
}

/**
 * A screenshot beside the copy that describes it.
 *
 * The two feature sections explained a simulator and a set of calculators
 * without ever showing one, so the only picture of either was the wall of
 * gallery tiles further down the page.
 */
function FeatureShot({
  src,
  alt,
  caption,
  width = 1100,
  height = 726,
}: {
  src: string;
  alt: string;
  caption: string;
  width?: number;
  height?: number;
}): React.JSX.Element {
  const base = useBaseUrl('/').replace(/\/$/, '');
  return (
    <figure className={styles.featureShot}>
      <img src={`${base}/${src}`} alt={alt} loading="lazy" decoding="async" width={width} height={height} />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

function SimulatorSection(): React.JSX.Element {
  return (
    <section className={styles.section}>
      <div className={styles.featureRow}>
        <div>
          <FeatureMark tone="blue">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="8 6 3 12 8 18" />
              <polyline points="16 6 21 12 16 18" />
            </svg>
          </FeatureMark>
          <p className={styles.sectionLabel}>Browser simulator</p>
          <h2 className={styles.sectionTitle}>Run Java in the browser</h2>
          <p className={styles.sectionDesc}>
            Write and run each lesson's code against simulated hardware. Use
            telemetry and requirement checks to find mistakes before testing
            on the robot.
          </p>
        </div>
        <FeatureShot
          src="img/showcase/unit-6-mastery-homepage.png"
          alt="The Unit 6 coding challenge open beside FTC Team 17438's simulated robot and gamepad."
          caption="A complete FTC Java challenge, running against a team's own CAD robot."
          width={1672}
          height={941}
        />
      </div>
      <SimulatorWorkflow
        className={styles.simulatorWorkflow}
        itemClassName={styles.simulatorStep}
        taskClassName={styles.simulatorTasks}
      />
      <p className={styles.simulatorLimit}>
        Use a physical robot to verify wiring, motor direction, friction, and
        final tuning that the browser cannot model.
      </p>
      <AuthenticatedSimulatorNavigator
        simulatorId="homepage_navigator"
        wrapperClassName={styles.simulatorWrapper}
        toolbarClassName={styles.simulatorToolbar}
        toolbarButtonClassName={styles.simulatorToolbarButton}
      />
    </section>
  );
}

/**
 * The mechanical counterpart to the simulator section.
 *
 * The software track had a section showing what you can actually do in the
 * browser and the mechanical track had none, so the page implied one track was
 * interactive and the other was reading. Both halves run something.
 */
function ToolsSection(): React.JSX.Element {
  return (
    <section className={styles.section} id="tools">
      <div className={`${styles.featureRow} ${styles.featureRowFlip}`}>
        <div>
          <FeatureMark tone="amber">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21v-4L15 5l4 4L7 21H3z" />
              <path d="M14 6l4 4" />
            </svg>
          </FeatureMark>
          <p className={styles.sectionLabel}>Design tools</p>
          <h2 className={styles.sectionTitle}>Check the design before you cut</h2>
          <p className={styles.sectionDesc}>
            Use {TOOL_CATALOG.length} calculators to check mechanism dimensions
            and loads. The CAD check measures an exported model against the
            exercise requirements.
          </p>
        </div>
        <FeatureShot
          src="img/showcase/cad-check.jpg"
          alt="The CAD check reporting measured wall thickness and hole sizes from an uploaded file."
          caption="The CAD check, measuring an exported STEP file against the exercise."
        />
      </div>

      <div className={styles.toolStrip}>
        {HOME_TOOLS.slice(0, 4).map((tool) => (
          <SpotlightCard
            key={tool.path}
            className={styles.toolCard}
            spotlightColor="rgba(34, 211, 238, 0.12)"
          >
            <Link to={tool.path} className={styles.toolLink}>
              <span className={styles.toolName}>{tool.name}</span>
              <span className={styles.toolDesc}>{tool.desc}</span>
            </Link>
          </SpotlightCard>
        ))}
      </div>

      <p className={styles.toolLimit}>
        Calculators check the design arithmetic. Test grip, friction, and game
        element behavior with a physical prototype.
      </p>

      <div className={styles.heroActions}>
        <Link to="/simulator#cad-check" className={styles.btnTrackAlt}>
          Open the CAD check
        </Link>
      </div>
    </section>
  );
}

function ShowcaseSection(): React.JSX.Element {
  const base = useBaseUrl('/').replace(/\/$/, '');
  const items = SHOWCASE.map((shot) => ({
    id: shot.image,
    img: `${base}/${shot.image}`,
    url: shot.url,
    height: shot.height,
    alt: shot.alt,
    caption: shot.text,
  }));

  return (
    <section className={styles.section} id="showcase">
      <p className={styles.sectionLabel}>Inside</p>
      <h2 className={styles.sectionTitle}>See the curriculum and tools</h2>
      <p className={styles.sectionDesc}>
        Open any screenshot to use the lesson, simulator, calculator, or CAD
        exercise shown.
      </p>

      <div className={styles.gallery}>
        <BrowserOnly
          fallback={
            <div className={styles.galleryFallback}>
              {SHOWCASE.slice(0, 4).map((shot) => (
                <img
                  key={shot.image}
                  className={styles.showcaseFallback}
                  src={`${base}/${shot.image}`}
                  alt={shot.alt}
                  loading="lazy"
                />
              ))}
            </div>
          }
        >
          {() => {
            const Masonry =
              require('@site/src/components/vendor/reactbits/Masonry').default;
            return (
              <Masonry
                items={items}
                LinkComponent={Link}
                duration={0.5}
                stagger={0.04}
                columnCounts={[3, 3, 2, 2]}
              />
            );
          }}
        </BrowserOnly>
      </div>
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
          <Link to="/mechanical/module-00/design-cycle" className={styles.btnTrackAlt}>
            Begin Module 0 →
          </Link>
        </div>
      </div>
    </div>
  );
}

/** A full-width ground for one section. */
function Band({tint, children}: {tint?: boolean; children: React.ReactNode}): React.JSX.Element {
  return (
    <div className={tint ? `${styles.band} ${styles.bandTint}` : styles.band}>
      {children}
    </div>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

export default function Home(): React.JSX.Element {
  const { siteConfig } = useDocusaurusContext();
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

      {/* Font Awesome is used by the simulator controls. */}
      <link
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
        rel="stylesheet"
      />

      <main className={styles.lp}>
        <HeroSection />

        {/* Only renders for somebody who has been here before, and only when
            something has changed since; a first visit shows nothing. It carries
            its own ground rather than sitting in a Band, so the page does not
            keep an empty tinted strip for everyone it has nothing to say to. */}
        <WhatsNew />

        {/* Sections sit on alternating grounds rather than being separated by
            hairlines. A rule between two identical backgrounds says only that
            something ended; a change of ground says what the next thing is. */}
        <Band tint>
          <StatsBar />
        </Band>

        <Band>
          <CurriculumSection
            units={SOFTWARE_HOME_UNITS}
            label="Software track"
            id="curriculum"
            heading={`Blocks foundations and ${CURRICULUM_UNIT_COUNT} Java units`}
            blurb="Start with Blocks if you are new to programming. If you already know variables, conditions, and loops, begin with Java Unit 0."
            stat={`${BLOCKS_LESSON_COUNT + CURRICULUM_LESSON_COUNT} software lessons`}
          />
        </Band>

        <Band tint>
          <CurriculumSection
            units={MECHANICAL_UNITS}
            label="Mechanical track"
            id="mechanical"
            heading={`${MECHANICAL_UNIT_COUNT} modules from first sketch to competition`}
            blurb="Learn the design process, CAD, materials, power transmission, fabrication, testing, and competition maintenance."
            stat={`${MECHANICAL_UNIT_COUNT} modules · ${MECHANICAL_LESSON_COUNT} lessons`}
          />
        </Band>

        <Band>
          <SimulatorSection />
        </Band>

        <Band tint>
          <ToolsSection />
        </Band>

        <Band>
          <ShowcaseSection />
        </Band>

        <Band tint>
          <CtaSection />
        </Band>
      </main>
    </Layout>
  );
}
