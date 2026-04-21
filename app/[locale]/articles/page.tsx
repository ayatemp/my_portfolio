import Link from "next/link";
import { getArticles } from "@/lib/articles";
import type { Metadata } from "next";
import { getDictionary, normalizeLocale } from "@/lib/getDictionary";
import { lp } from "@/lib/localePath";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = normalizeLocale(localeParam);
  const dict = await getDictionary(locale);
  return {
    title: dict.articles.title,
    description: dict.articles.description,
  };
}

export default async function ArticlesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = normalizeLocale(localeParam);
  const dict = await getDictionary(locale);
  const t = dict.articles;
  const articles = await getArticles();

  return (
    <div className="min-h-screen pt-24 sm:pt-32 pb-16 sm:pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-10">
        {/* Header */}
        <div className="mb-16 animate-on-load stagger-1">
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-accent-cyan block mb-4">
            {t.eyebrow}
          </span>
          <h1 className="font-display font-bold text-display-lg text-text-primary mb-4">
            {t.title}
          </h1>
          <p className="font-display text-xl text-text-secondary leading-relaxed">
            {t.description}
          </p>
        </div>

        {/* Article list */}
        <div className="animate-on-load stagger-2">
          {articles.length === 0 ? (
            <p className="font-mono text-sm text-text-muted">{t.empty}</p>
          ) : (
            <div className="space-y-0">
              {articles.map((article, i) => (
                <Link
                  key={article.slug}
                  href={lp(locale, `/articles/${article.slug}`)}
                  className="group block border-b border-white/[0.06] hover:border-white/[0.12] transition-colors"
                >
                  <article className="py-8 flex gap-8">
                    <div className="font-mono text-xs text-text-muted pt-1 w-8 shrink-0 text-right">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-display text-2xl text-text-primary group-hover:text-accent-cyan transition-colors leading-snug mb-2">
                        {article.title}
                      </h2>
                      <p className="font-sans text-sm text-text-secondary leading-relaxed mb-4">
                        {article.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="font-mono text-[10px] text-text-muted">{article.date}</span>
                        <span className="w-px h-3 bg-white/10" />
                        <span className="font-mono text-[10px] text-text-muted">{article.readingTime}</span>
                        {article.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="font-mono text-[9px] tracking-wider uppercase border border-white/[0.08] text-text-muted px-2 py-0.5 rounded-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="self-center text-text-muted group-hover:text-accent-cyan group-hover:translate-x-1 transition-all shrink-0">
                      →
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
