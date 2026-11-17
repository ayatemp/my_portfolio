"use client";

import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";
import { useWorldPlayback } from "@/lib/vision-world-playback";
import { brakeRollout, hiddenRollout, pushRollout, roadRollout, sampleTrack } from "@/lib/vision-world-runtime";
import { drawBrake, drawHidden, drawPush, drawRoad, palette, stageHeight, stageWidth } from "@/lib/vision-world-visuals";
import VisionMazeLive from "./VisionMazeLive";
import styles from "./VisionWorldLive.module.css";

type Locale = "ja" | "en";
type Props = { locale: Locale; demoId: string };
type Painter = (context: CanvasRenderingContext2D) => void;
type Playback = ReturnType<typeof useWorldPlayback>;

const messages = {
  ja: {
    model: "学習モデル",
    simulator: "シミュレータ",
    scene: "シーン",
    play: "再生",
    pause: "一時停止",
    replay: "最初から",
    timeline: "タイムライン",
    pushTitle: "押し方を変えてみる",
    angle: "押す角度",
    force: "強さ",
    contact: "当てる位置",
    layouts: ["中央", "斜め置き", "壁ぎわ"],
    error: "終点のずれ",
    rotation: "予測した回転",
    roadTitle: "交差点で次の行動を選ぶ",
    action: "自車の行動",
    actions: ["停止", "徐行", "進む"],
    junctions: ["交差点 A", "交差点 B", "交差点 C"],
    ego: "自車",
    cross: "交差車",
    crossTravel: "交差車の移動距離（モデル / シミュレータ）",
    hiddenTitle: "壁の裏を横から観測する",
    camera: "カメラ",
    views: ["正面で待つ", "横から見る"],
    occlusions: ["シーン A", "シーン B"],
    choice: "経路候補",
    front: "正面",
    side: "横から観測済み",
    pending: "壁に隠れた後に観測",
    brakeTitle: "床と速度を変えてブレーキを試す",
    surface: "床",
    surfaces: ["滑りやすい", "止まりやすい"],
    observation: "ブレーキの試走",
    trials: ["0回", "1回", "3回"],
    speed: "初速",
    estimate: "予測停止位置",
    observedStop: "実際の停止位置",
    practice: "下の点は試走画像から得た位置",
  },
  en: {
    model: "Learned model",
    simulator: "Simulator",
    scene: "Scene",
    play: "Play",
    pause: "Pause",
    replay: "Restart",
    timeline: "Timeline",
    pushTitle: "Change the push",
    angle: "Push angle",
    force: "Strength",
    contact: "Contact point",
    layouts: ["Center", "Angled", "Near the edge"],
    error: "Endpoint error",
    rotation: "Predicted rotation",
    roadTitle: "Choose your action at the intersection",
    action: "Ego vehicle action",
    actions: ["Stop", "Creep", "Proceed"],
    junctions: ["Scene A", "Scene B", "Scene C"],
    ego: "Ego",
    cross: "Cross traffic",
    crossTravel: "Cross traffic distance (model / simulator)",
    hiddenTitle: "Look behind the wall",
    camera: "Camera",
    views: ["Stay in front", "Look from the side"],
    occlusions: ["Scene A", "Scene B"],
    choice: "Candidate paths",
    front: "Front view",
    side: "Side observation available",
    pending: "Side view when the ball is hidden",
    brakeTitle: "Try braking on different surfaces",
    surface: "Surface",
    surfaces: ["Slippery", "Grippy"],
    observation: "Brake trials",
    trials: ["0 trials", "1 trial", "3 trials"],
    speed: "Initial speed",
    estimate: "Predicted stop",
    observedStop: "Actual stopping point",
    practice: "Dots below show positions measured in trial frames",
  },
};

function SceneCanvas({ label, draw }: { label: string; draw: Painter }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext("2d");
    if (!element || !context) return;
    const resolution = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.round(stageWidth * resolution);
    const height = Math.round(stageHeight * resolution);
    if (element.width !== width || element.height !== height) {
      element.width = width;
      element.height = height;
    }
    context.setTransform(resolution, 0, 0, resolution, 0, 0);
    draw(context);
  }, [draw]);

  return <canvas ref={canvas} width={stageWidth} height={stageHeight} role="img" aria-label={label}>{label}</canvas>;
}

function WorldStage({
  locale, title, controls, playback, status, model, actual,
}: {
  locale: Locale;
  title: string;
  controls: ReactNode;
  playback: Playback;
  status?: ReactNode;
  model: Painter;
  actual: Painter;
}) {
  const copy = messages[locale];
  const heading = useId();
  const timeline = useId();
  const simulator = copy.simulator;

  return (
    <section className={styles.world} aria-labelledby={heading}>
      <div className={styles.header}>
        <h2 id={heading}>{title}</h2>
        <button onClick={playback.pauseOrPlay} className={styles.play} type="button">
          <span aria-hidden="true">{playback.playing ? "Ⅱ" : "▶"}</span>
          {playback.playing ? copy.pause : copy.play}
        </button>
      </div>
      <div className={styles.controls}>{controls}</div>
      <div className={styles.stage} ref={playback.viewport}>
        <figure>
          <figcaption><i aria-hidden="true" />{copy.model}</figcaption>
          <SceneCanvas label={copy.model} draw={model} />
        </figure>
        <figure>
          <figcaption><i aria-hidden="true" />{simulator}</figcaption>
          <SceneCanvas label={simulator} draw={actual} />
        </figure>
      </div>
      <div className={styles.scrub}>
        <button type="button" className={styles.restart} onClick={() => playback.replay()}>{copy.replay}</button>
        <label className={styles.timeline} htmlFor={timeline}>
          <span>{copy.timeline}</span>
          <input id={timeline} type="range" min="0" max="1000" value={Math.round(playback.progress * 1000)}
            onChange={(event) => playback.seek(Number(event.target.value) / 1000)} />
        </label>
        <output htmlFor={timeline} aria-live="off" className={styles.percent}>{Math.round(playback.progress * 100)}%</output>
      </div>
      {status && <div className={styles.status}>{status}</div>}
    </section>
  );
}

function Choices({ label, choices, value, onChange }: {
  label: string;
  choices: string[];
  value: number;
  onChange: (choice: number) => void;
}) {
  return (
    <fieldset className={styles.choice}>
      <legend>{label}</legend>
      <div>
        {choices.map((choice, index) => (
          <button key={choice} type="button" aria-pressed={index === value} onClick={() => onChange(index)}>{choice}</button>
        ))}
      </div>
    </fieldset>
  );
}

function Parameter({ label, value, display, min, max, step = 1, onChange }: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className={styles.parameter}>
      <span>{label}<b>{display}</b></span>
      <input type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function updatePlayback(playback: Playback) {
  playback.replay(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

function Push({ locale }: { locale: Locale }) {
  const copy = messages[locale];
  const playback = useWorldPlayback(3);
  const [scene, setScene] = useState(0);
  const [direction, setDirection] = useState(12);
  const [force, setForce] = useState(77);
  const [contact, setContact] = useState(50);
  const offset = (contact - 50) / 50;
  const result = useMemo(() => pushRollout(scene, direction, force / 100, offset), [scene, direction, force, offset]);
  const predicted = result.predicted.at(-1)!;
  const actual = result.actual.at(-1)!;
  const error = Math.hypot(predicted[0] - actual[0], predicted[1] - actual[1]);

  return (
    <WorldStage locale={locale} title={copy.pushTitle} playback={playback}
      controls={<>
        <Choices label={copy.scene} choices={copy.layouts} value={scene} onChange={(value) => { setScene(value); updatePlayback(playback); }} />
        <Parameter label={copy.angle} value={direction} display={direction + "°"} min={-180} max={180} onChange={(value) => { setDirection(value); updatePlayback(playback); }} />
        <Parameter label={copy.force} value={force} display={force + "%"} min={25} max={100} onChange={(value) => { setForce(value); updatePlayback(playback); }} />
        <Parameter label={copy.contact} value={contact} display={offset.toFixed(2)} min={0} max={100} onChange={(value) => { setContact(value); updatePlayback(playback); }} />
      </>}
      model={(context) => drawPush(context, result.predicted, playback.progress, direction, force / 100, offset, palette.lime)}
      actual={(context) => drawPush(context, result.actual, playback.progress, direction, force / 100, offset, palette.gold)}
      status={<>
        <span>{copy.error}<b>{(100 * error).toFixed(1)}%</b></span>
        <span>{copy.rotation}<b>{Math.round((predicted[2] - result.predicted[0][2]) * 180 / Math.PI)}°</b></span>
      </>}
    />
  );
}

function Road({ locale }: { locale: Locale }) {
  const copy = messages[locale];
  const playback = useWorldPlayback(2.5);
  const [scene, setScene] = useState(0);
  const [action, setAction] = useState(2);
  const result = useMemo(() => roadRollout(scene, action), [scene, action]);
  const modelTravel = result.predicted.at(-1)![1] - result.predicted[0][1];
  const actualTravel = result.actual.at(-1)![1] - result.actual[0][1];

  return (
    <WorldStage locale={locale} title={copy.roadTitle} playback={playback}
      controls={<>
        <Choices label={copy.action} choices={copy.actions} value={action} onChange={(value) => { setAction(value); updatePlayback(playback); }} />
        <Choices label={copy.scene} choices={copy.junctions} value={scene} onChange={(value) => { setScene(value); updatePlayback(playback); }} />
      </>}
      model={(context) => drawRoad(context, result.predicted, playback.progress)}
      actual={(context) => drawRoad(context, result.actual, playback.progress)}
      status={<>
        <span><i style={{ background: palette.lime }} aria-hidden="true" />{copy.ego}</span>
        <span><i style={{ background: palette.gold }} aria-hidden="true" />{copy.cross}</span>
        <span>{copy.crossTravel}<b>{modelTravel.toFixed(2)} / {actualTravel.toFixed(2)}</b></span>
        <span><b>{(2.5 * playback.progress).toFixed(1)} s</b></span>
      </>}
    />
  );
}

function Hidden({ locale }: { locale: Locale }) {
  const copy = messages[locale];
  const playback = useWorldPlayback(4.8);
  const [scene, setScene] = useState(0);
  const [view, setView] = useState(0);
  const result = useMemo(() => hiddenRollout(scene), [scene]);
  const observed = view === 1 && playback.progress >= 5 / 8;
  const weights = observed ? result.probability : [0.5, 0.5];
  const camera = observed ? copy.side : view === 1 ? copy.pending : copy.front;

  return (
    <WorldStage locale={locale} title={copy.hiddenTitle} playback={playback}
      controls={<>
        <Choices label={copy.camera} choices={copy.views} value={view} onChange={setView} />
        <Choices label={copy.scene} choices={copy.occlusions} value={scene} onChange={(value) => { setScene(value); updatePlayback(playback); }} />
      </>}
      model={(context) => drawHidden(context, result.actual, playback.progress, result.modes, weights, observed ? result.observed : undefined, true)}
      actual={(context) => drawHidden(context, result.actual, playback.progress, result.modes, weights, observed ? result.observed : undefined, false)}
      status={<>
        <span>{copy.choice}<b>{Math.round(weights[0] * 100)}% / {Math.round(weights[1] * 100)}%</b></span>
        <span>{camera}</span>
      </>}
    />
  );
}

function Brake({ locale }: { locale: Locale }) {
  const copy = messages[locale];
  const [scene, setScene] = useState(0);
  const [trial, setTrial] = useState(0);
  const [speed, setSpeed] = useState(113);
  const count = [0, 1, 3][trial];
  const result = useMemo(() => brakeRollout(scene, count, speed / 100), [scene, count, speed]);
  const duration = Math.max(2.2, result.seconds + 0.3);
  const playback = useWorldPlayback(duration);
  const travel = result.positionAt(duration * playback.progress);

  return (
    <WorldStage locale={locale} title={copy.brakeTitle} playback={playback}
      controls={<>
        <Choices label={copy.surface} choices={copy.surfaces} value={scene} onChange={(value) => { setScene(value); updatePlayback(playback); }} />
        <Choices label={copy.observation} choices={copy.trials} value={trial} onChange={setTrial} />
        <Parameter label={copy.speed} value={speed} display={(speed / 100).toFixed(2) + " m/s"} min={65} max={120} onChange={(value) => { setSpeed(value); updatePlayback(playback); }} />
      </>}
      model={(context) => drawBrake(context, 0, result.predicted, result.observed, true)}
      actual={(context) => drawBrake(context, travel, result.predicted, [], false)}
      status={<>
        <span>{copy.estimate}<b>{result.predicted.toFixed(2)} m</b></span>
        <span>{copy.observedStop}<b>{result.actual.toFixed(2)} m</b></span>
        {count > 0 && <span>{copy.practice}</span>}
      </>}
    />
  );
}

export default function VisionWorldLive({ locale, demoId }: Props) {
  switch (demoId) {
    case "01-block-push": return <Push locale={locale} />;
    case "02-intersection": return <Road locale={locale} />;
    case "03-occlusion": return <Hidden locale={locale} />;
    case "04-maze-rollout": return <VisionMazeLive locale={locale} />;
    case "05-slip-stop": return <Brake locale={locale} />;
    default: return null;
  }
}
