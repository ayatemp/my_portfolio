"use client";

import { useId, useMemo, useState } from "react";
import model from "@/lib/vision-maze-model.json";
import { useWorldPlayback } from "@/lib/vision-world-playback";
import styles from "./VisionMazeLive.module.css";

const [FLOOR, WALL, KEY, DOOR, GOAL] = [0, 1, 2, 3, 4];
const DIRECTIONS = { U: [-1, 0], D: [1, 0], L: [0, -1], R: [0, 1] } as const;
type Direction = keyof typeof DIRECTIONS;
type Position = [number, number];
type MazeState = { board: number[][]; location: Position; hasKey: boolean; blocked: boolean };
const ACTIONS = Object.keys(DIRECTIONS) as Direction[];
const BUTTONS: Array<[Direction, string]> = [["L", "←"], ["U", "↑"], ["D", "↓"], ["R", "→"]];
const ROUTES = ["DDRRRRRRR", "RRRDDRRRR", "RRRRRRR"];
const MAX_STEPS = 50;
const BLACK = [0, 0, 0];

const copy = {
  ja: {
    title: "自由にルートを試す",
    description: "移動を入力すると、学習済みモデルがこのブラウザで次の状態を順に予測します。",
    route: "移動ルート",
    examples: "ルートの例",
    presets: ["鍵を取る", "鍵を取らない", "壁に向かう"],
    run: "予測する",
    play: "再生",
    pause: "一時停止",
    timeline: "手順",
    learned: "学習モデル",
    simulator: "シミュレータ",
    key: "鍵あり",
    noKey: "鍵なし",
    blocked: "移動できない",
    goal: "ゴール到達",
    start: "スタート",
    tileLegend: "K 鍵 · D 扉 · G ゴール",
    step: (current: number, total: number) => `${current} / ${total} 手`,
    status: (count: number, step: number) => count === 0 ? `${step} 手まで一致` : `${step} 手までに ${count} 回の不一致`,
    direction: { U: "上", D: "下", L: "左", R: "右" },
  },
  en: {
    title: "Try your own route",
    description: "Enter a sequence of moves to run the trained model step by step in your browser.",
    route: "Route",
    examples: "Example routes",
    presets: ["Collect the key", "Skip the key", "Test a wall"],
    run: "Run prediction",
    play: "Play",
    pause: "Pause",
    timeline: "Timeline",
    learned: "Learned model",
    simulator: "Simulator",
    key: "Key collected",
    noKey: "No key",
    blocked: "Move blocked",
    goal: "Goal reached",
    start: "Start",
    tileLegend: "K Key · D Door · G Goal",
    step: (current: number, total: number) => `${current} / ${total} moves`,
    status: (count: number, step: number) => count === 0 ? `Matches through move ${step}` : `${count} differences through move ${step}`,
    direction: { U: "Up", D: "Down", L: "Left", R: "Right" },
  },
};

function predict(tile: number, hasKey: boolean, action: Direction) {
  // Same egocentric observation as visual_features in the training script.
  const features = [...model.palette[tile], ...(hasKey ? model.palette[KEY] : BLACK), ACTIONS.indexOf(action)];
  let node = model.nodes[0];
  while (Array.isArray(node)) {
    const [feature, threshold, left, right] = node;
    node = model.nodes[features[feature] <= threshold ? left : right];
  }
  return node;
}

function rollout(route: string, learned: boolean): MazeState[] {
  let location: Position = [model.start[0], model.start[1]];
  let hasKey = false;
  const board = model.board.map((row) => [...row]);
  const history = [{ board: model.board, location, hasKey, blocked: false }];

  for (const action of route as Iterable<Direction>) {
    const [dy, dx] = DIRECTIONS[action];
    const row = location[0] + dy;
    const column = location[1] + dx;
    const tile = board[row][column];
    let entered: boolean;
    let nextTile: number;
    if (learned) {
      const outcome = predict(tile, hasKey, action);
      entered = outcome >= 10;
      hasKey = outcome % 10 >= 5;
      nextTile = outcome % 5;
    } else {
      entered = tile !== WALL && (tile !== DOOR || hasKey);
      hasKey = hasKey || tile === KEY;
      nextTile = entered && (tile === KEY || tile === DOOR) ? FLOOR : tile;
    }
    board[row][column] = nextTile;
    if (entered) location = [row, column];
    history.push({ board: board.map((line) => [...line]), location, hasKey, blocked: !entered });
  }

  return history;
}

function MazeBoard({
  title,
  history,
  step,
  labels,
}: {
  title: string;
  history: MazeState[];
  step: number;
  labels: (typeof copy)["en" | "ja"];
}) {
  const state = history[step];
  const [playerRow, playerColumn] = state.location;
  const reached = state.board[playerRow][playerColumn] === GOAL;
  const visited = new Set(history.slice(0, step).map(({ location }) => location.join(",")));

  return (
    <figure className={styles.boardPanel}>
      <figcaption>{title}</figcaption>
      <div className={styles.board} aria-hidden="true">
        {state.board.flatMap((tiles, row) => tiles.map((tile, column) => {
          const key = `${row},${column}`;
          const player = row === playerRow && column === playerColumn;
          return (
            <span
              key={key}
              data-tile={tile}
              data-visited={visited.has(key)}
              className={styles.tile}
            >
              {tile === KEY && "K"}
              {tile === DOOR && "D"}
              {tile === GOAL && !player && "G"}
            </span>
          );
        }))}
        <span
          className={styles.player}
          data-blocked={state.blocked}
          style={{ left: `${10 * (playerColumn + 0.5)}%`, top: `${100 * (playerRow + 0.5) / state.board.length}%` }}
        />
      </div>
      <div className={styles.boardState}>
        <span>{state.hasKey ? labels.key : labels.noKey}</span>
        {state.blocked && <span className={styles.blocked}>{labels.blocked}</span>}
        {reached && <span className={styles.reached}>{labels.goal}</span>}
      </div>
    </figure>
  );
}

export default function VisionMazeLive({ locale }: { locale: "ja" | "en" }) {
  const id = useId();
  const t = copy[locale];
  const [draft, setDraft] = useState(ROUTES[0]);
  const [route, setRoute] = useState(ROUTES[0]);
  const playback = useWorldPlayback(Math.max(0.5, route.length * 0.42));
  const step = Math.floor(playback.progress * route.length);
  const predicted = useMemo(() => rollout(route, true), [route]);
  const actual = useMemo(() => rollout(route, false), [route]);
  const differences = predicted.slice(1, step + 1).filter((state, index) => {
    const other = actual[index + 1];
    return state.hasKey !== other.hasKey || state.blocked !== other.blocked ||
      state.location.some((coordinate, axis) => coordinate !== other.location[axis]);
  }).length;

  function run(input: string) {
    setDraft(input);
    setRoute(input);
    playback.replay(input.length > 0 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  return (
    <section className={styles.live} aria-labelledby={`${id}-title`}>
      <header className={styles.header}>
        <h2 id={`${id}-title`}>{t.title}</h2>
        <p>{t.description}</p>
      </header>
      <form className={styles.form} onSubmit={(event) => { event.preventDefault(); run(draft); }}>
        <div className={styles.field}>
          <label htmlFor={`${id}-route`}>{t.route}</label>
          <input
            id={`${id}-route`}
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value.toUpperCase().replace(/[^UDLR]/g, "").slice(0, MAX_STEPS))}
            maxLength={MAX_STEPS}
            placeholder="UDLR"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <div className={styles.directions}>
          {BUTTONS.map(([direction, arrow]) => (
            <button
              type="button"
              key={direction}
              aria-label={`${t.direction[direction]} (${direction})`}
              onClick={() => setDraft((previous) => (previous + direction).slice(0, MAX_STEPS))}
              disabled={draft.length >= MAX_STEPS}
            >
              {arrow}
            </button>
          ))}
        </div>
        <button type="submit" className={styles.run}>{t.run}</button>
      </form>
      <div className={styles.presets} aria-label={t.examples}>
        {ROUTES.map((preset, index) => (
          <button type="button" key={preset} onClick={() => run(preset)}>{t.presets[index]}</button>
        ))}
      </div>
      <div className={styles.timeline}>
        <div className={styles.timelineHeader}>
          <button type="button" className={styles.control} onClick={playback.pauseOrPlay} disabled={route.length === 0}>
            {playback.playing ? t.pause : t.play}
          </button>
          <label htmlFor={`${id}-step`}>{t.timeline}</label>
          <output htmlFor={`${id}-step`} aria-live="off">
            {t.step(step, route.length)} · {step === 0 ? t.start : t.direction[route[step - 1] as Direction]}
          </output>
        </div>
        <input
          id={`${id}-step`}
          type="range"
          min={0}
          max={route.length}
          value={step}
          onChange={(event) => playback.seek(Number(event.target.value) / route.length)}
          disabled={route.length === 0}
        />
      </div>
      <div className={styles.boards} ref={playback.viewport}>
        <MazeBoard title={t.learned} history={predicted} step={step} labels={t} />
        <MazeBoard title={t.simulator} history={actual} step={step} labels={t} />
      </div>
      <footer className={styles.footer}>
        <span>{t.tileLegend}</span>
        <span role="status" aria-live={playback.playing ? "off" : "polite"}>{t.status(differences, step)}</span>
      </footer>
    </section>
  );
}
