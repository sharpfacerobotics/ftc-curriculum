/**
 * Code-driven mechanism state for the Unit 2-15 coding-challenge robots.
 *
 * The Three.js view consumes this state, while FTC hardware callbacks and the
 * small SDK mocks below are the only writers. This keeps every visible motion
 * tied to code the student actually ran.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TelemarkMasteryMotion = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, Number(value) || 0));
  }

  function normalizedName(name) {
    return String(name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function create(unit) {
    const motors = new Map();
    const servos = new Map();
    const crServos = new Map();
    const state = {
      x: 0,
      z: unit === 14 ? 0.65 : 0,
      heading: 0,
      wheelAngles: [0, 0, 0, 0],
      primaryAngle: 0,
      primaryPosition: 0,
      slidePosition: unit === 8 ? 0.72 : 1.25,
      armAngle: unit === 13 ? -0.55 : 0,
      cameraAngle: 0,
      pathProgress: 0,
      visionActive: false,
      followerActive: false,
      elapsed: 0,
      driveLeftPower: 0,
      driveRightPower: 0,
      primaryPower: 0,
      armPower: 0,
      lifecyclePhase: "stopped",
    };

    function setMotorPower(name, power) {
      if (!motors.has(name)) motors.set(name, 0);
      motors.set(name, clamp(power, -1, 1));
    }

    function setServoPosition(name, logical, physical) {
      if (!servos.has(name)) servos.set(name, 0);
      servos.set(name, clamp(physical == null ? logical : physical, 0, 1));
    }

    function setCRServoPower(name, power) {
      if (!crServos.has(name)) crServos.set(name, 0);
      crServos.set(name, clamp(power, -1, 1));
    }

    function motorEntries() {
      return Array.from(motors.entries());
    }

    function average(entries) {
      if (!entries.length) return 0;
      return entries.reduce(function (total, entry) { return total + entry[1]; }, 0) / entries.length;
    }

    function mechanismPower(pattern) {
      const entries = motorEntries();
      const match = entries.find(function (entry) { return pattern.test(normalizedName(entry[0])); });
      if (match) return match[1];
      if (entries.length !== 1) return 0;
      const name = normalizedName(entries[0][0]);
      const looksLikeDrive = /left|right|front|back|rear|drive|^(?:lf|fl|lb|bl|rf|fr|rb|br)/.test(name);
      return looksLikeDrive ? 0 : entries[0][1];
    }

    function drivetrainEntries() {
      const mechanismName = /intake|arm|lift|slide|turret|wrist|flywheel|shooter|roller|claw|grip|mechanism/;
      return motorEntries().filter(function (entry) {
        return !mechanismName.test(normalizedName(entry[0]));
      });
    }

    function drivetrainPowers() {
      const candidates = drivetrainEntries();
      let left = candidates.filter(function (entry) {
        const name = normalizedName(entry[0]);
        return name.includes("left") || /^(?:lf|fl)/.test(name);
      });
      let right = candidates.filter(function (entry) {
        const name = normalizedName(entry[0]);
        return name.includes("right") || /^(?:rf|fr)/.test(name);
      });
      if (!left.length && !right.length) {
        if (candidates.length >= 2) {
          const split = Math.ceil(candidates.length / 2);
          left = candidates.slice(0, split);
          right = candidates.slice(split);
        } else {
          left = candidates;
          right = candidates;
        }
      }
      const leftPower = average(left);
      const rightPower = average(right);
      const hasLeftWheelNames = left.some(function (entry) {
        return /front|back|rear|^(?:lf|fl|lb|bl|lr|rl)/.test(normalizedName(entry[0]));
      });
      const hasRightWheelNames = right.some(function (entry) {
        return /front|back|rear|^(?:rf|fr|rb|br|rr)/.test(normalizedName(entry[0]));
      });
      function named(pattern, fallback) {
        const found = candidates.find(function (entry) { return pattern.test(normalizedName(entry[0])); });
        return found ? found[1] : fallback;
      }
      return {
        left: leftPower,
        right: rightPower,
        entries: candidates,
        wheels: [
          named(/leftfront|frontleft|^lf|^fl/, hasLeftWheelNames ? 0 : leftPower),
          named(/leftback|backleft|rearleft|leftrear|^lb|^bl|^lr|^rl/, hasLeftWheelNames ? 0 : leftPower),
          named(/rightfront|frontright|^rf|^fr/, hasRightWheelNames ? 0 : rightPower),
          named(/rightback|backright|rearright|rightrear|^rb|^br|^rr/, hasRightWheelNames ? 0 : rightPower),
        ],
      };
    }

    function mecanumPowers() {
      const entries = drivetrainEntries();
      const leftEntries = entries.filter(function (entry) {
        const name = normalizedName(entry[0]);
        return name.includes("left") || /^(?:lf|fl|lb|bl)/.test(name);
      });
      const rightEntries = entries.filter(function (entry) {
        const name = normalizedName(entry[0]);
        return name.includes("right") || /^(?:rf|fr|rb|br)/.test(name);
      });
      const positional = !leftEntries.length && !rightEntries.length;
      const leftFallback = leftEntries.length
        ? average(leftEntries)
        : (entries[0] ? entries[0][1] : 0);
      const rightFallback = rightEntries.length
        ? average(rightEntries)
        : (entries[1] ? entries[1][1] : leftFallback);
      function named(pattern, fallback) {
        const found = entries.find(function (entry) { return pattern.test(normalizedName(entry[0])); });
        return found ? found[1] : fallback;
      }
      const fl = named(/leftfront|frontleft|^lf|^fl/, positional && entries.length >= 4 ? entries[0][1] : leftFallback);
      const bl = named(/leftback|backleft|^lb|^bl/, positional && entries.length >= 4 ? entries[1][1] : leftFallback);
      const fr = named(/rightfront|frontright|^rf|^fr/, positional && entries.length >= 4 ? entries[2][1] : rightFallback);
      const br = named(/rightback|backright|^rb|^br/, positional && entries.length >= 4 ? entries[3][1] : rightFallback);
      return {
        left: (fl + bl) / 2,
        right: (fr + br) / 2,
        forward: (fl + bl + fr + br) / 4,
        strafe: (fl - bl - fr + br) / 4,
        turn: (fl + bl - fr - br) / 4,
        wheels: [fl, bl, fr, br],
      };
    }

    function integrateDrive(dt, mecanum) {
      const powers = mecanum ? mecanumPowers() : drivetrainPowers();
      state.driveLeftPower = powers.left;
      state.driveRightPower = powers.right;
      const forward = mecanum ? powers.forward : (powers.left + powers.right) / 2;
      const strafe = mecanum ? powers.strafe : 0;
      const turn = mecanum ? powers.turn : (powers.left - powers.right) / 2;
      state.heading += turn * dt * 1.7;
      const speed = 1.65;
      state.x += (Math.sin(state.heading) * forward + Math.cos(state.heading) * strafe) * speed * dt;
      state.z += (-Math.cos(state.heading) * forward + Math.sin(state.heading) * strafe) * speed * dt;
      state.x = clamp(state.x, -2.7, 2.7);
      state.z = clamp(state.z, -2.7, 2.7);
      state.wheelAngles[0] += powers.wheels[0] * dt * 11;
      state.wheelAngles[1] += powers.wheels[1] * dt * 11;
      state.wheelAngles[2] += powers.wheels[2] * dt * 11;
      state.wheelAngles[3] += powers.wheels[3] * dt * 11;
    }

    function step(seconds) {
      const dt = clamp(seconds, 0, 0.1);
      state.elapsed += dt;
      const primaryPower = mechanismPower(/intake|flywheel|shooter|roller|mechanism/);
      const armPower = mechanismPower(/arm|lift|slide|turret|wrist/);
      const crPower = average(Array.from(crServos.entries()));
      state.primaryPower = primaryPower || crPower;
      state.armPower = armPower;

      if (unit === 3) {
        state.primaryPosition = clamp(state.primaryPosition + primaryPower * dt * 0.9, 0, 0.72);
      }
      // Unit 8.2 is where students configure and mix a mecanum drivetrain.
      // Every later coding-challenge robot uses the same four-wheel kinematics
      // as the mecanum team CAD shown in the simulator.
      integrateDrive(dt, unit >= 8);
      if (unit === 5) {
        state.primaryPosition = clamp(state.primaryPosition + primaryPower * dt * 1.25, 0, 1);
      }
      if (unit === 7) {
        state.primaryPosition = clamp(state.primaryPosition + primaryPower * dt * 0.9, -0.62, 0.62);
      }
      if (unit === 7 || unit === 11 || unit === 13) state.primaryAngle += primaryPower * dt * 12;
      if (unit === 6) {
        state.armAngle = clamp(state.armAngle + armPower * dt * 1.4, 0, 0.65);
      }
      if (unit === 13) {
        state.armAngle = clamp(state.armAngle + armPower * dt * 1.4, -0.55, 0.55);
      }
      if (unit === 8) {
        state.slidePosition = clamp(state.slidePosition + armPower * dt * 1.05, 0.72, 1.82);
      }
      if (unit === 9) state.primaryAngle += crPower * dt * 12;
      if (unit === 14 && state.visionActive) {
        state.cameraAngle = Math.sin(state.elapsed * 1.8) * 0.58;
      }
      if (unit === 15 && state.followerActive) {
        state.pathProgress = clamp(state.pathProgress + dt * 0.12, 0, 1);
        if (state.pathProgress >= 1) state.followerActive = false;
      }
      return state;
    }

    function servoValues() {
      return Array.from(servos.values());
    }

    function connectHardwareMap(hardwareMap) {
      if (!hardwareMap) return;
      if (typeof hardwareMap.onMotorPower === "function") hardwareMap.onMotorPower(setMotorPower);
      if (typeof hardwareMap.onServoPosition === "function") hardwareMap.onServoPosition(setServoPosition);
      if (typeof hardwareMap.onCRServoPower === "function") hardwareMap.onCRServoPower(setCRServoPower);
      if (typeof hardwareMap.onVisionState === "function") {
        hardwareMap.onVisionState(function (_name, active) { state.visionActive = Boolean(active); });
      }
    }

    function resetPose() {
      state.x = 0;
      state.z = 0;
      state.heading = 0;
      state.pathProgress = 0;
      state.followerActive = false;
      state.driveLeftPower = 0;
      state.driveRightPower = 0;
      state.wheelAngles = [0, 0, 0, 0];
      return state;
    }

    return {
      state,
      setMotorPower,
      setServoPosition,
      setCRServoPower,
      setVisionActive(active) { state.visionActive = Boolean(active); },
      startFollower() { state.pathProgress = 0; state.followerActive = true; },
      pulseFollowerUpdate() {
        if (state.followerActive) return;
        if (state.pathProgress > 0 && state.pathProgress < 1) state.followerActive = true;
      },
      setPose(x, z, heading) {
        state.x = clamp(x, -2.7, 2.7);
        state.z = clamp(z, -2.7, 2.7);
        state.heading = Number(heading) || 0;
      },
      resetPose,
      step,
      servoValues,
      connectHardwareMap,
      setLifecyclePhase(phase) { state.lifecyclePhase = String(phase || "stopped"); },
      outputs() {
        return {
          motors: Object.fromEntries(motorEntries()),
          servos: Object.fromEntries(servos.entries()),
          crServos: Object.fromEntries(crServos.entries()),
          driveLeft: state.driveLeftPower,
          driveRight: state.driveRightPower,
          primary: state.primaryPower,
          arm: state.armPower,
        };
      },
      snapshot() {
        return {
          ...state,
          wheelAngles: state.wheelAngles.slice(),
          servoValues: servoValues(),
        };
      },
    };
  }

  function installSdkMocks(globalObject, motion) {
    const target = globalObject || globalThis;
    target.Range = target.Range || {};
    target.Range.clip = function (value, min, max) { return clamp(value, Number(min), Number(max)); };
    target.Range.scale = function (value, oldMin, oldMax, newMin, newMax) {
      const ratio = (Number(value) - Number(oldMin)) / (Number(oldMax) - Number(oldMin));
      return Number(newMin) + ratio * (Number(newMax) - Number(newMin));
    };
    target.DistanceUnit = target.DistanceUnit || {MM: "MM", CM: "CM", METER: "METER", INCH: "INCH"};

    class RevHubOrientationOnRobot {
      constructor(logo, usb) { this.logo = logo; this.usb = usb; }
    }
    RevHubOrientationOnRobot.LogoFacingDirection = {UP: "UP", DOWN: "DOWN", FORWARD: "FORWARD", BACKWARD: "BACKWARD", LEFT: "LEFT", RIGHT: "RIGHT"};
    RevHubOrientationOnRobot.UsbFacingDirection = RevHubOrientationOnRobot.LogoFacingDirection;
    target.RevHubOrientationOnRobot = target.RevHubOrientationOnRobot || RevHubOrientationOnRobot;
    target.IMU = target.IMU || {};
    target.IMU.Parameters = target.IMU.Parameters || class Parameters {
      constructor(orientation) { this.orientationOnRobot = orientation; }
    };

    class Pose {
      constructor(x, y, heading) { this.x = Number(x) || 0; this.y = Number(y) || 0; this.heading = Number(heading) || 0; }
      getX() { return this.x; }
      getY() { return this.y; }
      getHeading() { return this.heading; }
    }
    class Point {
      constructor(x, y) { this.x = Number(x) || 0; this.y = Number(y) || 0; }
    }
    Point.CARTESIAN = "CARTESIAN";
    class BezierLine { constructor() { this.points = Array.from(arguments); } }
    class BezierCurve { constructor() { this.points = Array.from(arguments); } }
    class PathChain { constructor(paths) { this.paths = paths || []; } }
    class PathBuilder {
      constructor() { this.paths = []; }
      addPath(path) { this.paths.push(path); return this; }
      setLinearHeadingInterpolation() { return this; }
      setConstantHeadingInterpolation() { return this; }
      build() { return new PathChain(this.paths.slice()); }
    }
    class Follower {
      constructor() { this.pose = new Pose(0, 0, 0); this.busy = false; }
      setStartingPose(pose) { this.setPose(pose); }
      setPose(pose) {
        this.pose = pose || this.pose;
        motion.setPose(this.pose.x || 0, this.pose.y || 0, this.pose.heading || 0);
      }
      getPose() { return this.pose; }
      pathBuilder() { return new PathBuilder(); }
      followPath() { this.busy = true; motion.startFollower(); }
      update() { motion.pulseFollowerUpdate(); this.busy = motion.state.followerActive; }
      isBusy() { return this.busy; }
    }
    target.Pose = target.Pose || Pose;
    target.Point = target.Point || Point;
    target.BezierLine = target.BezierLine || BezierLine;
    target.BezierCurve = target.BezierCurve || BezierCurve;
    target.PathChain = target.PathChain || PathChain;
    target.Follower = target.Follower || Follower;

    class Rect { constructor(x, y, width, height) { Object.assign(this, {x, y, width, height}); } }
    class AprilTagProcessor {
      getDetections() { return [{id: 1, ftcPose: {x: 0, y: 24, yaw: 0}}]; }
      static easyCreate() { return new AprilTagProcessor(); }
      static get() { return new AprilTagProcessor(); }
    }
    AprilTagProcessor.Builder = class Builder {
      build() { return new AprilTagProcessor(); }
    };
    class VisionPortal {
      constructor() { this.closed = false; motion.setVisionActive(true); }
      close() { this.closed = true; motion.setVisionActive(false); }
    }
    VisionPortal.Builder = class Builder {
      setCamera(camera) { this.camera = camera; return this; }
      addProcessor(processor) { this.processor = processor; return this; }
      build() { return new VisionPortal(); }
    };
    target.Rect = target.Rect || Rect;
    target.AprilTagProcessor = target.AprilTagProcessor || AprilTagProcessor;
    target.VisionPortal = target.VisionPortal || VisionPortal;
  }

  return Object.freeze({create, installSdkMocks});
});
