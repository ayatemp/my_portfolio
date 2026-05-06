"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Project } from "@/lib/projects";
import type { Locale } from "@/lib/getDictionary";
import { lp } from "@/lib/localePath";

type Props = {
  projects: Project[];
  locale: Locale;
};

type ProjectSignal = {
  project: Project;
  x: number;
  y: number;
  signals: {
    research: number;
    llm: number;
    product: number;
    validation: number;
  };
  thesis: {
    ja: string;
    en: string;
  };
};

const thesisBySlug: Record<string, ProjectSignal["thesis"]> = {
  "codex-pdf-translator": {
    ja: "論文読解の詰まりを、PDF構造解析とLLM翻訳パイプラインでほどく研究支援ツール。",
    en: "A research-support tool that turns messy paper reading into a structured PDF parsing and LLM translation pipeline.",
  },
  "assisted-mindmap": {
    ja: "研究案やPoC仮説を、AI相談と視覚的な思考構造に戻して探索する発想支援アプリ。",
    en: "An ideation app that converts AI dialogue back into visual structure for research and PoC exploration.",
  },
  "resin-mi-demo": {
    ja: "公開ポリマーデータから、材料候補探索と物性予測を触れるWeb体験にしたMaterials Informaticsデモ。",
    en: "A Materials Informatics demo that makes polymer candidate ranking and property prediction explorable in the browser.",
  },
  "codex-game-lab": {
    ja: "生成AIのゲーム実装を、scaffold、build、test、repair loopまで含めて閉じるCLI実験。",
    en: "A CLI experiment that closes the loop from AI game scaffolding to build, test, and automated repair.",
  },
};

function scoreProject(project: Project): ProjectSignal {
  const text = [
    project.title,
    project.description,
    project.category,
    ...project.stack,
  ].join(" ").toLowerCase();

  const has = (...terms: string[]) => terms.some((term) => text.includes(term));
  const clamp = (value: number) => Math.min(96, Math.max(8, value));

  const research = clamp(
    28 +
      (has("research", "paper", "論文", "materials", "polymer", "active learning", "hci") ? 34 : 0) +
      (has("poc", "仮説", "mi", "informatics") ? 18 : 0)
  );
  const llm = clamp(
    16 +
      (has("llm", "openai", "codex", "gpt", "ai") ? 44 : 0) +
      (has("translator", "mindmap", "game") ? 12 : 0)
  );
  const product = clamp(
    24 +
      (has("web", "react", "next", "vite", "vercel", "expo") ? 32 : 0) +
      (has("cli", "tool", "demo", "app") ? 18 : 0)
  );
  const validation = clamp(
    18 +
      (has("test", "build", "repair", "ranking", "prediction", "predict", "検証", "予測") ? 38 : 0) +
      (has("pdf", "data", "csv", "model") ? 16 : 0)
  );

  return {
    project,
    x: clamp(product * 0.78 + validation * 0.22),
    y: clamp(research * 0.58 + llm * 0.42),
    signals: { research, llm, product, validation },
    thesis: thesisBySlug[project.slug] ?? {
      ja: "研究・実装・検証の距離を縮めるための実験的プロジェクト。",
      en: "An experimental project that shortens the distance between research, implementation, and validation.",
    },
  };
}

function signalLabel(key: keyof ProjectSignal["signals"], locale: Locale) {
  const labels = {
    research: locale === "ja" ? "Research fit" : "Research fit",
    llm: locale === "ja" ? "LLM leverage" : "LLM leverage",
    product: locale === "ja" ? "Product shape" : "Product shape",
    validation: locale === "ja" ? "Validation loop" : "Validation loop",
  };
  return labels[key];
}

export function ProjectIntelligenceMap({ projects, locale }: Props) {
  const signals = useMemo(() => projects.map(scoreProject), [projects]);
  const [selectedSlug, setSelectedSlug] = useState(signals[0]?.project.slug ?? "");
  const selected = signals.find((item) => item.project.slug === selectedSlug) ?? signals[0];

  if (!selected) return null;

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 py-16 sm:py-24 border-t border-white/[0.06]">
      <div className="grid lg:grid-cols-[0.92fr_1.08fr] gap-8 lg:gap-12 items-start">
        <div>
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-accent-cyan block mb-3">
            {locale === "ja" ? "ML Lens" : "ML Lens"}
          </span>
          <h2 className="font-display font-bold text-display-md text-text-primary">
            {locale === "ja" ? "Project Intelligence Map" : "Project Intelligence Map"}
          </h2>
          <p className="font-sans text-sm sm:text-base text-text-secondary leading-relaxed mt-5 max-w-xl">
            {locale === "ja"
              ? "プロジェクト説明と技術スタックから、研究性・LLM活用・プロダクト化・検証ループを簡易スコアリング。ポートフォリオを小さな特徴空間として探索できます。"
              : "Project descriptions and stacks are scored across research fit, LLM leverage, product shape, and validation loops, turning the portfolio into a small feature space."}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {Object.entries(selected.signals).map(([key, value]) => (
              <div key={key} className="border border-white/[0.08] rounded-lg bg-bg-surface/35 p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className="font-mono text-[9px] tracking-widest uppercase text-text-muted">
                    {signalLabel(key as keyof ProjectSignal["signals"], locale)}
                  </span>
                  <span className="font-mono text-xs text-accent-cyan">{value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent-cyan"
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-white/[0.08] rounded-lg bg-bg-surface/35 p-4 sm:p-6 overflow-hidden">
          <div className="relative aspect-[1.25/1] min-h-[320px] rounded-md border border-white/[0.06] bg-[#0D111B] overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.22]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(110,255,212,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(110,255,212,0.16) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
            />
            <div className="absolute left-4 top-4 font-mono text-[9px] tracking-widest uppercase text-text-muted">
              Research / LLM
            </div>
            <div className="absolute right-4 bottom-4 font-mono text-[9px] tracking-widest uppercase text-text-muted">
              Product / Validation
            </div>
            <div className="absolute left-8 right-8 top-1/2 h-px bg-white/[0.08]" />
            <div className="absolute top-8 bottom-8 left-1/2 w-px bg-white/[0.08]" />

            {signals.map((item) => {
              const active = item.project.slug === selected.project.slug;
              return (
                <button
                  key={item.project.slug}
                  type="button"
                  onClick={() => setSelectedSlug(item.project.slug)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group text-left"
                  style={{ left: `${item.x}%`, top: `${100 - item.y}%` }}
                  aria-label={item.project.title}
                >
                  <span
                    className={[
                      "block h-4 w-4 rounded-full border transition-all",
                      active
                        ? "bg-accent-cyan border-accent-cyan shadow-[0_0_22px_rgba(110,255,212,0.55)] scale-125"
                        : "bg-accent-amber/70 border-accent-amber/70 hover:scale-125",
                    ].join(" ")}
                  />
                  <span
                    className={[
                      "absolute left-5 top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[10px] tracking-wider transition-colors",
                      active ? "text-text-primary" : "text-text-muted group-hover:text-accent-amber",
                    ].join(" ")}
                  >
                    {item.project.title}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 grid md:grid-cols-[1fr_auto] gap-5 md:items-end">
            <div>
              <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-accent-cyan mb-2">
                {selected.project.category}
              </div>
              <h3 className="font-display text-2xl font-semibold text-text-primary">
                {selected.project.title}
              </h3>
              <p className="font-sans text-sm text-text-secondary leading-relaxed mt-3">
                {locale === "ja" ? selected.thesis.ja : selected.thesis.en}
              </p>
            </div>
            <Link
              href={lp(locale, `/projects/${selected.project.slug}`)}
              className="inline-flex items-center justify-center px-4 py-3 border border-accent-cyan/25 text-accent-cyan font-mono text-[10px] tracking-widest uppercase rounded-sm hover:bg-accent-cyan hover:text-bg-base transition-colors"
            >
              {locale === "ja" ? "Inspect project" : "Inspect project"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
