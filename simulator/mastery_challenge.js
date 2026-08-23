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
    return imports.join("\n")
      + "\n\n" + annotation
      + "\npublic class " + className + " extends " + parent + " {\n\n}";
  }

  const CONFIGS = {
    2: {
      title: "Unit 2 Mastery: Complete OpMode Lifecycle",
      scenario: "Build a competition TeleOp that registers correctly, reports a pre-match health check, resets its clock at Start, updates driver telemetry in every loop, and shuts down cleanly.",
      starter: shell([
        "import com.qualcomm.robotcore.eventloop.opmode.OpMode;",
        "import com.qualcomm.robotcore.eventloop.opmode.TeleOp;"
      ], "@TeleOp(name=\"Unit_2_Mastery\")", "Unit2Mastery", "OpMode"),
      inputs: ["a"],
      checks: [
        ["Create init() for one-time setup", /\bvoid\s+init\s*\(\s*\)/],
        ["Use init_loop() for a repeated health check", /\bvoid\s+init_loop\s*\(\s*\)/],
        ["Create start() and reset the match clock", /\bvoid\s+start\s*\(\s*\)[\s\S]*?resetRuntime\s*\(/],
        ["Create loop() for repeated driver logic", /\bvoid\s+loop\s*\(\s*\)/],
        ["Report runtime and gamepad state through telemetry", /getRuntime\s*\(/, /gamepad1\s*\./, /telemetry\s*\.\s*addData\s*\(/],
        ["Create stop() with a shutdown telemetry message", /\bvoid\s+stop\s*\(\s*\)[\s\S]*?telemetry\s*\.\s*addData\s*\(/]
      ]
    },
    3: {
      title: "Unit 3 Mastery: Robot State Variables",
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
        ["Declare a boolean mechanism state", /\bboolean\s+\w+\s*=/],
        ["Declare an int action counter", /\bint\s+\w+\s*=/],
        ["Combine gamepad input with the double scale", /gamepad1\s*\.[a-zA-Z_]+[\s\S]*?[*/+-][\s\S]*?\w+/],
        ["Command the mapped motor with the calculated value", /\.\s*setPower\s*\(\s*\w+\s*\)/],
        ["Report the variables through telemetry", /telemetry\s*\.\s*addData\s*\([^)]*\w+\s*\)/]
      ]
    },
    4: {
      title: "Unit 4 Mastery: Driver-Controlled Drivetrain",
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
        ["Use a gamepad button to select a drive mode", /if\s*\(\s*gamepad1\s*\.\s*[abxy]|gamepad1\s*\.\s*[abxy]\s*\?/],
        ["Calculate and clip left/right arcade power", /Range\s*\.\s*clip\s*\(/, /(?:left|right)\w*\s*=\s*[^;]*(?:forward|drive|y)[^;]*[+-][^;]*(?:turn|x)/i],
        ["Send power to both drivetrain motors", /\.\s*setPower\s*\([^)]*\)[\s\S]*?\.\s*setPower\s*\(/]
      ]
    },
    5: {
      title: "Unit 5 Mastery: Safe Intake Decision Tree",
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
      title: "Unit 6 Mastery: Non-Blocking Autonomous Loop",
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
      title: "Unit 7 Mastery: Reusable Hardware Subsystem",
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
        ["Centralize exact hardware names as String constants", /static\s+final\s+String\s+\w+\s*=\s*\"[^\"]+\"/],
        ["Create a reusable mechanism class", /class\s+\w*(?:Mechanism|Subsystem|System)\b/],
        ["Give the mechanism an init(HardwareMap) method", /\bvoid\s+init\s*\(\s*HardwareMap\s+\w+\s*\)/],
        ["Map a DcMotor through the supplied HardwareMap", /\w+\s*\.\s*get\s*\(\s*DcMotor\.class\s*,/],
        ["Map a DigitalChannel and set INPUT mode", /\w+\s*\.\s*get\s*\(\s*DigitalChannel\.class\s*,/, /setMode\s*\(\s*DigitalChannel\.Mode\.INPUT\s*\)/],
        ["Map and read an AnalogInput", /\w+\s*\.\s*get\s*\(\s*AnalogInput\.class\s*,/, /getVoltage\s*\(/],
        ["Initialize the mechanism once from OpMode init()", /\bvoid\s+init\s*\(\s*\)[\s\S]*?\.\s*init\s*\(\s*hardwareMap\s*\)/],
        ["Delegate gamepad control to a mechanism method", /\bvoid\s+loop\s*\(\s*\)[\s\S]*?gamepad1\s*\.[\s\S]*?\.\s*\w+\s*\(/]
      ]
    },
    8: {
      title: "Unit 8 Mastery: Limit-Safe Linear Slide",
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
        ["Stop explicitly when motion is unsafe", /setPower\s*\(\s*0(?:\.0+)?\s*\)/]
      ]
    },
    9: {
      title: "Unit 9 Mastery: Coordinated Servo Mechanism",
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
        ["Give the CRServo a neutral zero-power state", /setPower\s*\(\s*0(?:\.0+)?\s*\)/]
      ]
    },
    10: {
      title: "Unit 10 Mastery: Encoder Distance Autonomous",
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
      title: "Unit 11 Mastery: Multi-Sensor Intake",
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
      title: "Unit 12 Mastery: IMU Field-Centric Drive",
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
        ["Apply a yaw error correction or heading target", /(?:target|error|correction|heading)[\s\S]*?[*/+-]/i]
      ]
    },
    13: {
      title: "Unit 13 Mastery: Modular Robot Architecture",
      scenario: "Build a TeleOp whose empty shell becomes a complete robot architecture: encapsulated subsystem state, inherited behavior, an override, shared constants, and one composed Robot object.",
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
        ["Use the Robot object from OpMode init() and loop()", /\bvoid\s+init\s*\(\s*\)[\s\S]*?\.\s*init\s*\(\s*hardwareMap\s*\)/, /\bvoid\s+loop\s*\(\s*\)[\s\S]*?robot\s*\./i]
      ]
    },
    14: {
      title: "Unit 14 Mastery: Vision-Guided Autonomous",
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
        ["Read a detection ID and pose values safely", /\.\s*id\b/, /\.\s*ftcPose\s*\./],
        ["Define multiple OpenCV Rect zones", /new\s+Rect\s*\([^)]*\)[\s\S]*?new\s+Rect\s*\(/],
        ["Classify at least three autonomous zones", /(?:LEFT|CENTER|RIGHT)[\s\S]*?(?:LEFT|CENTER|RIGHT)[\s\S]*?(?:LEFT|CENTER|RIGHT)/],
        ["Report the selected zone before Start", /while\s*\([^)]*(?:isStarted|isStopRequested)[\s\S]*?telemetry\s*\.\s*addData\s*\(/],
        ["Close VisionPortal when vision work is done", /\.\s*close\s*\(\s*\)/]
      ]
    },
    15: {
      title: "Unit 15 Mastery: Full Sensor-Fused Autonomous",
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

  function sourceWithoutComments(source) {
    return String(source || "")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/\/\/[^\n\r]*/g, " ");
  }

  function evaluate(unit, source) {
    const config = CONFIGS[unit];
    if (!config) return [];
    const code = sourceWithoutComments(source);
    return config.checks.map(function (check) {
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
      + "#sim-scene-container{min-height:260px}";
    document.head.appendChild(style);
  }

  function createSummary(config) {
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
      + "<div class=\"mastery-summary-score\" id=\"mastery-summary-score\">0 / " + config.checks.length + " complete</div>"
      + config.checks.map(function (check, index) {
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

    global.onSimulatorReady = function () {
      injectSummaryStyles();
      setCode(config.starter);
      setChallenge({
        title: config.title,
        scenario: config.scenario,
        requirements: config.checks.map(function (check) { return check[0]; }),
        successMessage: "Every lesson objective is represented in your solution."
      });
      setBadges([
        {iconClass: "fa-solid fa-code", label: "Blank starter", active: true},
        {iconClass: "fa-solid fa-layer-group", label: "Whole unit", active: true},
        {iconClass: "fa-solid fa-list-check", label: config.checks.length + " checks", active: true},
        {iconClass: "fa-solid fa-shield-halved", label: "Shared runtime", active: true}
      ]);
      setActiveInputs(config.inputs || []);
      createSummary(config);

      function validate() {
        const source = getCode();
        const compilation = global.TelemarkSimulatorBase.compileStudentSource(source);
        const results = compilation.ok ? evaluate(unit, source) : config.checks.map(function () { return false; });
        const forbiddenFailures = (config.forbidden || []).filter(function (rule) {
          rule[1].lastIndex = 0;
          return rule[1].test(sourceWithoutComments(source));
        });

        results.forEach(function (passed, index) {
          setRequirement(index, passed && forbiddenFailures.length === 0);
        });
        updateSummary(results);
        clearTelemetry();
        addTelemetry("Unit", unit + " comprehensive challenge");
        addTelemetry("Compiler", compilation.ok ? "Java parsed" : "Fix compile errors");
        addTelemetry("Objectives", results.filter(Boolean).length + " / " + results.length);
        addTelemetry("Lifecycle", "Init complete; press Start to test controls");
        updateTelemetry();

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

      global.onInit = validate;
      global.onRun = validate;
      global.onStart = function () {
        const results = validate();
        addTelemetry("Driver test", config.inputs && config.inputs.length ? "Gamepad inputs enabled" : "Autonomous lifecycle active");
        addTelemetry("Ready", results.every(Boolean) ? "Yes" : "Complete remaining objectives");
        updateTelemetry();
      };
      global.onStop = function () {
        addTelemetry("Lifecycle", "Stopped safely");
        updateTelemetry();
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
    evaluate: evaluate,
    install: install
  });
  if (selectedUnit) install(selectedUnit);
})(window);
