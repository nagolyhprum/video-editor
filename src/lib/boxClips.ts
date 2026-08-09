import { seekVideo } from "./media";
import { useCachedVideo } from "./videoElement";

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
 * cropped to its own region (or a centered square by default). Seeks happen
 * on the shared preview <video> element (see videoElement.ts), the same one
 * the timeline's own tile thumbnails use -- queued through useCachedVideo so
 * the two never race each other -- rather than opening a separate element
 * per call.
 *
 * Regions aren't necessarily square (e.g. a user-drawn screenshot crop), so
 * they're fit *within* the destination preserving aspect ratio (letterboxed)
 * rather than stretched to fill it. The canvas itself is always `size`
 * square, but when the caller's own label banner will overlay the bottom of
 * it, `contentHeight` (< size) keeps the fit contained to the area that'll
 * actually stay visible, anchored to the top rather than centered -- so
 * nothing meaningful ends up hidden underneath the banner.
 */
export async function generateBoxClipThumbnails(
  videoUrl: string,
  specs: BoxClipSpec[],
  size: number,
  contentHeight: number = size
): Promise<HTMLCanvasElement[]> {
  const thumbnails: HTMLCanvasElement[] = [];
  for (const spec of specs) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d")!;

    await useCachedVideo(videoUrl, async (video) => {
      await seekVideo(video, spec.time);
      const region = spec.region ?? centeredSquareRegion(video);

      const sw = region.width * video.videoWidth;
      const sh = region.height * video.videoHeight;
      const regionAspect = sw / sh || 1;
      const boxAspect = size / contentHeight;
      const drawWidth = regionAspect >= boxAspect ? size : contentHeight * regionAspect;
      const drawHeight = regionAspect >= boxAspect ? size / regionAspect : contentHeight;
      const dx = (size - drawWidth) / 2;
      const dy = (contentHeight - drawHeight) / 2;

      context.drawImage(
        video,
        region.x * video.videoWidth,
        region.y * video.videoHeight,
        sw,
        sh,
        dx,
        dy,
        drawWidth,
        drawHeight
      );
    });
    thumbnails.push(canvas);
  }
  return thumbnails;
}
