import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { WorldSceneBuilder } from "./world3d-types";

const roadRadius = 15;
const roadHalfWidth = 3.24;
const coordinateScale = 10;
const laneOffset = 1.2;
const egoColor = 0xb9ee80;
const crossColor = 0xffb777;
const comparisonColor = 0x98d8f7;

type Box = [x: number, y: number, z: number, width: number, height: number, depth: number];

function makeMaterials() {
  return {
    base: new THREE.MeshStandardMaterial({ color: 0x273630, roughness: 0.83 }),
    rim: new THREE.MeshStandardMaterial({ color: 0x4a6958, roughness: 0.57 }),
    asphalt: new THREE.MeshStandardMaterial({ color: 0x384446, roughness: 0.91 }),
    sidewalk: new THREE.MeshStandardMaterial({ color: 0x74837a, roughness: 0.86 }),
    pavement: new THREE.MeshStandardMaterial({ color: 0x607168, roughness: 0.91 }),
    seam: new THREE.MeshStandardMaterial({ color: 0x4d6258, roughness: 1 }),
    painted: new THREE.MeshStandardMaterial({ color: 0xb2b9a1, roughness: 0.78 }),
    centerLine: new THREE.MeshStandardMaterial({ color: 0xaaae77, roughness: 0.85 }),
    bed: new THREE.MeshStandardMaterial({ color: 0x4a5d45, roughness: 0.95 }),
    speckle: new THREE.MeshStandardMaterial({ color: 0x849486, roughness: 1, transparent: true, opacity: 0.25 }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x61594b, roughness: 0.94 }),
    foliage: new THREE.MeshStandardMaterial({ color: 0x6b976b, roughness: 0.94, flatShading: true }),
    bark: new THREE.MeshStandardMaterial({ color: 0x384d43, roughness: 0.7 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x768781, roughness: 0.48, metalness: 0.23 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x141b1b, roughness: 0.92 }),
    window: new THREE.MeshStandardMaterial({ color: 0x344e56, roughness: 0.22, metalness: 0.2 }),
    headlight: new THREE.MeshStandardMaterial({ color: 0xfff3d2, roughness: 0.4, emissive: 0xe7d097, emissiveIntensity: 0.54 }),
    taillight: new THREE.MeshStandardMaterial({ color: 0xc96349, roughness: 0.48, emissive: 0xb43c20, emissiveIntensity: 0.26 }),
    shadow: new THREE.MeshBasicMaterial({ color: 0x0c1717, transparent: true, opacity: 0.24, depthWrite: false }),
  };
}

type Materials = ReturnType<typeof makeMaterials>;

function box(parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, bounds: Box) {
  const [x, y, z, width, height, depth] = bounds;
  const object = new THREE.Mesh(geometry, material);
  object.position.set(x, y, z);
  object.scale.set(width, height, depth);
  parent.add(object);
  return object;
}

function batch(
  parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, bounds: Box[],
  receiveShadow = false,
) {
  const mesh = new THREE.InstancedMesh(geometry, material, bounds.length);
  const transform = new THREE.Object3D();
  bounds.forEach(([x, y, z, width, height, depth], index) => {
    transform.position.set(x, y, z);
    transform.scale.set(width, height, depth);
    transform.updateMatrix();
    mesh.setMatrixAt(index, transform.matrix);
  });
  mesh.receiveShadow = receiveShadow;
  parent.add(mesh);
  return mesh;
}

function roadSurface(city: THREE.Group, cube: THREE.BoxGeometry, materials: Materials) {
  const plinth = new RoundedBoxGeometry(30.35, 0.9, 30.35, 3, 0.25);
  const base = new THREE.Mesh(plinth, materials.base);
  base.position.y = -0.48;
  base.receiveShadow = true;
  city.add(base);
  box(city, cube, materials.rim, [0, -0.64, 0, 30.3, 0.065, 30.3]);

  // A single top plane avoids a seam where the perpendicular roads meet.
  box(city, cube, materials.asphalt, [0, 0, 0, 30.0, 0.04, 30.0]).receiveShadow = true;

  const curbs: Box[] = [];
  const sidewalks: Box[] = [];
  const seams: Box[] = [];
  for (const xSign of [-1, 1]) {
    for (const zSign of [-1, 1]) {
      const cornerWidth = roadRadius - roadHalfWidth;
      const center = roadHalfWidth + cornerWidth / 2;
      curbs.push([xSign * center, 0.14, zSign * center, cornerWidth, 0.26, cornerWidth]);
      sidewalks.push([xSign * (center + 0.13), 0.27, zSign * (center + 0.13),
        cornerWidth - 0.28, 0.04, cornerWidth - 0.28]);
      for (let offset = 4.66; offset < roadRadius - 0.5; offset += 1.58) {
        seams.push([xSign * offset, 0.295, zSign * center, 0.014, 0.006, cornerWidth - 0.4]);
        seams.push([xSign * center, 0.295, zSign * offset, cornerWidth - 0.4, 0.006, 0.014]);
      }
    }
  }
  batch(city, cube, materials.sidewalk, curbs, true);
  batch(city, cube, materials.pavement, sidewalks, true);
  batch(city, cube, materials.seam, seams, true);

  const markings: Box[] = [];
  const middleDashes: Box[] = [];
  for (const sign of [-1, 1]) {
    for (const border of [-1, 1]) {
      const roadEdge = (roadHalfWidth - 0.34) * border;
      markings.push([roadEdge, 0.036, sign * 10.29, 0.075, 0.012, 9.12]);
      markings.push([sign * 10.29, 0.036, roadEdge, 9.12, 0.012, 0.075]);
    }
    for (let center = 7.0; center < 14.9; center += 2.0) {
      middleDashes.push([0, 0.036, sign * center, 0.075, 0.012, 0.86]);
      middleDashes.push([sign * center, 0.036, 0, 0.86, 0.012, 0.075]);
    }
    for (let lane = -2.38; lane <= 2.39; lane += 0.79) {
      markings.push([lane, 0.036, sign * 4.46, 0.36, 0.012, 1.32]);
      markings.push([sign * 4.46, 0.036, lane, 1.32, 0.012, 0.36]);
    }
  }
  // The stop lines sit behind the pedestrian crossings, facing each incoming lane.
  markings.push([-1.39, 0.037, 5.48, 2.56, 0.014, 0.18]);
  markings.push([1.39, 0.037, -5.48, 2.56, 0.014, 0.18]);
  markings.push([-5.48, 0.037, -1.39, 0.18, 0.014, 2.56]);
  markings.push([5.48, 0.037, 1.39, 0.18, 0.014, 2.56]);
  batch(city, cube, materials.painted, markings, true);
  batch(city, cube, materials.centerLine, middleDashes, true);

  const stones: Box[] = [];
  let seed = 2149;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let index = 0; index < 490; index++) {
    const long = (rand() - 0.5) * 29.7;
    const short = (rand() - 0.5) * 6.2;
    const [x, z] = index % 2 === 0 ? [long, short] : [short, long];
    stones.push([x, 0.033, z, 0.023 + rand() * 0.045, 0.004, 0.015 + rand() * 0.031]);
  }
  batch(city, cube, materials.speckle, stones);
}

function architecture(city: THREE.Group, cube: THREE.BoxGeometry, materials: Materials) {
  const soil: Box[] = [];
  const border: Box[] = [];
  const trunk: Box[] = [];
  const leaves: Box[] = [];
  const post: Box[] = [];
  const cap: Box[] = [];
  const groundDetails: Box[] = [];

  for (const xSign of [-1, 1]) {
    for (const zSign of [-1, 1]) {
      const gardenX = xSign * 9.9;
      const gardenZ = zSign * 9.9;
      border.push([gardenX, 0.38, gardenZ, 6.68, 0.23, 6.68]);
      soil.push([gardenX, 0.51, gardenZ, 6.32, 0.09, 6.32]);

      const locations = xSign === zSign
        ? [[8.8, 11.68, 1], [11.8, 9.48, 0.83], [8.2, 8.1, 0.57]]
        : [[10.85, 10.75, 1.09], [8.5, 8.75, 0.64]];
      for (const [treeX, treeZ, size] of locations) {
        const x = xSign * treeX;
        const z = zSign * treeZ;
        trunk.push([x, 0.6 + 0.65 * size, z, 0.23 * size, 1.3 * size, 0.23 * size]);
        leaves.push([x, 0.57 + 1.8 * size, z, 1.16 * size, 1.25 * size, 1.2 * size]);
        leaves.push([x + 0.32 * size, 0.57 + 1.61 * size, z + 0.33 * size, 0.79 * size, 0.92 * size, 0.9 * size]);
        leaves.push([x - 0.52 * size, 0.57 + 1.48 * size, z - 0.18 * size, 0.73 * size, 0.87 * size, 0.78 * size]);
      }

      for (const shift of [0, 1.15]) {
        post.push([xSign * (3.8 + shift), 0.58, zSign * 3.88, 0.13, 0.58, 0.13]);
        cap.push([xSign * (3.8 + shift), 0.83, zSign * 3.88, 0.15, 0.1, 0.15]);
      }
      // Tactile paving makes the pedestrian crossing edges legible at shallow angles.
      for (let offset = 0; offset < 3; offset++) {
        groundDetails.push([xSign * 3.69, 0.31, zSign * (4.36 + 0.24 * offset), 0.35, 0.027, 0.12]);
        groundDetails.push([xSign * (4.36 + 0.24 * offset), 0.31, zSign * 3.69, 0.12, 0.027, 0.35]);
      }
    }
  }

  const faceted = new THREE.IcosahedronGeometry(1, 1);
  batch(city, cube, materials.bark, border, true);
  batch(city, cube, materials.bed, soil, true);
  batch(city, cube, materials.trunk, trunk).castShadow = true;
  const canopies = batch(city, faceted, materials.foliage, leaves);
  const shades = [new THREE.Color(0x98bd83), new THREE.Color(0xd1e2a7), new THREE.Color(0xb3cb96)];
  for (let index = 0; index < leaves.length; index++) canopies.setColorAt(index, shades[index % shades.length]);
  canopies.castShadow = true;
  batch(city, cube, materials.bark, post);
  batch(city, cube, materials.metal, cap);
  batch(city, cube, materials.centerLine, groundDetails, true);

  const furniture: Box[] = [
    [5.6, 0.52, -10.3, 0.19, 0.49, 0.76],
    [5.6, 0.52, -8.62, 0.19, 0.49, 0.76],
    [-9.4, 0.57, 5.93, 0.91, 0.56, 0.62],
    [-9.4, 0.85, 5.93, 0.97, 0.07, 0.68],
  ];
  batch(city, cube, materials.metal, furniture);
  batch(city, cube, materials.trunk, [
    [5.6, 0.79, -9.46, 0.74, 0.12, 2.08],
    [5.91, 1.04, -9.46, 0.12, 0.37, 2.08],
  ]);
}

function roofGeometry(rearWindowEnd: number) {
  const points = [
    -0.71, 0.77, -0.70, 0.71, 0.77, -0.70,
    0.68, 0.77, rearWindowEnd, -0.68, 0.77, rearWindowEnd,
    -0.58, 1.32, -0.18, 0.58, 1.32, -0.18,
    0.56, 1.31, 0.50, -0.56, 1.31, 0.50,
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  geometry.setIndex([0, 4, 5, 0, 5, 1, 1, 5, 6, 1, 6, 2, 2, 6, 7, 2, 7, 3, 3, 7, 4, 3, 4, 0, 4, 7, 6, 4, 6, 5]);
  geometry.computeVertexNormals();
  return geometry;
}

function vehicle(city: THREE.Group, cube: THREE.BoxGeometry, materials: Materials, color: number, crossTraffic: boolean) {
  const car = new THREE.Group();
  car.name = crossTraffic ? "Cross traffic car" : "Ego car";
  const bodyPaint = new THREE.MeshStandardMaterial({ color, roughness: 0.38, metalness: 0.14 });
  const brake = materials.taillight.clone();
  const length = crossTraffic ? 2.86 : 3.14;

  const floorShadow = new THREE.Mesh(new THREE.CircleGeometry(1, 28), materials.shadow);
  floorShadow.rotation.x = -Math.PI / 2;
  floorShadow.scale.set(1.01, length / 1.92, 1);
  floorShadow.position.y = 0.04;
  car.add(floorShadow);

  const mainShell = new THREE.Mesh(new RoundedBoxGeometry(1.52, 0.59, length, 3, 0.15), bodyPaint);
  mainShell.position.y = 0.55;
  mainShell.castShadow = true;
  car.add(mainShell);
  const sill = new THREE.Mesh(new RoundedBoxGeometry(1.57, 0.22, length + 0.03, 2, 0.09), materials.rubber);
  sill.position.y = 0.28;
  car.add(sill);

  const roof = new THREE.Mesh(roofGeometry(crossTraffic ? 0.91 : 1.06), materials.window);
  roof.castShadow = true;
  car.add(roof);
  const cap = new THREE.Mesh(new RoundedBoxGeometry(1.16, 0.10, 0.73, 3, 0.038), bodyPaint);
  cap.position.set(0, 1.34, 0.16);
  car.add(cap);
  box(car, cube, materials.rubber, [0, 0.48, -length / 2 - 0.018, 0.66, 0.12, 0.031]);
  box(car, cube, materials.metal, [0, 0.43, length / 2 + 0.016, 0.34, 0.115, 0.03]);
  for (const sign of [-1, 1]) {
    const offset = sign * 0.52;
    box(car, cube, materials.headlight, [offset, 0.66, -length / 2 - 0.018, 0.30, 0.108, 0.046]);
    box(car, cube, brake, [offset, 0.62, length / 2 + 0.012, 0.29, 0.105, 0.046]);
    box(car, cube, bodyPaint, [sign * 0.85, 0.91, -0.42, 0.24, 0.10, 0.22]);
    box(car, cube, materials.rubber, [sign * 0.633, 0.98, 0.23, 0.041, 0.40, 0.10]);
  }

  const tires = new THREE.CylinderGeometry(0.282, 0.282, 0.235, 14);
  const hubs = new THREE.CylinderGeometry(0.151, 0.151, 0.021, 11);
  const wheels: THREE.Group[] = [];
  for (const sign of [-1, 1]) {
    for (const axle of [-0.94, 0.95]) {
      const wheel = new THREE.Group();
      wheel.position.set(sign * 0.77, 0.30, axle);
      const tire = new THREE.Mesh(tires, materials.rubber);
      tire.rotation.z = Math.PI / 2;
      wheel.add(tire);
      const rim = new THREE.Mesh(hubs, materials.metal);
      rim.position.x = sign * 0.128;
      rim.rotation.z = Math.PI / 2;
      wheel.add(rim);
      box(wheel, cube, materials.rubber, [sign * 0.143, 0, 0, 0.02, 0.18, 0.035]);
      box(wheel, cube, materials.rubber, [sign * 0.143, 0, 0, 0.02, 0.035, 0.18]);
      wheels.push(wheel);
      car.add(wheel);
    }
  }
  if (crossTraffic) car.rotation.y = -Math.PI / 2;
  city.add(car);
  return { car, wheels, brake };
}

function pointPosition(row: number[], axis: number, target: THREE.Vector3, height = 0.07) {
  if (axis === 0) return target.set(-laneOffset, height, -row[0] * coordinateScale);
  return target.set(row[1] * coordinateScale, height, -laneOffset);
}

function interpolatePosition(track: number[][], index: number, axis: number, target: THREE.Vector3) {
  const start = Math.floor(index);
  const next = Math.min(start + 1, track.length - 1);
  const lower = track[start][axis];
  const position = lower + (track[next][axis] - lower) * (index - start);
  return axis === 0
    ? target.set(-laneOffset, 0, -position * coordinateScale)
    : target.set(position * coordinateScale, 0, -laneOffset);
}

function routeRibbon(city: THREE.Group, geometry: THREE.BoxGeometry, color: number, opacity: number, width: number) {
  const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
  const mesh = new THREE.InstancedMesh(geometry, material, 12);
  mesh.name = opacity < 0.4 ? "Full trajectory" : "Travelled trajectory";
  mesh.frustumCulled = false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.count = 0;
  city.add(mesh);
  const transform = new THREE.Object3D();
  const pointA = new THREE.Vector3();
  const pointB = new THREE.Vector3();
  const diff = new THREE.Vector3();

  return (track: number[][], axis: number, index: number, height: number) => {
    const last = Math.min(track.length - 1, Math.ceil(index));
    let count = 0;
    for (let edge = 0; edge < last; edge++) {
      pointPosition(track[edge], axis, pointA, height);
      pointPosition(track[edge + 1], axis, pointB, height);
      pointB.lerp(pointA, Math.max(0, edge + 1 - index));
      diff.subVectors(pointB, pointA);
      const length = diff.length();
      if (length < 0.006) continue;
      transform.position.copy(pointA).lerp(pointB, 0.5);
      transform.rotation.y = Math.atan2(diff.x, diff.z);
      transform.scale.set(width, 0.017, length + 0.025);
      transform.updateMatrix();
      mesh.setMatrixAt(count++, transform.matrix);
    }
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
  };
}

function marker(city: THREE.Group, color: number, radius: number, opacity: number) {
  const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.RingGeometry(radius - 0.043, radius, 36), material);
  ring.rotation.x = -Math.PI / 2;
  city.add(ring);
  return ring;
}

function comparisonGuide(city: THREE.Group) {
  const geometry = new THREE.BufferGeometry();
  const positions = new THREE.Float32BufferAttribute(new Float32Array(6), 3);
  const distances = new THREE.Float32BufferAttribute(new Float32Array(2), 1);
  positions.setUsage(THREE.DynamicDrawUsage);
  distances.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("position", positions);
  geometry.setAttribute("lineDistance", distances);
  const line = new THREE.Line(
    geometry,
    new THREE.LineDashedMaterial({ color: comparisonColor, dashSize: 0.16, gapSize: 0.11, transparent: true, opacity: 0.92 }),
  );
  line.frustumCulled = false;
  city.add(line);
  const ghost = marker(city, comparisonColor, 0.54, 0.96);

  return (position: THREE.Vector3, counterpart: THREE.Vector3) => {
    const distance = position.distanceTo(counterpart);
    const show = distance > 0.30;
    ghost.visible = show;
    line.visible = show;
    if (show) {
      ghost.position.set(counterpart.x, 0.111, counterpart.z);
      positions.setXYZ(0, position.x, 0.13, position.z);
      positions.setXYZ(1, counterpart.x, 0.13, counterpart.z);
      positions.needsUpdate = true;
      distances.setX(1, distance);
      distances.needsUpdate = true;
    }
  };
}

export const buildIntersectionScene: WorldSceneBuilder = (scene, side) => {
  scene.background = new THREE.Color(0x11211f);
  scene.fog = new THREE.Fog(0x11211f, 62, 102);
  const city = new THREE.Group();
  city.name = "Intersection diorama";
  scene.add(city);

  const key = new THREE.DirectionalLight(0xffe3bb, 2.65);
  key.position.set(-14, 28, 11);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -18;
  key.shadow.camera.right = 18;
  key.shadow.camera.top = 18;
  key.shadow.camera.bottom = -18;
  key.shadow.camera.far = 52;
  key.shadow.normalBias = 0.045;
  key.shadow.bias = -0.0002;
  city.add(key);
  city.add(new THREE.HemisphereLight(0xbcdced, 0x405b44, 2.1));

  const grid = new THREE.GridHelper(100, 50, 0x526f62, 0x344d44);
  grid.position.y = -0.93;
  grid.material.transparent = true;
  grid.material.opacity = 0.63;
  city.add(grid);

  const cube = new THREE.BoxGeometry(1, 1, 1);
  const materials = makeMaterials();
  roadSurface(city, cube, materials);
  architecture(city, cube, materials);

  const actors = [egoColor, crossColor].map((color, axis) => ({
    ...vehicle(city, cube, materials, color, axis === 1),
    active: routeRibbon(city, cube, color, 0.88, 0.115),
    fullPath: routeRibbon(city, cube, color, 0.29, 0.067),
    endpoint: marker(city, color, 0.65, 0.77),
    guide: comparisonGuide(city),
  }));

  const position = new THREE.Vector3();
  const counterpart = new THREE.Vector3();
  const earlier = new THREE.Vector3();
  const origin = new THREE.Vector3();
  let previousTrack: number[][] | undefined;

  return {
    target: new THREE.Vector3(0, 0.35, 0.35),
    distance: 37,
    update({ predicted, actual, progress }) {
      const selected = side === "model" ? predicted : actual;
      const alternative = side === "model" ? actual : predicted;
      if (!selected.length || !alternative.length) return;
      const fraction = Math.max(0, Math.min(progress, 1));
      const index = fraction * (selected.length - 1);

      for (const [axis, actor] of actors.entries()) {
        interpolatePosition(selected, index, axis, position);
        interpolatePosition(selected, Math.max(0, index - 0.18), axis, earlier);
        interpolatePosition(alternative, fraction * (alternative.length - 1), axis, counterpart);
        pointPosition(selected[0], axis, origin, 0);
        actor.car.position.copy(position);
        actor.brake.emissiveIntensity = index > 0.18 && earlier.distanceTo(position) < 0.04 ? 1.35 : 0.26;
        const travel = axis === 0 ? origin.z - position.z : position.x - origin.x;
        for (const wheel of actor.wheels) wheel.rotation.x = -travel / 0.282;
        actor.active(selected, axis, index, 0.087);
        actor.guide(position, counterpart);
        if (selected !== previousTrack) {
          pointPosition(selected[selected.length - 1], axis, actor.endpoint.position, 0.1);
          actor.fullPath(selected, axis, selected.length - 1, 0.056);
        }
      }

      previousTrack = selected;
    },
    dispose() {
      const geometries = new Set<THREE.BufferGeometry>();
      const materialsToDispose = new Set<THREE.Material>(Object.values(materials));
      city.traverse((object) => {
        if (object instanceof THREE.InstancedMesh) object.dispose();
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          geometries.add(object.geometry);
          const assigned = object.material;
          for (const material of Array.isArray(assigned) ? assigned : [assigned]) materialsToDispose.add(material);
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materialsToDispose.forEach((material) => material.dispose());
      key.shadow.dispose();
      scene.remove(city);
    },
  };
};
