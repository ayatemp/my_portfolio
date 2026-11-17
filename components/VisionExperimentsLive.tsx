"use client";

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import references from "@/lib/vision-experiments-reference.json";
import stress from "@/lib/vision-experiments-stress.json";
import tracking from "@/lib/vision-experiments-tracking.json";
import { runVisionDetection } from "@/lib/vision-detection";
import { trackScene, type Box, type Scene, type SceneFrame, type TrackingFrame } from "@/lib/vision-experiments-tracker";
import styles from "./VisionExperimentsLive.module.css";

type Locale = "ja" | "en";
type Photo = { file: string; width: number; height: number };
type Detection = { box: number[]; score: number };
const mediaRoot = "/products/vision-experiments";
const frameDuration = 145;
const trackColors = ["#baf277", "#ffb774", "#b7b5ff", "#60eee7", "#fba2d8"];

const copy = {
  ja: {
    reference: "画像の見本から検索",
    referenceHelp: "見本の枠を選ぶと、右の写真に OWLv2 の照合候補がスコア順に現れます。",
    source: "見本の写真", target: "検索対象", photoA: "デスク A → B", photoB: "デスク B → A",
    replay: "検索を再生", candidates: "照合候補", none: "候補が見つかりませんでした",
    sample: "事前に実行した OWLv2 の結果",
    objects: { laptop: "ノートPC", keyboard: "キーボード", mouse: "マウス", bowl: "ボウル", cup: "カップ" },
    tracking: "遮蔽をまたいで追跡", trackingHelp: "小型CNNの検出枠から、追跡IDを各フレームで割り当てます。",
    wall: "壁あり", open: "壁なし", last: "最後に見えた位置", motion: "速度で予測",
    compare: "両方式を比較", tracks: "軌跡", lost: "IDの保持時間", frames: "フレーム",
    stepBack: "1フレーム戻る", stepForward: "1フレーム進む", play: "再生", pause: "一時停止",
    jump: "次のID入れ替わり", switches: "ID入れ替わり", misses: "検出の見逃し", speed: "再生速度",
    stress: "検出が崩れる条件を探す",
    stressHelp: "明るさ、ぼけ、遮蔽を組み合わせて、元画像と検出結果を比較します。",
    original: "元画像", changed: "条件を変えた画像", brightness: "明るさ", blur: "ぼけ", cover: "近くの猫を覆う割合",
    truth: "正解枠", prediction: "検出枠", reset: "条件をリセット", detected: "正検出", false: "誤検出", missed: "見逃し",
    fullGrid: "100条件を OWLv2 で実測。検出スコア 0.30 以上、正解との IoU 0.50 以上で集計。",
    runBrowser: "OWL-ViT で再検出", downloading: "ブラウザ用モデルを取得中",
    firstDownload: "OWL-ViT による再検出には、初回のみ約155 MBのモデル取得が必要です。",
    detecting: "ブラウザで再検出中", browserOutput: "OWL-ViT · ブラウザ推論",
    failure: "OWL-ViT を実行できませんでした。準備済みの結果は引き続き比較できます。",
  },
  en: {
    reference: "Search from a visual example",
    referenceHelp: "Select a reference region to reveal OWLv2’s ranked matches in the photo on the right.",
    source: "Reference photo", target: "Search photo", photoA: "Desk A → B", photoB: "Desk B → A",
    replay: "Replay search", candidates: "Ranked matches", none: "No matches found",
    sample: "Results from prior OWLv2 runs",
    objects: { laptop: "Laptop", keyboard: "Keyboard", mouse: "Mouse", bowl: "Bowl", cup: "Cup" },
    tracking: "Track through occlusion", trackingHelp: "Assign tracking IDs frame by frame to boxes detected by a small CNN.",
    wall: "Wall", open: "No wall", last: "Last seen position", motion: "Predict motion",
    compare: "Compare methods", tracks: "Trails", lost: "ID retention", frames: "frames",
    stepBack: "Previous frame", stepForward: "Next frame", play: "Play", pause: "Pause",
    jump: "Next ID switch", switches: "ID switches", misses: "Missed detections", speed: "Playback speed",
    stress: "Find where detection fails",
    stressHelp: "Combine brightness, blur and occlusion, and compare detections with the original photo.",
    original: "Original photo", changed: "Modified photo", brightness: "Brightness", blur: "Blur",
    cover: "Near-cat occlusion", truth: "Ground truth", prediction: "Detections", reset: "Reset conditions",
    detected: "True positives", false: "False positives", missed: "Misses",
    fullGrid: "100 settings evaluated with OWLv2. Scores ≥ 0.30 and matching IoU ≥ 0.50.",
    runBrowser: "Run OWL-ViT", downloading: "Downloading the browser model",
    firstDownload: "OWL-ViT downloads about 155 MB of model data on first use.",
    detecting: "Running browser detection", browserOutput: "OWL-ViT · browser inference",
    failure: "OWL-ViT could not run. The prepared results are still available to compare.",
  },
};

function regionStyle([x, y, right, bottom]: number[]): CSSProperties {
  return {
    left: `${x * 100}%`, top: `${y * 100}%`,
    width: `${Math.max(0, right - x) * 100}%`, height: `${Math.max(0, bottom - y) * 100}%`,
  };
}

function PhotoPanel({ photo, title, label, children, scan }: {
  photo: Photo;
  title: string;
  label?: string;
  children?: ReactNode;
  scan?: boolean;
}) {
  return (
    <figure className={styles.figure}>
      <figcaption className={styles.figureHeader}><strong>{title}</strong>{label && <span>{label}</span>}</figcaption>
      <div className={styles.photo} style={{ aspectRatio: `${photo.width} / ${photo.height}` }}>
        {/* The overlays use the original pixel coordinates. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${mediaRoot}/${photo.file}`} alt={title} width={photo.width} height={photo.height} />
        {children}
        {scan && <span className={styles.scan} aria-hidden="true" />}
      </div>
    </figure>
  );
}

function Overlay({ box, label, truth, selected, order }: {
  box: number[];
  label?: string;
  truth?: boolean;
  selected?: boolean;
  order?: number;
}) {
  return (
    <span
      className={styles.overlay}
      style={{ ...regionStyle(box), animationDelay: order === undefined ? undefined : `${130 + order * 120}ms` }}
      data-truth={truth || undefined}
      data-selected={selected || undefined}
      aria-hidden="true"
    >
      {label && <span>{label}</span>}
    </span>
  );
}

function ReferenceSearch({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [pair, setPair] = useState(0);
  const [object, setObject] = useState(0);
  const [run, setRun] = useState(0);
  const [activeMatch, setActiveMatch] = useState(0);
  const experiment = references[pair];
  const query = experiment.objects[object];
  const label = (value: string) => t.objects[value as keyof typeof t.objects];

  function search(next: number) {
    setObject(next);
    setActiveMatch(0);
    setRun((id) => id + 1);
  }

  return (
    <section className={styles.experiment} aria-label={t.reference}>
      <header className={styles.header}>
        <div><h2>{t.reference}</h2><p>{t.referenceHelp}</p></div>
        <div className={styles.segment} role="group" aria-label={t.source}>
          {[t.photoA, t.photoB].map((name, index) => (
            <button type="button" key={name} aria-pressed={pair === index} onClick={() => { setPair(index); search(0); }}>{name}</button>
          ))}
        </div>
      </header>
      <div className={styles.referenceDeck}>
        <PhotoPanel photo={experiment.source} title={t.source} label={label(query.label)}>
          {experiment.objects.map((candidate, index) => (
            <button
              type="button"
              key={candidate.label}
              className={styles.crop}
              style={regionStyle(candidate.box)}
              aria-label={label(candidate.label)}
              aria-pressed={object === index}
              onClick={() => search(index)}
            >
              <span>{label(candidate.label)}</span>
            </button>
          ))}
        </PhotoPanel>
        <PhotoPanel key={run} photo={experiment.target} title={t.target} label={`OWLv2 · ${query.matches.length}`} scan>
          {query.matches.map((match, index) => (
            <Overlay key={index} box={match.box} label={`#${index + 1} · ${(match.score * 100).toFixed(1)}%`}
              selected={activeMatch === index} order={index} />
          ))}
        </PhotoPanel>
      </div>
      <div className={styles.referenceFooter}>
        <div className={styles.row}>
          <div className={styles.segment} role="group" aria-label={t.source}>
            {experiment.objects.map((candidate, index) => (
              <button type="button" key={candidate.label} aria-pressed={object === index} onClick={() => search(index)}>
                {label(candidate.label)}
              </button>
            ))}
          </div>
          <button type="button" className={styles.action} onClick={() => search(object)}>{t.replay}</button>
        </div>
        <div className={styles.rank} aria-label={t.candidates}>
          <strong>{t.candidates}</strong>
          {query.matches.length ? query.matches.map((match, index) => (
            <button key={index} type="button" aria-pressed={activeMatch === index} onClick={() => setActiveMatch(index)}>
              <span>#{index + 1}</span> {(match.score * 100).toFixed(1)}%
            </button>
          )) : <span>{t.none}</span>}
        </div>
        <p className={styles.note}>{t.sample}</p>
      </div>
    </section>
  );
}

function drawTracking(ctx: CanvasRenderingContext2D, frame: SceneFrame, next: SceneFrame, fraction: number,
  result: TrackingFrame, wall: Box | null, trails: boolean) {
  ctx.clearRect(0, 0, 560, 360);
  ctx.fillStyle = "#101d22";
  ctx.fillRect(0, 0, 560, 360);
  ctx.fillStyle = "#253741";
  ctx.fillRect(0, 60, 560, 229);
  ctx.strokeStyle = "#607078";
  ctx.setLineDash([16, 16]);
  ctx.beginPath();
  ctx.moveTo(0, 173);
  ctx.lineTo(560, 173);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#718489";
  ctx.fillRect(0, 62, 560, 1);
  ctx.fillRect(0, 287, 560, 1);
  for (let x = 8; x < 560; x += 20) {
    ctx.fillRect(x, 47, 7, 1);
    ctx.fillRect(x, 305, 7, 1);
  }

  frame.cars.forEach(([x, y], index) => {
    const [nextX, nextY] = next.cars[index];
    ctx.save();
    ctx.translate((x + (nextX - x) * fraction) * 5, (y + (nextY - y) * fraction) * 5);
    if (index === 1) ctx.rotate(Math.PI);
    ctx.shadowColor = "#0009";
    ctx.shadowBlur = 9;
    ctx.fillStyle = "#e8a46e";
    ctx.beginPath();
    ctx.roundRect(-31, -16, 63, 34, 7);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#2d4248";
    ctx.beginPath();
    ctx.roundRect(-12, -11, 23, 24, 4);
    ctx.fill();
    ctx.fillStyle = "#fae5a6";
    ctx.fillRect(24, -11, 5, 7);
    ctx.fillRect(24, 6, 5, 7);
    ctx.fillStyle = "#ab564c";
    ctx.fillRect(-29, -10, 4, 6);
    ctx.fillRect(-29, 6, 4, 6);
    ctx.restore();
  });

  if (wall) {
    const [left, top, right, bottom] = wall.map((value) => value * 5);
    ctx.fillStyle = "#0005";
    ctx.fillRect(left + 9, top + 9, right - left + 4, bottom - top + 4);
    const material = ctx.createLinearGradient(left, top, right, bottom);
    material.addColorStop(0, "#677983");
    material.addColorStop(1, "#455762");
    ctx.fillStyle = material;
    ctx.fillRect(left, top, right - left + 4, bottom - top + 4);
    ctx.strokeStyle = "#9baba988";
    ctx.strokeRect(left, top, right - left + 4, bottom - top + 4);
    ctx.fillStyle = "#192c4066";
    for (let y = top + 12; y < bottom; y += 10) ctx.fillRect(left + 7, y, right - left - 10, 2);
  }

  for (const object of result.objects) {
    const color = trackColors[(object.id - 1) % trackColors.length];
    const [x1, y1, x2, y2] = object.box.map((value) => value * 5);
    if (trails && object.trail.length > 1) {
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.62;
      ctx.lineWidth = 2;
      ctx.beginPath();
      object.trail.forEach(([x, y], index) => index === 0 ? ctx.moveTo(x * 5, y * 5) : ctx.lineTo(x * 5, y * 5));
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = color;
    ctx.strokeRect(x1, y1, x2 - x1 + 4, y2 - y1 + 4);
    ctx.fillStyle = color;
    ctx.fillRect(x1, y1 - 21, 42, 20);
    ctx.fillStyle = "#182728";
    ctx.font = "bold 12px monospace";
    ctx.fillText(`ID ${object.id}`, x1 + 6, y1 - 7);
  }
}

function TrackingPanel({ scene, sample, position, title, trails, locale }: {
  scene: Scene;
  sample: TrackingFrame;
  position: number;
  title: string;
  trails: boolean;
  locale: Locale;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const t = copy[locale];
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    const frame = Math.floor(position);
    if (ctx) drawTracking(ctx, scene.frames[frame], scene.frames[frame + 1] ?? scene.frames[frame],
      position - frame, sample, scene.wall, trails);
  }, [position, sample, scene, trails]);

  return (
    <figure className={styles.figure}>
      <figcaption className={styles.figureHeader}>
        <strong>{title}</strong>
        <span className={sample.switched ? styles.alert : undefined}>{t.switches} {sample.switches}</span>
      </figcaption>
      <canvas className={styles.trackCanvas} ref={canvas} width={560} height={360} role="img" aria-label={title} />
      <div className={styles.trackStats}><span>{t.misses} <strong>{sample.misses}</strong></span></div>
    </figure>
  );
}

function ObjectTracking({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const identifier = useId();
  const [sceneIndex, setSceneIndex] = useState(0);
  const [velocity, setVelocity] = useState(false);
  const [compare, setCompare] = useState(true);
  const [trails, setTrails] = useState(true);
  const [maxGap, setMaxGap] = useState(13);
  const [speed, setSpeed] = useState(1);
  const [position, setPosition] = useState(0);
  const [playing, setPlaying] = useState(false);
  const scene = tracking[sceneIndex] as Scene;
  const last = scene.frames.length - 1;
  const frame = Math.floor(position);
  const tracked = useMemo(
    () => [trackScene(scene, false, maxGap), trackScene(scene, true, maxGap)],
    [scene, maxGap],
  );
  const switchFrames = tracked[Number(velocity)].flatMap((sample, index) =>
    sample.switched || (compare && tracked[Number(!velocity)][index].switched) ? [index] : []);

  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(true);
  }, []);

  useEffect(() => {
    if (!playing) return;
    let lastTime = performance.now();
    let handle: number;
    function advance(now: number) {
      const elapsed = Math.min(100, now - lastTime);
      lastTime = now;
      setPosition((current) => Math.min(last, current + elapsed * speed / frameDuration));
      handle = requestAnimationFrame(advance);
    }
    handle = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(handle);
  }, [playing, last, speed]);

  useEffect(() => {
    if (position === last) setPlaying(false);
  }, [position, last]);

  function scrub(next: number) {
    setPlaying(false);
    setPosition(Math.max(0, Math.min(last, next)));
  }

  return (
    <section className={styles.experiment} aria-label={t.tracking}>
      <header className={styles.header}>
        <div><h2>{t.tracking}</h2><p>{t.trackingHelp}</p></div>
        <div className={styles.segment} role="group" aria-label={locale === "ja" ? "撮影条件" : "Scene"}>
          {[t.wall, t.open].map((name, index) => (
            <button type="button" key={name} aria-pressed={sceneIndex === index}
              onClick={() => { setSceneIndex(index); setPosition(0); setPlaying(true); }}>{name}</button>
          ))}
        </div>
      </header>
      <div className={styles.trackControls}>
        <label className={styles.checkbox}><input type="checkbox" checked={compare} onChange={(event) => setCompare(event.target.checked)} />{t.compare}</label>
        <label className={styles.checkbox}><input type="checkbox" checked={trails} onChange={(event) => setTrails(event.target.checked)} />{t.tracks}</label>
        {!compare && <select aria-label={locale === "ja" ? "追跡方式" : "Tracking method"} value={Number(velocity)} onChange={(event) => setVelocity(event.target.value === "1")}>
          <option value={0}>{t.last}</option><option value={1}>{t.motion}</option>
        </select>}
        <label className={styles.smallField}>{t.lost}
          <select value={maxGap} onChange={(event) => setMaxGap(Number(event.target.value))}>
            {[3, 6, 9, 13, 20].map((value) => <option key={value} value={value}>{value} {t.frames}</option>)}
          </select>
        </label>
      </div>
      <div className={compare ? styles.trackDeck : styles.trackSingle}>
        {(compare ? [false, true] : [velocity]).map((mode) => (
          <TrackingPanel key={Number(mode)} scene={scene} position={position} sample={tracked[Number(mode)][frame]}
            title={mode ? t.motion : t.last} trails={trails} locale={locale} />
        ))}
      </div>
      <div className={styles.playback}>
        <div className={styles.row}>
          <div className={styles.transport}>
            <button type="button" aria-label={t.stepBack} onClick={() => scrub(frame - 1)} disabled={frame === 0}>‹</button>
            <button type="button" className={styles.action} onClick={() => {
              if (!playing && frame === last) setPosition(0);
              setPlaying(!playing);
            }}>{playing ? t.pause : t.play}</button>
            <button type="button" aria-label={t.stepForward} onClick={() => scrub(frame + 1)} disabled={frame === last}>›</button>
          </div>
          <label className={styles.smallField}>{t.speed}
            <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>
              {[0.25, 0.5, 1, 2].map((value) => <option key={value} value={value}>{value}×</option>)}
            </select>
          </label>
          <button type="button" className={styles.outline} disabled={switchFrames.length === 0}
            onClick={() => scrub(switchFrames.find((index) => index > frame) ?? switchFrames[0])}>{t.jump}</button>
        </div>
        <label className={styles.timeline} htmlFor={identifier}>
          <span>{t.frames}</span>
          <input id={identifier} type="range" min={0} max={last} value={frame} onChange={(event) => scrub(Number(event.target.value))} />
          <output htmlFor={identifier}>{String(frame + 1).padStart(2, "0")} / {last + 1}</output>
        </label>
      </div>
    </section>
  );
}

function overlap(a: number[], b: number[]) {
  const area = ([left, top, right, bottom]: number[]) => Math.max(0, right - left) * Math.max(0, bottom - top);
  const intersection = area([Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.min(a[3], b[3])]);
  return intersection / Math.max(Number.EPSILON, area(a) + area(b) - intersection);
}

function reportDetection(boxes: Detection[]) {
  const remaining = [...stress.truth];
  let hits = 0;
  for (const detection of [...boxes].sort((a, b) => b.score - a.score)) {
    const scores = remaining.map((truth) => overlap(truth, detection.box));
    const best = Math.max(...scores);
    if (best < 0.5) continue;
    remaining.splice(scores.indexOf(best), 1);
    hits++;
  }
  return [hits, boxes.length - hits, remaining.length];
}

function StressTest({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [bright, setBright] = useState(0);
  const [blur, setBlur] = useState(0);
  const [cover, setCover] = useState(0);
  const [showTruth, setTruth] = useState(true);
  const [showBoxes, setBoxes] = useState(true);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [live, setLive] = useState<{ file: string; original: Detection[]; changed: Detection[] } | null>(null);
  const condition = stress.conditions[(bright * stress.blur.length + blur) * stress.coverage.length + cover];
  const baseline = stress.conditions[0];
  const comparison = live?.file === condition.file ? live : null;
  const fields = [
    { label: t.brightness, values: stress.brightness, current: bright, set: setBright, unit: "%" },
    { label: t.blur, values: stress.blur, current: blur, set: setBlur, unit: "px" },
    { label: t.cover, values: stress.coverage, current: cover, set: setCover, unit: "%" },
  ];

  async function runBrowser() {
    setRunning(true);
    setProgress(null);
    setFailed(false);
    try {
      const detect = async (file: string) => (
        await runVisionDetection(`${mediaRoot}/${file}`, ["a cat"], setProgress)
      ).filter((prediction) => prediction.score >= 0.3);
      const original = await detect(baseline.file);
      const changed = condition.file === baseline.file ? original : await detect(condition.file);
      setLive({ file: condition.file, original, changed });
    } catch {
      setFailed(true);
    } finally {
      setRunning(false);
    }
  }

  function result(item: typeof condition, boxes: Detection[], title: string) {
    const metrics = reportDetection(boxes);
    return (
      <div className={styles.stressResult} key={title}>
        <PhotoPanel key={`${item.file}-${Boolean(comparison)}`} photo={{ file: item.file, width: stress.width, height: stress.height }}
          title={title} label={comparison ? t.browserOutput : "OWLv2"}>
          {showTruth && stress.truth.map((box, index) => <Overlay key={`truth-${index}`} box={box} truth />)}
          {showBoxes && boxes.map(({ box, score }, index) => (
            <Overlay key={`box-${index}`} box={box} label={`CAT ${(score * 100).toFixed(0)}%`} order={index} />
          ))}
        </PhotoPanel>
        <dl className={styles.metrics} aria-live="polite">
          {[t.detected, t.false, t.missed].map((label, index) => (
            <div key={label}><dt>{label}</dt><dd>{metrics[index]}</dd></div>
          ))}
        </dl>
      </div>
    );
  }

  return (
    <section className={styles.experiment} aria-label={t.stress}>
      <header className={styles.header}><div><h2>{t.stress}</h2><p>{t.stressHelp}</p></div></header>
      <div className={styles.stressControls}>
        {fields.map((field) => (
          <label className={styles.control} key={field.label}>
            <span>{field.label}<output>{field.values[field.current]} {field.unit}</output></span>
            <input type="range" min={0} max={field.values.length - 1} value={field.current}
              aria-label={field.label} aria-valuetext={`${field.values[field.current]} ${field.unit}`}
              onChange={(event) => field.set(Number(event.target.value))} />
          </label>
        ))}
      </div>
      <div className={styles.stressDeck}>
        {result(baseline, comparison?.original ?? baseline.boxes, t.original)}
        {result(condition, comparison?.changed ?? condition.boxes, t.changed)}
      </div>
      <div className={styles.referenceFooter}>
        <div className={styles.row}>
          <div className={styles.rowOptions}>
            <label className={styles.checkbox}><input type="checkbox" checked={showTruth} onChange={(event) => setTruth(event.target.checked)} />{t.truth}</label>
            <label className={styles.checkbox}><input type="checkbox" checked={showBoxes} onChange={(event) => setBoxes(event.target.checked)} />{t.prediction}</label>
          </div>
          <div className={styles.rowOptions}>
            <button type="button" className={styles.outline} disabled={!comparison && bright === 0 && blur === 0 && cover === 0}
              onClick={() => { setBright(0); setBlur(0); setCover(0); setLive(null); }}>{t.reset}</button>
            <button type="button" className={styles.action} disabled={running} onClick={runBrowser}>{t.runBrowser}</button>
          </div>
        </div>
        {running && <p className={styles.note} role="status">{progress === null ? t.detecting : `${t.downloading} ${Math.round(progress)}%`}</p>}
        {failed && <p className={styles.note} role="alert">{t.failure}</p>}
        <p className={styles.note}>{t.fullGrid} {t.firstDownload}</p>
      </div>
    </section>
  );
}

export default function VisionExperimentsLive({ locale, demoId }: { locale: Locale; demoId: string }) {
  if (demoId.startsWith("07")) return <ReferenceSearch locale={locale} />;
  if (demoId.startsWith("08")) return <ObjectTracking locale={locale} />;
  return <StressTest locale={locale} />;
}
