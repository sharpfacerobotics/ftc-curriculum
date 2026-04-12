export type Tier = 'Beginner' | 'Intermediate' | 'Advanced';

export interface CurriculumUnit {
  id: string;
  label: string;
  title: string;
  desc: string;
  tier: Tier;
  slug: string;
  overviewPath: string;
  startPath: string;
  nextPath: string;
  nextLabel: string;
  lessonCount: number;
  overview: string;
  outcomes: string[];
}

export interface CurriculumLesson {
  id: string;
  label: string;
  title: string;
  path: string;
  unitSlug: string;
  unitLabel: string;
  unitTitle: string;
}

export const CURRICULUM_UNITS: CurriculumUnit[] = [
  {
    id: 'UNIT_01',
    label: 'Unit 1',
    title: 'Environment Setup',
    desc: 'Install JDK 17, Android Studio, and the FTC SDK, then verify the toolchain.',
    tier: 'Beginner',
    slug: 'unit-01',
    overviewPath: '/docs/unit-01',
    startPath: '/docs/unit-01/prerequisites',
    nextPath: '/docs/unit-02',
    nextLabel: 'Unit 2: OpMode Structure',
    lessonCount: 10,
    overview:
      'This unit gets every student onto the same stable FTC development setup before any robot code is written.',
    outcomes: [
      'Install JDK 17 and Android Studio with the right FTC-compatible settings.',
      'Clone and open the FTC SDK without Gradle or build configuration issues.',
      'Verify that your environment can build and deploy a basic diagnostic OpMode.',
    ],
  },
  {
    id: 'UNIT_02',
    label: 'Unit 2',
    title: 'OpMode Structure',
    desc: 'Learn annotations plus the init(), loop(), start(), and stop() lifecycle.',
    tier: 'Beginner',
    slug: 'unit-02',
    overviewPath: '/docs/unit-02',
    startPath: '/docs/unit-02/registering-programs',
    nextPath: '/docs/unit-03',
    nextLabel: 'Unit 3: Java Variables',
    lessonCount: 6,
    overview:
      'This unit introduces the FTC OpMode lifecycle so students understand where initialization, real-time control, and one-time transitions belong.',
    outcomes: [
      'Choose the right annotation so programs appear correctly on the Driver Station.',
      'Separate setup work from repeated loop logic and one-time start/stop transitions.',
      'Build a health-check style OpMode that reports robot state clearly through telemetry.',
    ],
  },
  {
    id: 'UNIT_03',
    label: 'Unit 3',
    title: 'Java Variables',
    desc: 'Practice String, double, boolean, and int patterns in FTC robot code.',
    tier: 'Beginner',
    slug: 'unit-03',
    overviewPath: '/docs/unit-03',
    startPath: '/docs/unit-03/string-literals',
    nextPath: '/docs/unit-04',
    nextLabel: 'Unit 4: Gamepad Input',
    lessonCount: 6,
    overview:
      'This unit focuses on the Java datatypes students will use constantly when mapping hardware, reading sensors, and calculating robot behavior.',
    outcomes: [
      'Choose the correct datatype for names, numeric precision, binary state, and whole-number counts.',
      'Avoid common FTC bugs caused by integer truncation or mismatched hardware identifiers.',
      'Use variables as a single source of truth instead of scattering magic values through code.',
    ],
  },
  {
    id: 'UNIT_04',
    label: 'Unit 4',
    title: 'Gamepad Input',
    desc: 'Map buttons, joysticks, and triggers to robot mechanisms with deadzones and sensitivity curves.',
    tier: 'Beginner',
    slug: 'unit-04',
    overviewPath: '/docs/unit-04',
    startPath: '/docs/unit-04/button-toggles',
    nextPath: '/dashboard',
    nextLabel: 'Dashboard',
    lessonCount: 6,
    overview:
      'This unit teaches students how driver input gets translated into robot behavior, from simple button toggles to analog control shaping.',
    outcomes: [
      'Use buttons, joysticks, and triggers appropriately based on whether the mechanism needs digital or analog control.',
      'Implement deadzones and sensitivity shaping so the robot feels stable and intuitive to drive.',
      'Combine multiple gamepad inputs into a clean arcade-drive style control system.',
    ],
  },
];

export const CURRICULUM_LESSONS: CurriculumLesson[] = [
  {
    id: 'unit-01/prerequisites',
    label: '1 · Prerequisites',
    title: 'Section 1: What You Need Before You Start',
    path: '/docs/unit-01/prerequisites',
    unitSlug: 'unit-01',
    unitLabel: 'Unit 1',
    unitTitle: 'Environment Setup',
  },
  {
    id: 'unit-01/install-jdk',
    label: '2 · Installing JDK 17',
    title: 'Section 2: Installing JDK 17',
    path: '/docs/unit-01/install-jdk',
    unitSlug: 'unit-01',
    unitLabel: 'Unit 1',
    unitTitle: 'Environment Setup',
  },
  {
    id: 'unit-01/install-android-studio',
    label: '3 · Installing Android Studio',
    title: 'Section 3: Installing Android Studio',
    path: '/docs/unit-01/install-android-studio',
    unitSlug: 'unit-01',
    unitLabel: 'Unit 1',
    unitTitle: 'Environment Setup',
  },
  {
    id: 'unit-01/configure-jdk',
    label: '4 · Configure JDK',
    title: 'Section 4: Pointing Android Studio to JDK 17',
    path: '/docs/unit-01/configure-jdk',
    unitSlug: 'unit-01',
    unitLabel: 'Unit 1',
    unitTitle: 'Environment Setup',
  },
  {
    id: 'unit-01/get-ftc-sdk',
    label: '5 · Getting the FTC SDK',
    title: 'Section 5: Getting the FTC SDK',
    path: '/docs/unit-01/get-ftc-sdk',
    unitSlug: 'unit-01',
    unitLabel: 'Unit 1',
    unitTitle: 'Environment Setup',
  },
  {
    id: 'unit-01/open-project',
    label: '6 · Open the Project',
    title: 'Section 6: Opening the Project in Android Studio',
    path: '/docs/unit-01/open-project',
    unitSlug: 'unit-01',
    unitLabel: 'Unit 1',
    unitTitle: 'Environment Setup',
  },
  {
    id: 'unit-01/verify-build-config',
    label: '7 · Verify Build Config',
    title: 'Section 7: Verifying the Build Configuration',
    path: '/docs/unit-01/verify-build-config',
    unitSlug: 'unit-01',
    unitLabel: 'Unit 1',
    unitTitle: 'Environment Setup',
  },
  {
    id: 'unit-01/first-opmode',
    label: '8 · First OpMode',
    title: 'Section 8: Writing Your First OpMode',
    path: '/docs/unit-01/first-opmode',
    unitSlug: 'unit-01',
    unitLabel: 'Unit 1',
    unitTitle: 'Environment Setup',
  },
  {
    id: 'unit-01/connect-control-hub',
    label: '9 · Connect to Control Hub',
    title: 'Section 9: Connecting to the Control Hub',
    path: '/docs/unit-01/connect-control-hub',
    unitSlug: 'unit-01',
    unitLabel: 'Unit 1',
    unitTitle: 'Environment Setup',
  },
  {
    id: 'unit-01/verification-checklist',
    label: '10 · Verification Checklist',
    title: 'Section 10: Environment Verification Checklist',
    path: '/docs/unit-01/verification-checklist',
    unitSlug: 'unit-01',
    unitLabel: 'Unit 1',
    unitTitle: 'Environment Setup',
  },
  {
    id: 'unit-02/registering-programs',
    label: '2.1 · @TeleOp & @Autonomous',
    title: 'Lesson 2.1: Registering Programs with @TeleOp and @Autonomous Annotations',
    path: '/docs/unit-02/registering-programs',
    unitSlug: 'unit-02',
    unitLabel: 'Unit 2',
    unitTitle: 'OpMode Structure',
  },
  {
    id: 'unit-02/init-method',
    label: '2.2 · init() Method',
    title: 'Lesson 2.2: Initializing Peripheral Hardware within the init() Method',
    path: '/docs/unit-02/init-method',
    unitSlug: 'unit-02',
    unitLabel: 'Unit 2',
    unitTitle: 'OpMode Structure',
  },
  {
    id: 'unit-02/loop-lifecycle',
    label: '2.3 · loop() Lifecycle',
    title: 'Lesson 2.3: Executing Real-time Logic inside the loop() Lifecycle',
    path: '/docs/unit-02/loop-lifecycle',
    unitSlug: 'unit-02',
    unitLabel: 'Unit 2',
    unitTitle: 'OpMode Structure',
  },
  {
    id: 'unit-02/start-and-stop',
    label: '2.4 · start() & stop()',
    title: 'Lesson 2.4: Utilizing start() and stop() for One-time Hardware Transitions',
    path: '/docs/unit-02/start-and-stop',
    unitSlug: 'unit-02',
    unitLabel: 'Unit 2',
    unitTitle: 'OpMode Structure',
  },
  {
    id: 'unit-02/health-check-challenge',
    label: '2.5 · Challenge: Health-Check',
    title: 'Lesson 2.5: Challenge — Implementing a Robot Health-Check OpMode with Telemetry Feedback',
    path: '/docs/unit-02/health-check-challenge',
    unitSlug: 'unit-02',
    unitLabel: 'Unit 2',
    unitTitle: 'OpMode Structure',
  },
  {
    id: 'unit-02/mastery-quiz',
    label: 'Unit 2 · Mastery Quiz',
    title: 'Unit 2 Mastery Quiz: OpMode Structure',
    path: '/docs/unit-02/mastery-quiz',
    unitSlug: 'unit-02',
    unitLabel: 'Unit 2',
    unitTitle: 'OpMode Structure',
  },
  {
    id: 'unit-03/string-literals',
    label: '3.1 · String Literals',
    title: 'Lesson 3.1: Using String Literals for Exact Hardware Configuration Names',
    path: '/docs/unit-03/string-literals',
    unitSlug: 'unit-03',
    unitLabel: 'Unit 3',
    unitTitle: 'Java Variables',
  },
  {
    id: 'unit-03/double-precision',
    label: '3.2 · double Precision',
    title: 'Lesson 3.2: Storing Motor Power Levels with double Precision',
    path: '/docs/unit-03/double-precision',
    unitSlug: 'unit-03',
    unitLabel: 'Unit 3',
    unitTitle: 'Java Variables',
  },
  {
    id: 'unit-03/boolean-flags',
    label: '3.3 · boolean Flags',
    title: 'Lesson 3.3: Managing Binary Sensor States using boolean Flags',
    path: '/docs/unit-03/boolean-flags',
    unitSlug: 'unit-03',
    unitLabel: 'Unit 3',
    unitTitle: 'Java Variables',
  },
  {
    id: 'unit-03/int-datatypes',
    label: '3.4 · int Datatypes',
    title: 'Lesson 3.4: Tracking Mechanism Cycle Counts with int Datatypes',
    path: '/docs/unit-03/int-datatypes',
    unitSlug: 'unit-03',
    unitLabel: 'Unit 3',
    unitTitle: 'Java Variables',
  },
  {
    id: 'unit-03/dynamic-power-challenge',
    label: '3.5 · Challenge: Dynamic Power',
    title: 'Lesson 3.5: Challenge — Dynamic Power Calculation using Multi-Variable Math Operations',
    path: '/docs/unit-03/dynamic-power-challenge',
    unitSlug: 'unit-03',
    unitLabel: 'Unit 3',
    unitTitle: 'Java Variables',
  },
  {
    id: 'unit-03/mastery-quiz',
    label: 'Unit 3 · Mastery Quiz',
    title: 'Unit 3 Mastery Quiz: Java Variables',
    path: '/docs/unit-03/mastery-quiz',
    unitSlug: 'unit-03',
    unitLabel: 'Unit 3',
    unitTitle: 'Java Variables',
  },
  {
    id: 'unit-04/button-toggles',
    label: '4.1 · Button Toggles',
    title: 'Lesson 4.1: Mapping gamepad.a and gamepad.b to Direct Mechanism Toggles',
    path: '/docs/unit-04/button-toggles',
    unitSlug: 'unit-04',
    unitLabel: 'Unit 4',
    unitTitle: 'Gamepad Input',
  },
  {
    id: 'unit-04/joystick-scaling',
    label: '4.2 · Joystick Scaling',
    title: 'Lesson 4.2: Scaling Joystick X/Y Analog Values for Differential Drive',
    path: '/docs/unit-04/joystick-scaling',
    unitSlug: 'unit-04',
    unitLabel: 'Unit 4',
    unitTitle: 'Gamepad Input',
  },
  {
    id: 'unit-04/trigger-inputs',
    label: '4.3 · Trigger Inputs',
    title: 'Lesson 4.3: Implementing Progressive Braking via Analog Trigger Inputs',
    path: '/docs/unit-04/trigger-inputs',
    unitSlug: 'unit-04',
    unitLabel: 'Unit 4',
    unitTitle: 'Gamepad Input',
  },
  {
    id: 'unit-04/sensitivity-curves',
    label: '4.4 · Sensitivity Curves',
    title: 'Lesson 4.4: Reducing Stick Sensitivity using the squareInputWithSign() Method',
    path: '/docs/unit-04/sensitivity-curves',
    unitSlug: 'unit-04',
    unitLabel: 'Unit 4',
    unitTitle: 'Gamepad Input',
  },
  {
    id: 'unit-04/arcade-drive-challenge',
    label: '4.5 · Challenge: Arcade Drive',
    title: 'Lesson 4.5: Challenge — Full Arcade Drive Mapping with Custom Deadzones and Sensitivity Curves',
    path: '/docs/unit-04/arcade-drive-challenge',
    unitSlug: 'unit-04',
    unitLabel: 'Unit 4',
    unitTitle: 'Gamepad Input',
  },
  {
    id: 'unit-04/mastery-quiz',
    label: 'Unit 4 · Mastery Quiz',
    title: 'Unit 4 Mastery Quiz: Gamepad Input',
    path: '/docs/unit-04/mastery-quiz',
    unitSlug: 'unit-04',
    unitLabel: 'Unit 4',
    unitTitle: 'Gamepad Input',
  },
];

export const CURRICULUM_UNIT_COUNT = CURRICULUM_UNITS.length;
export const CURRICULUM_LESSON_COUNT = CURRICULUM_LESSONS.length;

export function getUnitBySlug(unitSlug: string): CurriculumUnit | undefined {
  return CURRICULUM_UNITS.find((unit) => unit.slug === unitSlug);
}

export function getLessonsForUnit(unitSlug: string): CurriculumLesson[] {
  return CURRICULUM_LESSONS.filter((lesson) => lesson.unitSlug === unitSlug);
}
