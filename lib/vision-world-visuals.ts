import { sampleTrack, type Point, type Pose } from "./vision-world-runtime";

export const stageWidth = 420;
export const stageHeight = 288;

export const palette = {
  ink: "#101c1a",
  panel: "#182c28",
  line: "#38524b",
  lime: "#c7ed8c",
  gold: "#ffe1a7",
  mint: "#7ce8c5",
  sky: "#80ccf8",
  violet: "#cab8f3",
  text: "#dbe9da",
  dim: "#9bb8a9",
};

type Context = CanvasRenderingContext2D;

function roundRect(context: Context, x: number, y: number, width: number, height: number, fill: string, radius = 7) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fillStyle = fill;
  context.fill();
}

function line(context: Context, a: Point, b: Point, color: string, width = 1) {
  context.beginPath();
  context.moveTo(...a);
  context.lineTo(...b);
  context.strokeStyle = color;
  context.lineWidth = width;
  context.stroke();
}

function circle(context: Context, [x, y]: Point, radius: number, color: string) {
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fillStyle = color;
  context.fill();
}

function text(context: Context, value: string, position: Point, color: string, align: CanvasTextAlign = "left") {
  context.font = "12px ui-monospace, Menlo, monospace";
  context.fillStyle = color;
  context.textAlign = align;
  context.fillText(value, ...position);
}

function floor(context: Context) {
  context.fillStyle = palette.ink;
  context.fillRect(0, 0, stageWidth, stageHeight);
  context.globalAlpha = 0.57;
  for (let x = 18; x < stageWidth; x += 24) line(context, [x, 0], [x, stageHeight], palette.line, 0.5);
  for (let y = 12; y < stageHeight; y += 24) line(context, [0, y], [stageWidth, y], palette.line, 0.5);
  context.globalAlpha = 1;
}

function trail<T extends number[]>(context: Context, path: T[], current: number, project: (point: T) => Point, color: string) {
  context.save();
  context.globalAlpha *= 0.62;
  context.setLineDash([4, 6]);
  const steps = Math.floor(current * (path.length - 1));
  for (let index = 1; index <= steps; index++) line(context, project(path[index - 1]), project(path[index]), color, 2);
  line(context, project(path[steps]), project(sampleTrack(path, current)), color, 2);
  context.restore();
}

export function drawPush(context: Context, path: Pose[], progress: number, direction: number, force: number, contact: number, color: string) {
  floor(context);
  roundRect(context, 29, 19, 362, 250, "#2f4b44", 16);
  roundRect(context, 35, 24, 350, 238, "#203730", 13);

  for (let x = 59; x < 385; x += 24) line(context, [x, 25], [x, 260], palette.line, 0.75);
  for (let y = 48; y < 262; y += 24) line(context, [36, y], [384, y], palette.line, 0.75);
  const project = ([x, y]: Pose): Point => [35 + x * 350, 24 + y * 238];
  const [x, y] = project(sampleTrack(path, progress));
  const [originX, originY] = project(path[0]);
  const angle = sampleTrack(path, progress)[2];
  const finalPoint = project(path[path.length - 1]);
  context.globalAlpha = 0.32;
  circle(context, finalPoint, 7, color);
  context.globalAlpha = 1;
  trail(context, path, progress, project, color);

  if (progress < 0.23) {
    const radians = direction * Math.PI / 180;
    context.save();
    context.translate(originX, originY);
    context.scale(350 / 238, 1);
    context.rotate(radians);
    const offset = -contact * 14;
    const tail = -36 - 42 * force;
    line(context, [tail, offset], [-25, offset], color, 2.5);
    line(context, [-25, offset], [-34, offset - 6], color, 2.5);
    line(context, [-25, offset], [-34, offset + 6], color, 2.5);
    context.restore();
  }

  context.save();
  context.translate(x, y);
  context.scale(350 / 238, 1);
  context.rotate(angle);
  roundRect(context, -20, -10, 40, 24, "#101c1a");
  roundRect(context, -20, -13, 40, 23, color);
  roundRect(context, -17, -10, 34, 15, "#264237");
  line(context, [12, -7], [12, 3], color, 3);
  context.restore();

  for (const dx of [43, 377]) for (const dy of [32, 254]) circle(context, [dx, dy], 2.8, "#89a99a");
}

function drawCar(context: Context, center: Point, angle: number, color: string) {
  context.save();
  context.translate(...center);
  context.rotate(angle);
  roundRect(context, -9, -16, 18, 35, "#15201d", 5);
  for (const side of [-1, 1]) {
    roundRect(context, side * 7 - 2, -11, 5, 7, "#101c19", 1);
    roundRect(context, side * 7 - 2, 7, 5, 7, "#101c19", 1);
  }
  roundRect(context, -7, -17, 14, 31, color, 4);
  roundRect(context, -5, -9, 10, 13, "#243d36", 2);
  line(context, [-4, -12], [4, -12], "#fff8dc", 2);
  line(context, [-4, 10], [4, 10], "#a75945", 2);
  context.restore();
}

export function drawRoad(context: Context, path: Point[], progress: number) {
  floor(context);
  const scale = 106;
  const mapX = (x: number) => 184 + x * scale;
  const mapY = (y: number) => 155 - y * scale;
  const roadWidth = 61;
  const x = mapX(0);
  const y = mapY(0);
  context.fillStyle = "#213a33";
  context.fillRect(0, y - roadWidth / 2, stageWidth, roadWidth);
  context.fillRect(x - roadWidth / 2, 0, roadWidth, stageHeight);

  for (const side of [-1, 1]) {
    const edge = side * roadWidth / 2;
    for (const [a, b] of [
      [[0, y + edge], [x - roadWidth / 2, y + edge]],
      [[x + roadWidth / 2, y + edge], [stageWidth, y + edge]],
      [[x + edge, 0], [x + edge, y - roadWidth / 2]],
      [[x + edge, y + roadWidth / 2], [x + edge, stageHeight]],
    ] as [Point, Point][]) line(context, a, b, "#90aa9d", 1);
  }
  context.save();
  context.setLineDash([8, 7]);
  line(context, [x, 0], [x, y - 31], "#73825e");
  line(context, [x, y + 31], [x, stageHeight], "#73825e");
  line(context, [0, y], [x - 31, y], "#73825e");
  line(context, [x + 31, y], [stageWidth, y], "#73825e");
  context.restore();
  line(context, [x - 29, y + 34], [x - 1, y + 34], "#a8baa9", 2);
  line(context, [x - 34, y - 29], [x - 34, y - 1], "#a8baa9", 2);

  const ego = ([position]: Point): Point => [mapX(-0.12), mapY(position)];
  const cross = (([, position]: Point): Point => [mapX(position), mapY(0.12)]);
  trail(context, path, progress, ego, palette.lime);
  trail(context, path, progress, cross, palette.gold);
  const car = sampleTrack(path, progress);
  drawCar(context, ego(car), 0, palette.lime);
  drawCar(context, cross(car), Math.PI / 2, palette.gold);
  text(context, "N ↑", [stageWidth - 25, 22], palette.dim, "right");
}

export function drawHidden(
  context: Context,
  actual: Point[],
  progress: number,
  modes: Point[][],
  weights: number[],
  observed: Point | undefined,
  isModel: boolean,
) {
  floor(context);
  const project = ([x, y]: Point): Point => [23 + x * 374, 265 - y * 242];
  const currentStep = (actual.length - 1) * progress;
  const sideView = Boolean(observed);
  const [left] = project([0.31, 0]);
  const [right] = project([0.78, 0]);

  roundRect(context, left, 35, right - left, 219, isModel || sideView ? "#344840" : "#50685b", 4);
  for (let x = left + 10; x < right - 6; x += 10) {
    line(context, [x, 40], [x + 6, 249], isModel || sideView ? "#455c51" : "#607c6b", 0.6);
  }
  line(context, [left, 35], [right, 35], palette.dim, 2);

  if (isModel && currentStep >= 2) {
    trail(context, actual.slice(0, 3), 1, project, palette.gold);
    const colors = [palette.sky, palette.violet];
    for (const [index, track] of modes.entries()) {
      const candidateProgress = Math.max(0, Math.min(1, (currentStep - 5) / 3));
      context.globalAlpha = 0.16 + 0.84 * weights[index];
      const end = project(track[track.length - 1]);
      circle(context, end, 8, colors[index]);
      trail(context, track, candidateProgress, project, colors[index]);
      if (currentStep >= 5) circle(context, project(sampleTrack(track, candidateProgress)), 6, colors[index]);
      else {
        context.save();
        context.setLineDash([3, 7]);
        line(context, project(actual[2]), project(track[0]), colors[index], 1.5);
        context.restore();
      }
    }
    context.globalAlpha = 1;
  } else {
    const ball = sampleTrack(actual, progress);
    if (isModel || sideView || ball[0] < 0.31 || ball[0] > 0.78) {
      trail(context, sideView ? actual : actual.slice(0, 3), sideView ? progress : Math.min(1, currentStep / 2), project, palette.gold);
      circle(context, project(ball), 8, palette.gold);
      const [x, y] = project(ball);
      circle(context, [x - 2.5, y - 2.5], 2.5, "#fff5da");
    }
  }

  if (observed) {
    const [x, y] = project(observed);
    context.strokeStyle = palette.mint;
    context.lineWidth = 1.3;
    context.strokeRect(x - 12, y - 12, 24, 24);
    line(context, [x - 16, y], [x + 16, y], palette.mint);
    line(context, [x, y - 16], [x, y + 16], palette.mint);
  }
}

export function drawBrake(
  context: Context,
  travel: number,
  estimate: number,
  observed: number[][],
  isModel: boolean,
) {
  floor(context);
  const x = (meters: number) => 37 + (meters / 2.5) * 347;
  roundRect(context, 22, 107, 376, 69, "#273f37", 7);
  line(context, [x(0), 143], [x(2.5), 143], palette.line, 1.5);
  for (let meters = 0; meters <= 2.5; meters += 0.5) {
    line(context, [x(meters), 161], [x(meters), 172], palette.dim);
    text(context, meters.toFixed(1) + " m", [x(meters), 195], palette.dim, "center");
  }

  if (isModel) {
    line(context, [x(0), 143], [x(estimate), 143], palette.lime, 5);
    context.save();
    context.setLineDash([4, 4]);
    line(context, [x(estimate), 97], [x(estimate), 171], palette.lime, 1.5);
    context.restore();
    circle(context, [x(estimate), 143], 7, palette.lime);
    text(context, estimate.toFixed(2) + " m", [x(estimate), 89], palette.lime, "center");
    for (const [index, frames] of observed.entries()) {
      const left = 37 + index * 117;
      roundRect(context, left, 222, 110, 31, "#263e35", 4);
      const y = 237;
      for (const [image, center] of frames.entries()) {
        const column = left + 7 + image * 27;
        line(context, [column, y + 6], [column + 17, y + 6], palette.line);
        circle(context, [column + center / 92 * 17, y], 2.6, palette.mint);
      }
    }
  } else {
    line(context, [x(0), 143], [x(travel), 143], palette.gold, 2);
    drawCar(context, [x(travel), 143], Math.PI / 2, palette.gold);
    text(context, travel.toFixed(2) + " m", [x(travel), 89], palette.gold, "center");
  }
}
