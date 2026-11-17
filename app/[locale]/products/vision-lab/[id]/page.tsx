import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import VisionDemoViewer from "@/components/VisionDemoViewer";
import VisionMazeLive from "@/components/VisionMazeLive";
import { normalizeLocale } from "@/lib/getDictionary";
import { getVisionDemos } from "@/lib/visionDemos";
import credits from "@/lib/vision-demo-credits.json";
import styles from "./page.module.css";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

const groups = {
  ja: { world: "World Models", vision: "物体認識" },
  en: { world: "World Models", vision: "Computer Vision" },
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getVisionDemos("ja").map(({ id }) => ({ id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, locale: localeParam } = await params;
  const demo = getVisionDemos(normalizeLocale(localeParam)).find((item) => item.id === id);
  if (!demo) notFound();
  return { title: `${demo.title} | Vision Lab`, description: demo.description };
}

export default async function VisionDemoPage({ params }: PageProps) {
  const { id, locale: localeParam } = await params;
  const locale = normalizeLocale(localeParam);
  const isJa = locale === "ja";
  const demos = getVisionDemos(locale);
  const index = demos.findIndex((item) => item.id === id);
  if (index === -1) notFound();
  const demo = demos[index];
  const previous = demos[index - 1];
  const next = demos[index + 1];
  const catalog = `/${locale}/products`;
  const group = groups[locale][demo.group];
  const usesOwl = demo.model === "OWLv2";

  return (
    <div className={styles.frame}>
      <div className={styles.paper}>
        <div className={styles.inner}>
          <nav aria-label={isJa ? "パンくずリスト" : "Breadcrumb"} className={styles.breadcrumb}>
            <Link href={catalog}><span aria-hidden="true">←</span> Products</Link>
            <span aria-hidden="true">/</span>
            <span>Vision Lab</span>
          </nav>
          <header className={styles.heading}>
            <div>
              <p className={styles.group}><span aria-hidden="true" />{group}</p>
              <h1>{demo.title}</h1>
              <p className={styles.description}>{demo.description}</p>
            </div>
            <dl className={styles.specification}>
              <div><dt>{isJa ? "モデル" : "Model"}</dt><dd>{demo.model}</dd></div>
              <div><dt>{isJa ? "比較条件" : "Conditions"}</dt><dd>{demo.cases.length}</dd></div>
            </dl>
          </header>

          {id === "04-maze-rollout" && (
            <div className={styles.live}><VisionMazeLive locale={locale} /></div>
          )}

          <VisionDemoViewer
            key={demo.id}
            locale={locale}
            demoId={demo.id}
            cases={demo.cases}
            label={demo.control}
            baselineLabel={isJa ? "比較元" : "Reference"}
          />

          {usesOwl && (
            <details className={styles.credits}>
              <summary>{isJa ? "モデルと画像の出典" : "Model and image credits"}</summary>
              <p>{isJa
                ? "表示画像には検出枠やラベルを重ね、一部のケースでは切り抜き、明度調整、ぼけ、遮蔽を加えています。"
                : "The images are adapted with detection boxes and labels, and some cases use crops, brightness changes, blur or occlusion."}</p>
              <ul>
                {credits.map(({ label, href, credit, license, licenseHref }) => (
                  <li key={href}>
                    <a href={href} target="_blank" rel="noreferrer">{label}</a>
                    {credit && <> · {credit}</>}
                    {license && licenseHref && <> · <a href={licenseHref} target="_blank" rel="noreferrer">{license}</a></>}
                  </li>
                ))}
              </ul>
            </details>
          )}

          <nav className={styles.neighbors} aria-label={isJa ? "ほかのデモ" : "More demos"}>
            {previous ? (
              <Link href={`${catalog}/vision-lab/${previous.id}`}>
                <span><span aria-hidden="true">← </span>{isJa ? "前のデモ" : "Previous demo"}</span>
                <strong>{previous.title}</strong>
              </Link>
            ) : (
              <Link href={catalog}>
                <span><span aria-hidden="true">← </span>{isJa ? "一覧へ" : "Back to catalog"}</span>
                <strong>Vision Lab</strong>
              </Link>
            )}
            {next ? (
              <Link href={`${catalog}/vision-lab/${next.id}`}>
                <span>{isJa ? "次のデモ" : "Next demo"}<span aria-hidden="true"> →</span></span>
                <strong>{next.title}</strong>
              </Link>
            ) : (
              <Link href={catalog}>
                <span>{isJa ? "一覧へ" : "Back to catalog"}<span aria-hidden="true"> →</span></span>
                <strong>Vision Lab</strong>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}
