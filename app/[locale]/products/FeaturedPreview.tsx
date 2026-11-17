"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import intersection from "@/lib/vision-intersection-preview.json";
import styles from "./products.module.css";

const duration = 2.5;
const stepTime = .25;
const margin = 96;
const scale = 107;

function coordinates(value: number, vehicle: number) {
  return vehicle === 0
    ? [244 - .12 * scale, 187 - value * scale]
    : [244 + value * scale, 187 - .12 * scale];
}

function getPosition(points: number[][], vehicle: number, time: number) {
  const frame = time / stepTime;
  const from = Math.floor(frame);
  const end = Math.min(from + 1, points.length - 1);
  const value = points[from][vehicle] + (points[end][vehicle] - points[from][vehicle]) * (frame - from);
  return coordinates(value, vehicle);
}

function path(points: number[][], vehicle: number, frame: number) {
  const current = points.slice(0, Math.floor(frame / stepTime) + 1)
    .map((point) => coordinates(point[vehicle], vehicle));
  return [...current, getPosition(points, vehicle, frame)].map((point) => point.join(",")).join(" ");
}

export default function FeaturedPreview({
  locale,
  demoHref,
  demoTitle,
  scenarios,
  initialScenario,
  conditionLabel,
  photo,
}: {
  locale: "ja" | "en";
  demoHref: string;
  demoTitle: string;
  scenarios: { name: string }[];
  initialScenario: number;
  conditionLabel: string;
  photo: { href: string; title: string; image: string };
}) {
  const japanese = locale === "ja";
  const [selectedIndex, setSelectedIndex] = useState(initialScenario);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(true);
  const timeRef = useRef(0);
  const figure = useRef<HTMLElement>(null);
  const selected = intersection[selectedIndex];

  function seek(value: number) {
    timeRef.current = value;
    setTime(value);
  }

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!reduced.matches) setPlaying(true);
    const onChange = () => { if (reduced.matches) setPlaying(false); };
    reduced.addEventListener("change", onChange);
    return () => reduced.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!figure.current) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(figure.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || !visible) return;
    let animation = 0;
    let previous: number | null = null;
    const play = (now: number) => {
      if (previous !== null && !document.hidden) {
        const next = (timeRef.current + Math.min(now - previous, 50) / 1200) % (duration + .8);
        seek(next);
      }
      previous = now;
      animation = requestAnimationFrame(play);
    };
    animation = requestAnimationFrame(play);
    return () => cancelAnimationFrame(animation);
  }, [playing, visible]);

  const visibleTime = Math.min(time, duration);

  return (
    <div className={styles.preview}>
      <figure className={styles.featureFigure} ref={figure}>
        <figcaption className={styles.featureCaption}>
          <Link href={demoHref}>
            <span className={styles.featureStatus} aria-hidden="true" />
            {demoTitle}
            <span className={styles.featureChevron}>3D <span aria-hidden="true">↗</span></span>
          </Link>
        </figcaption>
        <div className={styles.featureImage}>
          <svg viewBox="0 0 488 310" role="img" aria-label={japanese ? "交差点での自車と交差車両の軌跡" : "The paths of two cars through the intersection"}>
            <defs>
              <pattern id="intersection-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 H 0 V 24" fill="none" stroke="#30423c" strokeWidth=".7"/>
              </pattern>
            </defs>
            <rect width="488" height="310" fill="#14231f" />
            <rect width="488" height="310" fill="url(#intersection-grid)" />
            <path d="M207 0H281V151H488V224H281V310H207V224H0V151H207Z" fill="#263830" stroke="#516759" strokeWidth=".8"/>
            <path d="M244 6V145M244 230V305M5 187H201M285 187H481" stroke="#819488" strokeWidth=".9" strokeDasharray="9 10"/>
            <path d="M209 235H242M176 154V185" stroke="#a5ba9d" strokeWidth="1.2"/>
            <circle cx="244" cy="187" r={margin / 2} stroke="#677963" fill="none" strokeDasharray="1 5" opacity=".55"/>
            {["#c9f882", "#fbb979"].map((color, vehicle) => {
              const [x, y] = getPosition(selected.actual, vehicle, visibleTime);
              const [px, py] = getPosition(selected.predicted, vehicle, visibleTime);
              return (
                <g key={color}>
                  <polyline points={path(selected.actual, vehicle, duration)} fill="none" stroke={color} strokeWidth="1" opacity=".18" />
                  <polyline points={path(selected.actual, vehicle, visibleTime)} fill="none" stroke={color} strokeWidth="2.2" opacity=".7" />
                  <polyline points={path(selected.predicted, vehicle, visibleTime)} transform={vehicle === 0 ? "translate(9 0)" : "translate(0 9)"} fill="none" stroke={color} strokeWidth="1.2" strokeDasharray="3 4" />
                  <rect x={x - 7} y={y - 11} width="14" height="22" rx="3" fill={color} transform={`rotate(${vehicle === 0 ? 0 : 90} ${x} ${y})`} />
                  <rect x={x - 5} y={y - 5} width="10" height="5" rx="1.5" fill="#2d4133" transform={`rotate(${vehicle === 0 ? 0 : 90} ${x} ${y})`} />
                  <circle cx={px + (vehicle === 0 ? 9 : 0)} cy={py + (vehicle === 1 ? 9 : 0)} r="3" fill="#14231f" stroke={color} strokeWidth="1.5" />
                </g>
              );
            })}
          </svg>
          <div className={styles.featureLegend}>
            <span><i />{japanese ? "シミュレータ" : "Simulator"}</span>
            <span><i />{japanese ? "モデル予測" : "Model forecast"}</span>
          </div>
        </div>
        <div className={styles.featureTimeline}>
          <button type="button" onClick={() => setPlaying((value) => !value)} aria-label={playing ? (japanese ? "一時停止" : "Pause") : (japanese ? "再生" : "Play")}>
            {playing ? "Ⅱ" : "▶"}
          </button>
          <input type="range" min="0" max={duration} step=".01" value={visibleTime} aria-label={japanese ? "再生位置" : "Playback position"} onChange={(event) => { setPlaying(false); seek(Number(event.target.value)); }} />
          <span>{visibleTime.toFixed(1)} s</span>
        </div>
        <div className={styles.featureControls} role="group" aria-label={conditionLabel}>
          {scenarios.map((scenario, index) => (
            <button type="button" key={scenario.name} aria-pressed={selectedIndex === index} onClick={() => {
              const animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
              setSelectedIndex(index);
              seek(animate ? 0 : duration);
              setPlaying(animate);
            }}>
              {scenario.name}
            </button>
          ))}
        </div>
      </figure>

      <Link className={styles.photoPeek} href={photo.href}>
        <span className={styles.peekImage}>
          <Image src={photo.image} alt="" sizes="170px" fill unoptimized />
        </span>
        <span className={styles.peekCaption}>
          {photo.title}
          <span aria-hidden="true">↗</span>
        </span>
      </Link>
    </div>
  );
}
