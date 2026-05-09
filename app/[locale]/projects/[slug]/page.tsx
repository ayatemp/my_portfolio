import { notFound } from "next/navigation";
import Link from "next/link";
import { getProjectBySlug, getProjects } from "@/lib/projects";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import type { Metadata } from "next";
import { getDictionary, normalizeLocale } from "@/lib/getDictionary";
import { lp } from "@/lib/localePath";

async function markdownToHtml(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);
  return result.toString();
}

export async function generateStaticParams() {
  const projects = await getProjects();
  return ["ja", "en"].flatMap((locale) =>
    projects.map((p) => ({ locale, slug: p.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return {};
  return { title: project.title, description: project.description };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: localeParam, slug } = await params;
  const locale = normalizeLocale(localeParam);
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const dict = await getDictionary(locale);
  const t = dict.projects;
  const htmlContent = await markdownToHtml(project.content);
  const isSpotlight = project.spotlight;
  const spotlightLabel = locale === "ja" ? "優秀ポスター賞級プロジェクト" : "Flagship Project";
  const spotlightCopy =
    locale === "ja"
      ? "今いちばん自信のある研究ツールとして、設計・実装・配布まで磨き込んだ作品です。"
      : "A polished research tool I am especially confident in, from product design to desktop distribution.";

  return (
    <div className="min-h-screen pt-32 pb-24">
      {/* Back */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 mb-12">
        <Link href={lp(locale, "/projects")} className="inline-flex items-center gap-2 font-mono text-xs text-text-muted hover:text-accent-amber transition-colors">
          {t.back}
        </Link>
      </div>

      {/* Hero panel */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 mb-16 animate-on-load stagger-1">
        <div
          className={`relative rounded-xl bg-bg-surface overflow-hidden p-10 ${
            isSpotlight
              ? "border border-accent-amber/35 shadow-[0_0_0_1px_rgba(255,213,128,0.08),0_32px_100px_rgba(255,213,128,0.10)]"
              : "border border-white/[0.08]"
          }`}
        >
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #FFD580 30%, transparent)" }} />
          {isSpotlight ? (
            <>
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-accent-amber/[0.08] to-transparent" />
              <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-accent-amber/70 via-white/10 to-transparent" />
              <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-accent-cyan/50 via-white/10 to-transparent" />
            </>
          ) : null}

          {isSpotlight ? (
            <div className="relative mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <span className="inline-flex w-fit items-center rounded-sm border border-accent-amber/40 bg-accent-amber/10 px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-accent-amber">
                {spotlightLabel}
              </span>
              <span className="font-mono text-[10px] leading-5 text-text-muted">
                {spotlightCopy}
              </span>
            </div>
          ) : null}

          <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-accent-amber/70 mb-4">
            {project.category}
          </div>

          <h1 className="font-display font-bold text-display-md text-text-primary leading-tight mb-4">
            {project.title}
          </h1>

          <p className="font-display text-xl text-text-secondary leading-relaxed mb-8 max-w-2xl">
            {project.description}
          </p>

          <div className="flex flex-wrap gap-2 mb-8">
            {project.stack.map((tech) => (
              <span
                key={tech}
                className="font-mono text-[10px] tracking-wider border border-accent-amber/20 text-accent-amber/70 px-3 py-1.5 rounded-sm"
              >
                {tech}
              </span>
            ))}
          </div>

          {project.links && project.links.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {project.links.map(({ label, url }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-white/10 text-text-secondary font-mono text-xs tracking-wider rounded-sm hover:border-accent-amber/30 hover:text-accent-amber transition-all"
                >
                  {label} ↗
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 md:px-10 animate-on-load stagger-2">
        <div className="prose-custom" dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </article>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-10 mt-20 pt-8 border-t border-white/[0.06]">
        <Link href={lp(locale, "/projects")} className="inline-flex items-center gap-2 font-mono text-xs text-text-muted hover:text-accent-amber transition-colors">
          {t.back_full}
        </Link>
      </div>
    </div>
  );
}
