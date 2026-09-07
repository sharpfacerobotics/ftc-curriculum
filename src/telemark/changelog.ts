/**
 * User-facing additions to Telemark.
 *
 * This list is written from deployed Git history, but it is not a commit log.
 * Readers need to know what they can use, not how the implementation changed.
 *
 * Newest first. Dates are the day each release reached the live site.
 */

export type ChangeKind = 'curriculum' | 'simulator' | 'tools' | 'site';

export interface ChangeEntry {
  readonly version: string;
  readonly date: string;
  readonly kind: ChangeKind;
  readonly title: string;
  readonly body: string;
  readonly additions: readonly string[];
  readonly href?: string;
  readonly image?: string;
  readonly darkImage?: string;
  readonly imageAlt?: string;
}

export const CHANGELOG: readonly ChangeEntry[] = [
  {
    version: '1.9',
    date: '2026-09-06',
    kind: 'simulator',
    title: 'Multi-file Java projects',
    body:
      'Build simulator projects the same way you structure TeamCode, with supporting classes kept in separate files and compiled together in the browser.',
    additions: [
      'Create and switch between Java files inside supported simulators.',
      'Use packages, imports, helper classes, and shared constants across one project.',
      'See Java annotations highlighted and complete @TeleOp, @Autonomous, and @Override as you type.',
      'Get case-sensitive suggestions for FTC SDK types and the classes and methods you write.',
    ],
    href: '/docs/unit-07/mechanism-classes',
    image: '/img/releases/1.9.png',
    darkImage: '/img/releases/1.9(black).png',
    imageAlt:
      'The version number 1.9 in a glossy cyan and green gradient.',
  },
  {
    version: '1.8',
    date: '2026-09-05',
    kind: 'curriculum',
    title: 'Deeper lessons and simulator challenges',
    body:
      'Software lessons now connect each concept to more complete robot code, while simulator challenges cover the decisions teams make during a match.',
    additions: [
      'Study team-code excerpts for OpMode structure, mechanisms, sensors, and autonomous design.',
      'Build a complete Limelight and odometry fusion routine in Unit 15.',
      'Practice new challenge behavior across motors, servos, sensors, and drivetrain control.',
    ],
    href: '/docs/unit-15/limelight-fusion',
  },
  {
    version: '1.7',
    date: '2026-09-01',
    kind: 'site',
    title: 'A live product tour',
    body:
      'The homepage now shows Telemark in use through a compact video tour instead of asking you to picture the curriculum and simulators.',
    additions: [
      'Preview lessons, coding challenges, robot simulators, and mechanical tools from the homepage.',
      'Watch a version made for either light or dark mode.',
    ],
    href: '/',
  },
  {
    version: '1.6',
    date: '2026-08-30',
    kind: 'curriculum',
    title: 'FLL Challenge with Blocks',
    body:
      'A three-unit FLL path now teaches movement, sensors, attachments, reusable blocks, and mission planning with an interactive robot.',
    additions: [
      'Program precision routes with motor pairs, turns, and steering.',
      'Use color, distance, and heading sensors in retrieval challenges.',
      'Plan and test a complete mission run in the capstone.',
    ],
    href: '/blocks/fll',
  },
  {
    version: '1.5',
    date: '2026-08-29',
    kind: 'curriculum',
    title: 'Programming foundations in Blocks',
    body:
      'New programmers can learn core programming ideas in six visual units before moving into the Java curriculum.',
    additions: [
      'Practice variables, decisions, loops, functions, lists, and debugging.',
      'Run each Blocks exercise and inspect its execution step by step.',
      'Choose a learning path based on your role and prior experience.',
    ],
    href: '/blocks',
  },
  {
    version: '1.4',
    date: '2026-08-28',
    kind: 'simulator',
    title: 'Student code on real team CAD',
    body:
      'Mastery simulators now run your code against imported competition robot CAD, and the curriculum connects each scene to its challenge.',
    additions: [
      "Drive Sharp Face Robotics' KG-SFR robot in the Unit 2 TeleOp challenge.",
      "Run autonomous code on FTC 17438 Input/Output's robot in Unit 6.",
      'Open both team-code challenges directly from the homepage gallery.',
    ],
    href: '/docs/unit-06/mastery-coding-challenge',
  },
  {
    version: '1.3',
    date: '2026-08-24',
    kind: 'curriculum',
    title: 'Mastery coding challenges',
    body:
      'Every software unit from 2 through 15 now ends with a full coding challenge built around a practical FTC requirement list.',
    additions: [
      'Start from an FTC SDK class shell and write the complete behavior.',
      'Run checks that inspect your code and show which requirements you met.',
      'Test the result in a simulator driven by your OpMode.',
    ],
    href: '/docs/unit-02/mastery-coding-challenge',
  },
  {
    version: '1.2',
    date: '2026-08-23',
    kind: 'site',
    title: 'An interactive gallery',
    body:
      'The homepage now uses screenshots from the running site, giving you a direct route into lessons, simulators, calculators, and CAD practice.',
    additions: [
      'Open every screenshot to use the page or tool it shows.',
      'Browse code editors, robot fields, mechanical calculators, and lessons in one gallery.',
      'Preview the Unit 8.2 simulator from the homepage.',
    ],
    href: '/',
  },
  {
    version: '1.1',
    date: '2026-08-21',
    kind: 'tools',
    title: 'Sharp AI in every lesson',
    body:
      'You can ask Sharp AI about the lesson you are reading without leaving the curriculum, then return to earlier chats when you need them.',
    additions: [
      'Open the assistant from its standing launcher on lesson pages.',
      'Ask follow-up questions in a tutor-style conversation.',
      'Keep chat history and continue in the full Sharp AI experience.',
    ],
    href: '/docs/unit-00/classes-and-objects',
  },
  {
    version: '1.0',
    date: '2026-08-20',
    kind: 'curriculum',
    title: 'Mechanical curriculum',
    body:
      'Telemark now teaches the full mechanical path alongside software, from design requirements and shop work through CAD, mechanisms, wiring, and competition readiness.',
    additions: [
      'Follow 12 mechanical modules with the same lesson structure as the software track.',
      'Run an arm simulator and use calculators for torque, gearing, slides, fasteners, and weight.',
      'Check exported CAD files against exercise dimensions.',
      'Practice the design process, shop standards, mechanism theory, and the Onshape toolset.',
    ],
    href: '/mechanical',
  },
];

export const LATEST_RELEASE = CHANGELOG[0];

export function formatChangeDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
