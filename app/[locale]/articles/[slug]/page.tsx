import { notFound } from "next/navigation";
import Link from "next/link";
import { getArticleBySlug, getArticles } from "@/lib/articles";
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
  const articles = await getArticles();
  return ["ja", "en"].flatMap((locale) =>
    articles.map((a) => ({ locale, slug: a.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.description,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const dict = await getDictionary(locale);
  const t = dict.articles;
  const htmlContent = await markdownToHtml(article.content);

  return (
    <div className="min-h-screen pt-32 pb-24">
      {/* Back link */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-10 mb-12">
        <Link
          href={lp(locale, "/articles")}
          className="inline-flex items-center gap-2 font-mono text-xs text-text-muted hover:text-accent-cyan transition-colors"
        >
          {t.back}
        </Link>
      </div>

      {/* Article header */}
      <header className="max-w-4xl mx-auto px-4 sm:px-6 md:px-10 mb-16 animate-on-load stagger-1">
        <div className="flex flex-wrap gap-2 mb-6">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="font-mono text-[9px] tracking-widest uppercase border border-accent-cyan/20 text-accent-cyan/70 px-2 py-1 rounded-sm"
            >
              {tag}
            </span>
          ))}
        </div>

        <h1 className="font-display font-bold text-display-lg text-text-primary leading-tight mb-6">
          {article.title}
        </h1>

        {article.description && (
          <p className="font-display text-xl text-text-secondary leading-relaxed mb-8">
            {article.description}
          </p>
        )}

        <div className="flex items-center gap-6 py-4 border-y border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-text-muted">{t.published}</span>
            <span className="font-mono text-[10px] text-accent-amber">{article.date}</span>
          </div>
          <span className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-text-muted">{article.readingTime}</span>
          </div>
        </div>
      </header>

      {/* Article body */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 md:px-10 animate-on-load stagger-2">
        <div
          className="prose-custom"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </article>

      {/* Footer nav */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-10 mt-20 pt-8 border-t border-white/[0.06]">
        <Link
          href={lp(locale, "/articles")}
          className="inline-flex items-center gap-2 font-mono text-xs text-text-muted hover:text-accent-cyan transition-colors"
        >
          {t.back_full}
        </Link>
      </div>
    </div>
  );
}
