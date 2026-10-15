// Offline preparation only. No 3D library or GLB parser is shipped to visitors.
// Source: Innerscene, original CC0 heart geometry, adapted from MakeHuman.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = process.argv[2];
if (!source) throw new Error('Supply the official heart.glb downloaded from the source in docs/heart-redesign.md');
const bytes = readFileSync(source);
if (bytes.toString('ascii', 0, 4) !== 'glTF') throw new Error('Expected glTF binary');
const jsonLength = bytes.readUInt32LE(12);
const gltf = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString());
const binary = bytes.subarray(28 + jsonLength);
const componentBytes = { 5123: 2, 5125: 4, 5126: 4 };
const componentCount = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
function accessor(index) {
  const a = gltf.accessors[index], v = gltf.bufferViews[a.bufferView];
  const size = componentBytes[a.componentType], count = componentCount[a.type];
  const stride = v.byteStride || size * count;
  const start = (v.byteOffset || 0) + (a.byteOffset || 0);
  return Array.from({ length: a.count }, (_, i) => Array.from({ length: count }, (_, k) => {
    const offset = start + i * stride + k * size;
    return a.componentType === 5126 ? binary.readFloatLE(offset) : a.componentType === 5123 ? binary.readUInt16LE(offset) : binary.readUInt32LE(offset);
  }));
}
const vertices = [], triangles = [], edges = new Set();
gltf.meshes.forEach((mesh, part) => mesh.primitives.forEach(p => {
  const positions = accessor(p.attributes.POSITION), normals = accessor(p.attributes.NORMAL);
  const indices = accessor(p.indices).flat(), welded = new Map(), remap = [];
  positions.forEach((point, i) => {
    const key = point.map(x => x.toFixed(7)).join(',');
    if (!welded.has(key)) { welded.set(key, vertices.length); vertices.push([...point, ...normals[i]]); }
    remap[i] = welded.get(key);
  });
  for (let i = 0; i < indices.length; i += 3) {
    const face = indices.slice(i, i + 3).map(x => remap[x]);
    if (new Set(face).size !== 3) continue;
    triangles.push(...face);
    for (let k = 0; k < 3; k++) {
      const a = face[k], b = face[(k + 1) % 3];
      edges.add(a < b ? `${a},${b}` : `${b},${a}`);
    }
  }
}));
if (vertices.length >= 65536) throw new Error('Mesh exceeds the 16-bit vertex budget');
const min = [0, 1, 2].map(k => Math.min(...vertices.map(v => v[k])));
const max = [0, 1, 2].map(k => Math.max(...vertices.map(v => v[k])));
const centre = min.map((x, k) => (x + max[k]) / 2), scale = 3.4 / (max[1] - min[1]);
vertices.forEach(v => { for (let k = 0; k < 3; k++) v[k] = (v[k] - centre[k]) * scale; });
const lines = [...edges].flatMap(e => e.split(',').map(Number));
const mesh = Buffer.alloc(24 + vertices.length * 24 + (triangles.length + lines.length) * 2);
mesh.write('VWHT'); mesh.writeUInt32LE(1, 4); mesh.writeUInt32LE(vertices.length, 8);
mesh.writeUInt32LE(triangles.length, 12); mesh.writeUInt32LE(lines.length, 16);
let offset = 24;
vertices.flat().forEach(n => { mesh.writeFloatLE(n, offset); offset += 4; });
[...triangles, ...lines].forEach(n => { mesh.writeUInt16LE(n, offset); offset += 2; });
mkdirSync(resolve(root, 'assets/models'), { recursive: true });
writeFileSync(resolve(root, 'assets/models/heart.bin'), mesh);

// A first-paint/no-WebGL fallback made from exactly the same geometry.
function project(v) {
  let [x, y, z] = v;
  const yaw = -0.24, pitch = -0.06, roll = -0.12;
  [x, z] = [x * Math.cos(yaw) + z * Math.sin(yaw), -x * Math.sin(yaw) + z * Math.cos(yaw)];
  [y, z] = [y * Math.cos(pitch) - z * Math.sin(pitch), y * Math.sin(pitch) + z * Math.cos(pitch)];
  [x, y] = [x * Math.cos(roll) - y * Math.sin(roll), x * Math.sin(roll) + y * Math.cos(roll)];
  return [300 + x * 163, 350 - y * 163, z];
}
const projected = vertices.map(project);
let path = '';
for (let i = 0; i < lines.length; i += 2) {
  const a = lines[i], b = lines[i + 1];
  if ((vertices[a][5] + vertices[b][5]) / 2 < -0.12) continue;
  const p = projected[a], q = projected[b];
  path += `M${p[0].toFixed(1)},${p[1].toFixed(1)}L${q[0].toFixed(1)},${q[1].toFixed(1)}`;
}
writeFileSync(resolve(root, 'assets/models/heart-fallback.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700"><path d="${path}" fill="none" stroke="#d7d8dc" stroke-width=".55" stroke-opacity=".62"/></svg>`);
writeFileSync(resolve(root, 'data/heart_mesh.json'), JSON.stringify({ vertices: vertices.length, triangles: triangles.length / 3, edges: lines.length / 2, bytes: mesh.length, source: 'https://www.innerscene.com/tools/library/3d-parts/heart-e9f72b0e', licence: 'CC0-1.0' }, null, 2) + '\n');
console.log(`${vertices.length} vertices, ${lines.length / 2} edges, ${Math.round(mesh.length / 1024)} KiB. Textures and materials removed.`);
