"""Export the fitted Vision Lab intersection demo's landing animation."""

import argparse
import runpy
import json
from pathlib import Path

import joblib
import numpy as np


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("vision_lab", type=Path, help="Path to the ayarnte-project-forWEB checkout")
    args = parser.parse_args()
    experiment = args.vision_lab / "demos/02-intersection"
    api = runpy.run_path(str(experiment / "run.py"))
    with np.load(experiment / "artifacts/dataset.npz") as data:
        split = int(data["train_scenes"])
        actual = data["trajectories"][split:]
        scene = int(np.argmax(actual[:, 0, -1, 1] - actual[:, 2, -1, 1]))
        features = api["camera_features"](data["observations"][split + scene:split + scene + 1])
    model = joblib.load(experiment / "artifacts/world-model.joblib")
    forecast = model.predict(api["with_actions"](features)).reshape(actual.shape[1:])
    start = features[0, -2:].round(5).tolist()
    result = [
        {"actual": [start, *truth.round(5).tolist()], "predicted": [start, *pred.round(5).tolist()]}
        for truth, pred in zip(actual[scene], forecast, strict=True)
    ]
    output = Path(__file__).resolve().parents[1] / "lib/vision-intersection-preview.json"
    output.write_text(json.dumps(result, separators=(",", ":")) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
