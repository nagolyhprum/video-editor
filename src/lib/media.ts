export function getBlobText(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      resolve(event.target?.result as string);
    };
    reader.readAsText(blob);
  });
}

export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const videoElement = document.createElement("video");
    videoElement.src = URL.createObjectURL(file);
    videoElement.addEventListener("loadedmetadata", () => {
      resolve(videoElement.duration);
    });
  });
}

export function seekVideo(video: HTMLVideoElement, at: number): Promise<void> {
  return new Promise((resolve) => {
    video.onseeked = () => resolve();
    video.currentTime = at;
  });
}
