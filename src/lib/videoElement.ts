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

const cachedVideosByUrl = new Map<string, Promise<HTMLVideoElement>>();

/**
 * A separate, URL-cached <video> element used purely for generating thumbnail
 * frames. Kept apart from the shared playback video so seeking around to
 * capture thumbnails never disturbs the marker/playback position.
 */
export function getCachedVideo(url: string): Promise<HTMLVideoElement> {
  let cached = cachedVideosByUrl.get(url);
  if (!cached) {
    cached = new Promise((resolve) => {
      const video = document.createElement("video");
      video.onloadeddata = () => resolve(video);
      video.src = url;
    });
    cachedVideosByUrl.set(url, cached);
  }
  return cached;
}
