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
      "車を動かす、物体を追跡する、写真から探す。操作を変えて、モデルが何を予測し、どこで外すのかを確かめる10本のデモ。",
    worldDescription: "操作と観測から、物体の動きや環境の次の状態を予測します。",
    visionDescription: "物体を見つけ、追跡し、どんな条件で見失うかを確かめます。",
    openDemo: "試す",
    seeDemos: "デモを見る",
    demoList: "デモ一覧",
    selectAction: "自車の行動を選ぶ",
  },
  en: {
    description:
      "Move a car, track an object, or search a photo. Ten interactive demos show how models respond to your choices and where their predictions go wrong.",
    worldDescription: "Predict how objects and environments change as actions and observations vary.",
    visionDescription: "Find and track objects, and see which conditions make them harder to detect.",
    openDemo: "Try demo",
    seeDemos: "Explore demos",
    demoList: "Demo index",
    selectAction: "Choose an action for the ego vehicle",
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
                locale={locale}
                demoHref={`${demoPath}/${intersection.id}`}
                demoTitle={intersection.title}
                scenarios={intersection.cases.map((scenario) => ({
                  name: scenario.name,
                }))}
                initialScenario={intersection.cases.length - 1}
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
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}

        </div>
      </div>
    </div>
  );
}

function DemoCard({ demo, href, actionLabel }: {
  demo: Demo;
  href: string;
  actionLabel: string;
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
        <p className={styles.model}>{demo.model}</p>
        <h3>{demo.title}</h3>
        <p className={styles.cardDesc}>{demo.description}</p>
        <span className={styles.cardLink} aria-hidden="true">
          {actionLabel} <span>↗</span>
        </span>
      </div>
    </Link>
  );
}
