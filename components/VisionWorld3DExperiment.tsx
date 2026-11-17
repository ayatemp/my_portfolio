"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { buildBlockScene } from "@/lib/world3d-block";
import { buildIntersectionScene } from "@/lib/world3d-intersection";
import type { WorldSceneSample } from "@/lib/world3d-types";
import { pushRollout, roadRollout, sampleTrack } from "@/lib/vision-world-runtime";
import { useWorldPlayback } from "@/lib/vision-world-playback";
import { drawPush, drawRoad, palette, stageHeight, stageWidth } from "@/lib/vision-world-visuals";
import VisionWorld3DStage from "./VisionWorld3DStage";
import styles from "./VisionWorld3D.module.css";

type Locale = "ja" | "en";
type Demo = "block" | "intersection";
type View = "compare" | "model" | "simulator";
type Push = { scene: number; heading: number; force: number; contact: number };
const pushPresets: Push[] = [
  { scene: 0, heading: 0, force: 0.7, contact: 0 },
  { scene: 1, heading: 36, force: 0.84, contact: 0.82 },
  { scene: 2, heading: 12, force: 0.93, contact: -0.4 },
];

const copy = {
  ja: {
    scene: "シーン",
    action: "自車の行動",
    actions: ["停止", "徐行", "進む"],
    junctions: ["交差点 A", "交差点 B", "交差点 C"],
    layout: "ブロックの配置",
    positions: ["テーブル中央", "斜め置き", "壁ぎわ"],
    presets: "試し方",
    pushes: ["まっすぐ押す", "端を押して回す", "壁に向けて押す"],
    heading: "押す方向",
    force: "押す強さ",
    contact: "当てる位置",
    view: "表示",
    modes: ["左右で比較", "学習モデル", "シミュレータ"],
    titles: { block: "ブロックの動きを3Dで比べる", intersection: "交差点の動きを3Dで比べる" },
    timeline: "タイムライン",
    play: "再生",
    pause: "一時停止",
    restart: "先頭へ",
    steps: (number: string) => `${number} / 8 ステップ`,
    last: "終点での差",
    blockNow: "現在の位置の差",
    blockAngle: "現在の回転の差",
    blockUnit: "テーブル幅に対する割合",
    blockGhost: "半透明の輪郭は、もう一方の同時刻の位置と向き",
    egoNow: "現在の自車位置の差",
    crossNow: "現在の交差車位置の差",
    roadUnit: "シーン座標の絶対差",
    roadKey: "黄緑は自車、琥珀色は交差車両",
    roadGap: "水色の輪と点線は、もう一方の同時刻の位置と差",
    fallback: "同じ条件を2Dで比較",
  },
  en: {
    scene: "Scene",
    action: "Ego vehicle action",
    actions: ["Stop", "Creep", "Proceed"],
    junctions: ["Junction A", "Junction B", "Junction C"],
    layout: "Block placement",
    positions: ["Center", "Angled", "Near the wall"],
    presets: "Try a push",
    pushes: ["Push straight", "Spin from the edge", "Push toward the wall"],
    heading: "Push direction",
    force: "Push strength",
    contact: "Contact point",
    view: "View",
    modes: ["Compare side by side", "Learned model", "Simulator"],
    titles: { block: "Compare the block in 3D", intersection: "Compare the intersection in 3D" },
    timeline: "Timeline",
    play: "Play",
    pause: "Pause",
    restart: "Back to start",
    steps: (number: string) => `${number} / 8 steps`,
    last: "Endpoint gap",
    blockNow: "Current position gap",
    blockAngle: "Current rotation gap",
    blockUnit: "As a share of the tabletop width",
    blockGhost: "The translucent outline shows the other result at the same instant",
    egoNow: "Current ego position gap",
    crossNow: "Current cross-traffic gap",
    roadUnit: "Absolute difference in scene coordinates",
    roadKey: "Lime is the ego vehicle; amber is cross traffic",
    roadGap: "The blue ring and dashed line show the other position at the same instant",
    fallback: "Compare these settings in 2D",
  },
};

const views: View[] = ["compare", "model", "simulator"];

function Choices({ label, options, selected, select, tone }: {
  label: string;
  options: string[];
  selected?: number;
  select: (index: number) => void;
  tone?: "emphasized";
}) {
  return (
    <fieldset className={styles.choices} data-tone={tone}>
      <legend>{label}</legend>
      <div>
        {options.map((option, index) => (
          <button key={option} type="button" aria-pressed={selected === undefined ? undefined : selected === index}
            onClick={() => select(index)}>
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Parameter({ label, value, min, max, step = 1, display, change }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  display: string;
  change: (value: number) => void;
}) {
  return (
    <label className={styles.parameter}>
      <span>{label}<output>{display}</output></span>
      <input aria-label={label} aria-valuetext={display} type="range"
        value={value} min={min} max={max} step={step}
        onChange={(event) => change(Number(event.target.value))} />
    </label>
  );
}

function FallbackPanel({ points, side, progress, push, label }: {
  points: number[][];
  side: "model" | "simulator";
  progress: number;
  push?: Push;
  label: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    if (push) {
      drawPush(ctx, points as [number, number, number][], progress,
        push.heading, push.force, push.contact, side === "model" ? palette.lime : palette.gold);
    } else {
      drawRoad(ctx, points as [number, number][], progress);
    }
  }, [points, progress, push, side]);
  return (
    <figure>
      <figcaption>{label}</figcaption>
      <canvas ref={canvas} width={stageWidth} height={stageHeight} aria-label={label} />
    </figure>
  );
}

function Fallback({ locale, tracks, push, mode }: {
  locale: Locale;
  tracks: WorldSceneSample;
  push?: Push;
  mode: View;
}) {
  const t = copy[locale];
  return (
    <div className={styles.fallback} aria-label={t.fallback} data-single={mode !== "compare"}>
      {mode !== "simulator" && <FallbackPanel points={tracks.predicted} side="model"
        progress={tracks.progress} push={push} label={t.modes[1]} />}
      {mode !== "model" && <FallbackPanel points={tracks.actual} side="simulator"
        progress={tracks.progress} push={push} label={t.modes[2]} />}
    </div>
  );
}

export default function VisionWorld3DExperiment({ locale, demo }: { locale: Locale; demo: Demo }) {
  const t = copy[locale];
  const id = useId();
  const block = demo === "block";
  const playback = useWorldPlayback(block ? 3.2 : 2.5);
  const [view, setView] = useState<View>("compare");
  const [push, setPush] = useState<Push>(pushPresets[2]);
  const [intersection, setIntersection] = useState({ scene: 0, action: 2 });

  const tracks = useMemo(
    () => block ? pushRollout(push.scene, push.heading, push.force, push.contact)
      : roadRollout(intersection.scene, intersection.action),
    [block, push, intersection],
  );
  const sample = useMemo<WorldSceneSample>(
    () => ({ ...tracks, progress: playback.progress, ...(block ? push : intersection) }),
    [tracks, playback.progress, block, push, intersection],
  );
  const forecast = sampleTrack(sample.predicted, sample.progress);
  const reference = sampleTrack(sample.actual, sample.progress);
  const forecastEnd = sample.predicted.at(-1)!;
  const referenceEnd = sample.actual.at(-1)!;
  const differences = forecast.map((value, axis) => value - reference[axis]);
  const endGap = Math.hypot(forecastEnd[0] - referenceEnd[0], forecastEnd[1] - referenceEnd[1]);
  const rotation = block ? Math.abs(Math.atan2(Math.sin(differences[2]), Math.cos(differences[2])) * 180 / Math.PI) : 0;
  const readings = block ? [
    { title: t.blockNow, value: (Math.hypot(differences[0], differences[1]) * 100).toFixed(1), unit: "%" },
    { title: t.blockAngle, value: rotation.toFixed(1), unit: "°" },
    { title: t.last, value: (endGap * 100).toFixed(1), unit: "%" },
  ] : [
    { title: t.egoNow, value: Math.abs(differences[0]).toFixed(2), unit: "" },
    { title: t.crossNow, value: Math.abs(differences[1]).toFixed(2), unit: "" },
  ];

  function replay() {
    const animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (animate) playback.replay();
    else playback.seek(1);
  }

  function changePush(value: Partial<Push>, animate = false) {
    setPush((previous) => ({ ...previous, ...value }));
    if (animate) replay();
  }

  function changeRoad(value: Partial<{ scene: number; action: number }>) {
    setIntersection((previous) => ({ ...previous, ...value }));
    replay();
  }

  return (
    <section className={styles.experiment} aria-labelledby={`${id}-title`}>
      <header className={styles.header}>
        <h2 id={`${id}-title`}>{t.titles[demo]}</h2>
        {block
          ? <Choices label={t.presets} options={t.pushes} select={(index) => changePush(pushPresets[index], true)} />
          : <Choices label={t.action} options={t.actions} selected={intersection.action}
            select={(action) => changeRoad({ action })} tone="emphasized" />}
        <Choices label={t.view} options={t.modes} selected={views.indexOf(view)} select={(index) => setView(views[index])} />
      </header>

      <div className={styles.workbench}>
        <div className={styles.stage} ref={playback.viewport}>
          <VisionWorld3DStage
            locale={locale}
            buildScene={block ? buildBlockScene : buildIntersectionScene}
            sample={sample}
            mode={view}
            fallback={<Fallback locale={locale} tracks={sample} mode={view} push={block ? push : undefined} />}
          />
        </div>

        <div className={styles.transport}>
          <div className={styles.playbackButtons}>
            <button type="button" className={styles.play} onClick={playback.pauseOrPlay}>
              <span aria-hidden="true">{playback.playing ? "Ⅱ" : "▶"}</span>
              {playback.playing ? t.pause : t.play}
            </button>
            <button type="button" className={styles.restart} onClick={() => playback.seek(0)}>
              <span aria-hidden="true">↶</span>{t.restart}
            </button>
          </div>
          <label htmlFor={`${id}-time`} className={styles.timeline}>
            <span>{t.timeline}</span>
            <input id={`${id}-time`} type="range" min="0" max="1000"
              value={Math.round(1000 * playback.progress)}
              onChange={(event) => playback.seek(Number(event.target.value) / 1000)}
              aria-valuetext={block ? t.steps((8 * playback.progress).toFixed(1)) : `${(2.5 * playback.progress).toFixed(2)} s`} />
          </label>
          <output className={styles.time} htmlFor={`${id}-time`} aria-live="off">
            {block ? t.steps((8 * playback.progress).toFixed(1)) : `${(2.5 * playback.progress).toFixed(2)} / 2.50 s`}
          </output>
        </div>

        <div className={styles.controls}>
          {block ? (
            <>
              <Choices label={t.layout} options={t.positions} selected={push.scene} select={(scene) => changePush({ scene }, true)} />
              <div className={styles.parameters}>
                <Parameter label={t.heading} value={push.heading} min={-180} max={180} display={`${push.heading}°`}
                  change={(heading) => changePush({ heading })} />
                <Parameter label={t.force} value={push.force} min={0.25} max={1} step={0.01}
                  display={`${Math.round(push.force * 100)}%`} change={(force) => changePush({ force })} />
                <Parameter label={t.contact} value={push.contact} min={-1} max={1} step={0.01}
                  display={push.contact.toFixed(2)} change={(contact) => changePush({ contact })} />
              </div>
            </>
          ) : (
            <Choices label={t.scene} options={t.junctions} selected={intersection.scene}
              select={(scene) => changeRoad({ scene })} />
          )}
        </div>
      </div>

      <div className={styles.measurements}>
        <dl>
          {readings.map(({ title, value, unit }) => (
            <div key={title}>
              <dt>{title}</dt>
              <dd>{value}<span>{unit}</span></dd>
            </div>
          ))}
        </dl>
        <p>{block ? `${t.blockUnit} · ${t.blockGhost}` : `${t.roadUnit} · ${t.roadKey} · ${t.roadGap}`}</p>
      </div>
    </section>
  );
}
