import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { normalizeLocale } from "@/lib/getDictionary";
import { getVisionDemos } from "@/lib/visionDemos";
import FeaturedPreview from "./FeaturedPreview";
import styles from "./products.module.css";

const copy = {
  ja: {
    description:
      "操作で軌跡がどう変わるか、画像から何を見つけられるか。条件を変えて、学習したモデルの出力を比べてみてください。",
    worldDescription: "操作と観測から、物体の動きや環境の次の状態を予測します。",
    visionDescription: "物体を見つけ、追跡し、どんな条件で見失うかを確かめます。",
    openDemo: "試す",
    liveInference: "ブラウザで推論",
    seeDemos: "デモを見る",
    demoList: "デモ一覧",
    selectAction: "自車の行動を選ぶ",
    sourceNote: "各デモでは事前に実行した学習・推論の結果を比較できます。",
  },
  en: {
    description:
      "How does an action change a trajectory? What can a model find in a photo? Change the conditions and compare the outputs yourself.",
    worldDescription: "Predict how objects and environments change as actions and observations vary.",
    visionDescription: "Find and track objects, and see which conditions make them harder to detect.",
    openDemo: "Try demo",
    liveInference: "Runs in your browser",
    seeDemos: "Explore demos",
    demoList: "Demo index",
    selectAction: "Choose an action for the ego vehicle",
    sourceNote: "The demos compare results from prior training and inference runs.",
  },
} as const;

type Params = { params: Promise<{ locale: string }> };
type Demo = ReturnType<typeof getVisionDemos>[number];

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const locale = normalizeLocale((await params).locale);
  return {
    title: "Products · Vision Lab",
    description: copy[locale].description,
  };
}

export default async function ProductsPage({ params }: Params) {
  const locale = normalizeLocale((await params).locale);
  const text = copy[locale];
  const demos = getVisionDemos(locale);
  const groups = [
    { id: "world", label: "World Models", description: text.worldDescription },
    { id: "vision", label: "Computer Vision", description: text.visionDescription },
  ] as const;
  const demoPath = `/${locale}/products/vision-lab`;
  const intersection = demos.find(({ id }) => id === "02-intersection");
  const textDetection = demos.find(({ id }) => id === "06-text-detection");

  return (
    <div className={styles.page}>
      <div className={styles.sheet}>
        <div className={styles.wrap}>
          <header className={styles.hero}>
            <div className={styles.heroCopy}>
              <p className={styles.kicker}>Products</p>
              <h1>Vision <em>Lab.</em></h1>
              <p className={styles.intro}>{text.description}</p>
              <a className={styles.heroLink} href="#demos">
                {text.seeDemos}
                <span aria-hidden="true">↓</span>
              </a>
            </div>

            {intersection && textDetection && (
              <FeaturedPreview
                demoHref={`${demoPath}/${intersection.id}`}
                demoTitle={intersection.title}
                scenarios={intersection.cases.map((scenario) => ({
                  name: scenario.name,
                  image: `/products/vision-lab/${intersection.id}/${scenario.image}`,
                }))}
                initialScenario={Math.min(1, intersection.cases.length - 1)}
                conditionLabel={text.selectAction}
                photo={{
                  href: `${demoPath}/${textDetection.id}`,
                  title: textDetection.title,
                  image: textDetection.preview,
                }}
              />
            )}
          </header>

          <nav id="demos" className={styles.demoIndex} aria-label={text.demoList}>
            <span>{text.demoList}</span>
            <ul>
              {groups.map((group) => (
                <li key={group.id}>
                  <a href={`#${group.id}`}>
                    {group.label}
                    <span aria-hidden="true">↓</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {groups.map((group) => (
            <section key={group.id} id={group.id} className={styles.group} aria-labelledby={`${group.id}-title`}>
              <div className={styles.groupIntro}>
                <h2 id={`${group.id}-title`}>{group.label}</h2>
                <p>{group.description}</p>
              </div>
              <ul className={styles.cards}>
                {demos.filter((demo) => demo.group === group.id).map((demo) => (
                  <li key={demo.id}>
                    <DemoCard
                      demo={demo}
                      href={`${demoPath}/${demo.id}`}
                      actionLabel={text.openDemo}
                      modelLabel={demo.id === "04-maze-rollout" ? text.liveInference : demo.model}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <footer className={styles.footer}>{text.sourceNote}</footer>
        </div>
      </div>
    </div>
  );
}

function DemoCard({ demo, href, actionLabel, modelLabel }: {
  demo: Demo;
  href: string;
  actionLabel: string;
  modelLabel: string;
}) {
  return (
    <Link href={href} className={styles.card} aria-label={demo.title}>
      <div className={styles.thumb}>
        <Image
          src={demo.preview}
          alt=""
          sizes="(max-width: 540px) 100vw, (max-width: 870px) 50vw, 33vw"
          fill
          unoptimized
        />
      </div>
      <div className={styles.cardCopy}>
        <p className={styles.model}>{modelLabel}</p>
        <h3>{demo.title}</h3>
        <p className={styles.cardDesc}>{demo.description}</p>
        <span className={styles.cardLink} aria-hidden="true">
          {actionLabel} <span>↗</span>
        </span>
      </div>
    </Link>
  );
}
