"use client";

import { type KeyboardEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";
import {
  ACESFilmicToneMapping,
  Color,
  Material,
  Mesh,
  PCFShadowMap,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import type { WorldSceneBuilder, WorldSceneSample, WorldSceneSide } from "@/lib/world3d-types";
import styles from "./VisionWorld3DStage.module.css";

type Locale = "ja" | "en";
type Mode = "compare" | WorldSceneSide;
type CameraPosition = { azimuth: number; polar: number; zoom: number; panX: number; panZ: number };
type Pointer = { x: number; y: number };
type Viewport = { x: number; y: number; width: number; height: number };
type SceneView = {
  side: WorldSceneSide;
  scene: Scene;
  camera: PerspectiveCamera;
  content: ReturnType<WorldSceneBuilder>;
  element: HTMLElement;
  viewport: Viewport;
};
type CameraPreset = "perspective" | "overhead" | "low";

const orbitStep = Math.PI / 9;
const fieldOfView = 36;
const stageBackground = new Color("#101e1a");

const defaultPosition: CameraPosition = { azimuth: Math.PI / 4, polar: .63, zoom: 1, panX: 0, panZ: 0 };
const presets: Record<CameraPreset, CameraPosition> = {
  perspective: defaultPosition,
  overhead: { ...defaultPosition, azimuth: 0, polar: .012 },
  low: { ...defaultPosition, azimuth: .9, polar: 1.26, zoom: 1.12 },
};

const labels = {
  ja: {
    stage: "3D比較",
    model: "学習モデルの予測",
    simulator: "シミュレータ",
    camera: "カメラ",
    perspective: "斜め",
    overhead: "真上",
    low: "低い視点",
    rotateLeft: "左へ回す",
    rotateRight: "右へ回す",
    zoomOut: "縮小",
    zoomIn: "拡大",
    reset: "カメラをリセット",
    drag: "ドラッグで回転、Shift＋ドラッグで移動、選択後にホイールで拡大・縮小",
    touch: "指1本で回転、2本で移動・拡大・縮小",
    keyboard: "矢印キーで回転、＋／−で拡大・縮小、0でリセット。",
    starting: "3Dシーンを準備中",
    unavailable: "このブラウザでは3D表示を利用できません。",
    lost: "3D表示が中断しました。",
    azimuth: "方位",
    elevation: "仰角",
    zoom: "倍率",
  },
  en: {
    stage: "3D comparison",
    model: "Learned prediction",
    simulator: "Simulator",
    camera: "Camera",
    perspective: "Perspective",
    overhead: "Overhead",
    low: "Low angle",
    rotateLeft: "Orbit left",
    rotateRight: "Orbit right",
    zoomOut: "Zoom out",
    zoomIn: "Zoom in",
    reset: "Reset camera",
    drag: "Drag to orbit, Shift + drag to pan, and scroll to zoom after selecting the view",
    touch: "Drag with one finger to orbit, or use two to pan and zoom",
    keyboard: "Use the arrow keys to orbit, plus or minus to zoom, and 0 to reset.",
    starting: "Preparing the 3D scene",
    unavailable: "3D rendering is unavailable in this browser.",
    lost: "The 3D view was interrupted.",
    azimuth: "Azimuth",
    elevation: "Elevation",
    zoom: "Zoom",
  },
} as const;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function rotation(position: CameraPosition, azimuth: number, polar: number): CameraPosition {
  return {
    ...position,
    azimuth: position.azimuth + azimuth,
    polar: clamp(position.polar + polar, .012, 1.45),
  };
}

function zoom(position: CameraPosition, factor: number): CameraPosition {
  return { ...position, zoom: clamp(position.zoom * factor, .48, 2.55) };
}

function pan(position: CameraPosition, horizontal: number, vertical: number): CameraPosition {
  const sin = Math.sin(position.azimuth);
  const cos = Math.cos(position.azimuth);
  return {
    ...position,
    panX: clamp(position.panX - horizontal * cos - vertical * sin, -.65, .65),
    panZ: clamp(position.panZ + horizontal * sin - vertical * cos, -.65, .65),
  };
}

function setCamera(camera: PerspectiveCamera, view: SceneView, position: CameraPosition) {
  const { distance, target } = view.content;
  const aspect = view.viewport.width / view.viewport.height;
  const range = distance * position.zoom * Math.max(1, 1 / aspect);
  const height = Math.sin(position.polar) * range;

  camera.aspect = aspect;
  camera.position
    .set(Math.sin(position.azimuth) * height, Math.cos(position.polar) * range, Math.cos(position.azimuth) * height)
    .add(target);
  camera.position.x += distance * position.panX;
  camera.position.z += distance * position.panZ;
  camera.lookAt(target.x + distance * position.panX, target.y, target.z + distance * position.panZ);
  camera.updateProjectionMatrix();
}

function disposeScene(view: SceneView) {
  if (view.content.dispose) {
    view.content.dispose();
    view.scene.clear();
    return;
  }

  const geometries = new Set<Mesh["geometry"]>();
  const materials = new Set<Material>();
  view.scene.traverse((object) => {
    const drawable = object as Partial<Mesh>;
    if (drawable.geometry) geometries.add(drawable.geometry);
    if (Array.isArray(drawable.material)) drawable.material.forEach((material) => materials.add(material));
    else if (drawable.material) materials.add(drawable.material);
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  view.scene.clear();
}

function isVisible(side: WorldSceneSide, mode: Mode) {
  return mode === "compare" || mode === side;
}

export default function VisionWorld3DStage({
  locale,
  buildScene,
  sample,
  mode = "compare",
  fallback,
}: {
  locale: Locale;
  buildScene: WorldSceneBuilder;
  sample: WorldSceneSample;
  mode?: Mode;
  fallback?: ReactNode;
}) {
  const t = labels[locale];
  const helpId = useId();
  const frame = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const modelPane = useRef<HTMLDivElement>(null);
  const simulatorPane = useRef<HTMLDivElement>(null);
  const currentPosition = useRef<CameraPosition>(defaultPosition);
  const currentSample = useRef(sample);
  const currentMode = useRef(mode);
  const queue = useRef<() => void>(() => {});
  const measure = useRef<() => void>(() => {});
  const [position, setPosition] = useState<CameraPosition>(defaultPosition);
  const [preset, selectPreset] = useState<CameraPreset | null>("perspective");
  const [rendererStatus, setRendererStatus] = useState<"starting" | "available" | "unavailable" | "lost">("starting");

  function moveCamera(next: CameraPosition, nextPreset: CameraPreset | null = null) {
    currentPosition.current = next;
    setPosition(next);
    selectPreset(nextPreset);
    queue.current();
  }

  useEffect(() => {
    currentSample.current = sample;
    queue.current();
  }, [sample]);

  useEffect(() => {
    currentMode.current = mode;
    measure.current();
  }, [mode]);

  useEffect(() => {
    const host = frame.current;
    const surface = canvas.current;
    const modelElement = modelPane.current;
    const simulatorElement = simulatorPane.current;
    if (!host || !surface || !modelElement || !simulatorElement) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ canvas: surface, antialias: true, powerPreference: "high-performance" });
    } catch {
      setRendererStatus("unavailable");
      return;
    }
    renderer.setClearColor(stageBackground);
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFShadowMap;

    function createView(side: WorldSceneSide, element: HTMLElement): SceneView {
      const scene = new Scene();
      const content = buildScene(scene, side);
      return {
        side,
        scene,
        camera: new PerspectiveCamera(fieldOfView, 1, .05, Math.max(200, content.distance * 16)),
        content,
        element,
        viewport: { x: 0, y: 0, width: 0, height: 0 },
      };
    }

    const views = [createView("model", modelElement), createView("simulator", simulatorElement)];
    let width = 0;
    let height = 0;
    let pixelRatio = 0;
    let animation: number | null = null;
    let interrupted = false;
    let displayedSample: WorldSceneSample | null = null;

    function render() {
      animation = null;
      if (interrupted || width <= 0 || height <= 0) return;

      renderer.setScissorTest(false);
      renderer.clear();
      renderer.setScissorTest(true);
      const nextSample = currentSample.current;
      if (displayedSample !== nextSample) {
        views.forEach(({ content }) => content.update(nextSample));
        displayedSample = nextSample;
      }
      for (const view of views) {
        const { x, y, width: paneWidth, height: paneHeight } = view.viewport;
        if (!isVisible(view.side, currentMode.current) || paneWidth <= 0 || paneHeight <= 0) continue;
        setCamera(view.camera, view, currentPosition.current);
        renderer.setViewport(x, y, paneWidth, paneHeight);
        renderer.setScissor(x, y, paneWidth, paneHeight);
        renderer.render(view.scene, view.camera);
      }
    }

    function schedule() {
      if (animation === null) animation = requestAnimationFrame(render);
    }

    function resize() {
      if (!host) return;
      const bounds = host.getBoundingClientRect();
      const nextWidth = Math.round(bounds.width);
      const nextHeight = Math.round(bounds.height);
      const nextRatio = Math.min(window.devicePixelRatio || 1, 1.65);
      if (width !== nextWidth || height !== nextHeight || pixelRatio !== nextRatio) {
        width = nextWidth;
        height = nextHeight;
        pixelRatio = nextRatio;
        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(width, height, false);
      }

      // DOM rectangles start at the top. WebGL's scissor and viewport start at the bottom.
      views.forEach((view) => {
        const pane = view.element.getBoundingClientRect();
        const x = Math.round(pane.left - bounds.left);
        const top = Math.round(pane.top - bounds.top);
        const bottom = Math.round(pane.bottom - bounds.top);
        view.viewport = {
          x,
          y: height - bottom,
          width: Math.round(pane.right - bounds.left) - x,
          height: bottom - top,
        };
      });
      schedule();
    }

    const pointers = new Map<number, Pointer>();
    let gesture: "rotate" | "pan" = "rotate";

    function pointerDown(event: PointerEvent) {
      if (!surface || (event.pointerType === "mouse" && event.button > 2)) return;
      surface.focus({ preventScroll: true });
      surface.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      gesture = event.button !== 0 || event.shiftKey ? "pan" : "rotate";
      surface.dataset.dragging = "true";
    }

    function pointerMove(event: PointerEvent) {
      const previous = pointers.get(event.pointerId);
      if (!previous) return;
      const next = { x: event.clientX, y: event.clientY };
      const opposite = [...pointers].find(([id]) => id !== event.pointerId)?.[1];
      pointers.set(event.pointerId, next);

      const position = currentPosition.current;
      const dx = next.x - previous.x;
      const dy = next.y - previous.y;
      const visiblePane = views.find(({ side }) => isVisible(side, currentMode.current));
      const paneHeight = visiblePane?.viewport.height || height || 1;
      const sensitivity = .68 * position.zoom / paneHeight;

      if (opposite) {
        const previousDistance = Math.hypot(opposite.x - previous.x, opposite.y - previous.y);
        const nextDistance = Math.hypot(opposite.x - next.x, opposite.y - next.y);
        const transformed = pan(position, dx * sensitivity / 2, dy * sensitivity / 2);
        moveCamera(zoom(transformed, nextDistance > 4 ? previousDistance / nextDistance : 1));
      } else if (gesture === "pan" || event.shiftKey) {
        moveCamera(pan(position, dx * sensitivity, dy * sensitivity));
      } else {
        moveCamera(rotation(position, -dx * .007, -dy * .007));
      }
    }

    function pointerEnd(event: PointerEvent) {
      pointers.delete(event.pointerId);
      if (surface && !pointers.size) delete surface.dataset.dragging;
    }

    function wheel(event: WheelEvent) {
      if (surface !== document.activeElement) return;
      event.preventDefault();
      const multiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height : 1;
      moveCamera(zoom(currentPosition.current, Math.exp(clamp(event.deltaY * multiplier, -120, 120) * .0035)));
    }

    function suppressMenu(event: MouseEvent) {
      event.preventDefault();
    }

    function contextLost(event: Event) {
      event.preventDefault();
      interrupted = true;
      setRendererStatus("lost");
    }

    function contextRestored() {
      interrupted = false;
      setRendererStatus("available");
      resize();
    }

    queue.current = schedule;
    measure.current = resize;
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    window.addEventListener("resize", resize);
    surface.addEventListener("pointerdown", pointerDown);
    surface.addEventListener("pointermove", pointerMove);
    surface.addEventListener("pointerup", pointerEnd);
    surface.addEventListener("pointercancel", pointerEnd);
    surface.addEventListener("lostpointercapture", pointerEnd);
    surface.addEventListener("wheel", wheel, { passive: false });
    surface.addEventListener("contextmenu", suppressMenu);
    surface.addEventListener("webglcontextlost", contextLost);
    surface.addEventListener("webglcontextrestored", contextRestored);

    setRendererStatus("available");
    resize();

    return () => {
      queue.current = () => {};
      measure.current = () => {};
      if (animation !== null) cancelAnimationFrame(animation);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      surface.removeEventListener("pointerdown", pointerDown);
      surface.removeEventListener("pointermove", pointerMove);
      surface.removeEventListener("pointerup", pointerEnd);
      surface.removeEventListener("pointercancel", pointerEnd);
      surface.removeEventListener("lostpointercapture", pointerEnd);
      surface.removeEventListener("wheel", wheel);
      surface.removeEventListener("contextmenu", suppressMenu);
      surface.removeEventListener("webglcontextlost", contextLost);
      surface.removeEventListener("webglcontextrestored", contextRestored);
      views.forEach(disposeScene);
      renderer.dispose();
    };
  }, [buildScene]);

  function choosePreset(next: CameraPreset) {
    moveCamera(presets[next], next);
  }

  function onKeyDown(event: KeyboardEvent<HTMLCanvasElement>) {
    const current = currentPosition.current;
    let next: CameraPosition;
    switch (event.key) {
      case "ArrowLeft": next = rotation(current, -orbitStep, 0); break;
      case "ArrowRight": next = rotation(current, orbitStep, 0); break;
      case "ArrowUp": next = rotation(current, 0, -orbitStep / 2); break;
      case "ArrowDown": next = rotation(current, 0, orbitStep / 2); break;
      case "+":
      case "=": next = zoom(current, .86); break;
      case "-": next = zoom(current, 1 / .86); break;
      case "0":
        event.preventDefault();
        choosePreset("perspective");
        return;
      default: return;
    }
    event.preventDefault();
    moveCamera(next);
  }

  const showFallback = rendererStatus === "unavailable" || rendererStatus === "lost";
  const azimuth = Math.round(((position.azimuth * 180 / Math.PI) % 360 + 360) % 360);
  const elevation = Math.round(90 - position.polar * 180 / Math.PI);

  return (
    <section aria-label={t.stage} className={styles.stage} data-renderer={rendererStatus}>
      <div hidden={showFallback}>
        <div className={styles.toolbar}>
          <fieldset className={styles.presets}>
            <legend className={styles.srOnly}>{t.camera}</legend>
            {(["perspective", "overhead", "low"] as const).map((name) => (
              <button key={name} type="button" aria-pressed={preset === name}
                onClick={() => choosePreset(name)}>{t[name]}</button>
            ))}
          </fieldset>
          <div role="group" aria-label={t.camera} className={styles.actions}>
            <button type="button" aria-label={t.rotateLeft} title={t.rotateLeft}
              onClick={() => moveCamera(rotation(currentPosition.current, -orbitStep, 0))}>↶</button>
            <button type="button" aria-label={t.rotateRight} title={t.rotateRight}
              onClick={() => moveCamera(rotation(currentPosition.current, orbitStep, 0))}>↷</button>
            <button type="button" aria-label={t.zoomOut} title={t.zoomOut}
              onClick={() => moveCamera(zoom(currentPosition.current, 1 / .86))}>−</button>
            <button type="button" aria-label={t.zoomIn} title={t.zoomIn}
              onClick={() => moveCamera(zoom(currentPosition.current, .86))}>+</button>
            <button type="button" aria-label={t.reset} title={t.reset}
              onClick={() => choosePreset("perspective")}>⟲</button>
          </div>
        </div>
        <div className={styles.frame} data-mode={mode} ref={frame}>
          <canvas className={styles.canvas} ref={canvas} tabIndex={0}
            aria-label={t.stage} aria-describedby={helpId} onKeyDown={onKeyDown} />
          <div className={styles.pane} ref={modelPane} hidden={!isVisible("model", mode)}>
            <span className={styles.modelLabel}>{t.model}</span>
          </div>
          <div className={styles.pane} ref={simulatorPane} hidden={!isVisible("simulator", mode)}>
            <span className={styles.simulatorLabel}>{t.simulator}</span>
          </div>
          {rendererStatus === "starting" && <p className={styles.starting} role="status">{t.starting}</p>}
        </div>
        <div className={styles.footer} id={helpId}>
          <p><span className={styles.desktopHelp}>{t.drag}</span><span className={styles.touchHelp}>{t.touch}</span></p>
          <p className={styles.srOnly}>{t.keyboard}</p>
          <p className={styles.cameraReadout} aria-label={`${t.azimuth} ${azimuth}°, ${t.elevation} ${elevation}°, ${t.zoom} ${(1 / position.zoom).toFixed(2)}×`}>
            {azimuth}° / {elevation}° <span aria-hidden="true">·</span> {(1 / position.zoom).toFixed(2)}×
          </p>
        </div>
      </div>
      {showFallback && (
        <div className={styles.fallback}>
          <p role="status">{rendererStatus === "lost" ? t.lost : t.unavailable}</p>
          {fallback}
        </div>
      )}
    </section>
  );
}
