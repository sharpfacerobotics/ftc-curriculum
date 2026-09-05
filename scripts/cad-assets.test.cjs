const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..');
const chassisModels = [
  'kg-sfr-telemark.glb',
  'quixilver-8404-itd-telemark.glb',
  '2025-ftc-robot-manning-telemark.glb',
  '2024-centerstage-manning-telemark.glb',
  'ftc17438-inputoutput-telemark.glb',
];
const mechanismModels = new Set([
  'quixilver-8404-itd-telemark.glb',
  '2024-centerstage-manning-telemark.glb',
  'ftc17438-inputoutput-telemark.glb',
]);
const wheelNames = ['left-front', 'left-back', 'right-front', 'right-back'];
const wheelGeometry = {
  'kg-sfr-telemark.glb': {rawAxle: 2, spinAxis: 'x', outerRotationX: 0, maxAxleRatio: 0.58, minTriangles: 17000},
  'quixilver-8404-itd-telemark.glb': {rawAxle: 1, spinAxis: 'z', outerRotationX: Math.PI / 2, maxAxleRatio: 0.60, minTriangles: 11000},
  '2025-ftc-robot-manning-telemark.glb': {rawAxle: 0, spinAxis: 'x', outerRotationX: -Math.PI / 2, maxAxleRatio: 0.78, minTriangles: 8000},
  '2024-centerstage-manning-telemark.glb': {rawAxle: 1, spinAxis: 'z', outerRotationX: -Math.PI / 2, maxAxleRatio: 0.95, minTriangles: 9000},
  'ftc17438-inputoutput-telemark.glb': {rawAxle: 0, spinAxis: 'x', outerRotationX: 0, maxAxleRatio: 0.68, minTriangles: 18000},
};

function rotateByQuaternion(vector, quaternion) {
  const [x, y, z] = vector;
  const [qx, qy, qz, qw] = quaternion || [0, 0, 0, 1];
  const ix = qw * x + qy * z - qz * y;
  const iy = qw * y + qz * x - qx * z;
  const iz = qw * z + qx * y - qy * x;
  const iw = -qx * x - qy * y - qz * z;
  return [
    ix * qw + iw * -qx + iy * -qz - iz * -qy,
    iy * qw + iw * -qy + iz * -qx - ix * -qz,
    iz * qw + iw * -qz + ix * -qy - iy * -qx,
  ];
}

function rotateAroundX(vector, angle) {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return [vector[0], vector[1] * cosine - vector[2] * sine, vector[1] * sine + vector[2] * cosine];
}

function readGlb(relativeFile) {
  const file = path.join(repoRoot, 'static/simulator/models', relativeFile);
  const bytes = fs.readFileSync(file);
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF', `${relativeFile} must be a binary glTF`);
  const jsonLength = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString().replace(/\0+$/, ''));
  const binHeader = 20 + jsonLength;
  const binLength = bytes.readUInt32LE(binHeader);
  return {json, bin: bytes.subarray(binHeader + 8, binHeader + 8 + binLength)};
}

function indexedBounds(gltf, node) {
  const {json, bin} = gltf;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const primitive of json.meshes[node.mesh].primitives) {
    const positionAccessor = json.accessors[primitive.attributes.POSITION];
    const positionView = json.bufferViews[positionAccessor.bufferView];
    const indexAccessor = json.accessors[primitive.indices];
    const indexView = json.bufferViews[indexAccessor.bufferView];
    const positionStart = (positionView.byteOffset || 0) + (positionAccessor.byteOffset || 0);
    const indexStart = (indexView.byteOffset || 0) + (indexAccessor.byteOffset || 0);
    const stride = positionView.byteStride || 6;
    const widths = {5121: 1, 5123: 2, 5125: 4};
    const indexWidth = widths[indexAccessor.componentType];
    assert.ok(indexWidth, `unsupported wheel index type ${indexAccessor.componentType}`);
    for (let offset = 0; offset < indexAccessor.count; offset++) {
      const byteOffset = indexStart + offset * indexWidth;
      const vertex = indexWidth === 1
        ? bin.readUInt8(byteOffset)
        : indexWidth === 2
          ? bin.readUInt16LE(byteOffset)
          : bin.readUInt32LE(byteOffset);
      const positionOffset = positionStart + vertex * stride;
      const coordinates = [
        bin.readInt16LE(positionOffset) / 32767,
        bin.readInt16LE(positionOffset + 2) / 32767,
        bin.readInt16LE(positionOffset + 4) / 32767,
      ];
      for (let axis = 0; axis < 3; axis++) {
        min[axis] = Math.min(min[axis], coordinates[axis]);
        max[axis] = Math.max(max[axis], coordinates[axis]);
      }
    }
  }
  return {
    min,
    max,
    size: min.map((value, axis) => max[axis] - value),
  };
}

function triangleSignatures(gltf, node) {
  const {json, bin} = gltf;
  const signatures = new Set();
  for (const primitive of json.meshes[node.mesh].primitives) {
    const accessor = json.accessors[primitive.indices];
    const view = json.bufferViews[accessor.bufferView];
    const start = (view.byteOffset || 0) + (accessor.byteOffset || 0);
    const widths = {5121: 1, 5123: 2, 5125: 4};
    const width = widths[accessor.componentType];
    const read = width === 1
      ? (offset) => bin.readUInt8(offset)
      : width === 2
        ? (offset) => bin.readUInt16LE(offset)
        : (offset) => bin.readUInt32LE(offset);
    for (let offset = 0; offset < accessor.count; offset += 3) {
      const vertices = [0, 1, 2].map((corner) => read(start + (offset + corner) * width));
      vertices.sort((left, right) => left - right);
      signatures.add(`${primitive.attributes.POSITION}:${vertices.join(',')}`);
    }
  }
  return signatures;
}

for (const model of chassisModels) {
  const gltf = readGlb(model);
  const {json: gltfJson} = gltf;
  const chassisNode = gltfJson.nodes.find((node) => node.name === 'telemark-cad-chassis');
  assert.ok(chassisNode, `${model} must retain an actual CAD chassis node`);
  assert.equal(gltfJson.extras?.telemarkCadChassis, true, `${model} must carry the reusable chassis marker`);
  const chassisTriangles = gltfJson.meshes[chassisNode.mesh].primitives.reduce(
    (sum, primitive) => sum + gltfJson.accessors[primitive.indices].count / 3,
    0,
  );
  assert.ok(chassisTriangles > 10000, `${model} chassis geometry must not be empty`);
  const chassisSignatures = triangleSignatures(gltf, chassisNode);

  for (const name of wheelNames) {
    const wheelNode = gltfJson.nodes.find((node) => node.name === `telemark-cad-wheel-${name}`);
    assert.ok(wheelNode, `${model} must expose its actual ${name} wheel geometry`);
    assert.equal(wheelNode.extras?.telemarkCadWheel, name);
    assert.equal(wheelNode.extras?.spinAxis, wheelGeometry[model].spinAxis);
    const rawAxleVector = [0, 0, 0];
    rawAxleVector[wheelGeometry[model].rawAxle] = 1;
    const renderedAxle = rotateAroundX(
      rotateByQuaternion(rawAxleVector, wheelNode.rotation),
      wheelGeometry[model].outerRotationX,
    );
    const spinIndex = {x: 0, y: 1, z: 2}[wheelNode.extras.spinAxis];
    assert.ok(
      Math.abs(renderedAxle[spinIndex]) > 0.999,
      `${model} ${name} spin axis must align with its rendered axle; got ${renderedAxle.join(', ')}`,
    );
    const wheelTriangles = gltfJson.meshes[wheelNode.mesh].primitives.reduce(
      (sum, primitive) => sum + gltfJson.accessors[primitive.indices].count / 3,
      0,
    );
    assert.ok(
      wheelTriangles >= wheelGeometry[model].minTriangles,
      `${model} ${name} wheel must contain complete real CAD wheel geometry; got ${wheelTriangles} triangles`,
    );
    const bounds = indexedBounds(gltf, wheelNode);
    const size = bounds.size;
    const recordedBounds = wheelNode.extras?.telemarkCadBounds;
    const recordedCenter = wheelNode.extras?.telemarkCadCenter;
    assert.ok(recordedBounds && recordedCenter, `${model} ${name} must record indexed pivot bounds`);
    for (let axis = 0; axis < 3; axis++) {
      assert.ok(
        Math.abs(recordedBounds.min[axis] - bounds.min[axis]) < 0.0001
          && Math.abs(recordedBounds.max[axis] - bounds.max[axis]) < 0.0001,
        `${model} ${name} recorded bounds must match its indexed triangles`,
      );
      assert.ok(
        Math.abs(recordedCenter[axis] - (bounds.min[axis] + bounds.max[axis]) / 2) < 0.0001,
        `${model} ${name} pivot must be at its own indexed center`,
      );
    }
    for (const triangle of triangleSignatures(gltf, wheelNode)) {
      assert.equal(
        chassisSignatures.has(triangle),
        false,
        `${model} ${name} wheel triangles must be removed from the chassis`,
      );
    }
    const axle = wheelGeometry[model].rawAxle;
    const radial = size.filter((_, axis) => axis !== axle);
    assert.ok(
      size[axle] / Math.min(...radial) <= wheelGeometry[model].maxAxleRatio,
      `${model} ${name} must be cylindrical around its recorded axle; got ${size.join(', ')}`,
    );
    assert.ok(
      Math.max(...radial) / Math.min(...radial) < 1.18,
      `${model} ${name} wheel must have a circular radial envelope; got ${size.join(', ')}`,
    );
  }

  if (model === '2024-centerstage-manning-telemark.glb') {
    const front = gltfJson.nodes.find((node) => node.name === 'telemark-cad-wheel-left-front');
    const back = gltfJson.nodes.find((node) => node.name === 'telemark-cad-wheel-left-back');
    const rightFront = gltfJson.nodes.find((node) => node.name === 'telemark-cad-wheel-right-front');
    assert.ok(
      front.extras.telemarkCadCenter[0] < back.extras.telemarkCadCenter[0],
      'CENTERSTAGE front wheel mapping must use the intake/sloped negative-X end of the source CAD',
    );
    assert.ok(
      front.extras.telemarkCadCenter[1] < rightFront.extras.telemarkCadCenter[1],
      'CENTERSTAGE left/right wheel mapping must be relative to its negative-X front',
    );
  }

  if (mechanismModels.has(model)) {
    const mechanismNode = gltfJson.nodes.find((node) => node.name === 'telemark-cad-mechanism');
    assert.ok(mechanismNode, `${model} must expose actual CAD mechanism geometry`);
    assert.equal(mechanismNode.extras?.telemarkCadMechanism, true);
    const mechanismBounds = indexedBounds(gltf, mechanismNode);
    assert.deepEqual(
      mechanismNode.extras?.telemarkCadBounds,
      {min: mechanismBounds.min, max: mechanismBounds.max},
      `${model} must record bounds from the mechanism's indexed triangles`,
    );
    assert.deepEqual(
      mechanismNode.extras?.telemarkCadCenter,
      mechanismBounds.min.map((value, axis) => (value + mechanismBounds.max[axis]) / 2),
      `${model} must record the mechanism's indexed center`,
    );
    for (const triangle of triangleSignatures(gltf, mechanismNode)) {
      assert.equal(
        chassisSignatures.has(triangle),
        false,
        `${model} mechanism triangles must be removed from the fixed chassis`,
      );
    }
    if (model === 'ftc17438-inputoutput-telemark.glb') {
      assert.equal(
        mechanismNode.extras?.label,
        'FTC 17438 upper arm assembly',
        'Team 17438 must rig the driven upper arm while leaving its lower mount fixed',
      );
    }
    const mechanismTriangles = gltfJson.meshes[mechanismNode.mesh].primitives.reduce(
      (sum, primitive) => sum + gltfJson.accessors[primitive.indices].count / 3,
      0,
    );
    assert.ok(mechanismTriangles > 1000, `${model} mechanism must contain real CAD triangles`);
    if (model === 'ftc17438-inputoutput-telemark.glb') {
      assert.equal(
        mechanismTriangles,
        4840,
        'Team 17438 arm must exclude the curved base plates and fixed motor housing',
      );
    }
  }
}

const glutenFreeModel = readGlb('11115-gluten-free-skystone-telemark.glb');
const glutenFreeJson = glutenFreeModel.json;
function subtreeTriangles(json, node) {
  let triangles = node.mesh === undefined ? 0 : json.meshes[node.mesh].primitives.reduce(
    (sum, primitive) => sum + json.accessors[primitive.indices].count / 3,
    0,
  );
  for (const childIndex of node.children || []) {
    triangles += subtreeTriangles(json, json.nodes[childIndex]);
  }
  return triangles;
}
const glutenFreeGroups = [
  'telemark-cad-chassis',
  ...wheelNames.map((name) => `telemark-cad-wheel-${name}`),
  'telemark-cad-lift-lower-low',
  'telemark-cad-lift-lower-high',
  'telemark-cad-lift-upper-low',
  'telemark-cad-lift-upper-high',
  'telemark-cad-lift-middle',
  'telemark-cad-lift-base',
  'telemark-cad-lift-carriage',
];
for (const name of glutenFreeGroups) {
  const node = glutenFreeJson.nodes.find((candidate) => candidate.name === name);
  assert.ok(node, `Team 11115 CAD must expose ${name}`);
  assert.ok(subtreeTriangles(glutenFreeJson, node) > 500, `${name} must contain real CAD geometry`);
}
for (const name of [
  'telemark-cad-lift-lower-low',
  'telemark-cad-lift-lower-high',
  'telemark-cad-lift-upper-low',
  'telemark-cad-lift-upper-high',
]) {
  const node = glutenFreeJson.nodes.find((candidate) => candidate.name === name);
  assert.equal(node.extras?.telemarkCadPivot?.length, 3, `${name} must record its physical hinge pivot`);
}
assert.equal(glutenFreeJson.extras?.telemarkCadLift, 'double-reverse four-bar');
assert.match(glutenFreeJson.asset?.copyright || '', /11115 Gluten Free.*explicit permission/i);
assert.ok(
  fs.statSync(path.join(repoRoot, 'static/simulator/models/11115-gluten-free-skystone-telemark.glb')).size < 32 * 1024 * 1024,
  'Team 11115 browser CAD should stay below 32 MiB',
);

const challengeSource = fs.readFileSync(
  path.join(repoRoot, 'static/simulator/mastery_challenge.js'),
  'utf8',
);
assert.doesNotMatch(
  challengeSource,
  /add(?:DriveWheel|Flywheel|Intake|Arm)Rig/,
  'Imported CAD robots must not receive fabricated teaching mechanisms',
);
assert.match(challengeSource, /getObjectByName\("telemark-cad-mechanism"\)/);
assert.match(challengeSource, /rigCadTranslation\(model\)/);
assert.match(challengeSource, /rigCadMechanism\(model, \[0\.46, 0\.505, 0\.5\]\)/);
assert.match(challengeSource, /rigCadMechanism\(model, \[0\.5, 0\.455, 0\.356\]\)/);
assert.match(challengeSource, /cadMechanism\.rotation\.z = deployment \* 2\.0/);
assert.match(challengeSource, /cadMechanism\.rotation\.x = -motion\.state\.armAngle/);
assert.match(challengeSource, /function animate11115Lift\(rig\)/);
assert.match(challengeSource, /radius:\s*unit === 8 \? 8\.0/);
assert.match(challengeSource, /y:\s*unit === 8 \? 1\.5/);
assert.match(challengeSource, /rig\.lowerLow\.rotation\.z = deltaAngle/);
assert.match(challengeSource, /pivot\.rotation\.z = -deltaAngle/);
assert.match(challengeSource, /rig\.carriage\.position\.y \+= topDelta\.z \* rig\.scale/);
assert.doesNotMatch(challengeSource, /cadMechanism\.position\.z = -deployment/);
assert.doesNotMatch(
  challengeSource,
  /Math\.sin\(motion\.state\.primaryAngle/,
  'A steady mechanism command must not reverse through a sine animation',
);
assert.match(challengeSource, /getObjectByName\("telemark-cad-wheel-" \+ name\)/);
assert.match(challengeSource, /importedCadCenter\(THREE, part\)/);
assert.match(challengeSource, /importedCadBounds\(THREE, wheel\)/);
assert.match(challengeSource, /const driveCenter = wheelCenters\.length/);
assert.match(challengeSource, /object\.rotation\[axis\] = wheelSpinSign \* motion\.state\.wheelAngles\[index\]/);
assert.match(
  challengeSource,
  /5:\s*\{[\s\S]*?name:\s*"2024 FTC Robot — CENTERSTAGE"[\s\S]*?driveYaw:\s*Math\.PI \/ 2[\s\S]*?wheelSpinSign:\s*1[\s\S]*?\n\s*\}/,
  'CENTERSTAGE motion must point toward the intake/sloped front instead of a chassis side',
);
assert.match(challengeSource, /2 \+ \(\(numericUnit - 2\) % 5\)/);
assert.match(challengeSource, /loadCadRobotForUnit\(cadSourceUnit/);
assert.match(challengeSource, /createHardwareMap\(unit\)/);
assert.match(challengeSource, /data-sorter-sample=\\"red\\"/);
assert.match(challengeSource, /distanceSensor\._setDistance\(7 \/ 2\.54\)/);
assert.match(challengeSource, /Safety: blocked/);
for (const hardwareName of [
  'intake_color',
  'intake_distance',
  'storage_full',
  'arm_pot',
  'intake_range',
  'mechanism_limit',
  'mechanism_pot',
  'limit_upper',
  'limit_lower',
  'lift',
]) {
  assert.match(
    challengeSource,
    new RegExp(`name:\\s*"${hardwareName}"`),
    `${hardwareName} must be visible in the mastery hardware configuration strip`,
  );
}
assert.doesNotMatch(challengeSource, /Unit objective coverage/);

const challengeWindow = {};
vm.runInNewContext(challengeSource, {
  window: challengeWindow,
  document: {currentScript: {dataset: {}}},
  console,
});
const challengeApi = challengeWindow.TelemarkMasteryChallenge;
for (const unit of [7, 9, 11, 13]) {
  assert.equal(
    challengeApi.cadSourceUnitFor(unit),
    null,
    `Unit ${unit} must use its independently articulated mechanism model`,
  );
}
assert.equal(challengeApi.cadSourceUnitFor(8), 8, 'Unit 8 must use Team 11115 Gluten Free CAD');
for (const unit of [2, 3, 4, 5, 6, 10, 12, 14, 15]) {
  assert.equal(
    challengeApi.cadSourceUnitFor(unit),
    2 + ((unit - 2) % 5),
    `Unit ${unit} must retain its imported competition CAD`,
  );
}

const unit5Solution = `
  import com.qualcomm.robotcore.eventloop.opmode.OpMode;
  import com.qualcomm.robotcore.eventloop.opmode.TeleOp;
  @TeleOp(name="Unit_5_Mastery")
  public class Unit5Mastery extends OpMode {
    DcMotor intake; ColorSensor color; DistanceSensor distance;
    public void init() {
      intake = hardwareMap.get(DcMotor.class, "intake");
      color = hardwareMap.get(ColorSensor.class, "intake_color");
      distance = hardwareMap.get(DistanceSensor.class, "intake_distance");
    }
    public void loop() {
      double distanceCm = distance.getDistance(DistanceUnit.CM);
      int red = color.red();
      int blue = color.blue();
      String state;
      if (distanceCm < 10.0 && red > blue) { intake.setPower(0.8); state = "COLLECT RED"; }
      else if (distanceCm < 10.0 && blue > red) { intake.setPower(-0.5); state = "EJECT BLUE"; }
      else { intake.setPower(0.0); state = "STOP"; }
      telemetry.addData("Distance cm", distanceCm);
      telemetry.addData("Red / Blue", red + blue);
      telemetry.addData("State", state);
    }
  }
`;
assert.ok(challengeApi.evaluate(5, unit5Solution).every(Boolean), 'the specified Unit 5 solution must pass every check');
assert.equal(
  challengeApi.evaluate(5, unit5Solution.replace('"intake_distance"', '"distance"'))[3],
  false,
  'Unit 5 must reject the wrong distance sensor configuration name',
);

const unit11Solution = `
  import com.qualcomm.robotcore.eventloop.opmode.OpMode;
  import com.qualcomm.robotcore.eventloop.opmode.TeleOp;
  @TeleOp(name="Unit_11_Mastery")
  public class Unit11Mastery extends OpMode {
    DcMotor intake; DigitalChannel fullSwitch; AnalogInput armPot;
    ColorSensor color; DistanceSensor range;
    public void init() {
      intake = hardwareMap.get(DcMotor.class, "intake");
      fullSwitch = hardwareMap.get(DigitalChannel.class, "storage_full");
      armPot = hardwareMap.get(AnalogInput.class, "arm_pot");
      color = hardwareMap.get(ColorSensor.class, "intake_color");
      range = hardwareMap.get(DistanceSensor.class, "intake_range");
      fullSwitch.setMode(DigitalChannel.Mode.INPUT);
    }
    public void loop() {
      boolean storageFull = !fullSwitch.getState();
      double voltage = armPot.getVoltage();
      double angle = Range.scale(voltage, 0, 3.3, 0, 180);
      int red = color.red(); int blue = color.blue();
      double distanceCm = range.getDistance(DistanceUnit.CM);
      String state;
      if (!storageFull && angle >= 20 && angle <= 160 && distanceCm < 10 && red > blue) {
        intake.setPower(0.8); state = "COLLECT RED";
      } else if (!storageFull && angle >= 20 && angle <= 160 && distanceCm < 10 && blue > red) {
        intake.setPower(-0.5); state = "EJECT BLUE";
      } else { intake.setPower(0); state = "STOP"; }
      telemetry.addData("Storage", storageFull);
      telemetry.addData("Angle", angle);
      telemetry.addData("Distance", distanceCm);
      telemetry.addData("Red / Blue", red + blue);
      telemetry.addData("State", state);
    }
  }
`;
assert.ok(challengeApi.evaluate(11, unit11Solution).every(Boolean), 'the specified Unit 11 solution must pass every check');

console.log('Imported CAD asset tests passed');
