"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import styles from "./products.module.css";

type Scenario = {
  name: string;
  image: string;
};

export default function FeaturedPreview({
  demoHref,
  demoTitle,
  scenarios,
  initialScenario,
  conditionLabel,
  photo,
}: {
  demoHref: string;
  demoTitle: string;
  scenarios: Scenario[];
  initialScenario: number;
  conditionLabel: string;
  photo: { href: string; title: string; image: string };
}) {
  const [selectedIndex, setSelectedIndex] = useState(initialScenario);
  const selected = scenarios[selectedIndex];

  return (
    <div className={styles.preview}>
      <figure className={styles.featureFigure}>
        <figcaption className={styles.featureCaption}>
          <Link href={demoHref}>
            <span className={styles.featureStatus} aria-hidden="true" />
            {demoTitle}
            <span className={styles.featureChevron} aria-hidden="true">↗</span>
          </Link>
        </figcaption>
        <div className={styles.featureImage} aria-live="polite" aria-atomic="true">
          <Image
            src={selected.image}
            alt={`${demoTitle} · ${selected.name}`}
            sizes="(max-width: 870px) 100vw, 44vw"
            fill
            priority
            unoptimized
          />
        </div>
        <div className={styles.featureControls} role="group" aria-label={conditionLabel}>
          {scenarios.map((scenario, index) => (
            <button
              type="button"
              key={scenario.image}
              aria-pressed={selectedIndex === index}
              onClick={() => setSelectedIndex(index)}
            >
              {scenario.name}
            </button>
          ))}
        </div>
      </figure>

      <Link className={styles.photoPeek} href={photo.href}>
        <span className={styles.peekImage}>
          <Image
            src={photo.image}
            alt=""
            sizes="170px"
            fill
            unoptimized
          />
        </span>
        <span className={styles.peekCaption}>
          {photo.title}
          <span aria-hidden="true">↗</span>
        </span>
      </Link>
    </div>
  );
}
