export type VisionDetectionBox = {
  label: string;
  score: number;
  box: [number, number, number, number];
};

type WorkerReply =
  | { type: "progress"; progress: number | null }
  | { type: "result"; boxes: VisionDetectionBox[] }
  | { type: "error"; message: string };

let detectorWorker: Worker | undefined;
let queue: Promise<unknown> = Promise.resolve();

export function runVisionDetection(
  image: Blob | string,
  queries: string[],
  onProgress?: (progress: number | null) => void,
): Promise<VisionDetectionBox[]> {
  const source = typeof image === "string" ? new URL(image, location.href) : image;
  if (source instanceof URL && source.origin !== location.origin) {
    return Promise.reject(new Error("Only images from this site are supported"));
  }

  // A single worker holds a large model, so avoid compiling or running it twice at once.
  const task = queue.then(() => new Promise<VisionDetectionBox[]>((resolve, reject) => {
    const worker = detectorWorker ??= new Worker("/products/vision-lab/vision-detection-worker.mjs", { type: "module" });
    const timeout = window.setTimeout(() => fail(new Error("Object detection timed out"), true), 240_000);

    function cleanup() {
      window.clearTimeout(timeout);
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);
    }

    function fail(error: Error, restart = false) {
      cleanup();
      if (restart) {
        worker.terminate();
        detectorWorker = undefined;
      }
      reject(error);
    }

    function onMessage({ data }: MessageEvent<WorkerReply>) {
      if (data.type === "progress") {
        onProgress?.(data.progress);
      } else if (data.type === "error") {
        fail(new Error(data.message));
      } else {
        cleanup();
        resolve(data.boxes);
      }
    }

    function onError(event: ErrorEvent) {
      fail(new Error(event.message || "Could not start the object detection worker"), true);
    }

    worker.addEventListener("message", onMessage);
    worker.addEventListener("error", onError);
    worker.postMessage({ image: source instanceof URL ? source.href : source, queries });
  }));
  queue = task.catch(() => undefined);
  return task;
}
