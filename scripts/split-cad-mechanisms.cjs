const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');

const jobs = [
  {
    file: 'static/simulator/models/quixilver-8404-itd-telemark.glb',
    label: 'Quixilver front mechanism',
    select(component) {
      return component.center[0] > 0.72;
    },
  },
  {
    file: 'static/simulator/models/2024-centerstage-manning-telemark.glb',
    label: 'CENTERSTAGE intake assembly',
    select(component) {
      return component.triangles > 10000 && component.center[2] > 0.3;
    },
  },
  {
    file: 'static/simulator/models/ftc17438-inputoutput-telemark.glb',
    label: 'FTC 17438 front arm assembly',
    select(component) {
      return component.center[1] < -0.55;
    },
  },
];

function align4(value) {
  return (value + 3) & ~3;
}

function parseGlb(file) {
  const bytes = fs.readFileSync(file);
  if (bytes.toString('ascii', 0, 4) !== 'glTF') throw new Error(`${file} is not a binary glTF`);
  const jsonLength = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString().replace(/\0+$/, ''));
  const binHeader = 20 + jsonLength;
  const binLength = bytes.readUInt32LE(binHeader);
  const binStart = binHeader + 8;
  return {bytes, json, bin: Buffer.from(bytes.subarray(binStart, binStart + binLength))};
}

function createComponentMap(bytes, json, binStart, primitive) {
  const positionAccessor = json.accessors[primitive.attributes.POSITION];
  const positionView = json.bufferViews[positionAccessor.bufferView];
  const indexAccessor = json.accessors[primitive.indices];
  const indexView = json.bufferViews[indexAccessor.bufferView];
  if (positionAccessor.componentType !== 5122 || indexAccessor.componentType !== 5125) {
    throw new Error('The CAD splitter expects quantized INT16 positions and UINT32 indices');
  }

  const vertexCount = positionAccessor.count;
  const stride = positionView.byteStride || 6;
  const positionStart = binStart + (positionView.byteOffset || 0) + (positionAccessor.byteOffset || 0);
  const indexStart = binStart + (indexView.byteOffset || 0) + (indexAccessor.byteOffset || 0);
  const parent = new Int32Array(vertexCount);
  const rank = new Uint8Array(vertexCount);
  const coordinates = new Int16Array(vertexCount * 3);
  for (let index = 0; index < vertexCount; index++) parent[index] = index;

  function find(value) {
    let root = value;
    while (parent[root] !== root) root = parent[root];
    while (parent[value] !== value) {
      const next = parent[value];
      parent[value] = root;
      value = next;
    }
    return root;
  }

  function union(left, right) {
    let leftRoot = find(left);
    let rightRoot = find(right);
    if (leftRoot === rightRoot) return;
    if (rank[leftRoot] < rank[rightRoot]) [leftRoot, rightRoot] = [rightRoot, leftRoot];
    parent[rightRoot] = leftRoot;
    if (rank[leftRoot] === rank[rightRoot]) rank[leftRoot]++;
  }

  // CAD exporters duplicate vertices along hard edges. Weld coincident
  // quantized positions before finding connected solids so a physical part is
  // not mistaken for a collection of disconnected faces.
  const coincident = new Map();
  for (let index = 0; index < vertexCount; index++) {
    const offset = positionStart + index * stride;
    const x = bytes.readInt16LE(offset);
    const y = bytes.readInt16LE(offset + 2);
    const z = bytes.readInt16LE(offset + 4);
    coordinates[index * 3] = x;
    coordinates[index * 3 + 1] = y;
    coordinates[index * 3 + 2] = z;
    const key = (x + 32768) * 4294967296 + (y + 32768) * 65536 + (z + 32768);
    const match = coincident.get(key);
    if (match === undefined) coincident.set(key, index);
    else union(index, match);
  }

  const indices = new Uint32Array(indexAccessor.count);
  for (let index = 0; index < indexAccessor.count; index++) {
    indices[index] = bytes.readUInt32LE(indexStart + index * 4);
  }
  for (let index = 0; index < indices.length; index += 3) {
    union(indices[index], indices[index + 1]);
    union(indices[index], indices[index + 2]);
  }

  const components = new Map();
  for (let index = 0; index < vertexCount; index++) {
    const root = find(index);
    let component = components.get(root);
    if (!component) {
      component = {
        root,
        triangles: 0,
        min: [Infinity, Infinity, Infinity],
        max: [-Infinity, -Infinity, -Infinity],
      };
      components.set(root, component);
    }
    for (let axis = 0; axis < 3; axis++) {
      const value = coordinates[index * 3 + axis] / 32767;
      component.min[axis] = Math.min(component.min[axis], value);
      component.max[axis] = Math.max(component.max[axis], value);
    }
  }
  for (let index = 0; index < indices.length; index += 3) {
    components.get(find(indices[index])).triangles++;
  }
  for (const component of components.values()) {
    component.center = component.min.map((value, axis) => (value + component.max[axis]) / 2);
  }

  return {find, components, indices, indexAccessor, indexView};
}

function uint32Buffer(values) {
  const buffer = Buffer.alloc(values.length * 4);
  for (let index = 0; index < values.length; index++) buffer.writeUInt32LE(values[index], index * 4);
  return buffer;
}

function encodeGlb(json, bin) {
  const jsonSource = Buffer.from(JSON.stringify(json));
  const paddedJson = Buffer.alloc(align4(jsonSource.length), 0x20);
  jsonSource.copy(paddedJson);
  const paddedBin = Buffer.alloc(align4(bin.length));
  bin.copy(paddedBin);
  const output = Buffer.alloc(12 + 8 + paddedJson.length + 8 + paddedBin.length);
  output.write('glTF', 0);
  output.writeUInt32LE(2, 4);
  output.writeUInt32LE(output.length, 8);
  output.writeUInt32LE(paddedJson.length, 12);
  output.writeUInt32LE(0x4e4f534a, 16);
  paddedJson.copy(output, 20);
  const binHeader = 20 + paddedJson.length;
  output.writeUInt32LE(paddedBin.length, binHeader);
  output.writeUInt32LE(0x004e4942, binHeader + 4);
  paddedBin.copy(output, binHeader + 8);
  return output;
}

function splitJob(job) {
  const file = path.join(repoRoot, job.file);
  const {bytes, json, bin} = parseGlb(file);
  if (json.extras?.telemarkCadMechanism) {
    console.log(`${job.file}: already split`);
    return;
  }
  if (json.meshes.length !== 1 || json.meshes[0].primitives.length !== 1) {
    throw new Error(`${job.file} must contain one flattened mesh primitive`);
  }
  const jsonLength = bytes.readUInt32LE(12);
  const binStart = 20 + jsonLength + 8;
  const primitive = json.meshes[0].primitives[0];
  const graph = createComponentMap(bytes, json, binStart, primitive);
  const movingRoots = new Set(
    [...graph.components.values()].filter(job.select).map((component) => component.root),
  );
  const chassisIndices = [];
  const mechanismIndices = [];
  for (let index = 0; index < graph.indices.length; index += 3) {
    const target = movingRoots.has(graph.find(graph.indices[index])) ? mechanismIndices : chassisIndices;
    target.push(graph.indices[index], graph.indices[index + 1], graph.indices[index + 2]);
  }
  if (!mechanismIndices.length || !chassisIndices.length) {
    throw new Error(`${job.file} selection produced an empty chassis or mechanism`);
  }

  const chassisBuffer = uint32Buffer(chassisIndices);
  const mechanismBuffer = uint32Buffer(mechanismIndices);
  const originalIndexOffset = graph.indexView.byteOffset || 0;
  chassisBuffer.copy(bin, originalIndexOffset);
  graph.indexView.byteLength = chassisBuffer.length;
  graph.indexAccessor.count = chassisIndices.length;

  const mechanismOffset = align4(bin.length);
  const outputBin = Buffer.alloc(mechanismOffset + mechanismBuffer.length);
  bin.copy(outputBin);
  mechanismBuffer.copy(outputBin, mechanismOffset);
  const mechanismViewIndex = json.bufferViews.push({
    buffer: 0,
    byteOffset: mechanismOffset,
    byteLength: mechanismBuffer.length,
    target: graph.indexView.target,
  }) - 1;
  const mechanismAccessorIndex = json.accessors.push({
    type: 'SCALAR',
    componentType: 5125,
    count: mechanismIndices.length,
    bufferView: mechanismViewIndex,
    byteOffset: 0,
  }) - 1;

  const chassisNode = json.nodes.find((node) => node.mesh === 0);
  chassisNode.name = 'telemark-cad-chassis';
  json.meshes[0].name = 'telemark-cad-chassis';
  const mechanismMeshIndex = json.meshes.push({
    name: 'telemark-cad-mechanism',
    primitives: [{...primitive, indices: mechanismAccessorIndex}],
  }) - 1;
  const mechanismNodeIndex = json.nodes.push({
    name: 'telemark-cad-mechanism',
    translation: chassisNode.translation,
    rotation: chassisNode.rotation,
    scale: chassisNode.scale,
    matrix: chassisNode.matrix,
    mesh: mechanismMeshIndex,
    extras: {telemarkCadMechanism: true, label: job.label},
  }) - 1;
  for (const scene of json.scenes) scene.nodes.push(mechanismNodeIndex);
  json.buffers[0].byteLength = outputBin.length;
  json.extras = {
    ...(json.extras || {}),
    telemarkCadMechanism: job.label,
    modification: `${json.extras?.modification || ''} Existing CAD geometry partitioned into independently movable chassis and mechanism nodes.`.trim(),
  };

  const temporary = `${file}.tmp`;
  fs.writeFileSync(temporary, encodeGlb(json, outputBin));
  fs.renameSync(temporary, file);
  console.log(
    `${job.file}: ${movingRoots.size} CAD solids, ${mechanismIndices.length / 3} mechanism triangles, ${chassisIndices.length / 3} chassis triangles`,
  );
}

for (const job of jobs) splitJob(job);
