const assert = require('node:assert/strict');
const TelemarkJava = require('../static/simulator/telemark-java.js');

function compile(source, runtime = {}) {
  const result = TelemarkJava.compile(source, runtime);
  assert.equal(result.ok, true, result.diagnostics?.[0]?.message);
  return result;
}

function testIterativeExecution() {
  const program = compile(`
    public class LifecycleTest extends OpMode {
      int count = 0;
      public void init() { count = 1; }
      public void init_loop() { count++; }
      public void start() { count += 10; }
      public void loop() {
        for (int i = 0; i < 3; i++) {
          if (i > 0) count += i;
        }
      }
      public void stop() { count = -1; }
    }
  `);

  program.methods.init();
  program.methods.init_loop();
  program.methods.start();
  program.methods.loop();
  assert.equal(program.scope.count, 15);
  program.methods.stop();
  assert.equal(program.scope.count, -1);
}

function testArraysAndEnhancedFor() {
  const program = compile(`
    public class ArrayTest extends OpMode {
      int total = 0;
      public void loop() {
        int[] values = new int[3];
        values[0] = 2;
        values[1] = 3;
        values[2] = 4;
        for (int value : values) {
          total += value;
        }
      }
    }
  `);
  program.methods.loop();
  assert.equal(program.scope.total, 9);
}

function testClassesAndInheritance() {
  const program = compile(`
    class Mechanism {
      int power = 0;
      void setPower(int nextPower) { power = nextPower; }
      int getPower() { return power; }
    }
    class Lift extends Mechanism {
      void stop() { power = 0; }
    }
    public class RobotTest extends OpMode {
      Lift lift;
      int measured;
      public void init() {
        lift = new Lift();
        lift.setPower(7);
        measured = lift.getPower();
      }
    }
  `);
  program.methods.init();
  assert.equal(program.scope.measured, 7);
}

function testEnumsAndSwitch() {
  const program = compile(`
    enum State { READY, RUNNING, DONE }
    public class StateTest extends OpMode {
      State state = State.READY;
      int result = 0;
      public void loop() {
        switch (state) {
          case READY:
            result = 1;
            break;
          default:
            result = 2;
        }
      }
    }
  `);
  program.methods.loop();
  assert.equal(program.scope.result, 1);
}

function testHardwareAndTelemetry() {
  let motorPower = 0;
  const telemetry = [];
  const runtime = TelemarkJava.createRuntime({
    gamepad: {a: true},
    onPower(power) {
      motorPower = power;
    },
    onTelemetry(key, value) {
      telemetry.push([key, value]);
    },
  });
  const program = compile(`
    public class HardwareTest extends OpMode {
      DcMotor motor;
      public void init() {
        motor = hardwareMap.get(DcMotor.class, "lift");
      }
      public void loop() {
        if (gamepad1.a) {
          motor.setPower(0.5);
        } else {
          motor.setPower(0.0);
        }
        telemetry.addData("Power", 0.5);
      }
    }
  `, runtime);
  program.methods.init();
  program.methods.loop();
  assert.equal(motorPower, 0.5);
  assert.deepEqual(telemetry, [['Power', 0.5]]);
}

async function testLifecycleController() {
  const events = [];
  const lifecycle = TelemarkJava.createLifecycle({
    tickMs: 5,
    runtime: {
      addTelemetry(key) {
        events.push(key);
      },
    },
  });
  const result = lifecycle.init(`
    public class LifecycleOrder extends OpMode {
      public void init() { telemetry.addData("init", 1); }
      public void init_loop() { telemetry.addData("init_loop", 1); }
      public void start() { telemetry.addData("start", 1); }
      public void loop() { telemetry.addData("loop", 1); }
      public void stop() { telemetry.addData("stop", 1); }
    }
  `);
  assert.equal(result.ok, true);
  await new Promise((resolve) => setTimeout(resolve, 12));
  lifecycle.start();
  await new Promise((resolve) => setTimeout(resolve, 12));
  lifecycle.stop();
  assert.equal(events[0], 'init');
  assert.ok(events.includes('init_loop'));
  assert.ok(events.indexOf('start') > events.indexOf('init_loop'));
  assert.ok(events.indexOf('loop') > events.indexOf('start'));
  assert.equal(events.at(-1), 'stop');
}

async function testLinearWaitForStart() {
  let releaseStart;
  let active = false;
  const events = [];
  const runtime = TelemarkJava.createRuntime({
    waitForStart: () => new Promise((resolve) => {
      releaseStart = resolve;
    }),
    opModeIsActive: () => active,
    onTelemetry: (key) => events.push(key),
  });
  const program = compile(`
    public class LinearTest extends LinearOpMode {
      public void runOpMode() {
        telemetry.addData("before", 1);
        waitForStart();
        telemetry.addData("after", 1);
      }
    }
  `, runtime);
  const running = program.methods.runOpMode();
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.deepEqual(events, ['before']);
  active = true;
  releaseStart();
  await running;
  assert.deepEqual(events, ['before', 'after']);
}

function testDiagnostics() {
  const result = TelemarkJava.compile(`
    public class Broken extends OpMode {
      public void loop() {
        if (true) {
      }
    }
  `);
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0].line > 0, true);
  assert.equal(result.diagnostics[0].column > 0, true);
}

async function main() {
  testIterativeExecution();
  testArraysAndEnhancedFor();
  testClassesAndInheritance();
  testEnumsAndSwitch();
  testHardwareAndTelemetry();
  await testLifecycleController();
  await testLinearWaitForStart();
  testDiagnostics();
  console.log('TelemarkJava tests passed');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
