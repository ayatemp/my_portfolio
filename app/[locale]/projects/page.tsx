import { getProjects } from "@/lib/projects";
import ProjectCard from "@/components/ProjectCard";
import type { Metadata } from "next";
import { getDictionary, normalizeLocale } from "@/lib/getDictionary";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = normalizeLocale(localeParam);
  const dict = await getDictionary(locale);
  return {
    title: dict.projects.title,
    description: dict.projects.description,
  };
}

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = normalizeLocale(localeParam);
  const dict = await getDictionary(locale);
  const t = dict.projects;
  const projects = await getProjects();

  return (
    <div className="min-h-screen pt-24 sm:pt-32 pb-16 sm:pb-24">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10">
        {/* Header */}
        <div className="mb-16 animate-on-load stagger-1">
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-accent-amber block mb-4">
            {t.eyebrow}
          </span>
          <h1 className="font-display font-bold text-display-lg text-text-primary mb-4">
            {t.title}
          </h1>
          <p className="font-display text-xl text-text-secondary leading-relaxed max-w-2xl">
            {t.description}
          </p>
        </div>

        {/* Projects grid */}
        {projects.length === 0 ? (
          <p className="font-mono text-sm text-text-muted">{t.empty}</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, i) => (
              <ProjectCard key={project.slug} project={project} index={i} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
