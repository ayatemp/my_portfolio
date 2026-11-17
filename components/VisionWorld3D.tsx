"use client";

import dynamic from "next/dynamic";
import styles from "./VisionWorld3D.module.css";

const Experiment = dynamic(() => import("./VisionWorld3DExperiment"), {
  ssr: false,
  loading: () => <div className={styles.loading} aria-hidden="true" />,
});

export default function VisionWorld3D({ locale, demo }: {
  locale: "ja" | "en";
  demo: "block" | "intersection";
}) {
  return <Experiment locale={locale} demo={demo} />;
}
