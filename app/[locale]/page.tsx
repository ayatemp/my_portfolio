import Link from "next/link";
import { getArticles } from "@/lib/articles";
import { getProjects } from "@/lib/projects";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { getDictionary, type Locale } from "@/lib/getDictionary";
import { lp } from "@/lib/localePath";

const skills = [
  "Python", "Active Learning", "Computer Vision", "PyTorch",
  "C# / Unity", "React", "SQL", "LLM",
];

const researchPapers = [
  {
    year: "2025",
    title: "CREST: 大規模言語モデルにおけるアイデア生成のための創造的残差ステアリング",
    titleEn: "CREST: Creative Residual Steering for Idea Generation in LLMs",
    area: "LLM / Creative AI",
    context: "CREST Project",
    award: null,
  },
  {
    year: "2023",
    title: "HARTS: 機械学習による人間拡張技術の操作取得時間短縮と性能最適化",
    titleEn: "HARTS: Human Augmentation with Rapid Training and Skill-optimization",
    area: "HCI / Machine Learning",
    context: "DPS Workshop 2023",
    award: "優秀ポスター賞",
  },
  {
    year: "2022",
    title: "自らの身体に対するロボットマッサージ操作における操作他者感の増大",
    titleEn: "Increasing Sense of Agency of Others during Robot-mediated Self-massage",
    area: "HCI / Haptics",
    context: "修士研究",
    award: null,
  },
];

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const t = dict.home;

  const articles = (await getArticles()).slice(0, 3);
  const projects = (await getProjects()).slice(0, 3);

  return (
    <>
      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 -z-10">
          <div
            className="absolute w-[700px] h-[700px] rounded-full opacity-[0.12] animate-[meshDrift_12s_ease-in-out_infinite_alternate]"
            style={{
              background: "radial-gradient(circle, #6EFFD4 0%, transparent 70%)",
              top: "-20%",
              right: "-10%",
            }}
          />
          <div
            className="absolute w-[500px] h-[500px] rounded-full opacity-[0.08]"
            style={{
              background: "radial-gradient(circle, #FFD580 0%, transparent 70%)",
              bottom: "10%",
              left: "-5%",
              animation: "meshDrift 16s ease-in-out infinite alternate-reverse",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 pt-20 sm:pt-24 pb-12 sm:pb-16 w-full">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left: Text */}
            <div>
              <div className="animate-on-load stagger-1 flex items-center gap-3 mb-8">
                <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-accent-cyan">
                  {t.hero_tagline}
                </span>
                <span className="flex-1 h-px bg-accent-cyan/20" />
              </div>

              <h1
                className="animate-on-load stagger-2 font-display font-bold leading-none mb-6"
                style={{ fontSize: "clamp(3rem, 7vw, 6rem)", letterSpacing: "-0.03em" }}
              >
                {t.hero_h1_line1}<br />
                <em
                  className="not-italic text-transparent"
                  style={{ WebkitTextStroke: "1px rgba(240,237,230,0.4)" }}
                >
                  {t.hero_h1_line2}
                </em>
                <br />
                <span style={{ color: "#6EFFD4" }}>{t.hero_h1_line3}</span>
              </h1>

              <p className="animate-on-load stagger-3 font-display text-xl text-text-secondary leading-relaxed mb-10 max-w-lg">
                {t.hero_description}
              </p>

              <div className="animate-on-load stagger-4 flex flex-wrap gap-4">
                <Link
                  href={lp(locale, "/research")}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-accent-cyan text-bg-base font-mono text-xs tracking-wider uppercase font-medium rounded-sm hover:bg-accent-cyan/90 transition-colors"
                >
                  {t.cta_research}
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 7H13M7 1L13 7L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <Link
                  href={lp(locale, "/projects")}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-white/10 text-text-secondary font-mono text-xs tracking-wider uppercase rounded-sm hover:border-white/25 hover:text-text-primary transition-all"
                >
                  {t.cta_projects}
                </Link>
              </div>
            </div>

            {/* Right: Profile card */}
            <div className="animate-on-load stagger-5">
              <div className="border border-white/[0.08] rounded-lg bg-bg-surface/50 backdrop-blur-sm overflow-hidden">
                {/* Photo area */}
                <div className="relative h-72 bg-bg-elevated overflow-hidden">
                  <ProfilePhoto />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-surface/80 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Info */}
                <div className="p-6">
                  <div className="font-display text-xl font-semibold text-text-primary mb-0.5">
                    加来彩人
                  </div>
                  <div className="font-mono text-[9px] tracking-[0.15em] text-text-muted mb-3">
                    KAKU AYATO
                  </div>
                  <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-muted mb-1">
                    {t.profile_role}
                  </div>
                  <div className="font-display text-base text-text-secondary mb-4">
                    {t.profile_areas}
                  </div>

                  {/* Skill tags */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {skills.map((s) => (
                      <span
                        key={s}
                        className="font-mono text-[9px] tracking-wider border border-white/[0.08] text-text-muted px-2 py-0.5 rounded-sm"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/[0.06]">
                    {[
                      { num: "3", label: t.stats_papers },
                      { num: "7mo+", label: t.stats_industry },
                      { num: "1", label: t.stats_award },
                    ].map(({ num, label }) => (
                      <div key={label} className="text-center">
                        <div className="font-display text-2xl font-bold text-accent-cyan">{num}</div>
                        <div className="font-mono text-[9px] tracking-widest uppercase text-text-muted mt-0.5">
                          {label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-on-load stagger-5">
          <span className="font-mono text-[9px] tracking-widest uppercase text-text-muted">{t.scroll}</span>
          <div className="w-px h-12 bg-gradient-to-b from-white/20 to-transparent" />
        </div>
      </section>

      {/* ── MASTERS RESEARCH ───────────────────────────────── */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 py-16 sm:py-24 border-t border-white/[0.06]">
        <div className="flex items-end justify-between mb-10 sm:mb-12">
          <div>
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-accent-cyan block mb-3">
              {t.section_academic}
            </span>
            <h2 className="font-display font-bold text-display-md text-text-primary">
              {t.section_masters}
            </h2>
          </div>
          <Link
            href={lp(locale, "/research")}
            className="hidden md:inline-flex items-center gap-2 font-mono text-xs text-text-muted hover:text-accent-cyan transition-colors"
          >
            {t.full_details}
          </Link>
        </div>

        <div className="space-y-px">
          {researchPapers.map((paper, i) => (
            <Link key={i} href={lp(locale, "/research")} className="group block">
              <div className="flex items-center gap-3 sm:gap-6 py-5 sm:py-6 border-b border-white/[0.06] hover:border-white/[0.12] transition-colors">
                <span className="font-mono text-xs sm:text-sm text-accent-cyan/60 w-10 sm:w-12 shrink-0">
                  {paper.year}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 mb-1 flex-wrap">
                    <h3 className="font-display text-base sm:text-lg text-text-primary group-hover:text-accent-cyan transition-colors leading-snug">
                      {locale === "ja" ? paper.title : paper.titleEn}
                    </h3>
                    {paper.award && (
                      <span className="font-mono text-[9px] tracking-wider uppercase border border-accent-amber/40 text-accent-amber px-2 py-0.5 rounded-sm shrink-0">
                        ★ {paper.award}
                      </span>
                    )}
                  </div>
                  <p className="font-sans text-sm text-text-muted">{paper.context}</p>
                </div>
                <div className="hidden md:block shrink-0">
                  <span className="font-mono text-[9px] tracking-wider uppercase border border-white/10 text-text-muted px-2 py-1 rounded-sm">
                    {paper.area}
                  </span>
                </div>
                <span className="text-text-muted group-hover:text-accent-cyan group-hover:translate-x-1 transition-all">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 md:hidden">
          <Link href={lp(locale, "/research")} className="font-mono text-xs text-text-muted hover:text-accent-cyan transition-colors">
            {t.full_details}
          </Link>
        </div>
      </section>

      {/* ── RECENT ARTICLES ────────────────────────────────── */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 py-16 sm:py-24 border-t border-white/[0.06]">
        <div className="flex items-end justify-between mb-10 sm:mb-12">
          <div>
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-accent-cyan block mb-3">
              {t.section_writing}
            </span>
            <h2 className="font-display font-bold text-display-md text-text-primary">
              {t.section_articles}
            </h2>
          </div>
          <Link
            href={lp(locale, "/articles")}
            className="hidden md:inline-flex items-center gap-2 font-mono text-xs text-text-muted hover:text-accent-cyan transition-colors"
          >
            {t.all_articles}
          </Link>
        </div>

        <div className="space-y-px">
          {articles.map((article, i) => (
            <Link key={article.slug} href={lp(locale, `/articles/${article.slug}`)} className="group block">
              <div className="flex items-center gap-3 sm:gap-6 py-5 sm:py-6 border-b border-white/[0.06] hover:border-white/[0.12] transition-colors">
                <span className="font-mono text-[10px] text-text-muted w-6 text-right shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-display text-base sm:text-xl text-text-primary group-hover:text-accent-cyan transition-colors line-clamp-2 sm:truncate leading-snug">
                      {article.title}
                    </h3>
                  </div>
                  <p className="font-sans text-xs sm:text-sm text-text-muted line-clamp-1 sm:truncate">{article.description}</p>
                </div>
                <div className="hidden md:flex items-center gap-4 shrink-0">
                  {article.tags?.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="font-mono text-[9px] tracking-wider uppercase border border-white/10 text-text-muted px-2 py-1 rounded-sm"
                    >
                      {tag}
                    </span>
                  ))}
                  <span className="font-mono text-[10px] text-text-muted">{article.date}</span>
                </div>
                <span className="text-text-muted group-hover:text-accent-cyan group-hover:translate-x-1 transition-all">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 md:hidden">
          <Link href={lp(locale, "/articles")} className="font-mono text-xs text-text-muted hover:text-accent-cyan transition-colors">
            {t.all_articles}
          </Link>
        </div>
      </section>

      {/* ── FEATURED PROJECTS ──────────────────────────────── */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 py-16 sm:py-24 border-t border-white/[0.06]">
        <div className="flex items-end justify-between mb-10 sm:mb-12">
          <div>
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-accent-amber block mb-3">
              {t.section_work}
            </span>
            <h2 className="font-display font-bold text-display-md text-text-primary">
              {t.section_projects}
            </h2>
          </div>
          <Link
            href={lp(locale, "/projects")}
            className="hidden md:inline-flex items-center gap-2 font-mono text-xs text-text-muted hover:text-accent-amber transition-colors"
          >
            {t.all_projects}
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link key={project.slug} href={lp(locale, `/projects/${project.slug}`)} className="group block">
              <div className="relative h-64 border border-white/[0.08] rounded-lg bg-bg-surface overflow-hidden hover:border-accent-amber/30 transition-all duration-300">
                <div
                  className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: "linear-gradient(90deg, transparent, #FFD580, transparent)" }}
                />
                <div className="p-6 h-full flex flex-col justify-between">
                  <div>
                    <div className="font-mono text-[9px] tracking-widest uppercase text-accent-amber/70 mb-3">
                      {project.category}
                    </div>
                    <h3 className="font-display text-xl font-semibold text-text-primary group-hover:text-accent-amber transition-colors leading-tight">
                      {project.title}
                    </h3>
                    <p className="font-sans text-sm text-text-muted mt-2 leading-relaxed line-clamp-3">
                      {project.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {project.stack?.slice(0, 3).map((tech) => (
                      <span
                        key={tech}
                        className="font-mono text-[9px] tracking-wider border border-white/[0.08] text-text-muted px-2 py-0.5 rounded-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] mt-24">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 py-10 sm:py-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="font-display text-text-muted text-sm">
            {t.footer_built}
          </div>
          <div className="flex items-end gap-6">
            {/* QR Codes */}
            {[
              { src: "/github_qr.png", label: "GitHub", invert: true },
              { src: "/linkedin_qr.png", label: "LinkedIn", invert: false },
            ].map(({ src, label, invert }) => (
              <div key={label} className="group flex flex-col items-center gap-2">
                <div className="relative w-16 h-16 rounded-sm overflow-hidden border border-white/[0.08] group-hover:border-accent-cyan/40 transition-all duration-300 group-hover:scale-[1.08] group-hover:shadow-[0_0_16px_rgba(110,255,212,0.15)]">
                  <img
                    src={src}
                    alt={`${label} QR Code`}
                    className="w-full h-full object-cover"
                    style={invert ? { filter: "invert(1)" } : undefined}
                  />
                </div>
                <span className="font-mono text-[9px] tracking-widest uppercase text-text-muted group-hover:text-accent-cyan transition-colors">
                  {label}
                </span>
              </div>
            ))}

            {/* Divider */}
            <div className="w-px h-8 bg-white/[0.06] self-center" />

            {/* Zenn */}
            <a
              href="#"
              className="font-mono text-xs text-text-muted hover:text-accent-cyan transition-colors"
            >
              Zenn
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
