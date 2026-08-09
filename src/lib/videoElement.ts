let sharedVideoElement: HTMLVideoElement | null = null;

/**
 * A single hidden <video> element (never attached to the DOM) shared by the
 * main canvas render loop and the small thumbnail preview canvas, so both
 * always reflect the same playback position/source.
 */
export function getSharedVideoElement(): HTMLVideoElement {
  if (!sharedVideoElement) {
    sharedVideoElement = document.createElement("video");
  }
  return sharedVideoElement;
}
