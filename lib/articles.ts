import fs from "fs";
import path from "path";
import matter from "gray-matter";

const articlesDir = path.join(process.cwd(), "content/articles");

export type Article = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  readingTime: string;
  content: string;
};

function estimateReadingTime(content: string): string {
  const words = content.split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

export async function getArticles(): Promise<Article[]> {
  if (!fs.existsSync(articlesDir)) return [];

  const files = fs
    .readdirSync(articlesDir)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));

  const articles = files.map((filename) => {
    const slug = filename.replace(/\.mdx?$/, "");
    const raw = fs.readFileSync(path.join(articlesDir, filename), "utf-8");
    const { data, content } = matter(raw);

    return {
      slug,
      title: data.title ?? slug,
      description: data.description ?? "",
      date: data.date ? new Date(data.date).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" }) : "",
      tags: data.tags ?? [],
      readingTime: estimateReadingTime(content),
      content,
    } satisfies Article;
  });

  return articles.sort((a, b) => {
    return b.date.localeCompare(a.date);
  });
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const articles = await getArticles();
  return articles.find((a) => a.slug === slug) ?? null;
}
