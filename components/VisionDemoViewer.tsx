"use client";

import { useId, useState } from "react";
import styles from "./VisionDemoViewer.module.css";

type DemoCase = {
  name: string;
  detail: string;
  image: string;
  poster?: string;
};

type ViewerProps = {
  locale: "ja" | "en";
  demoId: string;
  cases: DemoCase[];
  label: string;
  baselineLabel: string;
};

const copy = {
  ja: {
    sample: "実行済みのモデル出力",
    compare: "2条件を比較",
    reset: "リセット",
    condition: "比較先",
    original: "原寸で開く",
  },
  en: {
    sample: "Precomputed model outputs",
    compare: "Compare cases",
    reset: "Reset",
    condition: "Comparison",
    original: "Open full size",
  },
};

function DemoResult({
  demoCase,
  mediaRoot,
  side,
  sideLabel,
  openLabel,
}: {
  demoCase: DemoCase;
  mediaRoot: string;
  side?: "A" | "B";
  sideLabel?: string;
  openLabel: string;
}) {
  const media = `${mediaRoot}/${demoCase.image}`;
  const isVideo = /\.(mp4|webm)$/i.test(demoCase.image);

  return (
    <figure className={styles.result}>
      <div className={styles.resultHeader}>
        <p className={styles.resultTitle}>
          {side && <span className={styles.side} data-side={side} title={sideLabel}>{side}</span>}
          {demoCase.name}
        </p>
        <a className={styles.open} href={media} target="_blank" rel="noreferrer">
          {openLabel} <span aria-hidden="true">↗</span>
        </a>
      </div>
      <div key={media} className={styles.media}>
        {isVideo ? (
          <video
            src={media}
            poster={demoCase.poster ? `${mediaRoot}/${demoCase.poster}` : undefined}
            aria-label={demoCase.name}
            controls
            muted
            playsInline
            preload="none"
          />
        ) : (
          // The media are complete, locally generated diagrams, or photos with model annotations.
          // Render every pixel without cropping or resizing through the image optimizer.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media} alt={demoCase.name} decoding="async" loading="lazy" />
        )}
      </div>
      <figcaption aria-live="polite" className={styles.caption}>{demoCase.detail}</figcaption>
    </figure>
  );
}

export default function VisionDemoViewer({ locale, demoId, cases, label, baselineLabel }: ViewerProps) {
  const [active, setActive] = useState(0);
  const [baseline, setBaseline] = useState(0);
  const [comparing, setComparing] = useState(false);
  const groupId = useId();
  const t = copy[locale];
  const mediaRoot = `/products/vision-lab/${demoId}`;

  if (cases.length === 0) return null;

  function selectActive(index: number) {
    if (comparing && baseline === index) setBaseline(active);
    setActive(index);
  }

  function selectBaseline(index: number) {
    if (active === index) setActive(baseline);
    setBaseline(index);
  }

  function toggleComparison() {
    if (!comparing && active === baseline) setActive(active === 0 ? 1 : 0);
    setComparing(!comparing);
  }

  function reset() {
    setActive(0);
    setBaseline(0);
    setComparing(false);
  }

  return (
    <section className={styles.viewer} aria-label={label}>
      <header className={styles.toolbar}>
        <p className={styles.sample}>{t.sample}</p>
        {cases.length > 1 && (
          <div className={styles.toolbarActions}>
            <button
              type="button"
              className={styles.reset}
              onClick={reset}
              disabled={active === 0 && baseline === 0 && !comparing}
            >
              {t.reset}
            </button>
            <button
              type="button"
              className={styles.compare}
              onClick={toggleComparison}
              aria-pressed={comparing}
            >
              <span className={styles.compareIcon} aria-hidden="true" />
              {t.compare}
            </button>
          </div>
        )}
      </header>
      <div className={styles.body}>
        <div className={styles.controls}>
          <fieldset className={styles.options}>
            <legend>{comparing ? `B · ${t.condition}` : label}</legend>
            {cases.map((demoCase, index) => (
              <label key={demoCase.image} className={styles.option}>
                <input
                  type="radio"
                  name={groupId}
                  checked={index === active}
                  onChange={() => selectActive(index)}
                />
                <span className={styles.optionBody}>
                  <span className={styles.mark} aria-hidden="true" />
                  <span>{demoCase.name}</span>
                </span>
              </label>
            ))}
          </fieldset>
          {comparing && (
            <div className={styles.baseline}>
              <label htmlFor={`${groupId}-baseline`}>A · {baselineLabel}</label>
              <select
                id={`${groupId}-baseline`}
                value={baseline}
                onChange={(event) => selectBaseline(Number(event.target.value))}
              >
                {cases.map((demoCase, index) => (
                  <option key={demoCase.image} value={index}>{demoCase.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className={styles.resultArea}>
          <div className={comparing ? styles.comparisonResults : styles.results}>
            {comparing && (
              <DemoResult
                key="baseline"
                demoCase={cases[baseline]}
                mediaRoot={mediaRoot}
                side="A"
                sideLabel={baselineLabel}
                openLabel={t.original}
              />
            )}
            <DemoResult
              key="active"
              demoCase={cases[active]}
              mediaRoot={mediaRoot}
              side={comparing ? "B" : undefined}
              sideLabel={comparing ? t.condition : undefined}
              openLabel={t.original}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
