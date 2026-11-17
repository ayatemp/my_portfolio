// Frame-level detections come from the trained CNN; association runs in the page.
export type Point = [number, number];
export type Box = [number, number, number, number];
export type SceneFrame = { cars: Point[]; boxes: Box[]; visible: number[] };
export type Scene = { wall: Box | null; frames: SceneFrame[] };

type Track = {
  id: number;
  position: Point;
  frame: number;
  width: number;
  stable: Point;
  stableFrame: number;
  velocity: Point;
  trail: Point[];
};

export type TrackingFrame = {
  objects: { id: number; box: Box; trail: Point[] }[];
  misses: number;
  switches: number;
  switched: boolean;
};

const center = ([x1, y1, x2, y2]: Box): Point => [(x1 + x2) / 2, (y1 + y2) / 2];
const distance = (left: Point, right: Point) => Math.hypot(left[0] - right[0], left[1] - right[1]);

function pairClosest(rows: Point[], columns: Point[]): [number, number][] {
  if (!rows.length || !columns.length) return [];
  if (rows.length > columns.length) return pairClosest(columns, rows).map(([column, row]) => [row, column]);
  let best: [number, number][] = [];
  let cost = Infinity;
  const selected = new Set<number>();
  const pairs: [number, number][] = [];

  // The two-car classroom scene has very few boxes. Enumerate the complete
  // assignments to match the global-distance objective of the Python demo.
  function visit(row: number, total: number) {
    if (total >= cost) return;
    if (row === rows.length) {
      cost = total;
      best = [...pairs];
      return;
    }
    columns.forEach((column, index) => {
      if (selected.has(index)) return;
      selected.add(index);
      pairs.push([row, index]);
      visit(row + 1, total + distance(rows[row], column));
      pairs.pop();
      selected.delete(index);
    });
  }

  visit(0, 0);
  return best;
}

export function trackScene(scene: Scene, useVelocity: boolean, maxGap: number): TrackingFrame[] {
  let active: Track[] = [];
  let nextId = 1;
  let misses = 0;
  let switches = 0;
  const lastIds = new Map<number, number>();

  return scene.frames.map(({ cars, boxes, visible }, frame) => {
    active = active.filter((track) => frame - track.frame <= maxGap);
    const positions = boxes.map(center);
    const widths = boxes.map(([x1, , x2]) => x2 - x1 + 1);
    const expected = active.map((track): Point => {
      if (!useVelocity) return track.position;
      const gap = frame - track.stableFrame;
      return [track.stable[0] + track.velocity[0] * gap, track.stable[1] + track.velocity[1] * gap];
    });
    const assigned = new Map<number, Track>();
    for (const [row, column] of pairClosest(expected, positions)) {
      if (distance(expected[row], positions[column]) > 15) continue;
      const track = active[row];
      const position = positions[column];
      if (widths[column] >= 0.8 * track.width) {
        const gap = frame - track.stableFrame;
        track.velocity = [(position[0] - track.stable[0]) / gap, (position[1] - track.stable[1]) / gap];
        track.stable = position;
        track.stableFrame = frame;
        track.width = Math.max(track.width, widths[column]);
      }
      track.position = position;
      track.frame = frame;
      track.trail.push(position);
      assigned.set(column, track);
    }
    const tracks = positions.map((position, index) => {
      const old = assigned.get(index);
      if (old) return old;
      const track: Track = {
        id: nextId++, position, frame, width: widths[index], stable: position,
        stableFrame: frame, velocity: [0, 0], trail: [position],
      };
      active.push(track);
      return track;
    });

    let matched = 0;
    let switched = false;
    const truth = visible.map((index) => cars[index]);
    for (const [row, column] of pairClosest(truth, positions)) {
      if (distance(truth[row], positions[column]) > 7) continue;
      matched++;
      const car = visible[row];
      const id = tracks[column].id;
      if (lastIds.has(car) && lastIds.get(car) !== id) {
        switches++;
        switched = true;
      }
      lastIds.set(car, id);
    }
    misses += visible.length - matched;

    return {
      objects: tracks.map((track, index) => ({ id: track.id, box: boxes[index], trail: track.trail.slice(-12) })),
      misses, switches, switched,
    };
  });
}
