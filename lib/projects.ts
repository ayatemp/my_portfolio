import fs from "fs";
import path from "path";
import matter from "gray-matter";

const projectsDir = path.join(process.cwd(), "content/projects");

export type Project = {
  slug: string;
  title: string;
  description: string;
  category: string;
  stack: string[];
  date: string;
  featured: boolean;
  content: string;
  links?: { label: string; url: string }[];
};

export async function getProjects(): Promise<Project[]> {
  if (!fs.existsSync(projectsDir)) return [];

  const files = fs
    .readdirSync(projectsDir)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));

  const projects = files.map((filename) => {
    const slug = filename.replace(/\.mdx?$/, "");
    const raw = fs.readFileSync(path.join(projectsDir, filename), "utf-8");
    const { data, content } = matter(raw);

    return {
      slug,
      title: data.title ?? slug,
      description: data.description ?? "",
      category: data.category ?? "Project",
      stack: data.stack ?? [],
      date: data.date ?? "",
      featured: data.featured ?? false,
      content,
      links: data.links ?? [],
    } satisfies Project;
  });

  return projects.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const projects = await getProjects();
  return projects.find((p) => p.slug === slug) ?? null;
}
