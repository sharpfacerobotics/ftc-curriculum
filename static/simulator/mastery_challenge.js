/**
 * Shared runtime for the Unit 2-15 comprehensive coding challenges.
 *
 * Each unit owns a small HTML entry point, while this adapter owns the editor,
 * compiler integration, requirement checks, telemetry, and hardware map.
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
        ["Apply a joystick deadzone", /Math\s*\.\s*abs\s*\([^)]*\)\s*[<>]=?\s*(?:0?\.\d+|[A-Z][A-Z0-9_]*)/i],
        ["Use a trigger as an analog speed limit", /gamepad1\s*\.\s*(?:left|right)_trigger/],
        ["Create and call a signed sensitivity-curve method", /\bdouble\s+\w+\s*\(\s*double\s+\w+\s*\)[\s\S]*?(?:Math\s*\.\s*(?:signum|copySign)|\w+\s*\*\s*\w+)/],
        ["Toggle a drive mode only on a button press edge", /gamepad1\s*\.\s*[abxy]/, /(?:previous|last|was|old)\w*/i, /(?:gamepad1\s*\.\s*[abxy]\s*&&\s*!\s*\w+|!\s*\w+\s*&&\s*gamepad1\s*\.\s*[abxy])/],
        ["Calculate and clip left/right arcade power", /Range\s*\.\s*clip\s*\(/, /(?:left|right)\w*\s*=\s*[^;]*(?:forward|drive|y)[^;]*[+-][^;]*(?:turn|x)/i],
        ["Send power to both drivetrain motors", /\.\s*setPower\s*\([^)]*\)[\s\S]*?\.\s*setPower\s*\(/],
        ["Report final drive powers through telemetry", /telemetry\s*\.\s*addData\s*\([^)]*(?:power|left|right)/i]
      ]
    },
    5: {
      title: "Unit 5 Coding Challenge: Red Alliance Sample Sorter",
      scenario: "Program a red-alliance intake. Collect a red sample at 0.8 only when it is closer than 10 cm. Eject a blue sample at -0.5 when it is closer than 10 cm. Stop for ties and anything 10 cm away or farther.",
      starter: shell([
        "import com.qualcomm.robotcore.eventloop.opmode.OpMode;",
        "import com.qualcomm.robotcore.eventloop.opmode.TeleOp;",
        "import com.qualcomm.robotcore.hardware.DcMotor;",
        "import com.qualcomm.robotcore.hardware.ColorSensor;",
        "import com.qualcomm.robotcore.hardware.DistanceSensor;",
        "import org.firstinspires.ftc.robotcore.external.navigation.DistanceUnit;"
      ], "@TeleOp(name=\"Unit_5_Mastery\")", "Unit5Mastery", "OpMode"),
      inputs: [],
      checks: [
        ["Map DcMotor \"intake\"", /hardwareMap\s*\.\s*get\s*\(\s*DcMotor\.class\s*,\s*"intake"\s*\)/],
        ["Map ColorSensor \"intake_color\"", /hardwareMap\s*\.\s*get\s*\(\s*ColorSensor\.class\s*,\s*"intake_color"\s*\)/],
        ["Map DistanceSensor \"intake_distance\"", /hardwareMap\s*\.\s*get\s*\(\s*DistanceSensor\.class\s*,\s*"intake_distance"\s*\)/],
        ["Store one CM distance, red, and blue reading per loop", /\bdouble\s+\w+\s*=\s*\w+\.getDistance\s*\(\s*DistanceUnit\.CM\s*\)/, /\bint\s+\w+\s*=\s*\w+\.red\s*\(\s*\)/, /\bint\s+\w+\s*=\s*\w+\.blue\s*\(\s*\)/],
        ["Use an if / else-if / else decision chain", /\bif\s*\(/, /\belse\s+if\s*\(/, /\belse\b/],
        ["Require distance below 10 cm and compare red with blue", /<\s*10(?:\.0+)?/, /&&/, />/],
        ["Collect red at 0.8 and eject blue at -0.5", /\.\s*setPower\s*\(\s*0\.8(?:0*)?\s*\)/, /\.\s*setPower\s*\(\s*-0\.5(?:0*)?\s*\)/],
        ["Stop explicitly for a tie or out-of-range sample", /\belse\b[\s\S]*?\.\s*setPower\s*\(\s*0(?:\.0+)?\s*\)/],
        ["Report distance, color readings, and sorter state", /telemetry\s*\.\s*addData\s*\([^)]*(?:distance|cm)/i, /telemetry\s*\.\s*addData\s*\([^)]*(?:red|blue|color)/i, /telemetry\s*\.\s*addData\s*\([^)]*state/i]
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
      scenario: "Build a TeleOp with centralized configuration names and a reusable mechanism class (in its own Java file or in the same file) that maps a motor, a digital limit, and an analog sensor exactly once.",
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
      title: "Unit 8 Coding Challenge: Team 11115 Limit-Safe Lift",
      scenario: "Control Team 11115 Gluten Free's SKYSTONE double-reverse four-bar with one lift motor and two limits. Correct its direction, select braking, accept proportional driver power, and always stop at a limit.",
      starter: shell([
        "import com.qualcomm.robotcore.eventloop.opmode.OpMode;",
        "import com.qualcomm.robotcore.eventloop.opmode.TeleOp;",
        "import com.qualcomm.robotcore.hardware.DcMotor;",
        "import com.qualcomm.robotcore.hardware.DcMotorSimple;",
        "import com.qualcomm.robotcore.hardware.DigitalChannel;"
      ], "@TeleOp(name=\"Unit_8_Mastery\")", "Unit8Mastery", "OpMode"),
      inputs: ["left_stick_y"],
      checks: [
        ["Map the lift motor and both limit switches", /hardwareMap\s*\.\s*get\s*\(\s*DcMotor\.class\s*,\s*"lift"\s*\)/, /hardwareMap\s*\.\s*get\s*\(\s*DigitalChannel\.class[\s\S]*?hardwareMap\s*\.\s*get\s*\(\s*DigitalChannel\.class/],
        ["Configure both digital channels as inputs", /setMode\s*\(\s*DigitalChannel\.Mode\.INPUT\s*\)[\s\S]*?setMode\s*\(\s*DigitalChannel\.Mode\.INPUT\s*\)/],
        ["Correct the motor direction with REVERSE", /setDirection\s*\([^)]*Direction\.REVERSE\s*\)/],
        ["Select BRAKE zero-power behavior", /setZeroPowerBehavior\s*\(\s*DcMotor\.ZeroPowerBehavior\.BRAKE\s*\)/],
        ["Read proportional joystick power", /gamepad1\s*\.\s*left_stick_y/],
        ["Use upper and lower limit states in direction checks", /getState\s*\(\s*\)[\s\S]*?getState\s*\(\s*\)/, /[<>]\s*0/],
        ["Command motion in both directions", /setPower\s*\([^)]*\)[\s\S]*?setPower\s*\([^)]*\)/],
        ["Stop explicitly when motion is unsafe", /setPower\s*\(\s*0(?:\.0+)?\s*\)/],
        ["Report lift power and both limits through telemetry", /telemetry\s*\.\s*addData\s*\([^)]*(?:power|lift)[^)]*\)[\s\S]*?telemetry\s*\.\s*addData\s*\(/i]
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
      title: "Unit 11 Coding Challenge: Safe Red Sample Sorter",
      scenario: "Run the red-alliance intake at 0.8 only for a red sample closer than 10 cm while storage is not full and the arm is between 20 and 160 degrees. Eject a close blue sample at -0.5 under the same safety limits. Stop in every other case.",
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
      inputs: [],
      checks: [
        ["Map DcMotor \"intake\"", /hardwareMap\s*\.\s*get\s*\(\s*DcMotor\.class\s*,\s*"intake"\s*\)/],
        ["Map \"storage_full\", \"arm_pot\", \"intake_color\", and \"intake_range\"", /DigitalChannel\.class\s*,\s*"storage_full"/, /AnalogInput\.class\s*,\s*"arm_pot"/, /ColorSensor\.class\s*,\s*"intake_color"/, /DistanceSensor\.class\s*,\s*"intake_range"/],
        ["Configure the active-low storage switch as an input", /DigitalChannel\.Mode\.INPUT/, /!\s*\w+\.getState\s*\(\s*\)/],
        ["Scale 0 to 3.3 V into 0 to 180 degrees", /getVoltage\s*\(/, /Range\s*\.\s*scale\s*\([^;]*0(?:\.0+)?\s*,\s*3\.3\s*,\s*0(?:\.0+)?\s*,\s*180(?:\.0+)?\s*\)/],
        ["Compare red and blue color channels", /\.\s*red\s*\(\s*\)/, /\.\s*blue\s*\(\s*\)/, /[<>]/],
        ["Read distance in centimeters and compare it with 10", /getDistance\s*\(\s*DistanceUnit\.CM\s*\)/, /<\s*10(?:\.0+)?/],
        ["Gate movement with storage, angle, distance, and color conditions", /&&[\s\S]*?&&[\s\S]*?&&/, /(?:20(?:\.0+)?\s*[<=>]|[<=>]\s*20(?:\.0+)?)/, /(?:160(?:\.0+)?\s*[<=>]|[<=>]\s*160(?:\.0+)?)/],
        ["Collect red at 0.8 and eject blue at -0.5", /setPower\s*\(\s*0\.8(?:0*)?\s*\)/, /setPower\s*\(\s*-0\.5(?:0*)?\s*\)/],
        ["Stop the intake in the final fallback", /\belse\b[\s\S]*?setPower\s*\(\s*0(?:\.0+)?\s*\)/],
        ["Report all five readings and the sorter state", /telemetry\s*\.\s*addData\s*\([^)]*\)[\s\S]*?telemetry\s*\.\s*addData\s*\([^)]*\)[\s\S]*?telemetry\s*\.\s*addData\s*\([^)]*\)[\s\S]*?telemetry\s*\.\s*addData\s*\([^)]*\)[\s\S]*?telemetry\s*\.\s*addData\s*\(/]
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
    2: {name: "KG-SFR competition robot", detail: "Team CAD model driven by student motor commands", accent: 0x22d3ee, driveYaw: 0},
    3: {
      name: "Quixilver 8404 · Into the Deep robot",
      detail: "Full Team 8404 competition robot CAD, optimized for the browser",
      accent: 0x38bdf8,
      driveYaw: -Math.PI / 2,
      wheelAxis: "z",
      sourceLabel: "Open Vault FTC · ITD 2024–2025 Robot — By Quixilver",
      sourceUrl: "https://www.open-vault-ftc.org/cad/robots"
    },
    4: {
      name: "2025 FTC Robot",
      detail: "Manning competition robot CAD, optimized for the browser",
      accent: 0x60a5fa,
      sourceLabel: "Manning, 2025 FTC Robot, Cad Crowd, 2025 · Creative Commons Attribution · Modified from the original",
      sourceUrl: "https://www.cadcrowd.com/3d-models/2025-ftc-robot"
    },
    5: {
      name: "2024 FTC Robot — CENTERSTAGE",
      detail: "Manning CENTERSTAGE competition robot CAD, optimized for the browser",
      accent: 0xf59e0b,
      // The STEP model's negative-X end is the intake/sloped front.
      driveYaw: Math.PI / 2,
      wheelSpinSign: 1,
      sourceLabel: "Manning, 2024 FTC Robot — CENTERSTAGE, Cad Crowd, 2025 · Creative Commons Attribution · Modified from the original",
      sourceUrl: "https://www.cadcrowd.com/3d-models/2024-ftc-robot"
    },
    6: {
      name: "FTC 17438 Input/Output Robot",
      detail: "Team 17438 competition robot CAD, optimized for the browser",
      accent: 0xa78bfa,
      sourceLabel: "FTC Team 17438 Input/Output, FTC17438 Input/Output Robot Model 29.03.2024, Charleston Dragon Robotics · CC BY 4.0 · Modified from the original",
      sourceUrl: "https://charlestondragonrobotics.org/ftc/"
    },
    7: {name: "Reusable subsystem robot", detail: "Mapped motor, limit switch, and analog sensor module", accent: 0x2dd4bf},
    8: {
      name: "FTC 11115 Gluten Free · SKYSTONE robot",
      detail: "One-motor DR4B lift · real rollers, linkage bars, and scoring assembly",
      accent: 0xfb7185,
      driveYaw: Math.PI / 2,
      wheelAxis: "z",
      wheelSpinSign: 1,
      // CAD left/right labels face the opposite direction to our driving frame.
      wheelMotionOrder: [2, 3, 0, 1],
      sourceLabel: "FTC Team 11115 Gluten Free CAD · used with explicit team permission · Modified from the original; simplified lift motion",
      sourceUrl: "https://www.youtube.com/watch?v=i2g_b54MEFI"
    },
    9: {name: "Servo gripper robot", detail: "Mirrored fingers with a continuous-rotation intake roller", accent: 0xf472b6},
    10: {name: "Encoder distance robot", detail: "Marked drive wheels for measured RUN_TO_POSITION travel", accent: 0x4ade80},
    11: {name: "Multi-sensor intake robot", detail: "Touch, potentiometer, color, and distance sensing around the intake", accent: 0xfbbf24},
    12: {name: "Field-centric mecanum robot", detail: "Four-wheel drive with a visible Control Hub IMU and orientation axes", accent: 0x818cf8},
    13: {name: "Modular architecture robot", detail: "Color-coded drive, lift, and gripper subsystems composed together", accent: 0xc084fc},
    14: {name: "Vision-guided robot", detail: "Camera mast facing three autonomous analysis zones", accent: 0x22c55e},
    15: {name: "Sensor-fused autonomous robot", detail: "Limelight, path follower, and timed scoring arm on one platform", accent: 0x06b6d4}
  });

  const GENERATED_MECHANISM_UNITS = Object.freeze([7, 9, 11, 13]);

  function cadSourceUnitFor(unit) {
    const numericUnit = Number(unit);
    if (numericUnit < 2 || numericUnit > 15) return null;
    // These challenges need several independently controlled parts that the
    // flattened imported CAD cannot articulate faithfully. Their dedicated
    // models preserve the exact motor, sensor, and servo behavior being coded.
    if (GENERATED_MECHANISM_UNITS.indexOf(numericUnit) >= 0) return null;
    if (numericUnit === 8) return 8;
    return 2 + ((numericUnit - 2) % 5);
  }

  function robotProfileForUnit(unit) {
    return ROBOT_PROFILES[cadSourceUnitFor(unit)] || ROBOT_PROFILES[unit];
  }

  const DRIVE_HARDWARE = Object.freeze([
    {label: "LF", name: "leftFront"},
    {label: "LB", name: "leftBack"},
    {label: "RF", name: "rightFront"},
    {label: "RB", name: "rightBack"}
  ]);
  const HARDWARE_PROFILES = Object.freeze({
    2: [],
    3: [{label: "Front slide motor", name: "intake_slide"}],
    4: DRIVE_HARDWARE,
    5: [
      {label: "Intake motor", name: "intake"},
      {label: "Color sensor", name: "intake_color"},
      {label: "Distance sensor", name: "intake_distance"}
    ],
    6: DRIVE_HARDWARE.concat([{label: "Arm", name: "arm"}]),
    7: [
      {label: "Mechanism motor", name: "mechanism"},
      {label: "Limit switch", name: "mechanism_limit"},
      {label: "Potentiometer", name: "mechanism_pot"}
    ],
    8: [
      {label: "Lift motor", name: "lift"},
      {label: "Upper limit", name: "limit_upper"},
      {label: "Lower limit", name: "limit_lower"}
    ],
    9: [
      {label: "Left claw servo", name: "left_claw"},
      {label: "Right claw servo", name: "right_claw"},
      {label: "Intake CRServo", name: "intake_servo"}
    ],
    10: [
      {label: "Left drive", name: "left_drive"},
      {label: "Right drive", name: "right_drive"}
    ],
    11: [
      {label: "Intake motor", name: "intake"},
      {label: "Storage switch", name: "storage_full"},
      {label: "Arm potentiometer", name: "arm_pot"},
      {label: "Color sensor", name: "intake_color"},
      {label: "Distance sensor", name: "intake_range"}
    ],
    12: DRIVE_HARDWARE.concat([{label: "IMU", name: "imu"}]),
    13: [{label: "Arm motor", name: "arm"}, {label: "Claw servo", name: "claw"}],
    14: [{label: "Camera", name: "Webcam 1"}],
    15: [{label: "Scoring servo", name: "scoringArm"}, {label: "Vision", name: "limelight"}]
  });

  const CAD_WHEEL_ORDER = Object.freeze(["left-front", "left-back", "right-front", "right-back"]);

  const KG_ROBOT_MODEL_URL = "./models/kg-sfr-telemark.glb";
  const QUIXILVER_ROBOT_MODEL_URL = "./models/quixilver-8404-itd-telemark.glb";
  const FTC_2025_ROBOT_MODEL_URL = "./models/2025-ftc-robot-manning-telemark.glb";
  const FTC_2024_ROBOT_MODEL_URL = "./models/2024-centerstage-manning-telemark.glb";
  const FTC_17438_ROBOT_MODEL_URL = "./models/ftc17438-inputoutput-telemark.glb";
  const FTC_11115_ROBOT_MODEL_URL = "./models/11115-gluten-free-skystone-telemark.glb";
  const GLTF_LOADER_URL = "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js";

  function setImportedRobotStatus(message) {
    const label = document.getElementById("mastery-robot-label");
    const detail = label && label.querySelector(".mastery-robot-status");
    if (detail) detail.textContent = message;
    if (/unavailable|could not|missing|did not contain/.test(message)) {
      const button = document.getElementById('sim-btn-run');
      if (button && button.textContent === 'Loading robot…') {
        button.textContent = 'Robot failed to load — reload page';
      }
    }
  }

  function ensureGltfLoader(THREE, callback) {
    if (THREE.GLTFLoader) {
      callback(null);
      return;
    }

    let script = document.querySelector("script[data-telemark-gltf-loader]");
    if (!script) {
      script = document.createElement("script");
      script.src = GLTF_LOADER_URL;
      script.dataset.telemarkGltfLoader = "true";
      document.head.appendChild(script);
    }

    script.addEventListener("load", function () {
      callback(THREE.GLTFLoader ? null : new Error("The GLB loader did not initialize."));
    }, {once: true});
    script.addEventListener("error", function () {
      callback(new Error("The GLB loader could not be downloaded."));
    }, {once: true});
  }

  function importedCadBounds(THREE, part) {
    const stored = part && part.userData && part.userData.telemarkCadBounds;
    if (!stored || !Array.isArray(stored.min) || !Array.isArray(stored.max)) {
      return new THREE.Box3().setFromObject(part);
    }
    part.updateWorldMatrix(true, false);
    const bounds = new THREE.Box3();
    [stored.min[0], stored.max[0]].forEach(function (x) {
      [stored.min[1], stored.max[1]].forEach(function (y) {
        [stored.min[2], stored.max[2]].forEach(function (z) {
          bounds.expandByPoint(part.localToWorld(new THREE.Vector3(x, y, z)));
        });
      });
    });
    return bounds;
  }

  function importedCadCenter(THREE, part) {
    const stored = part && part.userData && part.userData.telemarkCadCenter;
    if (Array.isArray(stored) && stored.length === 3) {
      part.updateWorldMatrix(true, false);
      return part.localToWorld(new THREE.Vector3(stored[0], stored[1], stored[2]));
    }
    return importedCadBounds(THREE, part).getCenter(new THREE.Vector3());
  }

  function loadImportedRobot(THREE, robot, options) {
    ensureGltfLoader(THREE, function (loaderError) {
      if (loaderError) {
        console.error("[Imported robot loader]", loaderError);
        setImportedRobotStatus(options.name + " unavailable: " + loaderError.message);
        return;
      }

      const loader = new THREE.GLTFLoader();
      loader.load(
        options.url,
        function (gltf) {
          const model = gltf && gltf.scene;
          if (!model) {
            setImportedRobotStatus(options.name + " file did not contain a scene.");
            return;
          }

          // Normalize the real footprint to the presentation scale used by the
          // mastery field, center the chassis, and sink it slightly into the
          // floor so wheel contact reads clearly. STEP-derived assets retain
          // their CAD Z-up orientation and are rotated before measuring bounds.
          if (options.rotation) {
            model.rotation.set(options.rotation[0], options.rotation[1], options.rotation[2]);
          }
          model.updateMatrixWorld(true);
          const bounds = new THREE.Box3().setFromObject(model);
          const size = bounds.getSize(new THREE.Vector3());
          const center = bounds.getCenter(new THREE.Vector3());
          const wheelBounds = new THREE.Box3();
          const wheelCenters = [];
          CAD_WHEEL_ORDER.forEach(function (name) {
            const wheel = model.getObjectByName && model.getObjectByName("telemark-cad-wheel-" + name);
            if (wheel) {
              wheelBounds.union(importedCadBounds(THREE, wheel));
              wheelCenters.push(importedCadCenter(THREE, wheel));
            }
          });
          const driveCenter = wheelCenters.length
            ? wheelCenters.reduce(function (total, wheelCenter) {
                return total.add(wheelCenter);
              }, new THREE.Vector3()).multiplyScalar(1 / wheelCenters.length)
            : center;
          const groundY = wheelBounds.isEmpty() ? bounds.min.y : wheelBounds.min.y;
          const footprint = Math.max(size.x, size.z);
          const scale = footprint > 0 ? (options.footprint || 2.15) / footprint : 1;
          model.scale.setScalar(scale);
          model.position.set(
            -driveCenter.x * scale,
            -groundY * scale + (options.groundClearance || 0),
            -driveCenter.z * scale
          );

          model.traverse(function (object) {
            if (!object.isMesh) return;
            object.castShadow = options.castShadow !== false;
            object.receiveShadow = false;
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach(function (entry) {
              if (!entry) return;
              entry.side = THREE.FrontSide;
              entry.needsUpdate = true;
            });
          });

          robot.add(model);
          setImportedRobotStatus(options.loadedMessage);
          if (typeof options.onLoad === "function") options.onLoad(model, scale);
        },
        function (event) {
          if (!event || !event.total) return;
          const percent = Math.min(100, Math.round(event.loaded / event.total * 100));
          setImportedRobotStatus("Loading " + options.name + "… " + percent + "%");
        },
        function (error) {
          console.error("[Imported robot model]", error);
          setImportedRobotStatus(options.name + " could not be loaded.");
        }
      );
    });
  }

  function loadKgRobot(THREE, robot, onLoad) {
    loadImportedRobot(THREE, robot, {
      name: "KG-SFR model",
      url: KG_ROBOT_MODEL_URL,
      footprint: 2.15,
      groundClearance: 0,
      loadedMessage: "Optimized team CAD model · real wheels driven by student code",
      onLoad: onLoad
    });
  }

  function loadQuixilverRobot(THREE, robot, onLoad) {
    loadImportedRobot(THREE, robot, {
      name: "Quixilver 8404 robot",
      url: QUIXILVER_ROBOT_MODEL_URL,
      footprint: 2.4,
      rotation: [Math.PI / 2, 0, 0],
      groundClearance: 0,
      loadedMessage: "Full Team 8404 CAD · real wheels and mechanism driven by student code",
      onLoad: onLoad
    });
  }

  function load2025FtcRobot(THREE, robot, onLoad) {
    loadImportedRobot(THREE, robot, {
      name: "2025 FTC Robot",
      url: FTC_2025_ROBOT_MODEL_URL,
      footprint: 2.15,
      rotation: [-Math.PI / 2, 0, 0],
      groundClearance: 0,
      castShadow: false,
      loadedMessage: "Manning competition CAD · real wheels driven by student code",
      onLoad: onLoad
    });
  }

  function load2024CenterstageRobot(THREE, robot, onLoad) {
    loadImportedRobot(THREE, robot, {
      name: "2024 FTC Robot — CENTERSTAGE",
      url: FTC_2024_ROBOT_MODEL_URL,
      footprint: 2.15,
      rotation: [-Math.PI / 2, 0, 0],
      groundClearance: 0,
      castShadow: false,
      loadedMessage: "Manning CENTERSTAGE CAD · real wheels and intake driven by student code",
      onLoad: onLoad
    });
  }

  function load17438Robot(THREE, robot, onLoad) {
    loadImportedRobot(THREE, robot, {
      name: "FTC 17438 Input/Output robot",
      url: FTC_17438_ROBOT_MODEL_URL,
      footprint: 2.15,
      groundClearance: 0,
      castShadow: false,
      loadedMessage: "FTC 17438 Input/Output CAD · real wheels and front arm driven by student code",
      onLoad: onLoad
    });
  }

  function load11115Robot(THREE, robot, onLoad) {
    loadImportedRobot(THREE, robot, {
      name: "FTC 11115 Gluten Free SKYSTONE robot",
      url: FTC_11115_ROBOT_MODEL_URL,
      footprint: 2.2,
      rotation: [-Math.PI / 2, 0, 0],
      groundClearance: 0,
      castShadow: false,
      loadedMessage: "Team 11115 CAD · one-motor DR4B linkage driven by student code",
      onLoad: onLoad
    });
  }

  function loadCadRobotForUnit(sourceUnit, THREE, robot, onLoad) {
    if (sourceUnit === 2) return loadKgRobot(THREE, robot, onLoad);
    if (sourceUnit === 3) return loadQuixilverRobot(THREE, robot, onLoad);
    if (sourceUnit === 4) return load2025FtcRobot(THREE, robot, onLoad);
    if (sourceUnit === 5) return load2024CenterstageRobot(THREE, robot, onLoad);
    if (sourceUnit === 6) return load17438Robot(THREE, robot, onLoad);
    if (sourceUnit === 8) return load11115Robot(THREE, robot, onLoad);
    return null;
  }

  function createChallengeRobot(unit, challengeMotion) {
    const THREE = global.THREE;
    const scene = global.scene;
    const cadSourceUnit = cadSourceUnitFor(unit);
    const profile = robotProfileForUnit(unit);
    if (!THREE || !scene || !profile) return null;
    const motion = challengeMotion || global.TelemarkMasteryMotion.create(unit);
    let modelReady = !cadSourceUnit;
    if (cadSourceUnit) {
      const button = document.getElementById('sim-btn-run');
      if (button) { button.disabled = true; button.textContent = 'Loading robot…'; }
    }

    const oldVisual = scene.getObjectByName && scene.getObjectByName("mastery-challenge-visual");
    if (oldVisual) scene.remove(oldVisual);

    const visual = new THREE.Group();
    visual.name = "mastery-challenge-visual";
    visual.userData.isModelReady = function () { return modelReady; };
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

    function rigCadMechanism(model, pivotFractions) {
      const part = model.getObjectByName && model.getObjectByName("telemark-cad-mechanism");
      if (!part) {
        setImportedRobotStatus("The optimized CAD is missing its movable mechanism node.");
        return null;
      }
      robot.updateMatrixWorld(true);
      const bounds = importedCadBounds(THREE, part);
      const fractions = pivotFractions || [0.5, 0.5, 0.5];
      const pivotWorld = new THREE.Vector3(
        THREE.MathUtils.lerp(bounds.min.x, bounds.max.x, fractions[0]),
        THREE.MathUtils.lerp(bounds.min.y, bounds.max.y, fractions[1]),
        THREE.MathUtils.lerp(bounds.min.z, bounds.max.z, fractions[2])
      );
      const pivot = new THREE.Group();
      pivot.name = "telemark-cad-mechanism-pivot";
      robot.add(pivot);
      pivot.position.copy(robot.worldToLocal(pivotWorld.clone()));
      robot.updateMatrixWorld(true);
      pivot.attach(part);
      return pivot;
    }

    function rigCadTranslation(model) {
      const part = model.getObjectByName && model.getObjectByName("telemark-cad-mechanism");
      if (!part) {
        setImportedRobotStatus("The optimized CAD is missing its movable mechanism node.");
        return null;
      }
      const travel = new THREE.Group();
      travel.name = "telemark-cad-mechanism-travel";
      robot.add(travel);
      robot.updateMatrixWorld(true);
      travel.attach(part);
      return travel;
    }

    function rig11115Lift(model, modelScale) {
      function part(name) {
        return model.getObjectByName && model.getObjectByName(name);
      }

      function pivotPart(name) {
        const movingPart = part(name);
        const rawPivot = movingPart && movingPart.userData && movingPart.userData.telemarkCadPivot;
        if (!movingPart || !Array.isArray(rawPivot)) return null;
        model.updateWorldMatrix(true, false);
        const pivotWorld = model.localToWorld(new THREE.Vector3(rawPivot[0], rawPivot[1], rawPivot[2]));
        const pivot = new THREE.Group();
        pivot.name = name + "-pivot";
        robot.add(pivot);
        pivot.position.copy(robot.worldToLocal(pivotWorld.clone()));
        robot.updateMatrixWorld(true);
        pivot.attach(movingPart);
        pivot.userData.restPosition = pivot.position.clone();
        return pivot;
      }

      function travelPart(name) {
        const movingPart = part(name);
        if (!movingPart) return null;
        const travel = new THREE.Group();
        travel.name = name + "-travel";
        robot.add(travel);
        robot.updateMatrixWorld(true);
        travel.attach(movingPart);
        travel.userData.restPosition = travel.position.clone();
        return travel;
      }

      const rig = {
        lowerLow: pivotPart("telemark-cad-lift-lower-low"),
        lowerHigh: pivotPart("telemark-cad-lift-lower-high"),
        upperLow: pivotPart("telemark-cad-lift-upper-low"),
        upperHigh: pivotPart("telemark-cad-lift-upper-high"),
        middle: travelPart("telemark-cad-lift-middle"),
        carriage: travelPart("telemark-cad-lift-carriage"),
        scale: modelScale
      };
      if (Object.values(rig).some(function (value) { return value == null; })) {
        setImportedRobotStatus("The optimized Team 11115 CAD is missing a lift linkage group.");
        return null;
      }
      return rig;
    }

    function animate11115Lift(rig) {
      const progress = THREE.MathUtils.clamp((motion.state.slidePosition - 0.72) / 1.10, 0, 1);
      const restingAngle = 0.322;
      const deployedAngle = 1.32;
      const angle = THREE.MathUtils.lerp(restingAngle, deployedAngle, progress);
      const deltaAngle = angle - restingAngle;
      const linkLength = 0.441;
      const baseMidpoint = {x: -0.2, z: 0.2685};
      const middleRest = {x: 0.2195, z: 0.408};
      const middleNow = {
        x: baseMidpoint.x + linkLength * Math.cos(angle),
        z: baseMidpoint.z + linkLength * Math.sin(angle)
      };
      const middleDelta = {
        x: middleNow.x - middleRest.x,
        z: middleNow.z - middleRest.z
      };
      const upperAnchorRest = {x: 0.2195, z: 0.306};
      const topRest = {x: -0.2, z: 0.4455};
      const upperAngle = Math.PI - angle;
      const topNow = {
        x: upperAnchorRest.x + middleDelta.x + linkLength * Math.cos(upperAngle),
        z: upperAnchorRest.z + middleDelta.z + linkLength * Math.sin(upperAngle)
      };
      const topDelta = {x: topNow.x - topRest.x, z: topNow.z - topRest.z};

      rig.lowerLow.rotation.z = deltaAngle;
      rig.lowerHigh.rotation.z = deltaAngle;
      [rig.upperLow, rig.upperHigh].forEach(function (pivot) {
        pivot.rotation.z = -deltaAngle;
        pivot.position.copy(pivot.userData.restPosition);
        pivot.position.x += middleDelta.x * rig.scale;
        pivot.position.y += middleDelta.z * rig.scale;
      });
      rig.middle.position.copy(rig.middle.userData.restPosition);
      rig.middle.position.x += middleDelta.x * rig.scale;
      rig.middle.position.y += middleDelta.z * rig.scale;
      rig.carriage.position.copy(rig.carriage.userData.restPosition);
      rig.carriage.position.x += topDelta.x * rig.scale;
      rig.carriage.position.y += topDelta.z * rig.scale;
    }

    function rigCadChassis(model) {
      const rigged = [];
      CAD_WHEEL_ORDER.forEach(function (name) {
        const part = model.getObjectByName && model.getObjectByName("telemark-cad-wheel-" + name);
        if (!part) return;
        const spinAxis = part.userData && part.userData.spinAxis || profile.wheelAxis || "x";
        robot.updateMatrixWorld(true);
        const center = importedCadCenter(THREE, part);
        const pivot = new THREE.Group();
        pivot.name = "telemark-cad-wheel-pivot-" + name;
        robot.add(pivot);
        pivot.position.copy(robot.worldToLocal(center.clone()));
        robot.updateMatrixWorld(true);
        pivot.attach(part);
        rigged.push({object: pivot, axis: spinAxis, name: name});
      });
      if (rigged.length !== CAD_WHEEL_ORDER.length) {
        setImportedRobotStatus("The optimized CAD is missing one or more movable wheel nodes.");
      }
      wheels.splice(0, wheels.length);
      CAD_WHEEL_ORDER.forEach(function (name) {
        const wheel = rigged.find(function (entry) { return entry.name === name; });
        if (wheel) wheels.push(wheel);
      });
      return rigged.length === CAD_WHEEL_ORDER.length;
    }

    const wheels = [];
    if (!cadSourceUnit) {
      // The generated challenge robots share a competition-scale chassis.
      // Units 2–6 use imported full-robot CAD models instead.
      box([1.85, 0.22, 1.35], [0, 0.34, 0], darkMat);
      box([1.72, 0.10, 1.18], [0, 0.49, 0], accentMat);
      [-0.78, 0.78].forEach(function (x) {
        box([0.09, 0.15, 1.3], [x, 0.59, 0], frameMat);
      });
      [-1, 1].forEach(function (side) {
        [-0.48, 0.48].forEach(function (z) {
          wheels.push(cylinder(0.27, 0.20, [side * 1.0, 0.29, z], tireMat, [0, 0, Math.PI / 2]));
        });
      });
      box([0.68, 0.23, 0.48], [0, 0.67, 0.12], sensorMat);
      box([0.48, 0.025, 0.34], [0, 0.795, 0.12], accentMat);
    }

    let animation = null;

    function applyDriveState() {
      const driveYaw = profile.driveYaw || 0;
      const wheelSpinSign = profile.wheelSpinSign == null ? -1 : profile.wheelSpinSign;
      const cosYaw = Math.cos(driveYaw);
      const sinYaw = Math.sin(driveYaw);
      robot.position.x = cosYaw * motion.state.x + sinYaw * motion.state.z;
      robot.position.z = -sinYaw * motion.state.x + cosYaw * motion.state.z;
      robot.rotation.y = -motion.state.heading;
      wheels.forEach(function (wheel, index) {
        const object = wheel.object || wheel;
        const axis = wheel.axis || "x";
        const motionIndex = profile.wheelMotionOrder ? profile.wheelMotionOrder[index] : index;
        // Match each CAD axle and physical side to the simulator's driving frame.
        object.rotation[axis] = wheelSpinSign * motion.state.wheelAngles[motionIndex];
      });
    }

    if (cadSourceUnit) {
      let cadMechanism = null;
      let glutenFreeLift = null;
      loadCadRobotForUnit(cadSourceUnit, THREE, robot, function (model, modelScale) {
        rigCadChassis(model);
        if (cadSourceUnit === 8) glutenFreeLift = rig11115Lift(model, modelScale);
        if (cadSourceUnit === 8 && !glutenFreeLift) return;
        modelReady = true;
        const button = document.getElementById('sim-btn-run');
        if (button) { button.disabled = false; button.textContent = 'Init'; }
        if (model.getObjectByName && model.getObjectByName("telemark-cad-mechanism")) {
          if (cadSourceUnit === 3) cadMechanism = rigCadTranslation(model);
          if (cadSourceUnit === 5) cadMechanism = rigCadMechanism(model, [0.46, 0.505, 0.5]);
          if (cadSourceUnit === 6) cadMechanism = rigCadMechanism(model, [0.5, 0.455, 0.356]);
        }
      });
      animation = function () {
        applyDriveState();
        if (cadSourceUnit === 8) {
          if (glutenFreeLift) animate11115Lift(glutenFreeLift);
          return;
        }
        if (!cadMechanism) return;
        if (cadSourceUnit === 3) {
          let extension = motion.state.primaryPosition;
          if (unit === 8) extension = motion.state.slidePosition - 1.25;
          if (unit === 13) extension = motion.state.armAngle;
          cadMechanism.position.x = extension * 0.62;
          return;
        }
        if (cadSourceUnit === 5) {
          let deployment = 0;
          if (unit === 5) deployment = motion.state.primaryPosition;
          if (unit === 15) deployment = motion.servoValues()[0] || 0;
          cadMechanism.rotation.z = deployment * 2.0;
          return;
        }
        if (cadSourceUnit === 6) {
          cadMechanism.rotation.x = -motion.state.armAngle;
        }
      };
    } else if (unit === 7) {
      box([0.48, 0.58, 0.48], [-0.45, 0.92, 0.12], accentMat);
      const subsystemMotor = cylinder(0.18, 0.42, [0.42, 0.87, 0.14], darkMat, [Math.PI / 2, 0, 0]);
      box([0.18, 0.18, 0.18], [0.66, 0.68, -0.18], warningMat);
      sphere(0.12, [0.52, 1.16, -0.12], sensorMat);
      box([0.08, 0.65, 0.08], [0.08, 0.96, 0.12], frameMat);
      animation = function () {
        applyDriveState();
        subsystemMotor.rotation.y = motion.state.primaryAngle;
      };
    } else if (unit === 8) {
      [-0.34, 0.34].forEach(function (x) {
        box([0.11, 1.55, 0.12], [x, 1.22, 0.08], frameMat);
      });
      const carriage = box([0.9, 0.22, 0.48], [0, 1.32, 0.08], accentMat);
      box([0.16, 0.12, 0.18], [0.48, 0.55, 0.08], redMat);
      box([0.16, 0.12, 0.18], [0.48, 1.9, 0.08], greenMat);
      animation = function () {
        applyDriveState();
        carriage.position.y = motion.state.slidePosition;
      };
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
        applyDriveState();
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
      animation = function () {
        applyDriveState();
        intake.rotation.x = motion.state.primaryAngle;
      };
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
        applyDriveState();
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
      animation = function () {
        applyDriveState();
        cameraHead.rotation.y = motion.state.cameraAngle;
      };
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
        if (motion.state.pathProgress > 0 || motion.state.followerActive) {
          const point = path.getPoint(motion.state.pathProgress);
          robot.position.set(point.x, 0, point.z);
        } else {
          applyDriveState();
        }
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
      detail.className = "mastery-robot-status";
      detail.textContent = profile.detail;
      label.appendChild(detail);
      if (profile.sourceUrl && profile.sourceLabel) {
        const source = document.createElement("a");
        source.className = "mastery-robot-source";
        source.href = profile.sourceUrl;
        source.target = "_blank";
        source.rel = "noopener noreferrer";
        source.textContent = "Source: " + profile.sourceLabel;
        source.setAttribute("aria-label", profile.sourceLabel + " (opens in a new tab)");
        label.appendChild(source);
      }
      sceneContainer.appendChild(label);
    }

    if (typeof global.setCameraOrbit === "function") {
      const groundView = unit === 2;
      global.setCameraOrbit({
        theta: groundView ? 0.82 : 0.56,
        phi: groundView ? 1.2 : 0.78,
        radius: unit === 8 ? 8.0 : (unit >= 14 ? 6.8 : 5.2),
        target: {
          x: 0,
          y: unit === 8 ? 1.5 : (groundView ? 0.42 : 0.72),
          z: unit >= 14 ? -0.35 : 0
        }
      });
    }
    if (animation && typeof global.addAnimationCallback === "function") {
      let previousTime = Date.now() * 0.001;
      global.addAnimationCallback(function () {
        const currentTime = Date.now() * 0.001;
        const dt = currentTime - previousTime;
        previousTime = currentTime;
        if (!modelReady) return;
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

  // Run an isolated, deterministic hardware fixture; never move the student's robot.
  function evaluateHardwareProject(source) {
    const results = checksForUnit(7).map(() => false);
    const code = sourceWithoutComments(source);
    results[0] = checksForUnit(7)[0].slice(1).every(p => p.test(code));
    const java = global.TelemarkJava;
    if (!java) return results;
    let digitalState = true;
    let voltageReads = 0;
    const mappings = [];
    const runtime = java.createRuntime({
      gamepad1: {left_stick_y: 0},
      getDigitalState: () => digitalState,
      getVoltage: () => { voltageReads++; return 1.65; }
    });
    const expected = {mechanism: 'DcMotor', mechanism_limit: 'DigitalChannel', mechanism_pot: 'AnalogInput'};
    const get = runtime.hardwareMap.get;
    runtime.hardwareMap.get = function (type, name) {
      if (expected[name] !== type) throw new Error('Hardware configuration name or type mismatch: ' + name);
      mappings.push({type, name});
      return get(type, name);
    };
    const program = java.compile(source, runtime, {loopLimit: 1000});
    if (!program.ok || program.kind !== 'iterative') return results;
    const main = program.ast.classes.find(c => c.name === program.className);
    const helpers = program.ast.classes.filter(c => c !== main);
    const mechanism = helpers.find(c => c.methods.some(m => m.name === 'init' && /\binit\s*\(\s*(?:final\s+)?HardwareMap\s+\w+\s*\)/.test(sourceWithoutComments(source.slice(c.bodyStart, c.bodyEnd))) && m.params.length === 1));
    const init = main.methods.find(m => m.name === 'init');
    const loop = main.methods.find(m => m.name === 'loop');
    results[2] = Boolean(mechanism);
    results[3] = Boolean(mechanism && /\binit\s*\(\s*(?:final\s+)?HardwareMap\s+\w+\s*\)/.test(code));
    // Accept constants in the mechanism or a separate config class, with any identifier spelling.
    const constants = program.ast.classes.flatMap(c => c.fields.filter(f => f.static && f.final && f.type === 'String' && f.initializer).map(f => ({owner: c.name, name: f.name})));
    const mappingBodies = helpers.flatMap(c => c.methods).map(m => m.body).join('\n');
    results[1] = ['DcMotor', 'DigitalChannel', 'AnalogInput'].every(type => constants.some(f =>
      new RegExp('\\.\\s*get\\s*\\(\\s*' + type + '\\s*\\.\\s*class\\s*,\\s*(?:' + f.owner + '\\s*\\.\\s*)?' + f.name + '\\s*\\)').test(mappingBodies)
    ));
    const delegatesInit = Boolean(init && /\.\s*init\s*\(\s*hardwareMap\s*\)/.test(init.body));
    const delegatesLoop = Boolean(loop && /\.\s*\w+\s*\(/.test(loop.body) && /gamepad1\s*\./.test(loop.body));
    try {
      if (!program.methods.init || !program.methods.loop) return results;
      program.methods.init();
      const initMappings = mappings.length;
      const mappedOnce = name => mappings.filter(m => m.name === name).length === 1;
      results[4] = mappedOnce('mechanism');
      const limit = runtime.devices.get('DigitalChannel:mechanism_limit');
      results[5] = mappedOnce('mechanism_limit') && limit._state.mode === 'INPUT';
      if (program.methods.init_loop) program.methods.init_loop();
      if (program.methods.start) program.methods.start();
      const motor = runtime.devices.get('DcMotor:mechanism');
      const outputs = [];
      for (const input of [-0.7, 0, 0.7]) {
        runtime.gamepad1.left_stick_y = input;
        digitalState = true;
        program.methods.loop();
        outputs.push(motor ? motor.getPower() : NaN);
      }
      results[6] = mappedOnce('mechanism_pot') && voltageReads > 0;
      results[8] = delegatesLoop && outputs.every(Number.isFinite) && Math.abs(outputs[0]) > 0 && outputs[1] === 0 && outputs[0] * outputs[2] < 0;
      const blocked = [];
      for (const input of [-0.7, 0.7]) {
        runtime.gamepad1.left_stick_y = input;
        digitalState = false;
        program.methods.loop();
        blocked.push(motor ? motor.getPower() : NaN);
      }
      // A limit may block both directions or only travel toward the switch.
      results[9] = results[8] && blocked.some(power => power === 0);
      if (program.methods.stop) program.methods.stop();
      results[7] = delegatesInit && initMappings === 3 && mappings.length === initMappings;
      if (!results[7]) results[4] = results[5] = results[6] = false;
    } catch (_) {
      return results;
    }
    return results;
  }

  function evaluate(unit, source) {
    if (unit === 7) return evaluateHardwareProject(source);
    const code = sourceWithoutComments(source);
    return checksForUnit(unit).map(function (check) {
      return check.slice(1).every(function (pattern) {
        pattern.lastIndex = 0;
        return pattern.test(code);
      });
    });
  }

  function injectChallengeStyles() {
    if (document.getElementById("mastery-summary-styles")) return;
    const style = document.createElement("style");
    style.id = "mastery-summary-styles";
    style.textContent = ""
      + ".mastery-hardware-map{display:flex;align-items:center;gap:8px;margin:6px 10px 0;padding:6px 9px;border:1px solid color-mix(in srgb,var(--border) 78%,transparent);border-radius:7px;background:color-mix(in srgb,var(--panel) 84%,transparent);font-family:var(--font-ui);overflow-x:auto;scrollbar-width:none;white-space:nowrap}"
      + ".mastery-hardware-map::-webkit-scrollbar{display:none}"
      + ".mastery-hardware-title{display:flex;align-items:center;gap:5px;color:var(--text-secondary);font-size:.68rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase}"
      + ".mastery-hardware-items{display:flex;align-items:center;gap:6px}"
      + ".mastery-hardware-item{display:inline-flex;align-items:center;gap:4px;color:var(--text-secondary);font-size:.69rem}"
      + ".mastery-hardware-item+ .mastery-hardware-item:before{content:'·';margin-right:2px;color:var(--border)}"
      + ".mastery-hardware-item code{padding:1px 4px;border:1px solid var(--border);border-radius:4px;background:var(--code-bg);color:var(--active);font:.68rem/1.35 var(--font-code)}"
      + ".mastery-sensor-tests{display:flex;align-items:center;gap:4px;margin-left:auto;padding-left:8px;border-left:1px solid var(--border)}"
      + ".mastery-sensor-tests button{padding:3px 7px;border:1px solid var(--border);border-radius:5px;background:var(--code-bg);color:var(--text-secondary);font:600 .65rem/1.25 var(--font-ui);cursor:pointer}"
      + ".mastery-sensor-tests button[aria-pressed='true']{border-color:var(--active);color:var(--active)}"
      + ".mastery-robot-label{position:absolute;left:12px;bottom:12px;z-index:3;max-width:calc(100% - 24px);padding:7px 10px;border:1px solid rgba(34,211,238,.35);border-radius:7px;background:rgba(5,8,13,.82);color:#effbff;font:600 .72rem/1.3 var(--font-code);letter-spacing:.03em;pointer-events:none;backdrop-filter:blur(7px)}"
      + ".mastery-robot-label span{display:block;margin-top:2px;color:rgba(221,241,249,.68);font-family:var(--font-ui);font-weight:400;letter-spacing:0}"
      + ".mastery-robot-label a{display:block;margin-top:3px;color:#67e8f9;font-family:var(--font-ui);font-weight:500;letter-spacing:0;pointer-events:auto;text-decoration:none}"
      + ".mastery-robot-label a:hover,.mastery-robot-label a:focus{text-decoration:underline}"
      + ":root[data-theme='light'] .mastery-robot-label,:root[data-telemark-theme='light'] .mastery-robot-label{background:rgba(255,255,255,.86);color:#102a36}"
      + "#sim-scene-container{min-height:260px}";
    document.head.appendChild(style);
  }

  function createHardwareMap(unit) {
    const rightPanel = document.getElementById("sim-right-panel");
    const scene = document.getElementById("sim-scene-container");
    if (!rightPanel || !scene) return;
    const old = document.getElementById("mastery-hardware-map");
    if (old) old.remove();
    const panel = document.createElement("section");
    panel.id = "mastery-hardware-map";
    panel.className = "mastery-hardware-map";
    panel.setAttribute("aria-label", "Simulator hardware configuration names");
    const hardware = HARDWARE_PROFILES[unit] || DRIVE_HARDWARE;
    panel.innerHTML = "<span class=\"mastery-hardware-title\"><i class=\"fa-solid fa-microchip\"></i> Hardware</span>"
      + "<span class=\"mastery-hardware-items\">"
      + hardware.map(function (item) {
        return "<span class=\"mastery-hardware-item\"><span>" + item.label + "</span><code>\"" + item.name + "\"</code></span>";
      }).join("")
      + "</span>";
    rightPanel.insertBefore(panel, scene);

    if (unit === 5 || unit === 11) {
      const colorName = "intake_color";
      const distanceName = unit === 5 ? "intake_distance" : "intake_range";
      const colorSensor = global.hardwareMap.get("ColorSensor", colorName);
      const distanceSensor = global.hardwareMap.get("DistanceSensor", distanceName);
      const testControls = document.createElement("span");
      testControls.className = "mastery-sensor-tests";
      testControls.setAttribute("aria-label", "Simulated sorter inputs");
      testControls.innerHTML = ""
        + "<button type=\"button\" data-sorter-sample=\"red\">Red · 7 cm</button>"
        + "<button type=\"button\" data-sorter-sample=\"blue\">Blue · 7 cm</button>"
        + "<button type=\"button\" data-sorter-sample=\"clear\">No sample</button>";
      panel.appendChild(testControls);

      function selectSample(sample) {
        if (sample === "red") {
          colorSensor._setColor(240, 25, 35, 255);
          distanceSensor._setDistance(7 / 2.54);
        } else if (sample === "blue") {
          colorSensor._setColor(25, 35, 240, 255);
          distanceSensor._setDistance(7 / 2.54);
        } else {
          colorSensor._setColor(0, 0, 0, 0);
          distanceSensor._setDistance(30 / 2.54);
        }
        testControls.querySelectorAll("[data-sorter-sample]").forEach(function (button) {
          button.setAttribute("aria-pressed", String(button.dataset.sorterSample === sample));
        });
      }

      testControls.addEventListener("click", function (event) {
        const button = event.target.closest && event.target.closest("[data-sorter-sample]");
        if (button) selectSample(button.dataset.sorterSample);
      });
      selectSample("red");

      if (unit === 11) {
        const storage = global.hardwareMap.get("DigitalChannel", "storage_full");
        const armPot = global.hardwareMap.get("AnalogInput", "arm_pot");
        storage._setState(true);
        armPot._setVoltage(1.65);
        const safetyButton = document.createElement("button");
        safetyButton.type = "button";
        safetyButton.textContent = "Safety: ready";
        safetyButton.setAttribute("aria-pressed", "true");
        safetyButton.addEventListener("click", function () {
          const ready = safetyButton.getAttribute("aria-pressed") !== "true";
          storage._setState(ready);
          armPot._setVoltage(ready ? 1.65 : 3.3);
          safetyButton.setAttribute("aria-pressed", String(ready));
          safetyButton.textContent = ready ? "Safety: ready" : "Safety: blocked";
        });
        testControls.appendChild(safetyButton);
      }
    }
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
      injectChallengeStyles();
      setTelemetryStudentOnly(true);
      setCode(config.starter);
      setChallenge({
        title: config.title,
        scenario: config.scenario,
        requirements: checks.map(function (check) { return check[0]; }),
        successMessage: "All challenge checks passed. Review the simulator behavior before continuing to the next unit."
      });
      setBadges([
        {iconClass: "fa-solid fa-file-code", label: "FTC SDK shell", active: true},
        {iconClass: "fa-solid fa-layer-group", label: "Whole unit", active: true},
        {iconClass: "fa-solid fa-list-check", label: checks.length + " checks", active: true},
        {iconClass: "fa-solid fa-robot", label: robotProfileForUnit(unit).name, active: true}
      ]);
      setActiveInputs(config.inputs || []);
      createHardwareMap(unit);
      const challengeVisual = createChallengeRobot(unit, challengeMotion);

      function validate() {
        clearHints();
        const source = getCode();
        const compilation = global.TelemarkSimulatorBase.compileStudentSource(source);
        if (!compilation.ok) {
          const diagnostic = compilation.diagnostics[0] || {};
          const message = String(diagnostic.message || "Unable to compile Java").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          addHint("Java compile error: " + message, "error");
        }
        const results = compilation.ok ? evaluate(unit, source) : checks.map(function () { return false; });
        const forbiddenFailures = (config.forbidden || []).filter(function (rule) {
          rule[1].lastIndex = 0;
          return rule[1].test(sourceWithoutComments(source));
        });

        results.forEach(function (passed, index) {
          setRequirement(index, passed && forbiddenFailures.length === 0);
        });
        forbiddenFailures.forEach(function (rule) {
          addHint("<i class=\"fa-solid fa-triangle-exclamation\"></i> " + rule[0], "error");
        });
        if (results.every(Boolean) && forbiddenFailures.length === 0) {
          addHint("<i class=\"fa-solid fa-circle-check\"></i> Unit checks passed for the current source.", "info");
        } else if (compilation.ok) {
          addHint("Use the requirement list beside the editor as a debugging map. It describes behavior, not exact code spelling.", "info");
        }
        return results;
      }

      global.onInit = function () {
        if (challengeVisual && !challengeVisual.userData.isModelReady()) {
          addHint('Wait for the robot model to load before initializing.', 'info');
          return false;
        }
        challengeMotion.setLifecyclePhase("initialized");
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
        challengeMotion.setLifecyclePhase("running");
        validate();
        updateTelemetry();
      };
      global.onStop = function () {
        challengeMotion.setLifecyclePhase("stopped");
        updateTelemetry();
        if (global.hardwareMap && typeof global.hardwareMap.stopAll === "function") {
          global.hardwareMap.stopAll();
        }
      };
      global.onReset = function () {
        clearHints();
        checks.forEach(function (_check, index) { setRequirement(index, false); });
      };

      if (unit === 7 && global.TelemarkProject) {
        const editor = document.getElementById("sim-code-editor");
        global.TelemarkProject.attach(editor);
      }
      clearHints();
      checks.forEach(function (_check, index) { setRequirement(index, false); });
    };
  }

  const script = document.currentScript;
  const selectedUnit = Number(script && script.dataset ? script.dataset.unit : 0);
  global.TelemarkMasteryChallenge = Object.freeze({
    configs: CONFIGS,
    robotProfiles: ROBOT_PROFILES,
    robotProfileForUnit: robotProfileForUnit,
    cadSourceUnitFor: cadSourceUnitFor,
    checksForUnit: checksForUnit,
    createChallengeRobot: createChallengeRobot,
    evaluate: evaluate,
    install: install
  });
  if (selectedUnit) install(selectedUnit);
})(window);
