import { seekVideo } from "./media";

export interface ClipRegion {
  x: number; // fraction 0-1 of the source video's width/height
  y: number;
  width: number;
  height: number;
}

export interface BoxClipSpec {
  time: number;
  region?: ClipRegion;
}

function loadIndependentVideo(url: string): Promise<HTMLVideoElement> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.onloadeddata = () => resolve(video);
    video.src = url;
  });
}

// Defaults to a centered square crop so a landscape video frame doesn't get
// squashed to fit the (square) box.
function centeredSquareRegion(video: HTMLVideoElement): ClipRegion {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return { x: 0, y: 0, width: 1, height: 1 };
  const size = Math.min(vw, vh);
  return {
    x: (vw - size) / 2 / vw,
    y: (vh - size) / 2 / vh,
    width: size / vw,
    height: size / vh,
  };
}

/**
 * Renders one square thumbnail per spec, each seeked to its own time and
 * cropped to its own region (or a centered square by default). Uses an
 * independent <video> element -- separate from the shared playback video and
 * the timeline's cached thumbnail video -- so seeking around for these never
 * disturbs either of those.
 */
export async function generateBoxClipThumbnails(
  videoUrl: string,
  specs: BoxClipSpec[],
  size: number
): Promise<HTMLCanvasElement[]> {
  const video = await loadIndependentVideo(videoUrl);
  const thumbnails: HTMLCanvasElement[] = [];
  for (const spec of specs) {
    await seekVideo(video, spec.time);
    const region = spec.region ?? centeredSquareRegion(video);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d")!;
    context.drawImage(
      video,
      region.x * video.videoWidth,
      region.y * video.videoHeight,
      region.width * video.videoWidth,
      region.height * video.videoHeight,
      0,
      0,
      size,
      size
    );
    thumbnails.push(canvas);
  }
  return thumbnails;
}
