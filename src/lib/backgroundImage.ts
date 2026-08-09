import { loadImage } from "./imageCache";

/**
 * Decorative background drawn behind the video on the main canvas, cached
 * so it's only ever fetched/decoded once per page load.
 */
export function getCanvasBackgroundImage(): Promise<HTMLImageElement> {
  return loadImage("/canvas-background.svg");
}
