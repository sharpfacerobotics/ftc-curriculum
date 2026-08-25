const assert = require('node:assert/strict');
const MasteryMotion = require('../static/simulator/mastery_motion.js');
const TelemarkJava = require('../static/simulator/telemark-java.js');

function changed(before, after, key) {
  assert.notEqual(after[key], before[key], `${key} should respond to student hardware commands`);
}

function testUnit4Drivetrain() {
  const motion = MasteryMotion.create(4);
  motion.setMotorPower('leftFront', 0.8);
  motion.setMotorPower('leftBack', 0.8);
  motion.setMotorPower('rightFront', 0.8);
  motion.setMotorPower('rightBack', 0.8);
  const before = motion.snapshot();
  motion.step(0.1);
  const after = motion.snapshot();
  changed(before, after, 'z');
  assert.ok(after.wheelAngles.every((angle) => Math.abs(angle) > 0));

  motion.setMotorPower('leftFront', 0.8);
  motion.setMotorPower('leftBack', 0.8);
  motion.setMotorPower('rightFront', -0.8);
  motion.setMotorPower('rightBack', -0.8);
  const heading = motion.snapshot().heading;
  motion.step(0.1);
  assert.notEqual(motion.snapshot().heading, heading, 'opposite side powers should turn the robot');
}

function testUnit4StudentProgramEndToEnd() {
  const motion = MasteryMotion.create(4);
  const runtime = TelemarkJava.createRuntime({
    gamepad1: {left_stick_y: -0.8, left_trigger: 0.6},
    onPower(power, device) { motion.setMotorPower(device.name, power); },
  });
  const compiled = TelemarkJava.compile(`
    import java.lang.Math;
    public class Unit4Mastery extends OpMode {
      DcMotor leftFront;
      DcMotor leftBack;
      DcMotor rightFront;
      DcMotor rightBack;
      public void init() {
        leftFront = hardwareMap.get(DcMotor.class, "leftFront");
        leftBack = hardwareMap.get(DcMotor.class, "leftBack");
        rightFront = hardwareMap.get(DcMotor.class, "rightFront");
        rightBack = hardwareMap.get(DcMotor.class, "rightBack");
      }
      public void loop() {
        double drivePower = Math.copySign(gamepad1.left_stick_y * gamepad1.left_stick_y, gamepad1.left_stick_y);
        drivePower = Math.copySign(Math.min(Math.abs(gamepad1.left_trigger), Math.abs(drivePower)), drivePower);
        leftFront.setPower(drivePower);
        leftBack.setPower(drivePower);
        rightFront.setPower(drivePower);
        rightBack.setPower(drivePower);
      }
    }
  `, runtime);
  assert.equal(compiled.ok, true, compiled.diagnostics?.[0]?.message);
  compiled.methods.init();
  compiled.methods.loop();
  motion.step(0.1);
  assert.notEqual(motion.snapshot().z, 0, 'the Unit 4 student program should move the robot mesh');
}

function testMotorDrivenMechanisms() {
  for (const unit of [3, 5, 7, 11]) {
    const motion = MasteryMotion.create(unit);
    const before = motion.snapshot().primaryAngle;
    motion.setMotorPower(unit === 3 ? 'flywheel' : 'intake', 0.7);
    motion.step(0.1);
    assert.notEqual(motion.snapshot().primaryAngle, before, `Unit ${unit} mechanism should move`);
  }

  for (const unit of [6, 13]) {
    const motion = MasteryMotion.create(unit);
    const before = motion.snapshot().armAngle;
    motion.setMotorPower('arm', 0.7);
    motion.step(0.1);
    assert.notEqual(motion.snapshot().armAngle, before, `Unit ${unit} arm should move`);
  }

  const slide = MasteryMotion.create(8);
  const slideBefore = slide.snapshot().slidePosition;
  slide.setMotorPower('slide', 0.8);
  slide.step(0.1);
  assert.notEqual(slide.snapshot().slidePosition, slideBefore, 'Unit 8 slide should move');
}

function testServosVisionAndPaths() {
  const servos = MasteryMotion.create(9);
  servos.setServoPosition('leftGrip', 0.75, 0.75);
  servos.setServoPosition('rightGrip', 0.25, 0.25);
  servos.setCRServoPower('intake', 1);
  const before = servos.snapshot().primaryAngle;
  servos.step(0.1);
  assert.deepEqual(servos.snapshot().servoValues, [0.75, 0.25]);
  assert.notEqual(servos.snapshot().primaryAngle, before);

  const vision = MasteryMotion.create(14);
  vision.setVisionActive(true);
  vision.step(0.1);
  assert.notEqual(vision.snapshot().cameraAngle, 0, 'Unit 14 camera should scan while vision is active');

  const pathing = MasteryMotion.create(15);
  pathing.startFollower();
  pathing.step(0.1);
  assert.ok(pathing.snapshot().pathProgress > 0, 'Unit 15 robot should advance when the follower runs');
}

function testMecanumDrive() {
  const motion = MasteryMotion.create(12);
  motion.setMotorPower('frontLeft', 1);
  motion.setMotorPower('backLeft', -1);
  motion.setMotorPower('frontRight', -1);
  motion.setMotorPower('backRight', 1);
  motion.step(0.1);
  assert.notEqual(motion.snapshot().x, 0, 'Unit 12 mecanum strafe should translate sideways');
}

function testChallengeSdkMocks() {
  const visionMotion = MasteryMotion.create(14);
  const sdk = {Range: function NativeDomRange() {}};
  MasteryMotion.installSdkMocks(sdk, visionMotion);
  assert.equal(sdk.Range.clip(2, -1, 1), 1);
  assert.equal(sdk.Range.scale(1.65, 0, 3.3, 0, 180), 90);
  const portal = new sdk.VisionPortal.Builder()
    .setCamera({name: 'Webcam 1'})
    .addProcessor(sdk.AprilTagProcessor.easyCreate())
    .build();
  assert.equal(visionMotion.snapshot().visionActive, true);
  portal.close();
  assert.equal(visionMotion.snapshot().visionActive, false);

  const pathMotion = MasteryMotion.create(15);
  const pathSdk = {};
  MasteryMotion.installSdkMocks(pathSdk, pathMotion);
  const follower = new pathSdk.Follower();
  const path = follower.pathBuilder()
    .addPath(new pathSdk.BezierLine(new pathSdk.Point(0, 0), new pathSdk.Point(1, 1)))
    .build();
  follower.followPath(path);
  follower.update();
  pathMotion.step(0.1);
  assert.ok(pathMotion.snapshot().pathProgress > 0);
}

testUnit4Drivetrain();
testUnit4StudentProgramEndToEnd();
testMotorDrivenMechanisms();
testServosVisionAndPaths();
testMecanumDrive();
testChallengeSdkMocks();
console.log('Mastery challenge motion tests passed');
