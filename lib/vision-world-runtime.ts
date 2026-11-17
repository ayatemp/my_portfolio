import fixtures from "./vision-world-models.json";

type Layer = { weights: number[][]; bias: number[] };
type Network = { mean: number[]; scale: number[]; layers: Layer[] };

export type Point = [number, number];
export type Pose = [number, number, number];

export function evaluate(model: Network, input: number[]) {
  let state = input.map((value, index) => (value - model.mean[index]) / model.scale[index]);
  for (const [index, layer] of model.layers.entries()) {
    const hidden = index < model.layers.length - 1;
    state = layer.weights.map((weights, output) => {
      const sum = weights.reduce((total, weight, feature) => total + weight * state[feature], layer.bias[output]);
      return hidden ? Math.max(0, sum) : sum;
    });
  }
  return state;
}

export function pushRollout(scene: number, direction: number, force: number, contact: number) {
  const { pose, features } = fixtures.push.scenes[scene];
  const angle = direction * Math.PI / 180;
  const x = Math.cos(angle);
  const y = Math.sin(angle);
  const outputs = evaluate(fixtures.push.model, [...features, contact, x, y, force]);
  const origin = pose as Pose;
  const predicted: Pose[] = [origin];
  for (let step = 0; step < outputs.length; step += 3) {
    predicted.push([features[0] + outputs[step], features[1] + outputs[step + 1], outputs[step + 2]]);
  }

  const actual: Pose[] = [origin];
  let [cx, cy, rotation] = pose;
  let vx = x * force * 0.089;
  let vy = y * force * 0.089;
  let spin = contact * force * 0.22;
  for (let step = 1; step <= 8; step++) {
    const nx = cx + vx;
    const ny = cy + vy;
    cx = Math.max(0.1, Math.min(0.9, nx));
    cy = Math.max(0.1, Math.min(0.9, ny));
    vx *= nx <= 0.1 || nx >= 0.9 ? -0.23 : 0.79;
    vy *= ny <= 0.1 || ny >= 0.9 ? -0.23 : 0.79;
    rotation += spin;
    spin *= 0.8;
    if (step % 2 === 0) actual.push([cx, cy, rotation]);
  }
  return { predicted, actual };
}

function pairs(values: number[]): Point[] {
  return Array.from({ length: values.length / 2 }, (_, index) => [values[2 * index], values[2 * index + 1]]);
}

export function roadRollout(scene: number, action: number) {
  const { features, initial, actual } = fixtures.road.scenes[scene];
  const actions = Array.from({ length: 3 }, (_, index) => Number(index === action));
  return {
    predicted: [initial as Point, ...pairs(evaluate(fixtures.road.model, [...features, ...actions]))],
    actual: [initial as Point, ...(actual[action] as Point[])],
  };
}

export function hiddenRollout(scene: number) {
  const { features, observed, actual } = fixtures.hidden.scenes[scene];
  const modes = [0, 1].map((mode) => pairs(evaluate(fixtures.hidden.model, [...features, mode])));
  const log = modes.map(([probe]) =>
    -0.5 * probe.reduce((sum, coordinate, axis) =>
      sum + ((coordinate - observed[axis]) / fixtures.hidden.sigma[0][axis]) ** 2, 0),
  );
  const likelihood = log.map((value) => Math.exp(value - Math.max(...log)));
  const probability = likelihood.map((value) => value / (likelihood[0] + likelihood[1]));
  return { modes, actual: actual as Point[], probability, observed: observed as Point };
}

export function brakeRollout(scene: number, count: number, speed: number) {
  const { features, deceleration, observed } = fixtures.brake.scenes[scene];
  const probes = features.flatMap((row, index) => (index < count ? row : row.map(() => 0)));
  const mask = features.map((_, index) => Number(index < count));
  const raw = evaluate(fixtures.brake.model, [...probes, ...mask, speed])[0];
  return {
    predicted: Math.max(0, Math.min(2.5, raw)),
    actual: speed * speed / (2 * deceleration),
    seconds: speed / deceleration,
    observed: observed.slice(0, count),
    positionAt(seconds: number) {
      const time = Math.min(seconds, speed / deceleration);
      return speed * time - 0.5 * deceleration * time * time;
    },
  };
}

export function sampleTrack<T extends number[]>(points: T[], progress: number): T {
  const position = Math.max(0, Math.min(1, progress)) * (points.length - 1);
  const index = Math.min(Math.floor(position), points.length - 1);
  const start = points[index];
  const end = points[Math.min(index + 1, points.length - 1)];
  return start.map((value, axis) => value + (end[axis] - value) * (position - index)) as T;
}
