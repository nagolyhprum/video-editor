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

// Every video element in the app (main playback, timeline thumbnails, and
// screenshot-thumbnail generation) reads from the same project file. Pointed
// directly at the streaming download URL, every seek anywhere in the app --
// and there are routinely hundreds during normal editing, between timeline
// scrubbing and thumbnail/screenshot generation -- fires its own HTTP Range
// request. Fetching the file once into a Blob and handing out its object URL
// instead means every consumer seeks purely in memory: zero network requests
// after the first load, with no risk of one consumer's seek clobbering
// another's, since each still gets its own <video> element, just backed by
// the same local bytes.
const blobUrlsByUrl = new Map<string, Promise<string>>();

export function getVideoBlobUrl(url: string): Promise<string> {
  let cached = blobUrlsByUrl.get(url);
  if (!cached) {
    cached = fetch(url)
      .then((response) => response.blob())
      .then((blob) => URL.createObjectURL(blob));
    blobUrlsByUrl.set(url, cached);
  }
  return cached;
}

const cachedVideosByUrl = new Map<string, Promise<HTMLVideoElement>>();

/**
 * A separate, URL-cached <video> element used purely for generating thumbnail
 * frames -- shared by every thumbnail/preview consumer (timeline tiles,
 * screenshot crops), kept apart only from the main playback video, so
 * seeking around to capture previews never disturbs the marker/playback
 * position.
 */
export function getCachedVideo(url: string): Promise<HTMLVideoElement> {
  let cached = cachedVideosByUrl.get(url);
  if (!cached) {
    cached = getVideoBlobUrl(url).then(
      (blobUrl) =>
        new Promise<HTMLVideoElement>((resolve) => {
          const video = document.createElement("video");
          video.onloadeddata = () => resolve(video);
          video.src = blobUrl;
        })
    );
    cachedVideosByUrl.set(url, cached);
  }
  return cached;
}

const queueByUrl = new Map<string, Promise<unknown>>();

/**
 * Runs `fn` against the cached preview video element for `url`, queued
 * behind any other in-flight use of that *same* element. Multiple consumers
 * (timeline tiles, screenshot thumbnails) share one <video> instead of each
 * opening their own, but seekVideo relies on video.onseeked -- a single
 * pending handler at a time -- so concurrent callers on a shared element
 * would clobber each other's seeks without this serializing them.
 */
export function useCachedVideo<T>(url: string, fn: (video: HTMLVideoElement) => Promise<T>): Promise<T> {
  const previous = queueByUrl.get(url) ?? Promise.resolve();
  const next = previous.then(() => getCachedVideo(url)).then(fn);
  // Chain continues even if this use rejects, so one failure doesn't wedge
  // every later caller waiting on the same queue.
  queueByUrl.set(url, next.catch(() => {}));
  return next;
}
