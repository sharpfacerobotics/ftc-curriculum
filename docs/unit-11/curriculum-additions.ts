// ============================================================
// ADD THIS UNIT OBJECT to the CURRICULUM_UNITS array in curriculum.ts
// Place it after the unit-09 entry (at the end of the array,
// or wherever the other units are sequenced).
// ============================================================

  {
    id: 'UNIT_11',
    label: 'Unit 11',
    title: 'Digital & Analog Sensors',
    desc: 'Read touch sensors and potentiometers, sample alliance colors, measure range with ToF sensors, and build a sensor-gated intake.',
    tier: 'Intermediate',
    slug: 'unit-11',
    overviewPath: '/docs/unit-11',
    startPath: '/docs/unit-11/touch-sensor',
    nextPath: '/dashboard',
    nextLabel: 'Dashboard',
    lessonCount: 6,
    overview:
      'This unit teaches students how to read, scale, and act on data from the three main sensor categories available in FTC: digital binary sensors, analog voltage sensors, and I2C sensors for color and distance.',
    outcomes: [
      'Read digital touch sensors correctly, accounting for active-low hardware logic, and use them as reliable software limit switches.',
      'Convert raw potentiometer voltage into engineering units using Range.scale() for absolute positional feedback without a homing sequence.',
      'Sample and compare color sensor channels to identify alliance game elements reliably across different field lighting conditions.',
    ],
  },


// ============================================================
// ADD THESE LESSON OBJECTS to the CURRICULUM_LESSONS array in curriculum.ts
// ============================================================

  {
    id: 'unit-11/touch-sensor',
    label: '11.1 · Touch Sensor',
    title: 'Lesson 11.1: Reading Touch Sensor Binary States via DigitalChannel',
    path: '/docs/unit-11/touch-sensor',
    unitSlug: 'unit-11',
    unitLabel: 'Unit 11',
    unitTitle: 'Digital & Analog Sensors',
  },
  {
    id: 'unit-11/potentiometer',
    label: '11.2 · Potentiometer',
    title: 'Lesson 11.2: Scaling Analog Voltage from Potentiometers using Range.scale',
    path: '/docs/unit-11/potentiometer',
    unitSlug: 'unit-11',
    unitLabel: 'Unit 11',
    unitTitle: 'Digital & Analog Sensors',
  },
  {
    id: 'unit-11/color-sensor',
    label: '11.3 · Color Sensor',
    title: 'Lesson 11.3: Sampling Alliance Colors with the REV Color Sensor',
    path: '/docs/unit-11/color-sensor',
    unitSlug: 'unit-11',
    unitLabel: 'Unit 11',
    unitTitle: 'Digital & Analog Sensors',
  },
  {
    id: 'unit-11/distance-sensor',
    label: '11.4 · Distance Sensor',
    title: 'Lesson 11.4: Integration of Time-of-Flight Distance Sensors for Obstacle Detection',
    path: '/docs/unit-11/distance-sensor',
    unitSlug: 'unit-11',
    unitLabel: 'Unit 11',
    unitTitle: 'Digital & Analog Sensors',
  },
  {
    id: 'unit-11/sensor-gated-intake',
    label: '11.5 · Challenge: Sensor-Gated Intake',
    title: 'Lesson 11.5: Challenge — Creating an Automated Sensor-Gated Intake System',
    path: '/docs/unit-11/sensor-gated-intake',
    unitSlug: 'unit-11',
    unitLabel: 'Unit 11',
    unitTitle: 'Digital & Analog Sensors',
  },
  {
    id: 'unit-11/mastery-quiz',
    label: 'Unit 11 · Mastery Quiz',
    title: 'Unit 11 Mastery Quiz: Digital & Analog Sensors',
    path: '/docs/unit-11/mastery-quiz',
    unitSlug: 'unit-11',
    unitLabel: 'Unit 11',
    unitTitle: 'Digital & Analog Sensors',
  },
