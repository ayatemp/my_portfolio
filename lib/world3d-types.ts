import type { Scene, Vector3 } from "three";

export type WorldSceneSide = "model" | "simulator";

export type WorldSceneSample = {
  predicted: number[][];
  actual: number[][];
  progress: number;
  heading?: number;
  force?: number;
  contact?: number;
  scene?: number;
  action?: number;
};

export type WorldSceneBuilder = (
  scene: Scene,
  side: WorldSceneSide,
) => {
  update: (sample: WorldSceneSample) => void;
  target: Vector3;
  distance: number;
  dispose?: () => void;
};
