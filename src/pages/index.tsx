import React, {useState} from 'react';
import Link from '@docusaurus/Link';
import BrowserOnly from '@docusaurus/BrowserOnly';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import {TOOL_CATALOG} from '@site/src/components/mechanical/toolCatalog';
import styles from './index.module.css';
import AuthenticatedSimulatorNavigator from '../components/AuthenticatedSimulatorNavigator';
import SimulatorWorkflow from '../components/SimulatorWorkflow';
import {
  CURRICULUM_LESSON_COUNT,
  CURRICULUM_UNIT_COUNT,
  CURRICULUM_UNITS,
  type Tier,
} from '../telemark/curriculum';
import {
  MECHANICAL_LESSON_COUNT,
  MECHANICAL_UNITS,
  MECHANICAL_UNIT_COUNT,
} from '../telemark/mechanical';
import {TOTAL_LESSON_COUNT} from '../telemark/tracks';
import CountUp from '@site/src/components/vendor/reactbits/CountUp';
import SpotlightCard from '@site/src/components/vendor/reactbits/SpotlightCard';

const MOBILE_CURRICULUM_PREVIEW_COUNT = 4;

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

/** A few tools that show the range, not a catalogue dump. */
/** Screenshots of the actual tools and pages, not mockups. */
const SHOWCASE = [
  {image: 'img/showcase/slide-calculator.jpg', text: 'Linear slide sizing', url: '/simulator#slide', height: 520,
   alt: 'The linear slide calculator, with extension, spool diameter and cable force filled in.'},
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
  {name: 'CAD file check', path: '/simulator#cad-check', desc: 'Drop in a STEP or STL export and see which of the exercise\u2019s numbers your model actually hit.'},
  {name: 'Arm gravity torque', path: '/simulator#arm-torque', desc: 'Work the torque an arm needs at its worst angle, then the reduction that delivers it.'},
  {name: 'Linear slide sizing', path: '/simulator#slide', desc: 'Extension, spool diameter, and the force the cable really carries.'},
  {name: 'Arm simulator', path: '/simulator#arm-sim', desc: 'Run a time-stepped arm against your own numbers and watch it fail or hold.'},
  {name: 'Tap drill and clearance', path: '/simulator#tap-drill', desc: 'The hole sizes that stop a screw binding, straight from the standards.'},
  {name: 'Weight budget', path: '/simulator#weight', desc: 'Spend the robot\u2019s mass on purpose instead of discovering it at inspection.'},
];

const HERO_SHOTS = [
  {image: 'img/showcase/arm-simulator.jpg', url: '/simulator#arm-sim',
   alt: 'The arm simulator running, with telemetry beside the simulated arm.', label: 'Simulator'},
  {image: 'img/showcase/cad-check.jpg', url: '/simulator#cad-check',
   alt: 'The CAD check measuring an uploaded STEP file against an exercise.', label: 'CAD check'},
  {image: 'img/showcase/lesson.jpg', url: '/docs/unit-00/classes-and-objects',
   alt: 'A lesson page, with the explanation beside a worked example.', label: 'A lesson'},
  {image: 'img/showcase/slide-calculator.jpg', url: '/simulator#slide',
   alt: 'The linear slide calculator, with extension and cable force worked out.', label: 'Calculators'},
  {image: 'img/showcase/cad-practice.jpg', url: '/mechanical/module-00/design-cycle',
   alt: 'A CAD exercise stating the dimensions a submitted model has to hit.', label: 'CAD practice'},
];

/**
 * True once the viewport matches, false on the server and on first paint.
 *
 * The accordion needs room to be an accordion: below its own breakpoint it
 * stacks its panels into a column, which on a phone is taller than the screen
 * the hero has to fit inside.
 */
function useWide(query: string): boolean {
  const [wide, setWide] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [query]);
  return wide;
}

/**
 * The three screenshots that open the page.
 *
 * They render as ordinary images in the served HTML and are animated after,
 * so the pictures are there whether or not the script arrives.
 */
function HeroShots(): React.JSX.Element {
  const base = useBaseUrl('/').replace(/\/$/, '');
  // A hook, at the top of the component. This lived inside the BrowserOnly
  // render prop, which runs as part of BrowserOnly's own render: the hook count
  // changed between the hydration pass and the one after it, and the panels
  // came out inert, with a click following the anchor instead of running the
  // handler that should have caught it.
  const wide = useWide('(min-width: 700px)');

  const grid = (
    <div className={styles.heroShots}>
      {HERO_SHOTS.slice(0, 3).map((shot) => (
        <HeroShot key={shot.image} base={base} shot={shot} />
      ))}
    </div>
  );

  if (!wide) return grid;

  return (
    <BrowserOnly fallback={grid}>
      {() => {
        const AccordionGallery =
          require('@site/src/components/vendor/reactbits/AccordionGallery').default;
        return (
          <div className={styles.heroAccordion}>
            <AccordionGallery
              items={HERO_SHOTS.map((shot, i) => ({
                image: `${base}/${shot.image}`,
                link: shot.url,
                label: shot.label,
                alt: shot.alt,
                eager: i < 2,
              }))}
              LinkComponent={Link}
              defaultIndex={0}
              height={null}
              gap={8}
              radius={12}
              tilt={5}
              expandRatio={0.46}
              grayscale={false}
              accentColor="var(--tm-accent)"
              overlayColor="#050a14"
            />
          </div>
        );
      }}
    </BrowserOnly>
  );
}

function HeroShot({base, shot}: {base: string; shot: (typeof HERO_SHOTS)[number]}): React.JSX.Element {
  return (
    <Link to={shot.url} className={styles.heroShot}>
      <img src={`${base}/${shot.image}`} alt={shot.alt} width={1100} height={726} />
      <span className={styles.heroShotLabel}>{shot.label}</span>
    </Link>
  );
}

function HeroSection(): React.JSX.Element {
  return (
    <section className={styles.hero}>
      <div className={styles.heroBadge}>
        <span className={styles.badgeDot} aria-hidden="true" />
        <span>Student-built FTC software and mechanical curriculum</span>
      </div>

      <h1 className={styles.heroTitle}>
        <span className={styles.titleLine1}>Master FTC</span>
        <span className={styles.titleLine2}>Robotics</span>
      </h1>

      <p className={styles.heroSub}>
        Two tracks, one robot. Learn to program an FTC robot and run your code
        in the browser, or learn to design one and check your numbers before you
        build.
      </p>


      <div className={styles.heroActions}>
        <Link to="/docs/unit-00/classes-and-objects" className={styles.btnPrimary}>
          Begin Software
        </Link>
        <Link to="/mechanical/module-00/design-cycle" className={styles.btnTrackAlt}>
          Begin Mechanical
        </Link>
      </div>

      {/* The screenshots were all below the fold, so the page opened on type
          and a pair of buttons and the reader had to take on faith that
          anything ran. These three are the first thing on the page: one from
          each of the two tracks and one lesson, arriving in turn. */}
      <HeroShots />
    </section>
  );
}

function StatsBar(): React.JSX.Element {

  return (
    <p className={styles.summaryLine}>
      <span className={styles.summaryFigure}>
        <BrowserOnly fallback={<>{TOTAL_LESSON_COUNT}</>}>
          {() => <CountUp to={TOTAL_LESSON_COUNT} duration={1.2} />}
        </BrowserOnly>
      </span>{' '}
      lessons across
      {' '}<span className={styles.summaryFigure}>2</span> tracks, written in
      Java against the FTC SDK, with simulators on one side and design
      calculators on the other.
    </p>
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
  units: typeof CURRICULUM_UNITS;
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
 * A screenshot beside the copy that describes it.
 *
 * The two feature sections explained a simulator and a set of calculators
 * without ever showing one, so the only picture of either was the wall of
 * gallery tiles further down the page.
 */
function FeatureShot({src, alt, caption}: {src: string; alt: string; caption: string}): React.JSX.Element {
  const base = useBaseUrl('/').replace(/\/$/, '');
  return (
    <figure className={styles.featureShot}>
      <img src={`${base}/${src}`} alt={alt} loading="lazy" decoding="async" width={1100} height={726} />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

function SimulatorSection(): React.JSX.Element {
  return (
    <section className={styles.section}>
      <div className={styles.featureRow}>
        <div>
          <p className={styles.sectionLabel}>Browser simulator</p>
          <h2 className={styles.sectionTitle}>Run Java in the browser</h2>
          <p className={styles.sectionDesc}>
            Write the code for a lesson, run it, and see what the robot does.
            You get telemetry, checks against what the lesson asked for, and
            simulated hardware to test against.
          </p>
        </div>
        <FeatureShot
          src="img/showcase/arm-simulator.jpg"
          alt="The arm simulator mid-run, with telemetry beside the simulated arm."
          caption="The arm simulator, running a student's own numbers."
        />
      </div>
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
      <div className={styles.featureRow}>
        <div>
          <p className={styles.sectionLabel}>Design tools</p>
          <h2 className={styles.sectionTitle}>Check the design before you cut</h2>
          <p className={styles.sectionDesc}>
            {TOOL_CATALOG.length} calculators for the numbers that decide
            whether a mechanism will work, and a check that reads your exported
            CAD file and measures it.
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
        A calculator checks the arithmetic behind a design. Whether the
        mechanism grips the game element is what a prototype is for.
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
      <h2 className={styles.sectionTitle}>What you actually get</h2>
      <p className={styles.sectionDesc}>
        Screenshots of the running site, not mockups. Every one of them opens
        the thing it shows.
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
        <StatsBar />
        <Divider />
        <CurriculumSection
          units={CURRICULUM_UNITS}
          label="Software track"
          id="curriculum"
          heading={`${CURRICULUM_UNIT_COUNT} units that grow with your team`}
          blurb="Start at the beginning or go straight to what your team needs."
          stat={`${CURRICULUM_UNIT_COUNT} units · ${CURRICULUM_LESSON_COUNT} lessons`}
        />
        <Divider />
        <CurriculumSection
          units={MECHANICAL_UNITS}
          label="Mechanical track"
          id="mechanical"
          heading={`${MECHANICAL_UNIT_COUNT} modules from first sketch to competition`}
          blurb="How to design a robot: the process, CAD, materials, gears and belts, and the standards that keep it together."
          stat={`${MECHANICAL_UNIT_COUNT} modules · ${MECHANICAL_LESSON_COUNT} lessons`}
        />
        <Divider />
        <SimulatorSection />
        <Divider />
        <ToolsSection />
        <Divider />
        <ShowcaseSection />
        <Divider />
        <CtaSection />
      </main>
    </Layout>
  );
}
