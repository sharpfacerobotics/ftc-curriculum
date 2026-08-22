import React, {useState} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import {TOOL_CATALOG} from '@site/src/components/mechanical/toolCatalog';
import RobotAssembly from '@site/src/components/ui/RobotAssembly';
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
const HOME_TOOLS = [
  {name: 'CAD file check', path: '/simulator#cad-check', desc: 'Drop in a STEP or STL export and see which of the exercise\u2019s numbers your model actually hit.'},
  {name: 'Arm gravity torque', path: '/simulator#arm-torque', desc: 'Work the torque an arm needs at its worst angle, then the reduction that delivers it.'},
  {name: 'Linear slide sizing', path: '/simulator#slide', desc: 'Extension, spool diameter, and the force the cable really carries.'},
  {name: 'Arm simulator', path: '/simulator#arm-sim', desc: 'Run a time-stepped arm against your own numbers and watch it fail or hold.'},
  {name: 'Tap drill and clearance', path: '/simulator#tap-drill', desc: 'The hole sizes that stop a screw binding, straight from the standards.'},
  {name: 'Weight budget', path: '/simulator#weight', desc: 'Spend the robot\u2019s mass on purpose instead of discovering it at inspection.'},
];

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

      {/* One figure, not two. The robot earns its place because it shows the
          build order the track teaches; a panel typing out code showed only
          that text can appear one letter at a time. */}
      <div className={styles.heroShowcase}>
        <RobotAssembly />
      </div>
    </section>
  );
}

function StatsBar(): React.JSX.Element {

  return (
    <p className={styles.summaryLine}>
      <span className={styles.summaryFigure}>{TOTAL_LESSON_COUNT}</span> lessons across
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

function SimulatorSection(): React.JSX.Element {
  return (
    <section className={styles.section}>
      <p className={styles.sectionLabel}>Browser simulator</p>
      <h2 className={styles.sectionTitle}>Run Java in the browser</h2>
      <p className={styles.sectionDesc}>
        Write the code for a lesson, run it, and see what the robot does. You
        get telemetry, checks against what the lesson asked for, and simulated
        hardware to test against.
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
      <p className={styles.sectionLabel}>Design tools</p>
      <h2 className={styles.sectionTitle}>Check the design before you cut</h2>
      <p className={styles.sectionDesc}>
        {TOOL_CATALOG.length} calculators for the numbers that decide whether a
        mechanism will work, and a check that reads your exported CAD file and
        measures it.
      </p>

      <div className={styles.toolStrip}>
        {HOME_TOOLS.slice(0, 4).map((tool) => (
          <Link key={tool.path} to={tool.path} className={styles.toolCard}>
            <span className={styles.toolName}>{tool.name}</span>
            <span className={styles.toolDesc}>{tool.desc}</span>
          </Link>
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
        <CtaSection />
      </main>
    </Layout>
  );
}
