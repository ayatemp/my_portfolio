import { notFound } from "next/navigation";
import Link from "next/link";
import { getProjectBySlug, getProjects } from "@/lib/projects";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import type { Metadata } from "next";
import { getDictionary, type Locale } from "@/lib/getDictionary";
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
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return {};
  return { title: project.title, description: project.description };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const dict = await getDictionary(locale);
  const t = dict.projects;
  const htmlContent = await markdownToHtml(project.content);

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
        <div className="relative border border-white/[0.08] rounded-xl bg-bg-surface overflow-hidden p-10">
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #FFD580 30%, transparent)" }} />

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
