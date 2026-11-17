"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ChangeEvent, CSSProperties, FormEvent } from "react";
import { runVisionDetection } from "@/lib/vision-detection";
import type { VisionDetectionBox } from "@/lib/vision-detection";
import sampleJson from "@/lib/vision-detection-samples.json";
import styles from "./VisionDetectionLive.module.css";

const imageRoot = "/products/vision-experiments";
type CachedDetection = Omit<VisionDetectionBox, "box"> & { box: number[] };
const samples: {
  text: Record<string, CachedDetection[]>;
  packing: Record<"desk-a" | "desk-b", CachedDetection[]>;
} = sampleJson;
const desks = ["desk-a", "desk-b"] as const;
const deskImage = { "desk-a": "desk-laptop.jpg", "desk-b": "desk-mouse.jpg" };
const packingItems = ["laptop", "computer mouse", "keyboard", "webcam", "headphones"];
const textLabels: Record<string, string> = {
  "a cat": "猫", "a computer keyboard": "キーボード", "a cup": "カップ",
  "a desktop computer": "デスクトップPC", "a mouse": "マウス", "a flower": "花",
  laptop: "ノートPC", "computer mouse": "マウス", keyboard: "キーボード", webcam: "ウェブカメラ", headphones: "ヘッドホン",
};

const translations = {
  ja: {
    textTitle: "画像の中から探す", packingTitle: "持ち物チェックを試す",
    sampleSearch: "検索例", search: "英語で探すものを入力", searchAction: "探す", packingAction: "持ち物を確認",
    confidence: "検出スコアの下限", source: "画像を選ぶ", desk: ["デスク A", "デスク B"],
    photo: "サンプル画像", customImage: "自分の写真を選ぶ", resetImage: "サンプルに戻す",
    sample: "OWLv2 の保存済み出力", local: "OWL-ViT · ブラウザ内で推論",
    load: "モデルを準備中", infer: "画像を解析中", failed: "推論を開始できませんでした。時間をおいて再試行できます。",
    fileError: "12 MB 以下の JPEG、PNG、WebP を選んでください。",
    dataSize: "独自の検索語や写真を使うと、初回にモデルのデータを約155 MB取得します。画像はブラウザ内で処理します。",
    found: "検出", review: "要確認", inventory: "チェック項目", results: "検出結果",
    boxes: (count: number) => `${count} 件の検出`,
    checked: (found: number, count: number) => `${count} 項目中 ${found} 件を検出`,
    noBoxes: "この条件での検出はありません。",
    customReady: "写真を解析するには、上のボタンを押してください。",
  },
  en: {
    textTitle: "Search inside the image", packingTitle: "Try the packing checklist",
    sampleSearch: "Example searches", search: "What to look for in English", searchAction: "Find objects", packingAction: "Check the photo",
    confidence: "Minimum detection score", source: "Choose a photo", desk: ["Desk A", "Desk B"],
    photo: "Sample photo", customImage: "Choose your photo", resetImage: "Return to sample",
    sample: "Saved OWLv2 detections", local: "OWL-ViT · in-browser inference",
    load: "Preparing model", infer: "Analyzing photo", failed: "Inference could not start. Try again in a moment.",
    fileError: "Choose a JPEG, PNG, or WebP up to 12 MB.",
    dataSize: "Custom queries or photos download about 155 MB of model data on first use. The photo is processed in your browser.",
    found: "Detected", review: "Verify", inventory: "Checklist", results: "Detections",
    boxes: (count: number) => `${count} ${count === 1 ? "detection" : "detections"}`,
    checked: (found: number, count: number) => `${found} of ${count} items detected`,
    noBoxes: "No detections at this setting.",
    customReady: "Choose Check the photo or Find objects above to analyze your photo.",
  },
};

type Upload = { file: File; url: string };

export default function VisionDetectionLive({ locale, demoId }: { locale: "ja" | "en"; demoId: string }) {
  const packing = demoId === "10-packing-check";
  const t = translations[locale];
  const id = useId();
  const [draft, setDraft] = useState("a cat");
  const [query, setQuery] = useState("a cat");
  const [desk, setDesk] = useState<typeof desks[number]>("desk-a");
  const [checked, setChecked] = useState(packingItems);
  const [threshold, setThreshold] = useState(packing ? 0.32 : 0.30);
  const [upload, setUpload] = useState<Upload | null>(null);
  const [inference, setInference] = useState<VisionDetectionBox[] | null>(null);
  const [pending, setPending] = useState(false);
  const [download, setDownload] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [animation, setAnimation] = useState(0);
  const requestId = useRef(0);
  const picker = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (upload) return () => URL.revokeObjectURL(upload.url);
  }, [upload]);
  useEffect(() => () => { requestId.current++; }, []);

  const photo = upload?.url ?? `${imageRoot}/${packing ? deskImage[desk] : "desk-cats.jpg"}`;
  const textBoxes = Object.hasOwn(samples.text, query) ? samples.text[query] : [];
  const sampleBoxes = packing ? samples.packing[desk] : textBoxes;
  const sourceBoxes = inference ?? (upload ? [] : sampleBoxes);
  const visible = sourceBoxes.filter((box) => box.score >= threshold && (!packing || checked.includes(box.label)));
  const byItem = new Map<string, CachedDetection>();
  for (const box of visible) {
    if (!byItem.has(box.label)) byItem.set(box.label, box);
  }
  const boxes = packing ? [...byItem.values()] : visible;
  const label = (name: string) => locale === "ja" && Object.hasOwn(textLabels, name) ? textLabels[name] : name.replace(/^a /, "");

  function cancelInference() {
    requestId.current++;
    setPending(false);
    setDownload(null);
    setInference(null);
    setError("");
  }

  function useSample() {
    cancelInference();
    setUpload(null);
    if (picker.current) picker.current.value = "";
    if (!packing && !Object.hasOwn(samples.text, query)) {
      setDraft("a cat");
      setQuery("a cat");
    }
    setThreshold(packing ? 0.32 : 0.30);
    setAnimation((count) => count + 1);
  }

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 12_000_000) {
      setError(t.fileError);
      event.target.value = "";
      return;
    }
    cancelInference();
    setUpload({ file, url: URL.createObjectURL(file) });
  }

  async function search(input = draft) {
    const currentQuery = input.trim().replace(/\s+/g, " ").toLowerCase();
    if (!packing && !currentQuery) return;
    if (!packing) {
      setDraft(input);
      setQuery(currentQuery);
    }
    setAnimation((count) => count + 1);
    cancelInference();
    if (!upload && (packing || Object.hasOwn(samples.text, currentQuery))) return;

    const request = requestId.current;
    setPending(true);
    try {
      const result = await runVisionDetection(upload?.file ?? photo, packing ? packingItems : [currentQuery], (value) => {
        if (request === requestId.current) setDownload(value);
      });
      if (request === requestId.current) {
        setInference(result);
        setThreshold(packing ? 0.32 : 0.10);
        setAnimation((count) => count + 1);
      }
    } catch {
      if (request === requestId.current) setError(t.failed);
    } finally {
      if (request === requestId.current) setPending(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void search();
  }

  const waitingForOwnPhoto = upload && !pending && !inference;
  const countText = packing ? t.checked(boxes.length, checked.length) : t.boxes(boxes.length);
  const status = pending
    ? download === null ? t.infer : `${t.load} ${Math.floor(download)}%`
    : waitingForOwnPhoto ? t.customReady : countText;

  return (
    <section className={styles.instrument} aria-label={packing ? t.packingTitle : t.textTitle}>
      <div className={styles.header}>
        <span className={styles.heading}>{packing ? t.packingTitle : t.textTitle}</span>
        <span className={styles.model}><i />{pending || inference || upload ? t.local : t.sample}</span>
      </div>
      <div className={styles.workbench}>
        <div className={styles.controls}>
          <form onSubmit={onSubmit} className={styles.form}>
            {!packing && (
              <label htmlFor={`${id}-query`} className={styles.controlLabel}>
                {t.search}
                <input id={`${id}-query`} autoComplete="off" maxLength={120} value={draft} onChange={(event) => setDraft(event.target.value)} />
              </label>
            )}
            <button className={styles.run} type="submit" disabled={pending || (!packing && !draft.trim())}>
              {packing ? t.packingAction : t.searchAction}<span aria-hidden="true">↗</span>
            </button>
          </form>

          {!packing ? (
            <fieldset className={styles.fieldset}>
              <legend>{t.sampleSearch}</legend>
              <div className={styles.chips}>
                {Object.keys(samples.text).map((prompt) => (
                  <button key={prompt} disabled={pending} type="button" aria-pressed={query === prompt} onClick={() => { void search(prompt); }}>
                    {label(prompt)}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : (
            <fieldset className={styles.fieldset}>
              <legend>{t.source}</legend>
              <div className={styles.chips}>
                {desks.map((item, index) => (
                  <button key={item} type="button" aria-pressed={!upload && desk === item} onClick={() => { setDesk(item); useSample(); }}>
                    {t.desk[index]}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <label className={styles.controlLabel} htmlFor={`${id}-threshold`}>
            <span className={styles.scoreLabel}>{t.confidence}<output>{threshold.toFixed(2)}</output></span>
            <input id={`${id}-threshold`} type="range" min="0.05" max="0.95" step="0.01" value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} />
          </label>

          <div className={styles.upload}>
            <label className={styles.uploadLabel}>
              {t.customImage}
              <input ref={picker} type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} />
            </label>
            {upload && <button type="button" onClick={useSample} className={styles.reset}>{t.resetImage}</button>}
            <p>{t.dataSize}</p>
          </div>
          {error && <p role="alert" className={styles.error}>{error}</p>}
        </div>

        <div className={styles.display}>
          <figure className={styles.stage}>
            <div className={styles.photograph}>
              {/* The source can be a local object URL and needs its intrinsic aspect ratio for the overlay. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt={upload?.file.name ?? (packing ? t.desk[desks.indexOf(desk)] : t.photo)} />
              <div className={styles.overlay} aria-hidden="true" key={animation}>
                {!pending && boxes.map(({ box, label: name, score }, index) => (
                  <div className={styles.box} key={`${name}-${index}`} style={{
                    left: `${box[0] * 100}%`, top: `${box[1] * 100}%`, width: `${(box[2] - box[0]) * 100}%`, height: `${(box[3] - box[1]) * 100}%`,
                    "--box-delay": `${Math.min(index, 5) * 45}ms`,
                  } as CSSProperties}>
                    <span>{label(name)} {score.toFixed(2)}</span>
                  </div>
                ))}
                <div className={styles.scan} data-pending={pending} />
              </div>
            </div>
          </figure>
          <div className={styles.readout} aria-live="polite" aria-atomic="true">
            <span className={styles.readoutDot} aria-hidden="true" />{status}
          </div>
          {packing && (
            <fieldset className={styles.inventory}>
              <legend>{t.inventory}</legend>
              {packingItems.map((name) => {
                const match = byItem.get(name);
                const enabled = checked.includes(name);
                return (
                  <label className={styles.item} key={name}>
                    <input type="checkbox" checked={enabled} onChange={() => setChecked((items) => enabled ? items.filter((item) => item !== name) : [...items, name])} />
                    <span>{label(name)}</span>
                    {enabled && !pending && !waitingForOwnPhoto && <small data-found={Boolean(match)}>{match ? `${t.found} ${match.score.toFixed(2)}` : t.review}</small>}
                  </label>
                );
              })}
            </fieldset>
          )}
          {!packing && !pending && !waitingForOwnPhoto && (
            <ul className={styles.results} aria-label={t.results}>
              {boxes.length === 0 ? <li>{t.noBoxes}</li> : boxes.map((box, index) => (
                <li key={`${box.label}-${index}`}>{label(box.label)}<b>{box.score.toFixed(2)}</b></li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
