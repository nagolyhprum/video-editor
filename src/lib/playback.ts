import { getState, setState } from "../state/store";
import { RECORDING_START_DELAY_MS } from "./constants";

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

// The canvas is bumped up to the video's native resolution for the
// recording pass; remembered here so it can be restored on exit. Margins,
// topCrop, and every other layout constant are tuned as absolute pixels
// against the canvas's normal (small) size, so leaving it at the much
// larger recording size afterward throws off all of that proportional math.
let preRecordingCanvasWidth = 0;
let preRecordingCanvasHeight = 0;

export function startFullscreenRecording(canvas: HTMLCanvasElement, video: HTMLVideoElement): void {
  preRecordingCanvasWidth = canvas.width;
  preRecordingCanvasHeight = canvas.height;
  canvas.requestFullscreen();
  canvas.width = video.videoWidth * devicePixelRatio;
  canvas.height = video.videoHeight * devicePixelRatio;
  canvas.style.cursor = "none";
  setTimeout(() => {
    startOffset = 0;
    startTime = Date.now();
    setState({ isPlaying: true, time: 0, isRecording: true });
  }, RECORDING_START_DELAY_MS);
}

export function restorePreRecordingCanvasSize(canvas: HTMLCanvasElement): void {
  if (!preRecordingCanvasWidth || !preRecordingCanvasHeight) return;
  canvas.width = preRecordingCanvasWidth;
  canvas.height = preRecordingCanvasHeight;
  preRecordingCanvasWidth = 0;
  preRecordingCanvasHeight = 0;
}
