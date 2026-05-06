"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/lib/getDictionary";

type Props = {
  locale: Locale;
};

type LoopStep = {
  id: string;
  label: string;
  labelJa: string;
  title: string;
  titleJa: string;
  description: string;
  descriptionJa: string;
  vector: {
    ambiguity: number;
    prototype: number;
    evidence: number;
    delivery: number;
  };
  artifacts: string[];
  artifactsJa: string[];
};

const loopSteps: LoopStep[] = [
  {
    id: "read",
    label: "Read",
    labelJa: "Read",
    title: "Turn research ambiguity into usable questions.",
    titleJa: "研究の曖昧さを、使える問いに変換する。",
    description:
      "Papers, user needs, and domain constraints are compressed into assumptions that can be tested quickly.",
    descriptionJa:
      "論文、ユーザー課題、ドメイン制約を読み、短い検証で答えられる仮説に圧縮する。",
    vector: { ambiguity: 92, prototype: 18, evidence: 30, delivery: 12 },
    artifacts: ["paper notes", "failure modes", "evaluation question"],
    artifactsJa: ["論文メモ", "失敗パターン", "評価の問い"],
  },
  {
    id: "build",
    label: "Build",
    labelJa: "Build",
    title: "Make the idea touchable before it becomes expensive.",
    titleJa: "重くなる前に、触れるプロトタイプへ落とす。",
    description:
      "Small local tools and web demos turn model behavior into something that can be inspected by humans.",
    descriptionJa:
      "小さなローカルツールやWebデモで、モデルの振る舞いを人間が見て判断できる形にする。",
    vector: { ambiguity: 48, prototype: 88, evidence: 42, delivery: 38 },
    artifacts: ["CLI", "browser demo", "model wrapper"],
    artifactsJa: ["CLI", "ブラウザデモ", "モデルラッパー"],
  },
  {
    id: "measure",
    label: "Measure",
    labelJa: "Measure",
    title: "Add evidence loops, not just outputs.",
    titleJa: "出力だけでなく、証拠のループを足す。",
    description:
      "Ranking quality, build checks, repair passes, and visual QA make the system easier to trust and improve.",
    descriptionJa:
      "ランキング品質、build確認、repair pass、表示QAで、信頼して改善できる仕組みにする。",
    vector: { ambiguity: 30, prototype: 64, evidence: 90, delivery: 58 },
    artifacts: ["score trace", "smoke test", "repair log"],
    artifactsJa: ["スコア追跡", "smoke test", "修正ログ"],
  },
  {
    id: "ship",
    label: "Ship",
    labelJa: "Ship",
    title: "Package the experiment as a real interface.",
    titleJa: "実験を、実際に使えるインターフェースへまとめる。",
    description:
      "The useful part becomes a deployed app, a documented tool, or an article that another person can inspect.",
    descriptionJa:
      "有用だった部分を、デプロイ済みアプリ、README付きツール、記事として他者が見られる形にする。",
    vector: { ambiguity: 16, prototype: 66, evidence: 74, delivery: 94 },
    artifacts: ["Vercel app", "README", "technical article"],
    artifactsJa: ["Vercel app", "README", "技術記事"],
  },
];

const vectorLabels = {
  ambiguity: { ja: "Ambiguity", en: "Ambiguity" },
  prototype: { ja: "Prototype", en: "Prototype" },
  evidence: { ja: "Evidence", en: "Evidence" },
  delivery: { ja: "Delivery", en: "Delivery" },
};

export function ResearchShipLoop({ locale }: Props) {
  const [selectedId, setSelectedId] = useState(loopSteps[0].id);
  const selected = useMemo(
    () => loopSteps.find((step) => step.id === selectedId) ?? loopSteps[0],
    [selectedId]
  );
  const isJa = locale === "ja";

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 py-16 sm:py-24 border-t border-white/[0.06]">
      <div className="grid lg:grid-cols-[0.86fr_1.14fr] gap-8 lg:gap-12 items-start">
        <div>
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-accent-amber block mb-3">
            Research-to-Ship
          </span>
          <h2 className="font-display font-bold text-display-md text-text-primary">
            {isJa ? "Experiment Loop" : "Experiment Loop"}
          </h2>
          <p className="font-sans text-sm sm:text-base text-text-secondary leading-relaxed mt-5 max-w-xl">
            {isJa
              ? "論文や仮説を読み、触れるものにして、検証し、公開できる形まで運ぶ。MLプロジェクトで大事にしている一連の動きを小さな状態機械として表現しました。"
              : "A compact state machine for how I move ML ideas from papers and hypotheses into touchable, measurable, shipped artifacts."}
          </p>

          <div className="mt-8 grid grid-cols-4 gap-2">
            {loopSteps.map((step, index) => {
              const active = step.id === selected.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setSelectedId(step.id)}
                  className={[
                    "relative h-20 border rounded-sm bg-bg-surface/35 transition-all overflow-hidden",
                    active
                      ? "border-accent-amber/60 text-accent-amber"
                      : "border-white/[0.08] text-text-muted hover:border-white/[0.18] hover:text-text-primary",
                  ].join(" ")}
                >
                  <span className="absolute left-2 top-2 font-mono text-[9px] text-white/20">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="absolute inset-x-2 bottom-3 font-mono text-[10px] tracking-widest uppercase">
                    {isJa ? step.labelJa : step.label}
                  </span>
                  {active && (
                    <span className="absolute inset-x-0 bottom-0 h-px bg-accent-amber shadow-[0_0_16px_rgba(255,213,128,0.7)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border border-white/[0.08] rounded-lg bg-bg-surface/35 p-4 sm:p-6">
          <div className="grid md:grid-cols-[1fr_0.9fr] gap-6">
            <div className="min-h-[260px] rounded-md border border-white/[0.06] bg-[#0D111B] p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-accent-amber/70 mb-3">
                  {isJa ? selected.labelJa : selected.label}
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-semibold text-text-primary leading-tight">
                  {isJa ? selected.titleJa : selected.title}
                </h3>
                <p className="font-sans text-sm text-text-secondary leading-relaxed mt-4">
                  {isJa ? selected.descriptionJa : selected.description}
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {(isJa ? selected.artifactsJa : selected.artifacts).map((artifact) => (
                  <span
                    key={artifact}
                    className="font-mono text-[9px] tracking-wider uppercase border border-accent-amber/20 text-accent-amber/70 px-2 py-1 rounded-sm"
                  >
                    {artifact}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {Object.entries(selected.vector).map(([key, value]) => (
                <div key={key} className="border border-white/[0.08] rounded-lg bg-bg-base/25 p-4">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <span className="font-mono text-[9px] tracking-widest uppercase text-text-muted">
                      {vectorLabels[key as keyof typeof vectorLabels][isJa ? "ja" : "en"]}
                    </span>
                    <span className="font-mono text-xs text-accent-amber">{value}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent-amber"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
