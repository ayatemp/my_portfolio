import type { Metadata } from "next";
import { getDictionary, type Locale } from "@/lib/getDictionary";

const papers = [
  {
    year: "2025",
    id: "crest",
    title: "CREST: 大規模言語モデルにおけるアイデア生成のための創造的残差ステアリング",
    titleEn: "CREST: Creative Residual Steering for Idea Generation in Large Language Models",
    area: "LLM / Creative AI",
    venue: "CREST Project",
    award: null,
    description:
      "大規模言語モデルの残差ストリームに対して創造的方向性を持つ潜在ベクトルを注入することで、アイデア生成の多様性と新規性を向上させる手法の提案。モデルの内部表現を活用した新しいステアリングアプローチ。",
    descriptionEn:
      "A method for improving the diversity and novelty of idea generation by injecting latent vectors with creative directionality into the residual stream of LLMs. A novel steering approach leveraging the model's internal representations.",
  },
  {
    year: "2023",
    id: "harts",
    title: "HARTS: 機械学習による人間拡張技術の操作取得時間短縮と性能最適化",
    titleEn: "HARTS: Human Augmentation with Rapid Training and Skill-optimization via machine learning",
    area: "HCI / Machine Learning",
    venue: "DPS Workshop 2023",
    award: "優秀ポスター賞",
    description:
      "人間拡張デバイス（外骨格・ハプティクス等）の操作習得コストを機械学習で削減するフレームワーク「HARTS」の提案。操作取得時間の短縮と性能最適化を両立する手法を実装し、DPSワークショップ2023にて優秀ポスター賞を受賞。",
    descriptionEn:
      "The HARTS framework for reducing the learning cost of human augmentation devices (exoskeletons, haptics, etc.) via machine learning. Implemented a method balancing training time reduction and performance optimization. Received the Best Poster Award at DPS Workshop 2023.",
  },
  {
    year: "2022",
    id: "massage",
    title: "自らの身体に対するロボットマッサージ操作における操作他者感の増大",
    titleEn: "Increasing Sense of Agency of Others during Robot-mediated Self-massage",
    area: "HCI / Haptics",
    venue: "修士研究 — 実世界通信研究室",
    award: null,
    description:
      "ロボットアームによる自己マッサージにおいて、操作者が「他者に操作されている」という感覚（他者感）を高めるインタラクション設計を研究。触覚フィードバックの遅延・変調が知覚に与える影響を実験的に検証。",
    descriptionEn:
      "Research into interaction design that increases the sense of being controlled by another person (sense of agency of others) during robot-arm self-massage. Experimentally verified how delays and modulations in haptic feedback affect perception.",
  },
];

const experiences = [
  {
    role: "AIモデルアルゴリズム改善 / PoC開発",
    roleEn: "AI Model Algorithm R&D / PoC Development",
    duration: "7ヶ月〜現在",
    description:
      "Active Learningを活用した独自アルゴリズムの構築と顧客への提供。画像認識モデルのラベリングコスト削減をPoC単位で受託。",
    descriptionEn:
      "Built proprietary Active Learning algorithms and delivered them to clients. Contract-based PoC work to reduce labeling costs for image recognition models.",
    tags: ["Active Learning", "Computer Vision", "PyTorch", "Python"],
  },
  {
    role: "NEDOプロジェクト — 触覚デバイス活用VRアプリ開発",
    roleEn: "NEDO Project — VR App with Haptic Device Integration",
    duration: "3ヶ月",
    description:
      "国家プロジェクトにおける触覚デバイスを活用したVRアプリケーションの設計・実装。C# / Unity を使用したリアルタイムハプティクス統合。",
    descriptionEn:
      "Designed and implemented a VR application with haptic device integration for a national project. Real-time haptics integration using C# / Unity.",
    tags: ["C# / Unity", "VR", "Haptics"],
  },
  {
    role: "ローカルLLM開発 / フィードバックシステム",
    roleEn: "Local LLM Development / Feedback System",
    duration: "3ヶ月",
    description:
      "オンプレミス環境でのLLMデプロイとフィードバック収集パイプラインの構築。モデルの応答品質を継続的に改善する評価インフラを設計。",
    descriptionEn:
      "On-premises LLM deployment and feedback collection pipeline. Designed evaluation infrastructure for continuously improving model response quality.",
    tags: ["LLM", "Python", "MLOps"],
  },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Research",
    description:
      locale === "ja"
        ? "青山学院大学大学院での研究 — HCI、人間拡張、LLM研究"
        : "Masters research at Aoyama Gakuin University — HCI, human augmentation, and LLM research.",
  };
}

const educationData = {
  ja: [
    {
      degree: "修士課程（在学中）",
      school: "青山学院大学大学院",
      dept: "理工学研究科 理工学専攻 知能情報コース",
      lab: "実世界通信研究室",
      period: "2024年4月〜現在",
    },
    {
      degree: "学士",
      school: "青山学院大学",
      dept: "理工学部 機械創造工学科",
      lab: null,
      period: "2024年3月 卒業",
    },
  ],
  en: [
    {
      degree: "Master's (in progress)",
      school: "Aoyama Gakuin University Graduate School",
      dept: "School of Science and Engineering — Intelligent Information",
      lab: "Real-World Communication Lab",
      period: "April 2024 – Present",
    },
    {
      degree: "Bachelor of Engineering",
      school: "Aoyama Gakuin University",
      dept: "School of Science and Engineering — Mechanical Engineering",
      lab: null,
      period: "Graduated March 2024",
    },
  ],
};

export default async function ResearchPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const t = dict.research;
  const education = educationData[locale];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 pt-28 sm:pt-32 pb-24">

      {/* ── HEADER ── */}
      <div className="mb-20">
        <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-accent-cyan block mb-4">
          {t.eyebrow}
        </span>
        <h1 className="font-display font-bold text-display-lg text-text-primary mb-6">
          {t.title}
        </h1>
        <p className="font-display text-xl text-text-secondary leading-relaxed max-w-2xl">
          {t.description}
        </p>
      </div>

      {/* ── EDUCATION ── */}
      <div className="mb-20 border-t border-white/[0.06] pt-16">
        <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-text-muted block mb-8">
          {t.education_label}
        </span>
        <div className="grid md:grid-cols-2 gap-4">
          {education.map((edu) => (
            <div
              key={edu.degree}
              className="border border-white/[0.08] rounded-lg bg-bg-surface/30 p-6"
            >
              <div className="font-mono text-[9px] tracking-widest uppercase text-accent-cyan mb-3">
                {edu.degree}
              </div>
              <div className="font-display text-xl text-text-primary mb-1">{edu.school}</div>
              <div className="font-sans text-sm text-text-secondary mb-1">{edu.dept}</div>
              {edu.lab && (
                <div className="font-mono text-xs text-accent-cyan/50 mb-3">{edu.lab}</div>
              )}
              <div className="font-mono text-[10px] text-text-muted">{edu.period}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PUBLICATIONS ── */}
      <div className="mb-20 border-t border-white/[0.06] pt-16">
        <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-text-muted block mb-8">
          {t.publications_label}
        </span>
        <div className="space-y-4">
          {papers.map((paper) => (
            <div
              key={paper.id}
              className="group border border-white/[0.08] rounded-lg bg-bg-surface/30 p-8 hover:border-accent-cyan/20 transition-all duration-300"
            >
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span className="font-mono text-sm text-accent-cyan">{paper.year}</span>
                <span className="font-mono text-[9px] tracking-wider uppercase border border-white/10 text-text-muted px-2 py-0.5 rounded-sm">
                  {paper.area}
                </span>
                {paper.award && (
                  <span className="font-mono text-[9px] tracking-wider uppercase border border-accent-amber/40 text-accent-amber px-2 py-0.5 rounded-sm">
                    ★ {paper.award}
                  </span>
                )}
              </div>

              <h3 className="font-display text-2xl text-text-primary mb-2 leading-tight">
                {locale === "ja" ? paper.title : paper.titleEn}
              </h3>
              <p className="font-mono text-xs text-text-muted mb-5">
                {locale === "ja" ? paper.titleEn : paper.title}
              </p>

              <p className="font-sans text-sm text-text-secondary leading-relaxed mb-4">
                {locale === "ja" ? paper.description : paper.descriptionEn}
              </p>

              <div className="flex items-center gap-2">
                <span className="w-3 h-px bg-accent-cyan/30" />
                <span className="font-mono text-[10px] text-text-muted">{paper.venue}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── INDUSTRY EXPERIENCE ── */}
      <div className="border-t border-white/[0.06] pt-16">
        <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-text-muted block mb-8">
          {t.experience_label}
        </span>
        <div className="space-y-px">
          {experiences.map((exp, i) => (
            <div key={i} className="flex gap-8 py-7 border-b border-white/[0.06]">
              <span className="font-mono text-xs text-text-muted w-24 shrink-0 pt-1">
                {exp.duration}
              </span>
              <div className="flex-1">
                <div className="font-display text-lg text-text-primary mb-2">
                  {locale === "ja" ? exp.role : exp.roleEn}
                </div>
                <p className="font-sans text-sm text-text-secondary leading-relaxed mb-3">
                  {locale === "ja" ? exp.description : exp.descriptionEn}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {exp.tags.map((tag) => (
                    <span
                      key={tag}
                      className="font-mono text-[9px] tracking-wider border border-white/[0.08] text-text-muted px-2 py-0.5 rounded-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
