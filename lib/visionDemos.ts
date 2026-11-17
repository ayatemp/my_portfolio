import type { Locale } from "@/lib/getDictionary";
import results from "@/lib/vision-demo-results.json";

export type VisionCase = {
  name: string;
  detail: string;
  image: string;
  poster?: string;
};

type RawCase = VisionCase & {
  count?: number;
  matches?: unknown[];
  metrics?: Record<string, number>;
};

type DemonstrationResult = {
  title: string;
  summary: string;
  cases: RawCase[];
};

type DemoInfo = {
  model: string;
  control: [string, string];
  title: string;
  description: string;
  descriptionJa?: string;
  names: string[];
  detail: (entry: RawCase, index: number) => string;
};

const info: Record<string, DemoInfo> = {
  "01-block-push": {
    model: "MLP regressor",
    control: ["押し方", "Push"],
    title: "How will the block move?",
    description: "Predict a block’s path and rotation from an overhead image and a push. Green shows the learned forecast and orange shows the simulator.",
    names: ["Push through the center", "Push an edge at an angle", "Push hard near the wall"],
    detail: (entry) => {
      const [rotation, error] = entry.detail.match(/[+-]?[\d.]+/g) ?? [];
      return `Predicted rotation ${rotation}°. The endpoint is off by ${error}% of the table width.`;
    },
  },
  "02-intersection": {
    model: "MLP regressor",
    control: ["自車の行動", "Ego vehicle action"],
    title: "One intersection, three futures",
    description: "Choose whether to stop, creep forward, or proceed and compare the two cars’ paths side by side in the learned model and the simulator.",
    descriptionJa: "停止・徐行・進行を選び、2台の車の動きを学習モデルとシミュレータで並べて比べます。",
    names: ["Stop", "Creep forward", "Proceed"],
    detail: (entry) => {
      const [, simulated, forecast, error] = entry.detail.match(/[\d.]+/g) ?? [];
      return `Compared with stopping, cross traffic travels ${simulated} scene units less in the simulator and ${forecast} units less in the model. Coordinate MAE is ${error}. Dashed paths are offset sideways for readability.`;
    },
  },
  "03-occlusion": {
    model: "MLP + Bayesian update",
    control: ["観測方法", "Viewpoint"],
    title: "Look behind the wall",
    description: "Forecast two possible paths from the frames before a ball disappears. A side view updates which path is more likely.",
    names: ["Wait", "Look from the side"],
    detail: (entry) => {
      const [, first, second, error] = entry.detail.match(/[\d.]+/g) ?? [];
      return `The two paths get ${first}% and ${second}% weight. The weighted endpoint is off by ${error} scene units. The white line shows what happened in the simulator.`;
    },
  },
  "04-maze-rollout": {
    model: "Decision tree",
    control: ["移動ルート", "Route"],
    title: "Rehearse a route through the maze",
    description: "Use local image patches and move commands to predict what happens at the key and door, one step at a time.",
    names: ["Collect the key first", "Head to the door without the key", "Try a shortcut through the wall"],
    detail: (entry) => {
      const route = entry.detail.match(/[UDLR]+/)?.[0];
      const mismatch = entry.detail.match(/\d+\/\d+/)?.[0];
      return `Route ${route}. The model predicts ${entry.detail.includes("未到達") ? "the goal stays out of reach" : "the goal is reached"}. Model and simulator disagree on ${mismatch} moves.`;
    },
  },
  "05-slip-stop": {
    model: "MLP regressor",
    control: ["床と試走回数", "Surface and trial count"],
    title: "Stop a robot on an unfamiliar floor",
    description: "Estimate how slippery the floor is from a few trial runs, then predict where braking will stop the robot at a different speed.",
    names: ["Slippery floor · 0 trials", "Slippery floor · 1 trial", "Slippery floor · 3 trials", "Grippy floor · 0 trials", "Grippy floor · 1 trial", "Grippy floor · 3 trials"],
    detail: (entry) => {
      const [predicted, simulated] = entry.detail.match(/[\d.]+/g) ?? [];
      return `The model predicts a stop at ${predicted} m. The robot stops at ${simulated} m in the simulator.`;
    },
  },
  "06-text-detection": {
    model: "OWLv2",
    control: ["検索語", "Text query"],
    title: "Find an object with words",
    description: "Change the English query to find objects in the sample or in a photo you choose.",
    descriptionJa: "英語の検索語を変えて、サンプル画像や自分の写真から物体を探します。",
    names: [],
    detail: (entry) => {
      const [count, threshold, ...scores] = entry.detail.match(/[\d.]+/g) ?? [];
      return `“${entry.name}” returns ${count} boxes at threshold ${threshold}.${scores.length ? ` Scores: ${scores.join(" / ")}.` : ""}`;
    },
  },
  "07-reference-search": {
    model: "OWLv2",
    control: ["見本画像", "Reference image"],
    title: "Find objects from a visual example",
    description: "Use a crop as the query. OWLv2 ranks candidate regions in a separate photo by visual similarity.",
    names: ["Laptop reference", "Computer mouse reference"],
    detail: (entry) => `Only the region in the yellow box on the left is passed as the reference. The photo on the right shows ${entry.matches?.length ?? 0} candidate regions ranked by the model.`,
  },
  "08-object-tracking": {
    model: "CNN + association",
    control: ["遮蔽と追跡方法", "Occlusion and tracking method"],
    title: "When do tracking IDs swap?",
    description: "Track toy cars with a CNN trained on synthetic images. Compare matching by the last seen position with matching by predicted motion.",
    names: ["Wall · last seen position", "Wall · motion prediction", "No wall · last seen position", "No wall · motion prediction"],
    detail: (entry) => {
      const [misses, switches, frames, test, iou] = entry.detail.match(/[\d.]+/g) ?? [];
      return `${frames} frames, ${misses} missed visible cars and ${switches} ID switches. Foreground IoU on ${test} held-out images: ${iou}.`;
    },
  },
  "09-detection-stress": {
    model: "OWLv2",
    control: ["画像の条件", "Image condition"],
    title: "Stress-test object detection",
    description: "Change brightness, blur or occlusion. The dashed yellow box marks the annotation and cyan marks the detector output.",
    names: ["Original", "55% darker", "94% darker", "Moderate blur", "Heavy blur", "Object partially covered"],
    detail: (entry) => {
      const [, , , threshold, iou, ...scores] = entry.detail.match(/[\d.]+/g) ?? [];
      return `${entry.metrics?.tp ?? 0} correct, ${entry.metrics?.fp ?? 0} false detections and ${entry.metrics?.fn ?? 0} missed. Threshold ${threshold}, matched at IoU ≥ ${iou}.${scores.length ? ` Scores: ${scores.join(" / ")}.` : ""}`;
    },
  },
  "10-packing-check": {
    model: "OWLv2",
    control: ["写真と閾値", "Photo and threshold"],
    title: "Check your packing list from a photo",
    description: "Match a checklist to objects detected in a desk photo. Items below the threshold are flagged for a manual check.",
    names: ["Desk A", "Desk B", "Desk A · threshold 0.65"],
    detail: (entry) => {
      const [found, total, threshold] = entry.detail.match(/[\d.]+/g) ?? [];
      return `${found} of ${total} items detected at threshold ${threshold}. See the checklist for the items that need a manual check.`;
    },
  },
};

export function getVisionDemos(locale: Locale) {
  const source: Record<string, DemonstrationResult> = results;

  return Object.entries(info).map(([id, demo]) => {
    const result = source[id];
    const first = result.cases[0];
    const isJa = locale === "ja";
    return {
      id,
      group: (id < "06" ? "world" : "vision") as "world" | "vision",
      title: isJa ? result.title : demo.title,
      description: isJa ? (demo.descriptionJa ?? result.summary) : demo.description,
      model: demo.model,
      control: demo.control[isJa ? 0 : 1],
      preview: `/products/vision-lab/${id}/${first.poster ?? first.image}`,
      cases: result.cases.map((entry, index) => ({
        image: entry.image,
        poster: entry.poster,
        name: isJa ? entry.name : demo.names[index] ?? entry.name,
        detail: isJa ? entry.detail : demo.detail(entry, index),
      })),
    };
  });
}
