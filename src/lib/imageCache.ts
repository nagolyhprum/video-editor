const cache = new Map<string, Promise<HTMLImageElement>>();

/** Loads (and caches) an image by URL, so each asset is only fetched once. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  let cached = cache.get(src);
  if (!cached) {
    cached = new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.src = src;
    });
    cache.set(src, cached);
  }
  return cached;
}
