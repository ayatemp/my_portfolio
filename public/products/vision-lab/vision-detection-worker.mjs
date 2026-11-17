import { env, pipeline } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js";

env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;

let detector;

const progress = (value) => self.postMessage({ type: "progress", progress: value });

function iou(first, second) {
  const area = ([left, top, right, bottom]) => (right - left) * (bottom - top);
  const overlap = Math.max(0, Math.min(first[2], second[2]) - Math.max(first[0], second[0]))
    * Math.max(0, Math.min(first[3], second[3]) - Math.max(first[1], second[1]));
  return overlap / (area(first) + area(second) - overlap);
}

self.addEventListener("message", async ({ data: { image, queries } }) => {
  try {
    if (!detector) {
      progress(null);
      detector = await pipeline("zero-shot-object-detection", "Xenova/owlvit-base-patch32", {
        dtype: "q8",
        device: "wasm",
        revision: "b75f4e52949639c3bb0b96546ea4149482f6e7ef",
        progress_callback(event) {
          if (event.status === "progress" && event.file?.endsWith("model_quantized.onnx")) {
            progress(event.progress);
          }
        },
      });
    }

    progress(null);
    const results = await detector(image, queries, { percentage: true, threshold: 0.05 });
    const kept = [];
    for (const { box: { xmin, ymin, xmax, ymax }, label, score } of results) {
      const box = [xmin, ymin, xmax, ymax].map((value) => Math.max(0, Math.min(1, value)));
      if (box[2] <= box[0] || box[3] <= box[1]) continue;
      if (kept.some((other) => other.label === label && iou(other.box, box) >= 0.45)) continue;
      kept.push({ box, label, score });
    }
    self.postMessage({ type: "result", boxes: kept });
  } catch (error) {
    self.postMessage({ type: "error", message: String(error) });
  }
});
