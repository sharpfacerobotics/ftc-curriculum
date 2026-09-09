const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
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

function testIndependentWheelOutputs() {
  const motion = MasteryMotion.create(4);
  motion.setMotorPower('leftFront', 0.9);
  motion.step(0.1);
  const angles = motion.snapshot().wheelAngles;
  assert.notEqual(angles[0], 0, 'the mapped left-front CAD wheel should spin');
  assert.equal(angles[1], 0, 'an unpowered left-back CAD wheel should remain still');
  assert.equal(angles[2], 0, 'an unpowered right-front CAD wheel should remain still');
  assert.equal(angles[3], 0, 'an unpowered right-back CAD wheel should remain still');
  assert.notEqual(motion.snapshot().heading, 0, 'one powered chassis side should rotate the robot');
}

function testEveryImportedRobotChassis() {
  for (let unit = 2; unit <= 15; unit++) {
    const motion = MasteryMotion.create(unit);
    motion.setMotorPower('leftFront', 0.7);
    motion.setMotorPower('leftBack', 0.7);
    motion.setMotorPower('rightFront', 0.7);
    motion.setMotorPower('rightBack', 0.7);
    const before = motion.snapshot();
    motion.step(0.1);
    const after = motion.snapshot();
    assert.notEqual(after.z, before.z, `Unit ${unit} imported chassis should translate`);
    assert.ok(after.wheelAngles.every((angle) => Math.abs(angle) > 0), `Unit ${unit} should animate all four CAD wheels`);
  }
}

function testUnit2KgDrivetrain() {
  const motion = MasteryMotion.create(2);
  motion.setMotorPower('leftFront', 0.75);
  motion.setMotorPower('leftBack', 0.75);
  motion.setMotorPower('rightFront', 0.75);
  motion.setMotorPower('rightBack', 0.75);
  const before = motion.snapshot();
  motion.step(0.1);
  const after = motion.snapshot();
  changed(before, after, 'z');
  assert.ok(after.wheelAngles.every((angle) => Math.abs(angle) > 0));
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

function testProvidedArcadeDriveProgramEndToEnd() {
  const source = `
    package org.firstinspires.ftc.teamcode;

    import com.qualcomm.robotcore.eventloop.opmode.OpMode;
    import com.qualcomm.robotcore.eventloop.opmode.TeleOp;
    import com.qualcomm.robotcore.hardware.DcMotor;
    import com.qualcomm.robotcore.hardware.DcMotorSimple;

    @TeleOp(name="Arcade_Drive_System")
    public class ArcadeDrive extends OpMode {
      private DcMotor leftFront, rightFront, leftBack, rightBack;
      private DcMotor[] allMotors;
      private final double DEADZONE = 0.1;

      @Override
      public void init() {
        leftFront = hardwareMap.get(DcMotor.class, "leftFront");
        rightFront = hardwareMap.get(DcMotor.class, "rightFront");
        leftBack = hardwareMap.get(DcMotor.class, "leftBack");
        rightBack = hardwareMap.get(DcMotor.class, "rightBack");
        rightFront.setDirection(DcMotorSimple.Direction.REVERSE);
        rightBack.setDirection(DcMotorSimple.Direction.REVERSE);
        allMotors = new DcMotor[]{leftFront, rightFront, leftBack, rightBack};
        for (DcMotor motor : allMotors) {
          motor.setZeroPowerBehavior(DcMotor.ZeroPowerBehavior.BRAKE);
          motor.setPower(0.0);
        }
      }

      @Override
      public void loop() {
        double x = gamepad1.left_stick_x;
        double y = -gamepad1.left_stick_y;
        if (Math.abs(x) < DEADZONE) x = 0;
        if (Math.abs(y) < DEADZONE) y = 0;
        double finalX = x * x * Math.signum(x);
        double finalY = y * y * Math.signum(y);
        double leftPower = finalY + finalX;
        double rightPower = finalY - finalX;
        double max = Math.max(Math.abs(leftPower), Math.abs(rightPower));
        if (max > 1.0) {
          leftPower /= max;
          rightPower /= max;
        }
        leftFront.setPower(leftPower);
        leftBack.setPower(leftPower);
        rightFront.setPower(rightPower);
        rightBack.setPower(rightPower);
      }
    }
  `;

  function run(gamepad1) {
    const motion = MasteryMotion.create(4);
    const runtime = TelemarkJava.createRuntime({
      gamepad1,
      onPower(power, device) { motion.setMotorPower(device.name, power); },
    });
    const compiled = TelemarkJava.compile(source, runtime);
    assert.equal(compiled.ok, true, compiled.diagnostics?.[0]?.message);
    compiled.methods.init();
    compiled.methods.loop();
    motion.step(0.1);
    return {motion, runtime};
  }

  const forward = run({left_stick_x: 0, left_stick_y: -1});
  assert.ok(forward.motion.snapshot().z < 0, 'provided arcade code should drive the chassis forward');
  assert.ok(
    forward.motion.snapshot().wheelAngles.every((angle) => angle > 0),
    'provided arcade code should advance every wheel animation state',
  );
  for (const motor of forward.runtime.devices.values()) {
    assert.equal(motor.getZeroPowerBehavior(), 'BRAKE');
  }

  const turning = run({left_stick_x: 1, left_stick_y: 0});
  assert.notEqual(turning.motion.snapshot().heading, 0, 'provided arcade code should rotate the chassis');
}

function testMotorDrivenMechanisms() {
  for (const unit of [3, 5]) {
    const motion = MasteryMotion.create(unit);
    motion.setMotorPower('intake', -0.7);
    motion.step(0.1);
    assert.equal(
      motion.snapshot().primaryPosition,
      0,
      `Unit ${unit} mechanism must not travel behind its initial retracted stop`,
    );
    const before = motion.snapshot().primaryPosition;
    motion.setMotorPower('intake', 0.7);
    motion.step(0.1);
    assert.notEqual(motion.snapshot().primaryPosition, before, `Unit ${unit} bounded mechanism should move`);
  }

  for (const unit of [7, 11]) {
    const roller = MasteryMotion.create(unit);
    const rollerBefore = roller.snapshot().primaryAngle;
    roller.setMotorPower(unit === 7 ? 'mechanism' : 'intake', 0.7);
    roller.step(0.1);
    assert.notEqual(roller.snapshot().primaryAngle, rollerBefore, `Unit ${unit} roller should rotate`);
  }

  for (const unit of [6, 13]) {
    const motion = MasteryMotion.create(unit);
    if (unit === 6) {
      motion.setMotorPower('arm', -0.7);
      motion.step(0.1);
      assert.equal(motion.snapshot().armAngle, 0, 'Unit 6 arm must not rotate behind its stowed stop');
    }
    const before = motion.snapshot().armAngle;
    motion.setMotorPower('arm', 0.7);
    motion.step(0.1);
    assert.notEqual(motion.snapshot().armAngle, before, `Unit ${unit} arm should move`);
  }

  const lift = MasteryMotion.create(8);
  const liftBefore = lift.snapshot().slidePosition;
  lift.setMotorPower('lift', 0.8);
  lift.step(0.1);
  assert.notEqual(lift.snapshot().slidePosition, liftBefore, 'Unit 8 DR4B lift should move');
}

function testResetPoseReturnsRobotToFieldCenter() {
  const motion = MasteryMotion.create(15);
  motion.setPose(2.2, -1.7, 1.25);
  motion.startFollower();
  motion.step(0.5);

  motion.resetPose();
  const reset = motion.snapshot();
  assert.equal(reset.x, 0);
  assert.equal(reset.z, 0);
  assert.equal(reset.heading, 0);
  assert.equal(reset.pathProgress, 0);
  assert.equal(reset.followerActive, false);
  assert.deepEqual(reset.wheelAngles, [0, 0, 0, 0]);
}

function testImportedMechanismEndpoints() {
  const unit5 = MasteryMotion.create(5);
  unit5.setMotorPower('intake', 1);
  for (let step = 0; step < 20; step++) unit5.step(0.1);
  assert.equal(unit5.snapshot().primaryPosition, 1, 'Unit 5 positive power must stop at the ground endpoint');
  unit5.setMotorPower('intake', -1);
  for (let step = 0; step < 20; step++) unit5.step(0.1);
  assert.equal(unit5.snapshot().primaryPosition, 0, 'Unit 5 negative power must return to the rear stop');

  const unit6 = MasteryMotion.create(6);
  unit6.setMotorPower('arm', 1);
  for (let step = 0; step < 20; step++) unit6.step(0.1);
  assert.equal(unit6.snapshot().armAngle, 0.65, 'Unit 6 positive power must stop at its safe arm endpoint');
  unit6.setMotorPower('arm', -1);
  for (let step = 0; step < 20; step++) unit6.step(0.1);
  assert.equal(unit6.snapshot().armAngle, 0, 'Unit 6 negative power must return to its stowed stop');
}

function testImportedRobotOutputReadouts() {
  const flywheel = MasteryMotion.create(3);
  flywheel.setMotorPower('flywheel', 0.65);
  flywheel.step(0.1);
  assert.equal(flywheel.outputs().primary, 0.65);

  const intake = MasteryMotion.create(5);
  intake.setMotorPower('intake', -0.7);
  intake.step(0.1);
  assert.equal(intake.outputs().primary, -0.7);

  const autonomous = MasteryMotion.create(6);
  autonomous.setMotorPower('leftDrive', 0.8);
  autonomous.setMotorPower('rightDrive', 0.6);
  autonomous.setMotorPower('arm', 0.5);
  const before = autonomous.snapshot();
  autonomous.step(0.1);
  const after = autonomous.snapshot();
  assert.notEqual(after.z, before.z, 'Unit 6 drive output should translate the imported robot');
  assert.notEqual(after.armAngle, before.armAngle, 'Unit 6 arm output should animate its mechanism rig');
  assert.equal(autonomous.outputs().arm, 0.5);
}

function testUnit5StudentProgramDrivesIntakeAndTelemetry() {
  const motion = MasteryMotion.create(5);
  const telemetry = [];
  const runtime = TelemarkJava.createRuntime({
    gamepad1: {a: true},
    onPower(power, device) { motion.setMotorPower(device.name, power); },
    onTelemetry(key, value) { telemetry.push([key, value]); },
  });
  const compiled = TelemarkJava.compile(`
    public class Unit5Mastery extends OpMode {
      DcMotor intake;
      public void init() {
        intake = hardwareMap.get(DcMotor.class, "intake");
      }
      public void loop() {
        if (gamepad1.a) intake.setPower(0.8);
        else intake.setPower(0);
        telemetry.addData("Intake", intake.getPower());
      }
    }
  `, runtime);
  assert.equal(compiled.ok, true, compiled.diagnostics?.[0]?.message);
  compiled.methods.init();
  compiled.methods.loop();
  motion.step(0.1);
  assert.notEqual(motion.snapshot().primaryPosition, 0, 'Unit 5 student motor code should deploy the intake rig');
  assert.deepEqual(telemetry, [['Intake', 0.8]], 'Unit 5 student telemetry should reach the runtime');
}

function testMechanismsHoldAndReverse() {
  for (const unit of [3, 5]) {
    const motion = MasteryMotion.create(unit);
    motion.setMotorPower('intake', 0.75);
    const positions = [];
    for (let step = 0; step < 30; step++) {
      motion.step(0.1);
      positions.push(motion.snapshot().primaryPosition);
    }
    positions.slice(1).forEach((position, index) => {
      assert.ok(position >= positions[index], `Unit ${unit} must not oscillate while power remains positive`);
    });

    motion.setMotorPower('intake', 0);
    const held = motion.snapshot().primaryPosition;
    motion.step(0.1);
    assert.equal(motion.snapshot().primaryPosition, held, `Unit ${unit} must hold after power returns to zero`);

    motion.setMotorPower('intake', -0.75);
    motion.step(0.1);
    assert.ok(motion.snapshot().primaryPosition < held, `Unit ${unit} must reverse only after negative power`);
  }

  for (const unit of [7, 11]) {
    const motion = MasteryMotion.create(unit);
    motion.setMotorPower(unit === 7 ? 'mechanism' : 'intake', 0.75);
    const angles = [];
    for (let step = 0; step < 30; step++) {
      motion.step(0.1);
      angles.push(motion.snapshot().primaryAngle);
    }
    angles.slice(1).forEach((angle, index) => {
      assert.ok(angle > angles[index], `Unit ${unit} roller must keep rotating in the commanded direction`);
    });

    motion.setMotorPower(unit === 7 ? 'mechanism' : 'intake', 0);
    const held = motion.snapshot().primaryAngle;
    motion.step(0.1);
    assert.equal(motion.snapshot().primaryAngle, held, `Unit ${unit} roller must stop without snapping backward`);

    motion.setMotorPower(unit === 7 ? 'mechanism' : 'intake', -0.75);
    motion.step(0.1);
    assert.ok(motion.snapshot().primaryAngle < held, `Unit ${unit} roller must reverse after negative power`);
  }
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

function testGeneratedChallengeMotionIsObservable() {
  const modular = MasteryMotion.create(13);
  const start = modular.snapshot();
  modular.setCRServoPower('intake', 0.8);
  modular.step(0.1);
  const moved = modular.snapshot();
  assert.notEqual(moved.primaryAngle, start.primaryAngle, 'Unit 13 intake needs visible rotor motion state');

  const visualSource = fs.readFileSync(path.resolve(__dirname, '../static/simulator/mastery_challenge.js'), 'utf8');
  for (const token of ['visibleRoller', 'mechanismLever', 'intakeSample', 'sensedSample', 'const transfer', 'const flywheel', 'mastery-motion-readout']) {
    assert.ok(visualSource.includes(token), `Generated challenge visuals are missing ${token}`);
  }
  assert.match(visualSource, /animation\(currentTime, dt\)/, 'visible game-piece motion must use frame time');
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

function testMecanumPhysicsBeginsAfterUnitEightLesson() {
  const wheelPowers = [
    ['leftFront', 0.8],
    ['leftBack', -0.8],
    ['rightFront', -0.8],
    ['rightBack', 0.8],
  ];

  const beforeMecanum = MasteryMotion.create(7);
  wheelPowers.forEach(([name, power]) => beforeMecanum.setMotorPower(name, power));
  beforeMecanum.step(0.1);
  assert.equal(beforeMecanum.snapshot().x, 0, 'pre-mecanum units should retain differential physics');

  for (let unit = 8; unit <= 15; unit += 1) {
    const motion = MasteryMotion.create(unit);
    wheelPowers.forEach(([name, power]) => motion.setMotorPower(name, power));
    motion.step(0.1);
    assert.notEqual(motion.snapshot().x, 0, `Unit ${unit} should use mecanum strafe physics`);
  }

  const liftOnly = MasteryMotion.create(8);
  liftOnly.setMotorPower('lift', 0.9);
  liftOnly.step(0.1);
  assert.equal(liftOnly.snapshot().x, 0, 'lift power must not move the mecanum chassis sideways');
  assert.equal(liftOnly.snapshot().z, 0, 'lift power must not drive the mecanum chassis');
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

testUnit2KgDrivetrain();
testUnit4Drivetrain();
testIndependentWheelOutputs();
testEveryImportedRobotChassis();
testUnit4StudentProgramEndToEnd();
testProvidedArcadeDriveProgramEndToEnd();
testMotorDrivenMechanisms();
testResetPoseReturnsRobotToFieldCenter();
testImportedMechanismEndpoints();
testImportedRobotOutputReadouts();
testUnit5StudentProgramDrivesIntakeAndTelemetry();
testMechanismsHoldAndReverse();
testServosVisionAndPaths();
testGeneratedChallengeMotionIsObservable();
testMecanumDrive();
testMecanumPhysicsBeginsAfterUnitEightLesson();
testChallengeSdkMocks();
console.log('Mastery challenge motion tests passed');
