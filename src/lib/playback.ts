import { getState, setState } from "../state/store";

let startTime = 0;
let startOffset = 0;

export function getPlaybackOrigin(): { startTime: number; startOffset: number } {
  return { startTime, startOffset };
}

export function togglePlayback(): void {
  const state = getState();
  startOffset = state.time;
  startTime = Date.now();
  setState({ isPlaying: !state.isPlaying });
}

export function toggleMobile(): void {
  setState({ isMobile: !getState().isMobile });
}

export function startFullscreenRecording(canvas: HTMLCanvasElement, video: HTMLVideoElement): void {
  canvas.requestFullscreen();
  canvas.width = video.videoWidth * devicePixelRatio;
  canvas.height = video.videoHeight * devicePixelRatio;
  canvas.style.cursor = "none";
  setTimeout(() => {
    startOffset = 0;
    startTime = Date.now();
    setState({ isPlaying: true, time: 0, isRecording: true });
  }, 5000);
}
