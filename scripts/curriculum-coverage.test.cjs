const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const challengeSource = fs.readFileSync(
  path.join(root, 'static/simulator/mastery_challenge.js'),
  'utf8',
);
const context = {window: {}, document: {currentScript: {dataset: {unit: '0'}}}};
vm.runInNewContext(challengeSource, context, {filename: 'mastery_challenge.js'});
const configs = context.window.TelemarkMasteryChallenge.configs;

function lessonCorpus(unit) {
  const directory = path.join(root, `docs/unit-${String(unit).padStart(2, '0')}`);
  return fs.readdirSync(directory)
    .filter((name) => name.endsWith('.mdx'))
    .filter((name) => !name.includes('overview') && !name.includes('mastery-coding-challenge'))
    .sort()
    .map((name) => fs.readFileSync(path.join(directory, name), 'utf8'))
    .join('\n');
}

// Entries align with CONFIGS[unit].checks followed by CONFIGS[unit].forbidden.
// An array means every listed detail must be taught somewhere before mastery.
const coverage = {
  2: [
    [/void\s+init\s*\(/, /telemetry\.addData/],
    [/void\s+init_loop\s*\(/, /telemetry\.addData/],
    [/void\s+start\s*\(/, /resetRuntime\s*\(/],
    /void\s+loop\s*\(/,
    [/getRuntime\s*\(/, /gamepad1\./, /telemetry\.addData/],
    [/void\s+stop\s*\(/, /telemetry\.addData/],
  ],
  3: [
    [/\bString\b/, /hardwareMap\.get/],
    /\bdouble\b/,
    /\bboolean\b/,
    [/\bint\b/, /(?:\+\+|\+=)/],
    [/gamepad1\./, /[*/+-]/],
    /\.setPower\s*\(/,
    /telemetry\.addData\s*\(/,
  ],
  4: [
    [/leftDrive/, /rightDrive/, /hardwareMap\.get\s*\(DcMotor\.class/],
    [/left_stick_y/, /right_stick_x/],
    /Math\.abs\s*\(/,
    /right_trigger/,
    [/double\s+squareInputWithSign\s*\(/, /squareInputWithSign\s*\(forward\)/],
    [/gamepad1\.a\s*&&\s*!previousA/, /previousA\s*=\s*gamepad1\.a/],
    [/forward\s*\+\s*turn/, /forward\s*-\s*turn/, /Range\.clip\s*\(/],
    [/leftDrive\.setPower/, /rightDrive\.setPower/],
    [/Left Power/, /Right Power/, /telemetry\.addData/],
  ],
  5: [
    [/hardwareMap\.get\s*\(DcMotor\.class/, /ColorSensor\.class/, /DistanceSensor\.class/],
    [/getDistance\s*\(DistanceUnit\./, /\.red\s*\(\)/, /\.blue\s*\(\)/],
    [/\bif\s*\(/, /\belse\s+if\s*\(/, /\belse\b/],
    /(?:<|>|<=|>=)\s*\d/,
    [/&&/, /\|\|/],
    /gamepad1\./,
    /setPower\s*\(\s*0(?:\.0+)?\s*\)/,
    /telemetry\.addData\s*\(/,
  ],
  6: [
    [/void\s+runOpMode\s*\(/, /waitForStart\s*\(/],
    [/DcMotor\s*\[\s*\]/, /hardwareMap\.get\s*\(DcMotor\.class/],
    /for\s*\(\s*int\s+\w+\s*=/,
    /for\s*\(\s*DcMotor\s+\w+\s*:/,
    /while\s*\([^)]*opModeIsActive\s*\(\s*\)/,
    [/getRuntime\s*\(\s*\)\s*\+/, /getRuntime\s*\(\s*\)\s*[<>]/],
    [/while\s*\([^)]*opModeIsActive/, /telemetry\.update\s*\(/],
    /setPower\s*\(\s*0(?:\.0+)?\s*\)/,
    [/sleep\s*\(/, /blocks|blocking/],
    [/while\s*\(\s*true\s*\)/, /unbounded loop/],
  ],
  7: [
    [/static\s+final\s+String/, /hardwareMap\.get/],
    /class\s+\w*(?:Mechanism|Subsystem|System)\b/,
    /void\s+init\s*\(\s*HardwareMap/,
    /\.get\s*\(\s*DcMotor\.class/,
    [/DigitalChannel\.class/, /DigitalChannel\.Mode\.INPUT/],
    [/AnalogInput\.class/, /getVoltage\s*\(/],
    /\.init\s*\(\s*hardwareMap\s*\)/,
    [/gamepad1\./, /setIntakePower\s*\(/],
    [/getState\s*\(\s*\)/, /setPower\s*\(\s*0(?:\.0+)?\s*\)/],
  ],
  8: [
    [/DcMotor\.class/, /limit_upper/, /limit_lower/],
    [/upperLimit\.setMode/, /lowerLimit\.setMode/, /DigitalChannel\.Mode\.INPUT/],
    /setDirection\s*\([^)]*Direction\.REVERSE/,
    /setZeroPowerBehavior\s*\(\s*DcMotor\.ZeroPowerBehavior\.BRAKE/,
    /gamepad1\.left_stick_y/,
    [/upperLimit\.getState/, /lowerLimit\.getState/, /requestedPower\s*>\s*0/, /requestedPower\s*<\s*0/],
    [/appliedPower\s*=\s*requestedPower/, /slideMotor\.setPower/],
    /appliedPower\s*=\s*0(?:\.0+)?/,
    [/At Upper Limit/, /At Lower Limit/, /Slide Power/],
  ],
  9: [
    [/Servo\.class/, /CRServo\.class/],
    /scaleRange\s*\(/,
    /setDirection\s*\(\s*Servo\.Direction\.REVERSE/,
    [/gamepad1\.a/, /gamepad1\.b/, /setPosition\s*\(/],
    [/leftClaw\.setPosition/, /rightClaw\.setPosition/],
    [/setPower\s*\(\s*(?:1(?:\.0+)?|gamepad1)/, /setPower\s*\(\s*-/],
    /setPower\s*\(\s*0(?:\.0+)?\s*\)/,
    [/telemetry\.addData/, /(?:Gripper|Intake)/],
  ],
  10: [
    [/(?:TICKS|COUNTS)_PER_REV/, /WHEEL_(?:DIAMETER|CIRCUMFERENCE)/],
    [/Math\.PI/, /(?:ticks|counts)/i],
    /STOP_AND_RESET_ENCODER/,
    /setTargetPosition\s*\(/,
    /RUN_TO_POSITION/,
    [/opModeIsActive\s*\(\s*\)/, /isBusy\s*\(\s*\)/],
    [/getCurrentPosition\s*\(/, /telemetry\.addData/],
    [/setPower\s*\(\s*0(?:\.0+)?\s*\)/, /RUN_USING_ENCODER/],
  ],
  11: [
    [/DcMotor\.class/, /DigitalChannel\.class/, /AnalogInput\.class/, /ColorSensor\.class/, /DistanceSensor\.class/],
    [/DigitalChannel\.Mode\.INPUT/, /getState\s*\(/],
    [/getVoltage\s*\(/, /Range\.scale\s*\(/],
    [/\.red\s*\(\)/, /\.blue\s*\(\)/, /(?:\br\s*>\s*b\b|\bb\s*>\s*r\b|red\w*\s*[<>]\s*blue\w*|blue\w*\s*[<>]\s*red\w*)/i],
    /getDistance\s*\(\s*DistanceUnit\./,
    [/(?:&&|\|\|)/, /setPower\s*\(/],
    /setPower\s*\(\s*0(?:\.0+)?\s*\)/,
    [/telemetry\.addData/, /(?:Distance|Voltage|Color|Touch|State)/],
  ],
  12: [
    [/hardwareMap\.get\s*\(IMU\.class/, /RevHubOrientationOnRobot/, /imu\.initialize/],
    /getRobotYawPitchRollAngles\s*\(/,
    [/getYaw\s*\(\s*AngleUnit\./, /getPitch\s*\(\s*AngleUnit\./, /getRoll\s*\(\s*AngleUnit\./],
    [/gamepad1\.[abxy]/, /resetYaw\s*\(/],
    [/Math\.cos\s*\(/, /Math\.sin\s*\(/],
    [/Math\.max\s*\(/, /leftFront\.setPower/, /rightFront\.setPower/, /leftBack\.setPower/, /rightBack\.setPower/],
    [/Math\.abs\s*\([^)]*(?:pitch|roll)/i, /setPower\s*\(\s*0(?:\.0+)?\s*\)/],
    [/(?:targetAngle|error|correction|heading)/i, /Range\.clip\s*\(/],
    [/telemetry\.addData/, /(?:Yaw|Pitch|Roll|Heading)/],
  ],
  13: [
    /private\s+(?:DcMotor|Servo|DigitalChannel)/,
    /class\s+\w*(?:Mechanism|Subsystem)/,
    /class\s+\w+\s+extends\s+\w+/,
    /@Override/,
    /static\s+final/,
    [/class\s+CompetitionRobot/, /new\s+\w*(?:Mechanism|Drivetrain)\s*\(/],
    [/CompetitionRobot/, /init\s*\(\s*HardwareMap/],
    [/robot\.init\s*\(\s*hardwareMap\s*\)/, /robot\.[a-zA-Z]+\./],
    [/void\s+stop\s*\(/, /stopAll\s*\(/, /setPower\s*\(\s*0(?:\.0+)?\s*\)/],
  ],
  14: [
    /hardwareMap\.get\s*\(\s*WebcamName\.class/,
    /AprilTagProcessor\.(?:easyCreateWithDefaults|Builder)/,
    [/VisionPortal/, /(?:easyCreateWithDefaults|new\s+VisionPortal\.Builder)/],
    [/getDetections\s*\(\)/, /for\s*\(\s*AprilTagDetection/],
    [/\.id\b/, /ftcPose/, /metadata\s*!=\s*null/],
    [/new\s+Rect\s*\(/, /ZONE_LEFT/, /ZONE_CENTER/, /ZONE_RIGHT/],
    [/enum\s+SpikeLocation/, /LEFT/, /CENTER/, /RIGHT/],
    [/while\s*\(\s*!isStarted\s*\(\)/, /telemetry\.addData/],
    /visionPortal\.close\s*\(/,
  ],
  15: [
    [/hardwareMap\.get\s*\(Limelight3A\.class/, /pipelineSwitch\s*\(/, /limelight\.start\s*\(/],
    [/new\s+Follower\s*\(/, /setStartingPose\s*\(\s*new\s+Pose/],
    [/new\s+BezierLine\s*\(/, /new\s+BezierCurve\s*\(/, /PathChain/],
    [/enum\s+\w*State/, /switch\s*\(/, /case\s+\w+/],
    [/while\s*\([^)]*opModeIsActive/, /follower\.update\s*\(/],
    [/getLatestResult\s*\(/, /\.isValid\s*\(\s*\)/],
    [/getBotpose\s*\(/, /follower\.setPose\s*\(/],
    [/Servo/, /setPosition\s*\(/, /getRuntime\s*\(/],
    [/limelight\.stop\s*\(/, /telemetry\.addData/],
    [/sleep\s*\(/, /blocking|blocks/],
  ],
};

let covered = 0;
for (let unit = 2; unit <= 15; unit += 1) {
  const requirements = [...configs[unit].checks, ...(configs[unit].forbidden || [])];
  const specs = coverage[unit];
  assert.equal(
    specs.length,
    requirements.length,
    `Unit ${unit} coverage map must align with every challenge requirement`,
  );
  const corpus = lessonCorpus(unit);
  requirements.forEach((requirement, index) => {
    const patterns = Array.isArray(specs[index]) ? specs[index] : [specs[index]];
    patterns.forEach((pattern) => {
      assert.match(
        corpus,
        pattern,
        `Unit ${unit} lessons do not cover challenge requirement: ${requirement[0]}`,
      );
    });
    covered += 1;
  });
}

console.log(`Curriculum coverage checks passed for ${covered} coding-challenge requirements`);
