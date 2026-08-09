let mainCanvas: HTMLCanvasElement | null = null;

export function setMainCanvas(canvas: HTMLCanvasElement | null): void {
  mainCanvas = canvas;
}

export function getMainCanvas(): HTMLCanvasElement | null {
  return mainCanvas;
}
