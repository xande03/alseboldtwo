/**
 * Client-side video assembly: turns generated frames into a real playable
 * video file (MP4 when the browser supports H.264 in MediaRecorder,
 * WebM otherwise) using a canvas capture stream.
 */

export interface VideoExportOptions {
  width: number;
  height: number;
  /** seconds each frame stays on screen (including the crossfade) */
  secondsPerFrame?: number;
  fps?: number;
  /** seconds of crossfade between consecutive frames */
  crossfade?: number;
  onProgress?: (percent: number) => void;
}

export interface VideoExportResult {
  url: string;
  blob: Blob;
  mimeType: string;
  extension: "mp4" | "webm";
}

const MP4_TYPES = [
  'video/mp4;codecs="avc1.640028"',
  'video/mp4;codecs="avc1.42E01E"',
  "video/mp4",
];

const WEBM_TYPES = [
  'video/webm;codecs="vp9"',
  'video/webm;codecs="vp8"',
  "video/webm",
];

export function pickMimeType(): { mimeType: string; extension: "mp4" | "webm" } {
  if (typeof MediaRecorder !== "undefined") {
    for (const t of MP4_TYPES) {
      if (MediaRecorder.isTypeSupported(t)) return { mimeType: t, extension: "mp4" };
    }
    for (const t of WEBM_TYPES) {
      if (MediaRecorder.isTypeSupported(t)) return { mimeType: t, extension: "webm" };
    }
  }
  return { mimeType: "", extension: "webm" };
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  // Fetch through blob first so the canvas is never tainted.
  let objectUrl: string | null = null;
  try {
    const res = await fetch(src, { mode: "cors" });
    if (res.ok) {
      objectUrl = URL.createObjectURL(await res.blob());
    }
  } catch {
    /* fall back to direct load below */
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Falha ao carregar frame para o vídeo"));
    img.src = objectUrl || src;
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  alpha: number,
  scale = 1,
) {
  const ratio = Math.max(width / img.width, height / img.height) * scale;
  const w = img.width * ratio;
  const h = img.height * ratio;
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h);
  ctx.globalAlpha = 1;
}

export async function framesToVideo(
  frameUrls: string[],
  options: VideoExportOptions,
): Promise<VideoExportResult> {
  const {
    width,
    height,
    secondsPerFrame = 1.5,
    fps = 30,
    crossfade = 0.4,
    onProgress,
  } = options;

  if (!frameUrls.length) throw new Error("Nenhum frame para montar o vídeo");
  if (typeof MediaRecorder === "undefined") {
    throw new Error("Seu navegador não suporta gravação de vídeo");
  }

  const images: HTMLImageElement[] = [];
  for (let i = 0; i < frameUrls.length; i++) {
    images.push(await loadImage(frameUrls[i]));
    onProgress?.(Math.round(((i + 1) / frameUrls.length) * 25));
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");

  const stream = canvas.captureStream(fps);
  const { mimeType, extension } = pickMimeType();
  const recorder = new MediaRecorder(stream, {
    ...(mimeType ? { mimeType } : {}),
    videoBitsPerSecond: 8_000_000,
  });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const done = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType || "video/webm" }));
  });

  recorder.start();

  const framesPerImage = Math.max(2, Math.round(secondsPerFrame * fps));
  const fadeFrames = Math.min(Math.round(crossfade * fps), Math.floor(framesPerImage / 2));
  const totalTicks = framesPerImage * images.length;
  const frameDelay = 1000 / fps;

  let tick = 0;
  const start = performance.now();

  for (let i = 0; i < images.length; i++) {
    for (let f = 0; f < framesPerImage; f++) {
      const progress = f / framesPerImage;
      // subtle Ken Burns zoom for motion
      const scale = 1.02 + progress * 0.05;

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);

      if (f < fadeFrames && i > 0) {
        const t = f / fadeFrames;
        drawCover(ctx, images[i - 1], width, height, 1, 1.07);
        drawCover(ctx, images[i], width, height, t, scale);
      } else if (i === 0 && f < fadeFrames) {
        drawCover(ctx, images[i], width, height, f / fadeFrames, scale);
      } else if (i === images.length - 1 && f > framesPerImage - fadeFrames) {
        const t = (framesPerImage - f) / fadeFrames;
        drawCover(ctx, images[i], width, height, Math.max(t, 0), scale);
      } else {
        drawCover(ctx, images[i], width, height, 1, scale);
      }

      tick++;
      if (tick % 5 === 0) onProgress?.(25 + Math.round((tick / totalTicks) * 70));

      // pace the loop to real time so the recorder captures the right duration
      const target = start + tick * frameDelay;
      const wait = target - performance.now();
      await new Promise((r) => setTimeout(r, Math.max(wait, 0)));
    }
  }

  recorder.stop();
  const blob = await done;
  onProgress?.(100);

  return {
    blob,
    url: URL.createObjectURL(blob),
    mimeType: mimeType || "video/webm",
    extension,
  };
}
