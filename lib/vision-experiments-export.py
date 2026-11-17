"""Export model detections and frame data for the portfolio experiments.

Run with the environment in the Vision Lab project, passing its checkout and
COCO val2017 annotation ZIP. No training or source asset download is performed
by the web application.
"""

import argparse
import importlib.util
import json
import sys
from itertools import product
from pathlib import Path
from zipfile import ZipFile

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter


PHOTOS = {248314: "desk-laptop.jpg", 333772: "desk-cats.jpg", 372466: "desk-mouse.jpg"}
BRIGHTNESS = [100, 75, 45, 20, 6]
BLUR = [0, 2, 5, 8, 24]
COVERAGE = [0, 25, 50, 75]


def normalized_box(box, width, height):
    return [round(min(1, max(0, value / scale)), 5)
            for value, scale in zip(box, (width, height, width, height), strict=True)]


def detections_for_image(detections, size):
    return [dict(box=normalized_box(det.box, *size), score=round(det.score, 4))
            for det in detections]


def write_manifest(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def annotation_index(path):
    with ZipFile(path) as archive:
        data = json.loads(archive.read("annotations/instances_val2017.json"))
    names = {item["id"]: item["name"] for item in data["categories"]}
    records = {}
    for row in data["annotations"]:
        image = row["image_id"]
        if image not in PHOTOS:
            continue
        x, y, width, height = row["bbox"]
        records.setdefault((image, names[row["category_id"]]), []).append((x, y, x + width, y + height))
    return records


def reference_targets(detector, images, index):
    cases = []
    pairs = [(248314, 372466, ["laptop", "keyboard", "mouse", "bowl"]),
             (372466, 248314, ["laptop", "mouse", "cup"])]
    for source, target, names in pairs:
        reference, photo = images[source], images[target]
        objects = []
        for name in names:
            box = max(index[source, name], key=lambda r: (r[2] - r[0]) * (r[3] - r[1]))
            crop = reference.crop(tuple(round(value) for value in box))
            matches = detector.reference(photo, crop, 0.58, 5)
            objects.append(dict(label=name, box=normalized_box(box, *reference.size),
                                matches=detections_for_image(matches, photo.size)))
        cases.append(dict(source=dict(file=PHOTOS[source], width=reference.width, height=reference.height),
                          target=dict(file=PHOTOS[target], width=photo.width, height=photo.height), objects=objects))
    return cases


def stress_conditions(detector, image, truth, destination):
    conditions = []
    (x1, y1, x2, y2) = truth[0]
    for bright_index, blur_index, cover_index in product(range(len(BRIGHTNESS)), range(len(BLUR)), range(len(COVERAGE))):
        sample = ImageEnhance.Brightness(image).enhance(BRIGHTNESS[bright_index] / 100)
        if blur_index:
            sample = sample.filter(ImageFilter.GaussianBlur(BLUR[blur_index] * image.width / 640))
        if cover_index:
            cover_end = x1 + (x2 - x1) * COVERAGE[cover_index] / 100
            ImageDraw.Draw(sample).rectangle((x1, y1, cover_end, y2), fill="#303841")
        file = f"stress-{bright_index}{blur_index}{cover_index}.webp"
        sample.save(destination / file, "WEBP", quality=82)
        # Decode the web asset before inference so the preview and input match.
        with Image.open(destination / file) as decoded:
            found = detector.text(decoded.convert("RGB"), ["a cat"], 0.3)
        conditions.append(dict(file=file, boxes=detections_for_image(found, image.size)))
        if len(conditions) % 10 == 0:
            print(f"Stress conditions complete: {len(conditions)}", flush=True)
    return dict(width=image.width, height=image.height, brightness=BRIGHTNESS, blur=BLUR, coverage=COVERAGE,
                truth=[normalized_box(bbox, *image.size) for bbox in truth], conditions=conditions)


def tracking_conditions(project):
    import torch
    from torch import nn

    script = project / "demos/08-object-tracking/run.py"
    spec = importlib.util.spec_from_file_location("tracking_demo", script)
    demo = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = demo
    spec.loader.exec_module(demo)
    torch.set_num_threads(4)
    model = nn.Sequential(nn.Conv2d(3, 8, 3, padding=1), nn.ReLU(), nn.Conv2d(8, 12, 3, padding=1), nn.ReLU(), nn.Conv2d(12, 1, 1))
    model.load_state_dict(torch.load(script.parent / "artifacts/detector.pt", weights_only=True, map_location="cpu"))
    model.eval()
    conditions = []
    for wall in [(44, 15, 68, 54), None]:
        clip = demo.make_clip(model, wall)
        frames = []
        for frame_index, (_, boxes, truth) in enumerate(clip):
            cars = [[10 + 2 * frame_index, 28 if wall else 25], [101 - 2 * frame_index, 40 if wall else 44]]
            frames.append(dict(cars=cars, boxes=[box.astype(int).tolist() for box in boxes],
                               visible=[int(vehicle) for vehicle, _ in truth]))
        conditions.append(dict(wall=wall, frames=frames))
    return conditions


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", type=Path, required=True)
    parser.add_argument("--annotations", type=Path, required=True)
    args = parser.parse_args()
    project = args.project.resolve()
    library = Path(__file__).resolve().parent
    destination = library.parent / "public/products/vision-experiments"
    destination.mkdir(parents=True, exist_ok=True)
    sys.path.insert(0, str(project / "demos"))
    from _vision.common import OwlDetector, coco_image

    images = {number: coco_image(number) for number in PHOTOS}
    for number, image in images.items():
        # Retain the already attributed, unmodified source JPEG.
        source = project / f"demos/_vision/artifacts/coco/{number:012d}.jpg"
        (destination / PHOTOS[number]).write_bytes(source.read_bytes())
    index = annotation_index(args.annotations)
    write_manifest(library / "vision-experiments-tracking.json", tracking_conditions(project))
    print("Tracking scenes exported", flush=True)
    model = OwlDetector()
    write_manifest(library / "vision-experiments-reference.json", reference_targets(model, images, index))
    print("Reference proposals exported", flush=True)
    stress = stress_conditions(model, images[333772], index[333772, "cat"], destination)
    write_manifest(library / "vision-experiments-stress.json", stress)
    print("Stress variants exported", flush=True)


if __name__ == "__main__":
    main()
