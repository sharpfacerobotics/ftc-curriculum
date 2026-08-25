/**
 * Shared runtime for the Unit 2-15 comprehensive coding challenges.
 *
 * Each unit owns a small HTML entry point, while this adapter owns the editor,
 * compiler integration, requirement checks, telemetry, and visual summary.
 * simulator_base.js remains the sole owner of the simulator shell and lifecycle.
 */
(function (global) {
  "use strict";

  function shell(imports, annotation, className, parent) {
    const sdkImports = imports.slice();
    if (sdkImports.indexOf("import java.lang.Math;") === -1) {
      sdkImports.push("import java.lang.Math;");
    }
    return sdkImports.join("\n")
      + "\n\n" + annotation
      + "\npublic class " + className + " extends " + parent + " {\n\n}";
  }

  const CONFIGS = {
    2: {
      title: "Unit 2 Coding Challenge: Complete OpMode Lifecycle",
      scenario: "Build a competition TeleOp that registers correctly, reports a pre-match health check, resets its clock at Start, updates driver telemetry in every loop, and shuts down cleanly.",
      starter: shell([
        "import com.qualcomm.robotcore.eventloop.opmode.OpMode;",
        "import com.qualcomm.robotcore.eventloop.opmode.TeleOp;"
      ], "@TeleOp(name=\"Unit_2_Mastery\")", "Unit2Mastery", "OpMode"),
      inputs: ["a"],
      checks: [
        ["Use init() for one-time status setup", /\bvoid\s+init\s*\(\s*\)[\s\S]*?telemetry\s*\.\s*addData\s*\(/],
        ["Use init_loop() for a repeated telemetry health check", /\bvoid\s+init_loop\s*\(\s*\)[\s\S]*?telemetry\s*\.\s*addData\s*\(/],
        ["Create start() and reset the match clock", /\bvoid\s+start\s*\(\s*\)[\s\S]*?resetRuntime\s*\(/],
        ["Create loop() for repeated driver logic", /\bvoid\s+loop\s*\(\s*\)/],
        ["Report runtime and gamepad state through telemetry", /getRuntime\s*\(/, /gamepad1\s*\./, /telemetry\s*\.\s*addData\s*\(/],
        ["Create stop() with a shutdown telemetry message", /\bvoid\s+stop\s*\(\s*\)[\s\S]*?telemetry\s*\.\s*addData\s*\(/]
      ]
    },
    3: {
      title: "Unit 3 Coding Challenge: Robot State Variables",
      scenario: "Build a TeleOp that maps a motor by a String name, uses double power scaling, tracks an enabled boolean, counts completed actions with an int, and reports every value.",
      starter: shell([
        "import com.qualcomm.robotcore.eventloop.opmode.OpMode;",
        "import com.qualcomm.robotcore.eventloop.opmode.TeleOp;",
        "import com.qualcomm.robotcore.hardware.DcMotor;"
      ], "@TeleOp(name=\"Unit_3_Mastery\")", "Unit3Mastery", "OpMode"),
      inputs: ["a", "left_bumper", "left_stick_y"],
      checks: [
        ["Declare and use a String hardware name", /\bString\s+\w+\s*=\s*\"[^\"]+\"/, /hardwareMap\s*\.\s*get\s*\(\s*DcMotor\.class\s*,\s*\w+\s*\)/],
        ["Declare a double scale or power value", /\bdouble\s+\w+\s*=/],
        ["Declare and use a boolean mechanism state", /\bboolean\s+(\w+)\s*=[^;]+;[\s\S]*?(?:if\s*\(\s*\1\s*\)|\1\s*\?)/],
        ["Declare and update an int action counter", /\bint\s+(\w+)\s*=\s*\d+\s*;[\s\S]*?(?:\1\s*(?:\+\+|\+=)|\1\s*=\s*\1\s*\+\s*1)/],
        ["Combine gamepad input with the double scale", /gamepad1\s*\.[a-zA-Z_]+[\s\S]*?[*/+-][\s\S]*?\w+/],
        ["Command the mapped motor with the calculated value", /\.\s*setPower\s*\(\s*\w+\s*\)/],
        ["Report the variables through telemetry", /telemetry\s*\.\s*addData\s*\([^)]*\w+\s*\)/]
      ]
    },
    4: {
      title: "Unit 4 Coding Challenge: Driver-Controlled Drivetrain",
      scenario: "Build an arcade-drive TeleOp with a button-controlled mode, joystick deadzones, trigger-based speed limiting, signed sensitivity shaping, and normalized left/right motor commands.",
      starter: shell([
        "import com.qualcomm.robotcore.eventloop.opmode.OpMode;",
        "import com.qualcomm.robotcore.eventloop.opmode.TeleOp;",
        "import com.qualcomm.robotcore.hardware.DcMotor;",
        "import com.qualcomm.robotcore.util.Range;"
      ], "@TeleOp(name=\"Unit_4_Mastery\")", "Unit4Mastery", "OpMode"),
      inputs: ["a", "left_stick_y", "right_stick_x", "right_trigger"],
      checks: [
        ["Map left and right drive motors in init()", /\bvoid\s+init\s*\(\s*\)[\s\S]*?hardwareMap\s*\.\s*get[\s\S]*?hardwareMap\s*\.\s*get/],
        ["Read forward and turn joystick axes", /gamepad1\s*\.\s*left_stick_y/, /gamepad1\s*\.\s*right_stick_x/],
        ["Apply a joystick deadzone", /Math\s*\.\s*abs\s*\([^)]*stick[^)]*\)\s*[<>]=?\s*0?\.\d+/i],
        ["Use a trigger as an analog speed limit", /gamepad1\s*\.\s*(?:left|right)_trigger/],
        ["Create and call a signed sensitivity-curve method", /\bdouble\s+\w+\s*\(\s*double\s+\w+\s*\)[\s\S]*?(?:Math\s*\.\s*(?:signum|copySign)|\w+\s*\*\s*\w+)/],
        ["Toggle a drive mode only on a button press edge", /gamepad1\s*\.\s*[abxy]/, /(?:previous|last|was|old)\w*/i, /(?:gamepad1\s*\.\s*[abxy]\s*&&\s*!\s*\w+|!\s*\w+\s*&&\s*gamepad1\s*\.\s*[abxy])/],
        ["Calculate and clip left/right arcade power", /Range\s*\.\s*clip\s*\(/, /(?:left|right)\w*\s*=\s*[^;]*(?:forward|drive|y)[^;]*[+-][^;]*(?:turn|x)/i],
        ["Send power to both drivetrain motors", /\.\s*setPower\s*\([^)]*\)[\s\S]*?\.\s*setPower\s*\(/],
        ["Report final drive powers through telemetry", /telemetry\s*\.\s*addData\s*\([^)]*(?:power|left|right)/i]
      ]
    },
    5: {
      title: "Unit 5 Coding Challenge: Safe Intake Decision Tree",
      scenario: "Build one unambiguous intake controller that combines driver commands, comparison-based limits, and multiple sensor conditions, with an explicit safe output on every loop.",
      starter: shell([
        "import com.qualcomm.robotcore.eventloop.opmode.OpMode;",
        "import com.qualcomm.robotcore.eventloop.opmode.TeleOp;",
        "import com.qualcomm.robotcore.hardware.DcMotor;",
        "import com.qualcomm.robotcore.hardware.ColorSensor;",
        "import com.qualcomm.robotcore.hardware.DistanceSensor;",
        "import org.firstinspires.ftc.robotcore.external.navigation.DistanceUnit;"
      ], "@TeleOp(name=\"Unit_5_Mastery\")", "Unit5Mastery", "OpMode"),
      inputs: ["a", "b", "right_trigger"],
      checks: [
        ["Map the intake and both sensors", /hardwareMap\s*\.\s*get\s*\(\s*DcMotor\.class/, /hardwareMap\s*\.\s*get\s*\(\s*ColorSensor\.class/, /hardwareMap\s*\.\s*get\s*\(\s*DistanceSensor\.class/],
        ["Read distance and color values", /getDistance\s*\(\s*DistanceUnit\./, /\.\s*(?:red|blue)\s*\(\s*\)/],
        ["Use an if / else-if / else decision chain", /\bif\s*\(/, /\belse\s+if\s*\(/, /\belse\b/],
        ["Use comparison operators for thresholds", /(?:<=|>=|<|>)\s*\w*\d|(?:<=|>=|<|>)\s*\d/],
        ["Combine conditions with AND and OR", /&&/, /\|\|/],
        ["Use gamepad input in the decision tree", /gamepad1\s*\./],
        ["Include an explicit safe setPower(0) fallback", /\.\s*setPower\s*\(\s*0(?:\.0+)?\s*\)/],
        ["Report the chosen state through telemetry", /telemetry\s*\.\s*addData\s*\(/]
      ]
    },
    6: {
      title: "Unit 6 Coding Challenge: Non-Blocking Autonomous Loop",
      scenario: "Build a safe LinearOpMode that maps a motor array, initializes it with iteration, and runs simultaneous timed actions without sleep or an unbounded loop.",
      starter: shell([
        "import com.qualcomm.robotcore.eventloop.opmode.LinearOpMode;",
        "import com.qualcomm.robotcore.eventloop.opmode.Autonomous;",
        "import com.qualcomm.robotcore.hardware.DcMotor;"
      ], "@Autonomous(name=\"Unit_6_Mastery\")", "Unit6Mastery", "LinearOpMode"),
      inputs: [],
      checks: [
        ["Implement runOpMode() and call waitForStart()", /\bvoid\s+runOpMode\s*\(\s*\)/, /waitForStart\s*\(/],
        ["Create and populate a DcMotor array", /DcMotor\s*\[\s*\]\s+\w+/, /hardwareMap\s*\.\s*get\s*\(\s*DcMotor\.class/],
        ["Use a for loop for fixed-count work", /for\s*\(\s*int\s+\w+\s*=/],
        ["Use a for-each loop over the motor array", /for\s*\(\s*DcMotor\s+\w+\s*:\s*\w+\s*\)/],
        ["Guard repeated work with opModeIsActive()", /while\s*\([^)]*opModeIsActive\s*\(\s*\)/],
        ["Create a non-blocking getRuntime() deadline", /\bdouble\s+\w+\s*=\s*getRuntime\s*\(\s*\)\s*\+/, /getRuntime\s*\(\s*\)\s*[<>]=?\s*\w+/],
        ["Keep telemetry updating inside the active loop", /while\s*\([^)]*opModeIsActive[\s\S]*?telemetry\s*\.\s*update\s*\(/],
        ["Stop every motor after the loop", /\.\s*setPower\s*\(\s*0(?:\.0+)?\s*\)/]
      ],
      forbidden: [["Do not block parallel work with sleep()", /\bsleep\s*\(/], ["Do not use while(true)", /while\s*\(\s*true\s*\)/]]
    },
    7: {
      title: "Unit 7 Coding Challenge: Reusable Hardware Subsystem",
      scenario: "Build a TeleOp with centralized configuration names and a reusable nested mechanism class that maps a motor, a digital limit, and an analog sensor exactly once.",
      starter: shell([
        "import com.qualcomm.robotcore.eventloop.opmode.OpMode;",
        "import com.qualcomm.robotcore.eventloop.opmode.TeleOp;",
        "import com.qualcomm.robotcore.hardware.DcMotor;",
        "import com.qualcomm.robotcore.hardware.DigitalChannel;",
        "import com.qualcomm.robotcore.hardware.AnalogInput;",
        "import com.qualcomm.robotcore.hardware.HardwareMap;"
      ], "@TeleOp(name=\"Unit_7_Mastery\")", "Unit7Mastery", "OpMode"),
      inputs: ["left_stick_y"],
      checks: [
        ["Centralize hardware names as constants and use them for mapping", /static\s+final\s+String\s+\w+\s*=\s*\"[^\"]+\"/, /\.\s*get\s*\(\s*DcMotor\.class\s*,\s*[A-Z][A-Z0-9_]*\s*\)/],
        ["Create a reusable mechanism class", /class\s+\w*(?:Mechanism|Subsystem|System)\b/],
        ["Give the mechanism an init(HardwareMap) method", /\bvoid\s+init\s*\(\s*HardwareMap\s+\w+\s*\)/],
        ["Map a DcMotor through the supplied HardwareMap", /\w+\s*\.\s*get\s*\(\s*DcMotor\.class\s*,/],
        ["Map a DigitalChannel and set INPUT mode", /\w+\s*\.\s*get\s*\(\s*DigitalChannel\.class\s*,/, /setMode\s*\(\s*DigitalChannel\.Mode\.INPUT\s*\)/],
        ["Map and read an AnalogInput", /\w+\s*\.\s*get\s*\(\s*AnalogInput\.class\s*,/, /getVoltage\s*\(/],
        ["Initialize the mechanism once from OpMode init()", /\bvoid\s+init\s*\(\s*\)[\s\S]*?\.\s*init\s*\(\s*hardwareMap\s*\)/],
        ["Delegate gamepad control to a mechanism method", /\bvoid\s+loop\s*\(\s*\)[\s\S]*?gamepad1\s*\.[\s\S]*?\.\s*\w+\s*\(/],
        ["Stop the motor when the digital limit blocks motion", /getState\s*\(\s*\)/, /setPower\s*\(\s*0(?:\.0+)?\s*\)/]
      ]
    },
    8: {
      title: "Unit 8 Coding Challenge: Limit-Safe Linear Slide",
      scenario: "Build a two-way slide controller that maps one motor and two limits, corrects direction, selects braking, accepts proportional driver power, and always stops at a limit.",
      starter: shell([
        "import com.qualcomm.robotcore.eventloop.opmode.OpMode;",
        "import com.qualcomm.robotcore.eventloop.opmode.TeleOp;",
        "import com.qualcomm.robotcore.hardware.DcMotor;",
        "import com.qualcomm.robotcore.hardware.DcMotorSimple;",
        "import com.qualcomm.robotcore.hardware.DigitalChannel;"
      ], "@TeleOp(name=\"Unit_8_Mastery\")", "Unit8Mastery", "OpMode"),
      inputs: ["left_stick_y"],
      checks: [
        ["Map the slide motor and both limit switches", /hardwareMap\s*\.\s*get\s*\(\s*DcMotor\.class/, /hardwareMap\s*\.\s*get\s*\(\s*DigitalChannel\.class[\s\S]*?hardwareMap\s*\.\s*get\s*\(\s*DigitalChannel\.class/],
        ["Configure both digital channels as inputs", /setMode\s*\(\s*DigitalChannel\.Mode\.INPUT\s*\)[\s\S]*?setMode\s*\(\s*DigitalChannel\.Mode\.INPUT\s*\)/],
        ["Correct the motor direction with REVERSE", /setDirection\s*\([^)]*Direction\.REVERSE\s*\)/],
        ["Select BRAKE zero-power behavior", /setZeroPowerBehavior\s*\(\s*DcMotor\.ZeroPowerBehavior\.BRAKE\s*\)/],
        ["Read proportional joystick power", /gamepad1\s*\.\s*left_stick_y/],
        ["Use upper and lower limit states in direction checks", /getState\s*\(\s*\)[\s\S]*?getState\s*\(\s*\)/, /[<>]\s*0/],
        ["Command motion in both directions", /setPower\s*\([^)]*\)[\s\S]*?setPower\s*\([^)]*\)/],
        ["Stop explicitly when motion is unsafe", /setPower\s*\(\s*0(?:\.0+)?\s*\)/],
        ["Report slide power and both limits through telemetry", /telemetry\s*\.\s*addData\s*\([^)]*(?:power|slide)[^)]*\)[\s\S]*?telemetry\s*\.\s*addData\s*\(/i]
      ]
    },
    9: {
      title: "Unit 9 Coding Challenge: Coordinated Servo Mechanism",
      scenario: "Build a TeleOp for a mirrored dual-servo gripper and CRServo intake, including safe travel ranges, direction correction, discrete positions, and a neutral intake state.",
      starter: shell([
        "import com.qualcomm.robotcore.eventloop.opmode.OpMode;",
        "import com.qualcomm.robotcore.eventloop.opmode.TeleOp;",
        "import com.qualcomm.robotcore.hardware.Servo;",
        "import com.qualcomm.robotcore.hardware.CRServo;"
      ], "@TeleOp(name=\"Unit_9_Mastery\")", "Unit9Mastery", "OpMode"),
      inputs: ["a", "b", "left_bumper", "right_bumper"],
      checks: [
        ["Map two positional servos and one CRServo", /hardwareMap\s*\.\s*get\s*\(\s*Servo\.class[\s\S]*?hardwareMap\s*\.\s*get\s*\(\s*Servo\.class/, /hardwareMap\s*\.\s*get\s*\(\s*CRServo\.class/],
        ["Limit both positional servo ranges", /scaleRange\s*\([^)]*\)[\s\S]*?scaleRange\s*\(/],
        ["Reverse one mirrored servo", /setDirection\s*\(\s*Servo\.Direction\.REVERSE\s*\)/],
        ["Use A and B for separate open and closed positions", /gamepad1\s*\.\s*a[\s\S]*?setPosition\s*\(/, /gamepad1\s*\.\s*b[\s\S]*?setPosition\s*\(/],
        ["Command both gripper servos together", /setPosition\s*\([^)]*\)[\s\S]*?setPosition\s*\(/],
        ["Run the CRServo forward and reverse", /setPower\s*\(\s*(?:1(?:\.0+)?|0\.\d+)\s*\)/, /setPower\s*\(\s*-(?:1(?:\.0+)?|0\.\d+)\s*\)/],
        ["Give the CRServo a neutral zero-power state", /setPower\s*\(\s*0(?:\.0+)?\s*\)/],
        ["Report gripper and intake state through telemetry", /telemetry\s*\.\s*addData\s*\([^)]*(?:grip|servo|intake)/i]
      ]
    },
    10: {
      title: "Unit 10 Coding Challenge: Encoder Distance Autonomous",
      scenario: "Build an autonomous drive that converts distance to encoder ticks, resets encoders, uses RUN_TO_POSITION safely, reports progress, stops, and restores closed-loop velocity mode.",
      starter: shell([
        "import com.qualcomm.robotcore.eventloop.opmode.LinearOpMode;",
        "import com.qualcomm.robotcore.eventloop.opmode.Autonomous;",
        "import com.qualcomm.robotcore.hardware.DcMotor;"
      ], "@Autonomous(name=\"Unit_10_Mastery\")", "Unit10Mastery", "LinearOpMode"),
      inputs: [],
      checks: [
        ["Declare ticks-per-revolution and wheel-size constants", /static\s+final\s+(?:double|int)\s+\w*(?:TICK|COUNTS)\w*\s*=/i, /static\s+final\s+double\s+\w*(?:WHEEL|DIAMETER|CIRCUMFERENCE)\w*\s*=/i],
        ["Convert a requested distance into target ticks", /Math\s*\.\s*(?:PI|round)/, /(?:tick|count)/i],
        ["Reset the drive encoders", /STOP_AND_RESET_ENCODER/],
        ["Set target positions on the drive motors", /setTargetPosition\s*\(/],
        ["Switch into RUN_TO_POSITION", /RUN_TO_POSITION/],
        ["Guard the motion loop with active and busy checks", /opModeIsActive\s*\(\s*\)/, /isBusy\s*\(\s*\)/],
        ["Read and report current encoder positions", /getCurrentPosition\s*\(/, /telemetry\s*\.\s*addData\s*\(/],
        ["Stop the motors and restore RUN_USING_ENCODER", /setPower\s*\(\s*0(?:\.0+)?\s*\)/, /RUN_USING_ENCODER/]
      ]
    },
    11: {
      title: "Unit 11 Coding Challenge: Multi-Sensor Intake",
      scenario: "Build a sensor-gated intake that combines a digital limit, scaled potentiometer angle, color classification, and distance threshold while continuously reporting raw and interpreted values.",
      starter: shell([
        "import com.qualcomm.robotcore.eventloop.opmode.OpMode;",
        "import com.qualcomm.robotcore.eventloop.opmode.TeleOp;",
        "import com.qualcomm.robotcore.hardware.DcMotor;",
        "import com.qualcomm.robotcore.hardware.DigitalChannel;",
        "import com.qualcomm.robotcore.hardware.AnalogInput;",
        "import com.qualcomm.robotcore.hardware.ColorSensor;",
        "import com.qualcomm.robotcore.hardware.DistanceSensor;",
        "import com.qualcomm.robotcore.util.Range;",
        "import org.firstinspires.ftc.robotcore.external.navigation.DistanceUnit;"
      ], "@TeleOp(name=\"Unit_11_Mastery\")", "Unit11Mastery", "OpMode"),
      inputs: ["right_trigger"],
      checks: [
        ["Map the motor and all four sensor types", /hardwareMap\s*\.\s*get\s*\(\s*DcMotor\.class/, /DigitalChannel\.class/, /AnalogInput\.class/, /ColorSensor\.class/, /DistanceSensor\.class/],
        ["Configure and read the digital touch input", /DigitalChannel\.Mode\.INPUT/, /getState\s*\(/],
        ["Scale potentiometer voltage into an angle", /getVoltage\s*\(/, /Range\s*\.\s*scale\s*\(/],
        ["Compare red and blue color channels", /\.\s*red\s*\(\s*\)/, /\.\s*blue\s*\(\s*\)/, /[<>]/],
        ["Read distance in a named unit", /getDistance\s*\(\s*DistanceUnit\./],
        ["Gate intake power with combined sensor conditions", /(?:&&|\|\|)/, /setPower\s*\(/],
        ["Stop the intake when the gate is closed", /setPower\s*\(\s*0(?:\.0+)?\s*\)/],
        ["Report raw readings and interpreted state", /telemetry\s*\.\s*addData\s*\([^)]*\)[\s\S]*?telemetry\s*\.\s*addData\s*\(/]
      ]
    },
    12: {
      title: "Unit 12 Coding Challenge: IMU Field-Centric Drive",
      scenario: "Build field-centric mecanum control that initializes hub orientation, reads yaw, pitch, and roll, resets heading on command, detects tipping, normalizes wheel power, and applies heading correction.",
      starter: shell([
        "import com.qualcomm.robotcore.eventloop.opmode.OpMode;",
        "import com.qualcomm.robotcore.eventloop.opmode.TeleOp;",
        "import com.qualcomm.hardware.rev.RevHubOrientationOnRobot;",
        "import com.qualcomm.robotcore.hardware.DcMotor;",
        "import com.qualcomm.robotcore.hardware.IMU;",
        "import org.firstinspires.ftc.robotcore.external.navigation.AngleUnit;",
        "import org.firstinspires.ftc.robotcore.external.navigation.YawPitchRollAngles;"
      ], "@TeleOp(name=\"Unit_12_Mastery\")", "Unit12Mastery", "OpMode"),
      inputs: ["a", "left_stick_x", "left_stick_y", "right_stick_x"],
      checks: [
        ["Map and initialize the IMU with hub orientation", /hardwareMap\s*\.\s*get\s*\(\s*IMU\.class/, /new\s+RevHubOrientationOnRobot\s*\(/, /\.\s*initialize\s*\(/],
        ["Read YawPitchRollAngles", /getRobotYawPitchRollAngles\s*\(/],
        ["Read yaw, pitch, and roll in AngleUnit", /getYaw\s*\(\s*AngleUnit\./, /getPitch\s*\(\s*AngleUnit\./, /getRoll\s*\(\s*AngleUnit\./],
        ["Reset yaw from a gamepad command", /gamepad1\s*\.[abxy][\s\S]*?resetYaw\s*\(/],
        ["Rotate joystick input with sine and cosine", /Math\s*\.\s*cos\s*\(/, /Math\s*\.\s*sin\s*\(/],
        ["Calculate and normalize four wheel powers", /Math\s*\.\s*max\s*\(/, /setPower\s*\([^)]*\)[\s\S]*?setPower\s*\([^)]*\)[\s\S]*?setPower\s*\([^)]*\)[\s\S]*?setPower\s*\(/],
        ["Use pitch or roll to detect a tip condition", /Math\s*\.\s*abs\s*\([^)]*(?:pitch|roll)[^)]*\)\s*[<>]=?/i],
        ["Apply a yaw error correction or heading target", /(?:target|error|correction|heading)[\s\S]*?[*/+-]/i],
        ["Report orientation through telemetry", /telemetry\s*\.\s*addData\s*\([^)]*(?:yaw|pitch|roll|heading)/i]
      ]
    },
    13: {
      title: "Unit 13 Coding Challenge: Modular Robot Architecture",
      scenario: "Build a complete TeleOp architecture with encapsulated subsystem state, inherited behavior, an override, shared constants, and one composed Robot object.",
      starter: shell([
        "import com.qualcomm.robotcore.eventloop.opmode.OpMode;",
        "import com.qualcomm.robotcore.eventloop.opmode.TeleOp;",
        "import com.qualcomm.robotcore.hardware.DcMotor;",
        "import com.qualcomm.robotcore.hardware.Servo;",
        "import com.qualcomm.robotcore.hardware.HardwareMap;"
      ], "@TeleOp(name=\"Unit_13_Mastery\")", "Unit13Mastery", "OpMode"),
      inputs: ["a", "left_stick_y"],
      checks: [
        ["Encapsulate subsystem hardware in private fields", /class\s+\w*(?:Mechanism|Subsystem)[\s\S]*?private\s+(?:DcMotor|Servo)\s+\w+/],
        ["Create a reusable parent mechanism class", /class\s+(?:Base|Abstract)\w+/],
        ["Create a child subsystem with extends", /class\s+\w+\s+extends\s+(?:Base|Abstract)\w+/],
        ["Override specialized behavior with @Override", /@Override[\s\S]*?(?:void|double|boolean|int)\s+\w+\s*\(/],
        ["Store shared configuration as static final constants", /static\s+final\s+(?:String|double|int)\s+\w+\s*=/],
        ["Compose subsystems inside a Robot class", /class\s+\w*Robot\b[\s\S]*?(?:Mechanism|Subsystem)\s+\w+/],
        ["Initialize the composed Robot with HardwareMap", /class\s+\w*Robot\b[\s\S]*?\bvoid\s+init\s*\(\s*HardwareMap\s+\w+\s*\)/],
        ["Use the Robot object from OpMode init() and loop()", /\bvoid\s+init\s*\(\s*\)[\s\S]*?\.\s*init\s*\(\s*hardwareMap\s*\)/, /\bvoid\s+loop\s*\(\s*\)[\s\S]*?robot\s*\./i],
        ["Provide a cleanup path that stops powered hardware", /\b(?:stop|shutdown|close)\s*\(\s*\)[\s\S]*?setPower\s*\(\s*0(?:\.0+)?\s*\)/]
      ]
    },
    14: {
      title: "Unit 14 Coding Challenge: Vision-Guided Autonomous",
      scenario: "Build an autonomous vision pipeline that opens a webcam through VisionPortal, processes AprilTags and pose, classifies OpenCV zones, reports a stable selection, and releases camera resources.",
      starter: shell([
        "import com.qualcomm.robotcore.eventloop.opmode.LinearOpMode;",
        "import com.qualcomm.robotcore.eventloop.opmode.Autonomous;",
        "import com.qualcomm.robotcore.hardware.WebcamName;",
        "import org.firstinspires.ftc.vision.VisionPortal;",
        "import org.firstinspires.ftc.vision.apriltag.AprilTagDetection;",
        "import org.firstinspires.ftc.vision.apriltag.AprilTagProcessor;",
        "import org.opencv.core.Rect;"
      ], "@Autonomous(name=\"Unit_14_Mastery\")", "Unit14Mastery", "LinearOpMode"),
      inputs: [],
      checks: [
        ["Map the configured webcam", /hardwareMap\s*\.\s*get\s*\(\s*WebcamName\.class\s*,\s*\"[^\"]+\"\s*\)/],
        ["Build an AprilTagProcessor", /AprilTagProcessor\s*\.\s*(?:easyCreate|get|Builder)|new\s+AprilTagProcessor\.Builder/],
        ["Build a VisionPortal with camera and processor", /new\s+VisionPortal\.Builder\s*\(\s*\)/, /setCamera\s*\(/, /addProcessor\s*\(/, /build\s*\(/],
        ["Iterate over current AprilTag detections", /getDetections\s*\(\s*\)/, /for\s*\(\s*AprilTagDetection\s+\w+\s*:/],
        ["Read a detection ID and pose values safely", /\.\s*id\b/, /\.\s*ftcPose\s*\./, /\bif\s*\([^)]*(?:detection|ftcPose|isEmpty|size)/i],
        ["Define multiple OpenCV Rect zones", /new\s+Rect\s*\([^)]*\)[\s\S]*?new\s+Rect\s*\(/],
        ["Classify at least three autonomous zones", /(?:LEFT|CENTER|RIGHT)[\s\S]*?(?:LEFT|CENTER|RIGHT)[\s\S]*?(?:LEFT|CENTER|RIGHT)/],
        ["Report the selected zone before Start", /while\s*\([^)]*(?:isStarted|isStopRequested)[\s\S]*?telemetry\s*\.\s*addData\s*\(/],
        ["Close VisionPortal when vision work is done", /\.\s*close\s*\(\s*\)/]
      ]
    },
    15: {
      title: "Unit 15 Coding Challenge: Full Sensor-Fused Autonomous",
      scenario: "Build a non-blocking autonomous that combines Limelight validation, Pedro Pathing updates, Bézier paths, absolute pose correction, and a timed mechanism state machine.",
      starter: shell([
        "import com.qualcomm.robotcore.eventloop.opmode.LinearOpMode;",
        "import com.qualcomm.robotcore.eventloop.opmode.Autonomous;",
        "import com.qualcomm.hardware.limelightvision.Limelight3A;",
        "import com.qualcomm.hardware.limelightvision.LLResult;",
        "import com.qualcomm.robotcore.hardware.Servo;",
        "import com.pedropathing.follower.Follower;",
        "import com.pedropathing.localization.Pose;",
        "import com.pedropathing.pathgen.BezierCurve;",
        "import com.pedropathing.pathgen.BezierLine;",
        "import com.pedropathing.pathgen.PathChain;",
        "import com.pedropathing.pathgen.Point;"
      ], "@Autonomous(name=\"Unit_15_Mastery\")", "Unit15Mastery", "LinearOpMode"),
      inputs: [],
      checks: [
        ["Map, select, and start the Limelight pipeline", /hardwareMap\s*\.\s*get\s*\(\s*Limelight3A\.class/, /pipelineSwitch\s*\(\s*\d+\s*\)/, /\.\s*start\s*\(\s*\)/],
        ["Create a Follower and set its starting Pose", /new\s+Follower\s*\(/, /setStartingPose\s*\(\s*new\s+Pose\s*\(/],
        ["Build both a Bézier line and curve into a PathChain", /new\s+BezierLine\s*\(/, /new\s+BezierCurve\s*\(/, /PathChain/],
        ["Use a named enum state machine", /enum\s+\w+/, /switch\s*\(/, /case\s+\w+\s*:/],
        ["Call follower.update() every active loop", /while\s*\([^)]*opModeIsActive[\s\S]*?follower\s*\.\s*update\s*\(/],
        ["Validate LLResult before reading target data", /getLatestResult\s*\(/, /\.\s*isValid\s*\(\s*\)/],
        ["Fuse a valid vision pose back into the Follower", /getBotpose\s*\(/, /follower\s*\.\s*setPose\s*\(/],
        ["Coordinate a Servo without blocking path updates", /Servo\.class/, /\.\s*setPosition\s*\(/, /getRuntime\s*\(/],
        ["Stop the Limelight and report final state", /limelight\s*\.\s*stop\s*\(/i, /telemetry\s*\.\s*addData\s*\(/]
      ],
      forbidden: [["Do not block follower updates with sleep()", /\bsleep\s*\(/]]
    }
  };

  const ROBOT_PROFILES = Object.freeze({
    2: {name: "Lifecycle diagnostics robot", detail: "Status tower, Control Hub, and pre-match health lights", accent: 0x22d3ee},
    3: {name: "Variable-power test robot", detail: "Single-motor flywheel for power, state, and count telemetry", accent: 0x38bdf8},
    4: {name: "Arcade-drive robot", detail: "Two-sided drivetrain configured for mixed forward and turn input", accent: 0x60a5fa},
    5: {name: "Sensor-safe intake robot", detail: "Front roller and guides for the intake decision tree", accent: 0xf59e0b},
    6: {name: "Non-blocking autonomous robot", detail: "Drivetrain and moving arm that must operate in parallel", accent: 0xa78bfa},
    7: {name: "Reusable subsystem robot", detail: "Mapped motor, limit switch, and analog sensor module", accent: 0x2dd4bf},
    8: {name: "Limit-safe slide robot", detail: "Twin slide rails, moving carriage, and upper/lower limits", accent: 0xfb7185},
    9: {name: "Servo gripper robot", detail: "Mirrored fingers with a continuous-rotation intake roller", accent: 0xf472b6},
    10: {name: "Encoder distance robot", detail: "Marked drive wheels for measured RUN_TO_POSITION travel", accent: 0x4ade80},
    11: {name: "Multi-sensor intake robot", detail: "Touch, potentiometer, color, and distance sensing around the intake", accent: 0xfbbf24},
    12: {name: "Field-centric mecanum robot", detail: "Four-wheel drive with a visible Control Hub IMU and orientation axes", accent: 0x818cf8},
    13: {name: "Modular architecture robot", detail: "Color-coded drive, lift, and gripper subsystems composed together", accent: 0xc084fc},
    14: {name: "Vision-guided robot", detail: "Camera mast facing three autonomous analysis zones", accent: 0x22c55e},
    15: {name: "Sensor-fused autonomous robot", detail: "Limelight, path follower, and timed scoring arm on one platform", accent: 0x06b6d4}
  });

  function createChallengeRobot(unit, challengeMotion) {
    const THREE = global.THREE;
    const scene = global.scene;
    const profile = ROBOT_PROFILES[unit];
    if (!THREE || !scene || !profile) return null;
    const motion = challengeMotion || global.TelemarkMasteryMotion.create(unit);

    const oldVisual = scene.getObjectByName && scene.getObjectByName("mastery-challenge-visual");
    if (oldVisual) scene.remove(oldVisual);

    const visual = new THREE.Group();
    visual.name = "mastery-challenge-visual";
    const robot = new THREE.Group();
    robot.name = "unit-" + unit + "-challenge-robot";
    visual.add(robot);
    scene.add(visual);

    function material(color, options) {
      const settings = options || {};
      return new THREE.MeshPhongMaterial({
        color: color,
        emissive: settings.emissive || 0x000000,
        emissiveIntensity: settings.emissiveIntensity || 0,
        shininess: settings.shininess == null ? 55 : settings.shininess,
        transparent: Boolean(settings.transparent),
        opacity: settings.opacity == null ? 1 : settings.opacity,
        side: settings.side
      });
    }

    const frameMat = material(0xb8c4cc, {shininess: 85});
    const darkMat = material(0x18232d, {shininess: 35});
    const tireMat = material(0x111318, {shininess: 10});
    const accentMat = material(profile.accent, {emissive: profile.accent, emissiveIntensity: 0.08});
    const warningMat = material(0xfbbf24, {emissive: 0x6b4500, emissiveIntensity: 0.22});
    const sensorMat = material(0x0f172a, {shininess: 95});
    const redMat = material(0xef4444, {emissive: 0x7f1d1d, emissiveIntensity: 0.2});
    const greenMat = material(0x22c55e, {emissive: 0x14532d, emissiveIntensity: 0.22});
    const blueMat = material(0x3b82f6, {emissive: 0x1e3a8a, emissiveIntensity: 0.22});

    function mesh(geometry, meshMaterial, position, rotation, parent) {
      const item = new THREE.Mesh(geometry, meshMaterial);
      const xyz = position || [0, 0, 0];
      const rxyz = rotation || [0, 0, 0];
      item.position.set(xyz[0], xyz[1], xyz[2]);
      item.rotation.set(rxyz[0], rxyz[1], rxyz[2]);
      item.castShadow = true;
      item.receiveShadow = true;
      (parent || robot).add(item);
      return item;
    }

    function box(size, position, meshMaterial, parent, rotation) {
      return mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), meshMaterial, position, rotation, parent);
    }

    function cylinder(radius, depth, position, meshMaterial, rotation, parent, segments) {
      return mesh(
        new THREE.CylinderGeometry(radius, radius, depth, segments || 20),
        meshMaterial,
        position,
        rotation,
        parent
      );
    }

    function sphere(radius, position, meshMaterial, parent) {
      return mesh(new THREE.SphereGeometry(radius, 18, 12), meshMaterial, position, null, parent);
    }

    // Every challenge starts from the same competition-scale chassis so the
    // unit-specific mechanism reads as part of a robot rather than a loose prop.
    box([1.85, 0.22, 1.35], [0, 0.34, 0], darkMat);
    box([1.72, 0.10, 1.18], [0, 0.49, 0], accentMat);
    [-0.78, 0.78].forEach(function (x) {
      box([0.09, 0.15, 1.3], [x, 0.59, 0], frameMat);
    });
    const wheels = [];
    [-1, 1].forEach(function (side) {
      [-0.48, 0.48].forEach(function (z) {
        wheels.push(cylinder(0.27, 0.20, [side * 1.0, 0.29, z], tireMat, [0, 0, Math.PI / 2]));
      });
    });
    const hub = box([0.68, 0.23, 0.48], [0, 0.67, 0.12], sensorMat);
    box([0.48, 0.025, 0.34], [0, 0.795, 0.12], accentMat);

    let animation = null;

    function applyDriveState() {
      robot.position.x = motion.state.x;
      robot.position.z = motion.state.z;
      robot.rotation.y = motion.state.heading;
      wheels.forEach(function (wheel, index) {
        wheel.rotation.x = motion.state.wheelAngles[index];
      });
    }

    if (unit === 2) {
      box([0.12, 0.72, 0.12], [0, 1.08, 0.12], frameMat);
      const statusLights = [redMat, warningMat, greenMat].map(function (lightMat, index) {
        return sphere(0.095, [0, 0.91 + index * 0.24, 0.12], lightMat);
      });
      box([0.52, 0.14, 0.28], [0, 1.52, 0.12], darkMat);
      animation = function (time) {
        statusLights.forEach(function (light, index) {
          light.material.emissiveIntensity = 0.18 + Math.max(0, Math.sin(time * 3.2 - index * 1.3)) * 0.75;
        });
      };
    } else if (unit === 3) {
      const flywheel = cylinder(0.38, 0.18, [0, 0.98, -0.12], accentMat, [Math.PI / 2, 0, 0]);
      cylinder(0.14, 0.5, [0, 0.98, 0.2], darkMat, [Math.PI / 2, 0, 0]);
      box([0.58, 0.38, 0.38], [0, 0.77, 0.38], frameMat);
      animation = function () { flywheel.rotation.y = motion.state.primaryAngle; };
    } else if (unit === 4) {
      box([1.95, 0.16, 0.16], [0, 0.55, -0.74], accentMat);
      box([0.5, 0.16, 0.42], [0, 0.72, 0.32], darkMat);
      animation = applyDriveState;
    } else if (unit === 5) {
      const roller = cylinder(0.19, 1.35, [0, 0.34, -0.87], warningMat, [0, 0, Math.PI / 2]);
      box([0.16, 0.25, 0.82], [-0.82, 0.35, -0.76], frameMat, null, [0, 0.22, 0]);
      box([0.16, 0.25, 0.82], [0.82, 0.35, -0.76], frameMat, null, [0, -0.22, 0]);
      sphere(0.12, [0, 0.63, -0.71], sensorMat);
      animation = function () { roller.rotation.x = motion.state.primaryAngle; };
    } else if (unit === 6) {
      const arm = new THREE.Group();
      arm.position.set(-0.56, 0.65, 0.12);
      robot.add(arm);
      cylinder(0.16, 0.32, [0, 0, 0], accentMat, [Math.PI / 2, 0, 0], arm);
      box([0.16, 1.05, 0.16], [0, 0.48, 0], frameMat, arm);
      box([0.48, 0.14, 0.34], [0, 1.0, 0], warningMat, arm);
      box([0.42, 0.34, 0.42], [0.5, 0.77, 0.1], darkMat);
      animation = function () {
        applyDriveState();
        arm.rotation.z = -0.25 + motion.state.armAngle;
      };
    } else if (unit === 7) {
      box([0.48, 0.58, 0.48], [-0.45, 0.92, 0.12], accentMat);
      const subsystemMotor = cylinder(0.18, 0.42, [0.42, 0.87, 0.14], darkMat, [Math.PI / 2, 0, 0]);
      box([0.18, 0.18, 0.18], [0.66, 0.68, -0.18], warningMat);
      sphere(0.12, [0.52, 1.16, -0.12], sensorMat);
      box([0.08, 0.65, 0.08], [0.08, 0.96, 0.12], frameMat);
      animation = function () { subsystemMotor.rotation.y = motion.state.primaryAngle; };
    } else if (unit === 8) {
      [-0.34, 0.34].forEach(function (x) {
        box([0.11, 1.55, 0.12], [x, 1.22, 0.08], frameMat);
      });
      const carriage = box([0.9, 0.22, 0.48], [0, 1.32, 0.08], accentMat);
      box([0.16, 0.12, 0.18], [0.48, 0.55, 0.08], redMat);
      box([0.16, 0.12, 0.18], [0.48, 1.9, 0.08], greenMat);
      animation = function () { carriage.position.y = motion.state.slidePosition; };
    } else if (unit === 9) {
      const leftFinger = new THREE.Group();
      const rightFinger = new THREE.Group();
      leftFinger.position.set(-0.35, 0.76, -0.72);
      rightFinger.position.set(0.35, 0.76, -0.72);
      robot.add(leftFinger);
      robot.add(rightFinger);
      box([0.28, 0.25, 0.28], [0, 0, 0], accentMat, leftFinger);
      box([0.13, 0.64, 0.16], [0, -0.28, -0.18], frameMat, leftFinger, [0.22, 0, 0]);
      box([0.28, 0.25, 0.28], [0, 0, 0], accentMat, rightFinger);
      box([0.13, 0.64, 0.16], [0, -0.28, -0.18], frameMat, rightFinger, [0.22, 0, 0]);
      const intake = cylinder(0.15, 0.9, [0, 0.38, -0.82], warningMat, [0, 0, Math.PI / 2]);
      animation = function () {
        const positions = motion.servoValues();
        const left = positions[0] == null ? 0 : positions[0];
        const right = positions[1] == null ? left : positions[1];
        leftFinger.rotation.z = -(0.08 + left * 0.44);
        rightFinger.rotation.z = 0.08 + right * 0.44;
        intake.rotation.x = motion.state.primaryAngle;
      };
    } else if (unit === 10) {
      wheels.forEach(function (wheel) {
        const ring = mesh(new THREE.TorusGeometry(0.205, 0.026, 8, 24), accentMat, wheel.position.toArray(), [0, Math.PI / 2, 0]);
        ring.userData.encoderRing = true;
      });
      box([0.08, 0.42, 0.08], [0, 0.74, -0.45], warningMat, null, [Math.PI / 4, 0, 0]);
      animation = applyDriveState;
    } else if (unit === 11) {
      const intake = cylinder(0.18, 1.25, [0, 0.35, -0.86], warningMat, [0, 0, Math.PI / 2]);
      box([0.15, 0.15, 0.15], [-0.56, 0.62, -0.64], redMat);
      box([0.15, 0.15, 0.15], [-0.2, 0.62, -0.64], greenMat);
      box([0.15, 0.15, 0.15], [0.2, 0.62, -0.64], blueMat);
      sphere(0.11, [0.56, 0.62, -0.64], sensorMat);
      cylinder(0.09, 0.38, [0.72, 0.82, 0.12], accentMat, [Math.PI / 2, 0, 0]);
      animation = function () { intake.rotation.x = motion.state.primaryAngle; };
    } else if (unit === 12) {
      box([0.38, 0.24, 0.38], [0, 0.87, 0.1], accentMat);
      box([0.62, 0.045, 0.045], [0.31, 1.08, 0.1], redMat);
      box([0.045, 0.62, 0.045], [0, 1.08, 0.1], greenMat);
      box([0.045, 0.045, 0.62], [0, 1.08, -0.21], blueMat);
      wheels.forEach(function (wheel, index) {
        box([0.05, 0.36, 0.08], [wheel.position.x, wheel.position.y, wheel.position.z], accentMat, null, [0.65, 0, index % 2 ? 0.65 : -0.65]);
      });
      animation = applyDriveState;
    } else if (unit === 13) {
      box([0.56, 0.38, 0.5], [-0.5, 0.84, 0.1], blueMat);
      box([0.56, 0.58, 0.5], [0.12, 0.94, 0.1], accentMat);
      box([0.46, 0.3, 0.5], [0.65, 0.8, 0.1], greenMat);
      const arm = new THREE.Group();
      arm.position.set(0.12, 1.18, 0.1);
      robot.add(arm);
      box([0.14, 0.82, 0.14], [0, 0.34, 0], frameMat, arm, [0, 0, -0.35]);
      const claw = new THREE.Group();
      claw.position.set(0.32, 1.66, 0.1);
      robot.add(claw);
      const clawLeft = box([0.08, 0.34, 0.12], [-0.12, 0, 0], frameMat, claw);
      const clawRight = box([0.08, 0.34, 0.12], [0.12, 0, 0], frameMat, claw);
      animation = function () {
        const position = motion.servoValues()[0] || 0;
        arm.rotation.z = motion.state.armAngle;
        clawLeft.rotation.z = -position * 0.55;
        clawRight.rotation.z = position * 0.55;
      };
    } else if (unit === 14) {
      box([0.1, 0.92, 0.1], [0, 1.08, -0.12], frameMat);
      const cameraHead = new THREE.Group();
      cameraHead.position.set(0, 1.55, -0.12);
      robot.add(cameraHead);
      box([0.52, 0.28, 0.3], [0, 0, 0], darkMat, cameraHead);
      cylinder(0.1, 0.08, [0, 0, -0.19], blueMat, [Math.PI / 2, 0, 0], cameraHead);
      [-1.45, 0, 1.45].forEach(function (x, index) {
        const zoneMat = index === 0 ? redMat : index === 1 ? warningMat : greenMat;
        box([0.9, 0.025, 0.9], [x, 0.025, -2.05], zoneMat, visual);
        box([0.42, 0.65, 0.06], [x, 0.34, -2.47], sensorMat, visual);
        box([0.24, 0.24, 0.025], [x, 0.38, -2.51], zoneMat, visual);
      });
      robot.position.z = 0.65;
      animation = function () { cameraHead.rotation.y = motion.state.cameraAngle; };
    } else if (unit === 15) {
      box([0.1, 0.72, 0.1], [-0.45, 1.0, -0.02], frameMat);
      const limelight = box(
        [0.42, 0.25, 0.28],
        [-0.45, 1.4, -0.02],
        material(0x18232d, {emissive: 0x064e3b, emissiveIntensity: 0.18})
      );
      cylinder(0.09, 0.08, [-0.45, 1.4, -0.2], greenMat, [Math.PI / 2, 0, 0]);
      const scoringArm = new THREE.Group();
      scoringArm.position.set(0.5, 0.68, 0.12);
      robot.add(scoringArm);
      box([0.13, 0.9, 0.13], [0, 0.4, 0], frameMat, scoringArm, [0, 0, -0.28]);
      box([0.42, 0.16, 0.3], [0.12, 0.83, 0], accentMat, scoringArm);
      const path = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-2.55, 0.04, 2.1),
        new THREE.Vector3(2.6, 0.04, 1.4),
        new THREE.Vector3(1.9, 0.04, -2.25)
      );
      const pathLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(path.getPoints(48)),
        new THREE.LineBasicMaterial({color: profile.accent, transparent: true, opacity: 0.75})
      );
      visual.add(pathLine);
      animation = function () {
        const point = path.getPoint(motion.state.pathProgress);
        robot.position.set(point.x, 0, point.z);
        const servoPosition = motion.servoValues()[0] || 0;
        scoringArm.rotation.z = -0.38 + servoPosition * 0.7;
        limelight.material.emissive = new THREE.Color(0x064e3b);
        limelight.material.emissiveIntensity = motion.state.visionActive ? 0.52 : 0.08;
      };
    }

    const sceneContainer = document.getElementById("sim-scene-container");
    if (sceneContainer) {
      const oldLabel = document.getElementById("mastery-robot-label");
      if (oldLabel) oldLabel.remove();
      const label = document.createElement("div");
      label.id = "mastery-robot-label";
      label.className = "mastery-robot-label";
      label.textContent = profile.name;
      const detail = document.createElement("span");
      detail.textContent = profile.detail;
      label.appendChild(detail);
      sceneContainer.appendChild(label);
    }

    if (typeof global.setCameraOrbit === "function") {
      global.setCameraOrbit({theta: 0.56, phi: 0.78, radius: unit >= 14 ? 6.8 : 5.2, target: {x: 0, y: 0.72, z: unit >= 14 ? -0.35 : 0}});
    }
    if (animation && typeof global.addAnimationCallback === "function") {
      let previousTime = Date.now() * 0.001;
      global.addAnimationCallback(function () {
        const currentTime = Date.now() * 0.001;
        const dt = currentTime - previousTime;
        previousTime = currentTime;
        if (global.hardwareMap && typeof global.hardwareMap.tick === "function") {
          global.hardwareMap.tick(dt);
        }
        motion.step(dt);
        animation(currentTime);
      });
    }
    visual.userData.challengeMotion = motion;
    return visual;
  }

  function sourceWithoutComments(source) {
    return String(source || "")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/\/\/[^\n\r]*/g, " ");
  }

  function checksForUnit(unit) {
    const config = CONFIGS[unit];
    if (!config) return [];
    const isAutonomous = [6, 10, 14, 15].indexOf(unit) >= 0;
    const registrationCheck = isAutonomous
      ? [
          "Keep the supplied FTC SDK autonomous class shell intact",
          /import\s+com\.qualcomm\.robotcore\.eventloop\.opmode\.(?:LinearOpMode|\*)\s*;/,
          /import\s+com\.qualcomm\.robotcore\.eventloop\.opmode\.(?:Autonomous|\*)\s*;/,
          /@Autonomous\s*\([^)]*\)/,
          /\bclass\s+\w+\s+extends\s+LinearOpMode\b/,
        ]
      : [
          "Keep the supplied FTC SDK TeleOp class shell intact",
          /import\s+com\.qualcomm\.robotcore\.eventloop\.opmode\.(?:OpMode|\*)\s*;/,
          /import\s+com\.qualcomm\.robotcore\.eventloop\.opmode\.(?:TeleOp|\*)\s*;/,
          /@TeleOp\s*\([^)]*\)/,
          /\bclass\s+\w+\s+extends\s+OpMode\b/,
        ];
    return [registrationCheck].concat(config.checks);
  }

  function evaluate(unit, source) {
    const code = sourceWithoutComments(source);
    return checksForUnit(unit).map(function (check) {
      return check.slice(1).every(function (pattern) {
        pattern.lastIndex = 0;
        return pattern.test(code);
      });
    });
  }

  function injectSummaryStyles() {
    if (document.getElementById("mastery-summary-styles")) return;
    const style = document.createElement("style");
    style.id = "mastery-summary-styles";
    style.textContent = ""
      + ".mastery-summary{margin:10px;padding:12px;border:1px solid var(--border);border-radius:8px;background:var(--panel);font-family:var(--font-ui);overflow:auto;max-height:42vh}"
      + ".mastery-summary h2{margin:0 0 4px;color:var(--text-primary);font-size:1rem}"
      + ".mastery-summary p{margin:0 0 10px;color:var(--text-secondary);font-size:.82rem;line-height:1.4}"
      + ".mastery-summary-row{display:flex;align-items:center;gap:8px;padding:7px 0;border-top:1px solid var(--border);color:var(--text-secondary);font-size:.8rem}"
      + ".mastery-summary-row i{width:16px;text-align:center}"
      + ".mastery-summary-row.pass{color:var(--good)}"
      + ".mastery-summary-row.fail{color:var(--text-secondary)}"
      + ".mastery-summary-score{font-family:var(--font-code);color:var(--active);font-weight:700}"
      + ".mastery-robot-label{position:absolute;left:12px;bottom:12px;z-index:3;max-width:calc(100% - 24px);padding:7px 10px;border:1px solid rgba(34,211,238,.35);border-radius:7px;background:rgba(5,8,13,.82);color:#effbff;font:600 .72rem/1.3 var(--font-code);letter-spacing:.03em;pointer-events:none;backdrop-filter:blur(7px)}"
      + ".mastery-robot-label span{display:block;margin-top:2px;color:rgba(221,241,249,.68);font-family:var(--font-ui);font-weight:400;letter-spacing:0}"
      + ":root[data-theme='light'] .mastery-robot-label,:root[data-telemark-theme='light'] .mastery-robot-label{background:rgba(255,255,255,.86);color:#102a36}"
      + "#sim-scene-container{min-height:260px}";
    document.head.appendChild(style);
  }

  function createSummary(checks) {
    const rightPanel = document.getElementById("sim-right-panel");
    const scene = document.getElementById("sim-scene-container");
    if (!rightPanel || !scene) return;
    const old = document.getElementById("mastery-summary");
    if (old) old.remove();
    const panel = document.createElement("section");
    panel.id = "mastery-summary";
    panel.className = "mastery-summary";
    panel.innerHTML = "<h2>Unit objective coverage</h2>"
      + "<p>Each row represents a concept from this unit. Init recompiles the whole file and refreshes these checks.</p>"
      + "<div class=\"mastery-summary-score\" id=\"mastery-summary-score\">0 / " + checks.length + " complete</div>"
      + checks.map(function (check, index) {
        return "<div class=\"mastery-summary-row fail\" id=\"mastery-summary-row-" + index + "\"><i class=\"fa-regular fa-circle\"></i><span>" + check[0] + "</span></div>";
      }).join("");
    rightPanel.insertBefore(panel, scene);
  }

  function updateSummary(results) {
    const passed = results.filter(Boolean).length;
    const score = document.getElementById("mastery-summary-score");
    if (score) score.textContent = passed + " / " + results.length + " complete";
    results.forEach(function (result, index) {
      const row = document.getElementById("mastery-summary-row-" + index);
      if (!row) return;
      row.className = "mastery-summary-row " + (result ? "pass" : "fail");
      const icon = row.querySelector("i");
      if (icon) icon.className = result ? "fa-solid fa-circle-check" : "fa-regular fa-circle";
    });
  }

  function install(unit) {
    const config = CONFIGS[unit];
    if (!config) throw new Error("Unknown mastery simulator unit: " + unit);
    const checks = checksForUnit(unit);
    let challengeMotion = null;

    global.onSimulatorReady = function () {
      if (!global.TelemarkMasteryMotion) {
        throw new Error("The coding challenge motion runtime is unavailable");
      }
      challengeMotion = global.TelemarkMasteryMotion.create(unit);
      global.TelemarkMasteryMotion.installSdkMocks(global, challengeMotion);
      challengeMotion.connectHardwareMap(global.hardwareMap);
      global.__telemarkMasteryMotion = challengeMotion;
      injectSummaryStyles();
      setTelemetryStudentOnly(true);
      setCode(config.starter);
      setChallenge({
        title: config.title,
        scenario: config.scenario,
        requirements: checks.map(function (check) { return check[0]; }),
        successMessage: "Every unit objective is represented. You have demonstrated full mastery and can continue to the next unit."
      });
      setBadges([
        {iconClass: "fa-solid fa-file-code", label: "FTC SDK shell", active: true},
        {iconClass: "fa-solid fa-layer-group", label: "Whole unit", active: true},
        {iconClass: "fa-solid fa-list-check", label: checks.length + " checks", active: true},
        {iconClass: "fa-solid fa-robot", label: ROBOT_PROFILES[unit].name, active: true}
      ]);
      setActiveInputs(config.inputs || []);
      createSummary(checks);
      createChallengeRobot(unit, challengeMotion);

      function validate() {
        const source = getCode();
        const compilation = global.TelemarkSimulatorBase.compileStudentSource(source);
        const results = compilation.ok ? evaluate(unit, source) : checks.map(function () { return false; });
        const forbiddenFailures = (config.forbidden || []).filter(function (rule) {
          rule[1].lastIndex = 0;
          return rule[1].test(sourceWithoutComments(source));
        });

        results.forEach(function (passed, index) {
          setRequirement(index, passed && forbiddenFailures.length === 0);
        });
        updateSummary(results);

        forbiddenFailures.forEach(function (rule) {
          addHint("<i class=\"fa-solid fa-triangle-exclamation\"></i> " + rule[0], "error");
        });
        if (results.every(Boolean) && forbiddenFailures.length === 0) {
          addHint("<i class=\"fa-solid fa-circle-check\"></i> Source structure covers every unit objective.", "info");
        } else if (compilation.ok) {
          addHint("Use the objective rows as a debugging map. They describe behavior, not exact code spelling.", "info");
        }
        return results;
      }

      global.onInit = function () {
        validate();
        return transpileAndRun(
          getCode(),
          function (initFn) {
            initFn();
            updateTelemetry();
          },
          function (loopFn) {
            global._simStartLoop(loopFn);
          }
        );
      };
      global.onStart = function () {
        validate();
        updateTelemetry();
      };
      global.onStop = function () {
        updateTelemetry();
        if (global.hardwareMap && typeof global.hardwareMap.stopAll === "function") {
          global.hardwareMap.stopAll();
        }
      };
      global.onReset = function () {
        updateSummary(evaluate(unit, getCode()));
      };

      validate();
    };
  }

  const script = document.currentScript;
  const selectedUnit = Number(script && script.dataset ? script.dataset.unit : 0);
  global.TelemarkMasteryChallenge = Object.freeze({
    configs: CONFIGS,
    robotProfiles: ROBOT_PROFILES,
    checksForUnit: checksForUnit,
    createChallengeRobot: createChallengeRobot,
    evaluate: evaluate,
    install: install
  });
  if (selectedUnit) install(selectedUnit);
})(window);
