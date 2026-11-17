"""Export the fitted synthetic world models with their example observations."""

import importlib.util
import json
from pathlib import Path
import sys

import joblib
import numpy as np


DESTINATION = Path(__file__).resolve().with_name("vision-world-models.json")
LAB = Path(sys.argv[1]) if len(sys.argv) > 1 else DESTINATION.parents[2] / "ayarnte-project-forWEB"


def load(name, checkpoint="model.joblib"):
    source = LAB / "demos" / name
    spec = importlib.util.spec_from_file_location(name, source / "run.py")
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module, joblib.load(source / "artifacts" / checkpoint), source / "artifacts"


def rounded(value):
    return np.asarray(value).round(8).tolist()


def network(pipeline):
    scaler, mlp = pipeline
    assert mlp.activation == "relu" and mlp.out_activation_ == "identity"
    return {
        "mean": rounded(scaler.mean_),
        "scale": rounded(scaler.scale_),
        "layers": [
            {"weights": rounded(weight.T), "bias": rounded(bias)}
            for weight, bias in zip(mlp.coefs_, mlp.intercepts_, strict=True)
        ],
    }


def export():
    push, push_model, _ = load("01-block-push")
    poses = [(0.40, 0.43, 0.24), (0.50, 0.44, -0.56), (0.80, 0.48, 0.31)]
    push_scenes = [
        {"pose": pose, "features": rounded(push.features(push.observation(pose), [0, 0, 0, 0])[:4])}
        for pose in poses
    ]

    road, road_model, road_artifacts = load("02-intersection", "world-model.joblib")
    with np.load(road_artifacts / "dataset.npz") as data:
        split = int(data["train_scenes"])
        actual = data["trajectories"][split:]
        timings = actual[:, 0, -1, 1] - actual[:, 2, -1, 1]
        largest_delay = int(np.argmax(timings))
        no_delay = int(np.argmin(timings))
        third = int(np.argmax(np.where(timings < timings[largest_delay] * 0.7, timings, -1)))
        indices = [largest_delay, third, no_delay]
        features = road.camera_features(data["observations"][split + np.array(indices)])
        road_scenes = [
            {
                "features": rounded(row),
                "initial": rounded([actual[index, 0, 0, 0], 2 * actual[index, 0, 0, 1] - actual[index, 0, 1, 1]]),
                "actual": rounded(actual[index]),
            }
            for index, row in zip(indices, features, strict=True)
        ]

    hidden, fitted, hidden_artifacts = load("03-occlusion", "world-model.joblib")
    with np.load(hidden_artifacts / "dataset.npz") as data:
        split = int(data["calibrate_end"])
        modes = data["hidden_modes"][split:]
        picks = [split, split + int(np.flatnonzero(modes != modes[0])[0])]
        hidden_scenes = [
            {
                "features": rounded(hidden.camera_positions(data["visible_cameras"][index]).ravel()),
                "observed": rounded(hidden.camera_positions(data["probe_cameras"][index, 1])),
                "actual": rounded(data["trajectories"][index]),
            }
            for index in picks
        ]

    brake, brake_model, _ = load("05-slip-stop")
    brake_scenes = []
    for index, deceleration in enumerate([0.42, 1.05]):
        images, features = brake.sample(deceleration, np.random.default_rng(61 + index + 100))
        positions = [[float(np.nonzero(frame > 200)[1].mean()) for frame in trial] for trial in images]
        brake_scenes.append({
            "deceleration": deceleration,
            "features": rounded(features),
            "observed": rounded(positions),
        })

    data = {
        "push": {"model": network(push_model), "scenes": push_scenes},
        "road": {"model": network(road_model), "scenes": road_scenes},
        "hidden": {"model": network(fitted["model"]), "sigma": rounded(fitted["sigma"]), "scenes": hidden_scenes},
        "brake": {"model": network(brake_model), "scenes": brake_scenes},
    }
    DESTINATION.write_text(json.dumps(data, separators=(",", ":")) + "\n", encoding="utf-8")


if __name__ == "__main__":
    export()
