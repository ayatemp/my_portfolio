import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { sampleTrack } from "./vision-world-runtime";
import type { WorldSceneBuilder } from "./world3d-types";

const TABLE_WIDTH = 6.8;
const SURFACE = 0.24;
const BLOCK_WIDTH = 0.84;
const BLOCK_DEPTH = 0.56;
const BLOCK_HEIGHT = 0.38;
const MAX_TRAIL_SEGMENTS = 32;
const UP = new THREE.Vector3(0, 1, 0);

const toWorld = (value: number) => (value - 0.5) * TABLE_WIDTH;

function drawSurface() {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1024;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const size = canvas.width;

  // Fine variation in the worktop reads as matte material in close-ups.
  const tint = context.createImageData(size, size);
  let random = 15211;
  for (let i = 0; i < tint.data.length; i += 4) {
    random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
    const grain = (random >>> 28) - 8;
    tint.data[i] = 44 + grain;
    tint.data[i + 1] = 70 + grain;
    tint.data[i + 2] = 61 + grain;
    tint.data[i + 3] = 255;
  }
  context.putImageData(tint, 0, 0);

  for (let step = 1; step < 40; step++) {
    const offset = step / 40 * size;
    const major = step % 4 === 0;
    context.beginPath();
    context.strokeStyle = major ? "rgba(199,223,199,0.23)" : "rgba(7,24,17,0.22)";
    context.lineWidth = major ? 1.5 : 1;
    context.moveTo(offset, 0);
    context.lineTo(offset, size);
    context.moveTo(0, offset);
    context.lineTo(size, offset);
    context.stroke();
  }

  // Rulers keep a fixed reference on the surface as the camera turns.
  context.strokeStyle = "rgba(211,230,192,0.65)";
  context.lineWidth = 2;
  context.beginPath();
  for (let step = 0; step <= 50; step++) {
    const offset = 17 + step / 50 * (size - 34);
    const end = step % 5 === 0 ? 34 : 24;
    context.moveTo(offset, 12);
    context.lineTo(offset, end);
    context.moveTo(size - 12, offset);
    context.lineTo(size - end, offset);
  }
  context.stroke();
  context.strokeStyle = "rgba(211,230,192,0.67)";
  context.lineWidth = 3;
  for (const x of [43, size - 43]) {
    for (const y of [43, size - 43]) {
      const xDirection = x < size / 2 ? 1 : -1;
      const yDirection = y < size / 2 ? 1 : -1;
      context.beginPath();
      context.moveTo(x + 23 * xDirection, y);
      context.lineTo(x, y);
      context.lineTo(x, y + 23 * yDirection);
      context.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function createTrail(color: THREE.Color, width: number, opacity: number, elevation: number) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(MAX_TRAIL_SEGMENTS * 18);
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setDrawRange(0, 0);
  const material = new THREE.MeshBasicMaterial({
    color, opacity, transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;

  function update(path: number[][], progress: number, dashed = false) {
    if (path.length < 2) {
      geometry.setDrawRange(0, 0);
      return;
    }

    const player = THREE.MathUtils.clamp(progress, 0, 1) * (path.length - 1);
    const count = Math.min(Math.ceil(player), MAX_TRAIL_SEGMENTS);
    let used = 0;
    for (let index = 0; index < count; index++) {
      const fraction = Math.min(player - index, dashed ? 0.72 : 1);
      const start = path[index];
      const end = path[index + 1];
      const x1 = toWorld(start[0]);
      const z1 = toWorld(start[1]);
      const x2 = x1 + (end[0] - start[0]) * fraction * TABLE_WIDTH;
      const z2 = z1 + (end[1] - start[1]) * fraction * TABLE_WIDTH;
      const length = Math.hypot(x2 - x1, z2 - z1);
      if (length < 0.0001) continue;
      const ox = -(z2 - z1) / length * width;
      const oz = (x2 - x1) / length * width;
      positions.set([
        x1 + ox, elevation, z1 + oz,
        x1 - ox, elevation, z1 - oz,
        x2 + ox, elevation, z2 + oz,
        x2 + ox, elevation, z2 + oz,
        x1 - ox, elevation, z1 - oz,
        x2 - ox, elevation, z2 - oz,
      ], used * 3);
      used += 6;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.setDrawRange(0, used);
  }

  return { mesh, update };
}

function addBox(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function makeWorktable(root: THREE.Group) {
  const frameMaterial = new THREE.MeshStandardMaterial({ color: "#283730", roughness: 0.52, metalness: 0.36 });
  const edgeMaterial = new THREE.MeshStandardMaterial({ color: "#6a7f68", roughness: 0.48, metalness: 0.52 });
  const footMaterial = new THREE.MeshStandardMaterial({ color: "#151f1b", roughness: 0.82 });
  const deckMaterial = new THREE.MeshStandardMaterial({ color: "#304e40", roughness: 0.96 });
  const frame = addBox(root, new RoundedBoxGeometry(7.14, 0.5, 7.14, 3, 0.11), frameMaterial, 0, -0.105, 0);
  frame.castShadow = frame.receiveShadow = true;
  addBox(root, new RoundedBoxGeometry(7.02, 0.095, 7.02, 2, 0.04), edgeMaterial, 0, 0.142, 0);
  const deck = addBox(root, new RoundedBoxGeometry(6.91, 0.1, 6.91, 2, 0.045), deckMaterial, 0, 0.19, 0);
  deck.receiveShadow = true;

  const texture = drawSurface();
  if (texture) {
    const surfaceMaterial = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.92 });
    const worktop = addBox(root, new THREE.PlaneGeometry(TABLE_WIDTH, TABLE_WIDTH), surfaceMaterial, 0, SURFACE + 0.002, 0);
    worktop.rotation.x = -Math.PI / 2;
    worktop.receiveShadow = true;
  }

  const foot = new THREE.CylinderGeometry(0.23, 0.28, 0.2, 18);
  const rim = new THREE.CylinderGeometry(0.055, 0.055, 0.023, 16);
  const socket = new THREE.CylinderGeometry(0.027, 0.027, 0.004, 6);
  const stop = new RoundedBoxGeometry(5.84, 0.115, 0.105, 2, 0.028);
  for (const x of [-1, 1]) {
    addBox(root, stop, frameMaterial, 0, SURFACE + 0.048, x * 3.32).castShadow = true;
    const sideStop = addBox(root, stop, frameMaterial, x * 3.32, SURFACE + 0.048, 0);
    sideStop.rotation.y = Math.PI / 2;
    sideStop.castShadow = true;
    for (const z of [-1, 1]) {
      addBox(root, foot, footMaterial, x * 3.1, -0.45, z * 3.1).castShadow = true;
      addBox(root, rim, edgeMaterial, x * 3.28, SURFACE + 0.01, z * 3.28);
      addBox(root, socket, footMaterial, x * 3.28, SURFACE + 0.023, z * 3.28);
    }
  }

  const floor = addBox(
    root, new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({ color: "#14221c", roughness: 0.9 }),
    0, -0.56, 0,
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  return texture;
}

function makeBlock(accent: THREE.Color) {
  const object = new THREE.Group();
  object.name = "live-block";
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: accent.clone().lerp(new THREE.Color("#627166"), 0.21), roughness: 0.29, metalness: 0.19,
  });
  const inlayMaterial = new THREE.MeshStandardMaterial({ color: "#263b31", roughness: 0.53, metalness: 0.29 });
  const marker = new THREE.MeshStandardMaterial({ color: "#f7f4cd", roughness: 0.4 });
  const shell = addBox(
    object, new RoundedBoxGeometry(BLOCK_WIDTH, BLOCK_HEIGHT, BLOCK_DEPTH, 3, 0.068),
    bodyMaterial, 0, BLOCK_HEIGHT / 2, 0,
  );
  shell.castShadow = shell.receiveShadow = true;
  const shoe = addBox(
    object, new RoundedBoxGeometry(BLOCK_WIDTH * 0.94, 0.073, BLOCK_DEPTH * 0.91, 2, 0.026),
    inlayMaterial, 0, 0.039, 0,
  );
  shoe.castShadow = true;
  addBox(
    object, new RoundedBoxGeometry(0.65, 0.022, 0.386, 2, 0.025),
    inlayMaterial, 0, BLOCK_HEIGHT, 0,
  );

  // An asymmetric inlay on the top makes yaw legible from either side.
  const arrowPoints = new THREE.Shape();
  arrowPoints.moveTo(-0.21, -0.029);
  arrowPoints.lineTo(0.052, -0.029);
  arrowPoints.lineTo(0.052, -0.082);
  arrowPoints.lineTo(0.192, 0);
  arrowPoints.lineTo(0.052, 0.082);
  arrowPoints.lineTo(0.052, 0.029);
  arrowPoints.lineTo(-0.21, 0.029);
  arrowPoints.closePath();
  const orientation = addBox(object, new THREE.ShapeGeometry(arrowPoints), marker, 0, BLOCK_HEIGHT + 0.013, 0);
  orientation.rotation.x = -Math.PI / 2;
  addBox(object, new THREE.BoxGeometry(0.022, 0.14, 0.21), marker, BLOCK_WIDTH / 2 - 0.011, 0.19, 0);
  return object;
}

function makeGhost(accent: THREE.Color) {
  const object = new THREE.Group();
  object.name = "counterpart-block";
  const shape = new RoundedBoxGeometry(BLOCK_WIDTH, BLOCK_HEIGHT, BLOCK_DEPTH, 1, 0.045);
  const edges = new THREE.EdgesGeometry(shape, 31);
  shape.dispose();
  const outline = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
    color: accent, transparent: true, opacity: 0.68, depthWrite: false,
  }));
  outline.position.y = BLOCK_HEIGHT / 2 + 0.008;
  outline.renderOrder = 4;
  object.add(outline);
  const front = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-0.19, BLOCK_HEIGHT + 0.014, 0),
    new THREE.Vector3(0.24, BLOCK_HEIGHT + 0.014, 0),
    new THREE.Vector3(0.16, BLOCK_HEIGHT + 0.014, 0.06),
    new THREE.Vector3(0.24, BLOCK_HEIGHT + 0.014, 0),
    new THREE.Vector3(0.16, BLOCK_HEIGHT + 0.014, -0.06),
  ]);
  const heading = new THREE.Line(front, new THREE.LineBasicMaterial({
    color: accent, transparent: true, opacity: 0.72, depthWrite: false,
  }));
  heading.renderOrder = 4;
  object.add(heading);
  return object;
}

function createMarker(color: THREE.ColorRepresentation, radius: number, opacity: number) {
  const marker = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.71, radius, 36),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide }),
  );
  marker.rotation.x = -Math.PI / 2;
  return marker;
}

function placeObject(object: THREE.Object3D, [x, z, angle]: number[]) {
  object.position.set(toWorld(x), SURFACE + 0.006, toWorld(z));
  object.rotation.y = -angle;
}

function makeForceIndicator(root: THREE.Group) {
  const group = new THREE.Group();
  group.name = "push-vector";
  root.add(group);
  const material = new THREE.MeshBasicMaterial({ color: "#f5f4d0", transparent: true, depthWrite: false });
  const shaft = addBox(group, new THREE.CylinderGeometry(0.023, 0.023, 1, 10), material, 0, 0, 0);
  const arrowhead = addBox(group, new THREE.ConeGeometry(0.082, 0.2, 16), material, 0, 0, 0);
  const point = createMarker("#fff6bd", 0.067, 0.95);
  group.add(point);

  function update([x, z, yaw]: number[], heading: number, force: number, contact: number) {
    const angle = THREE.MathUtils.degToRad(heading);
    const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const offset = new THREE.Vector3(-direction.z, 0, direction.x).multiplyScalar(-contact * 0.225);
    const rotation = Math.cos(yaw);
    const sine = Math.sin(yaw);
    const localOrigin = [offset.x * rotation + offset.z * sine, -offset.x * sine + offset.z * rotation];
    const localDirection = [direction.x * rotation + direction.z * sine, -direction.x * sine + direction.z * rotation];
    const bounds = [BLOCK_WIDTH / 2, BLOCK_DEPTH / 2];
    let entry = -Infinity;
    for (let axis = 0; axis < 2; axis++) {
      const delta = localDirection[axis];
      if (Math.abs(delta) < 0.00001) continue;
      const low = (-bounds[axis] - localOrigin[axis]) / delta;
      const high = (bounds[axis] - localOrigin[axis]) / delta;
      entry = Math.max(entry, Math.min(low, high));
    }

    const contactPoint = new THREE.Vector3(toWorld(x), SURFACE + BLOCK_HEIGHT * 0.53, toWorld(z))
      .add(offset).addScaledVector(direction, entry - 0.033);
    const length = 0.38 + 0.83 * force;
    shaft.scale.y = length;
    shaft.quaternion.setFromUnitVectors(UP, direction);
    shaft.position.copy(contactPoint).addScaledVector(direction, -0.175 - length / 2);
    arrowhead.quaternion.copy(shaft.quaternion);
    arrowhead.position.copy(contactPoint).addScaledVector(direction, -0.1);
    point.position.set(contactPoint.x, SURFACE + 0.032, contactPoint.z);
  }

  return {
    update,
    setProgress(progress: number) {
      material.opacity = progress < 0.15 ? 1 : 0.44;
      point.material.opacity = material.opacity;
    },
  };
}

export const buildBlockScene: WorldSceneBuilder = (scene, side) => {
  scene.background = new THREE.Color("#111e18");
  scene.fog = new THREE.Fog("#111e18", 18, 37);
  const root = new THREE.Group();
  root.name = "block-worktable";
  scene.add(root);
  root.add(new THREE.HemisphereLight("#f8f4d5", "#546c5c", 1.38));
  const key = new THREE.DirectionalLight("#fff0d3", 2.05);
  key.position.set(-4.9, 8, 4.5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -6.6;
  key.shadow.camera.right = 6.6;
  key.shadow.camera.top = 6.6;
  key.shadow.camera.bottom = -6.6;
  key.shadow.camera.far = 22;
  key.shadow.normalBias = 0.022;
  key.shadow.bias = -0.00013;
  root.add(key, key.target);
  const fill = new THREE.DirectionalLight("#a3dcde", 0.63);
  fill.position.set(5, 4, -5);
  root.add(fill);

  const accent = new THREE.Color(side === "model" ? "#c6ec8f" : "#ffcc8a");
  const otherAccent = new THREE.Color(side === "model" ? "#ffcc8a" : "#c6ec8f");
  const worktopTexture = makeWorktable(root);

  const guide = createTrail(accent, 0.016, 0.43, SURFACE + 0.013);
  const traveled = createTrail(accent, 0.034, 0.91, SURFACE + 0.019);
  const counterpart = createTrail(otherAccent, 0.02, 0.52, SURFACE + 0.027);
  const origin = createMarker("#e9ebcf", 0.087, 0.72);
  const endpoint = createMarker(accent, 0.125, 0.92);
  const otherEndpoint = createMarker(otherAccent, 0.105, 0.63);
  const ghost = makeGhost(otherAccent);
  const block = makeBlock(accent);
  const gapGeometry = new THREE.BufferGeometry();
  const gapPositions = new THREE.BufferAttribute(new Float32Array(6), 3).setUsage(THREE.DynamicDrawUsage);
  gapGeometry.setAttribute("position", gapPositions);
  const gap = new THREE.Line(gapGeometry, new THREE.LineBasicMaterial({
    color: "#fff3cc", transparent: true, opacity: 0.76, depthWrite: false,
  }));
  gap.frustumCulled = false;
  gap.renderOrder = 5;
  root.add(guide.mesh, traveled.mesh, counterpart.mesh, origin, endpoint, otherEndpoint, ghost, block, gap);
  const force = makeForceIndicator(root);
  let previousPath: number[][] | undefined;
  let previousComparison: number[][] | undefined;
  let previousInput: { heading: number; force: number; contact: number } | undefined;

  return {
    target: new THREE.Vector3(0, -0.01, 0),
    distance: 15.4,
    update(sample) {
      const path = side === "model" ? sample.predicted : sample.actual;
      const comparison = side === "model" ? sample.actual : sample.predicted;
      if (!path.length || !comparison.length) return;
      const pose = sampleTrack(path, sample.progress);
      const otherPose = sampleTrack(comparison, sample.progress);
      placeObject(block, pose);
      placeObject(ghost, otherPose);
      const translation = Math.hypot(pose[0] - otherPose[0], pose[1] - otherPose[1]) * TABLE_WIDTH;
      ghost.visible = translation > 0.014 || Math.abs(pose[2] - otherPose[2]) > 0.032;
      gap.visible = translation > BLOCK_DEPTH * 0.45;
      if (gap.visible) {
        const height = SURFACE + BLOCK_HEIGHT + 0.047;
        gapPositions.setXYZ(0, block.position.x, height, block.position.z);
        gapPositions.setXYZ(1, ghost.position.x, height, ghost.position.z);
        gapPositions.needsUpdate = true;
      }

      const { heading = 0, force: pushStrength = 0.77, contact = 0 } = sample;
      if (path !== previousPath) {
        guide.update(path, 1);
        const start = path[0];
        const finish = path[path.length - 1];
        origin.position.set(toWorld(start[0]), SURFACE + 0.022, toWorld(start[1]));
        endpoint.position.set(toWorld(finish[0]), SURFACE + 0.025, toWorld(finish[1]));
      }
      if (comparison !== previousComparison) {
        counterpart.update(comparison, 1, true);
        const finish = comparison[comparison.length - 1];
        otherEndpoint.position.set(toWorld(finish[0]), SURFACE + 0.032, toWorld(finish[1]));
      }
      if (path !== previousPath || previousInput?.heading !== heading
        || previousInput?.force !== pushStrength || previousInput?.contact !== contact) {
        force.update(path[0], heading, pushStrength, contact);
        previousInput = { heading, force: pushStrength, contact };
      }
      traveled.update(path, sample.progress);
      force.setProgress(sample.progress);
      previousPath = path;
      previousComparison = comparison;
    },
    dispose() {
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      root.traverse((child) => {
        const object = child as Partial<THREE.Mesh>;
        if (object.geometry) geometries.add(object.geometry);
        if (Array.isArray(object.material)) object.material.forEach((material) => materials.add(material));
        else if (object.material) materials.add(object.material);
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      worktopTexture?.dispose();
      key.shadow.dispose();
      scene.remove(root);
    },
  };
};
