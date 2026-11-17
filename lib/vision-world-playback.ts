"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useWorldPlayback(duration: number) {
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const cursor = useRef(0);
  const viewport = useRef<HTMLDivElement>(null);
  const interacted = useRef(false);

  const setCursor = useCallback((value: number) => {
    cursor.current = value;
    setProgress(value);
  }, []);

  useEffect(() => {
    const stage = viewport.current;
    if (!stage || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio < 0.12) return;
      if (!interacted.current) setPlaying(true);
      observer.disconnect();
    }, { threshold: 0.12 });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || duration <= 0) return;
    let previous: number | undefined;
    let frame: number;
    function tick(time: number) {
      const delta = previous === undefined ? 0 : (time - previous) / 1000;
      previous = time;
      const next = Math.min(1, cursor.current + delta / duration);
      setCursor(next);
      if (next < 1) frame = requestAnimationFrame(tick);
      else setPlaying(false);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, playing, setCursor]);

  function seek(value: number) {
    interacted.current = true;
    setPlaying(false);
    setCursor(value);
  }

  function replay(animate = true) {
    interacted.current = true;
    setCursor(0);
    setPlaying(animate && duration > 0);
  }

  function pauseOrPlay() {
    interacted.current = true;
    if (playing) {
      setPlaying(false);
    } else {
      if (cursor.current >= 1) setCursor(0);
      setPlaying(true);
    }
  }

  return { progress, playing, seek, replay, pauseOrPlay, viewport };
}
