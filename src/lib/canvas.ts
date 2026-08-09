import type { Media, MediaPreview, Point } from "../state/types";
import {
  DECOR_BANNER_BOTTOM_NUDGE,
  DECOR_BOX_SIZE,
  DECOR_PADDING,
  DECOR_STACK_SPACING,
  VIDEO_MARGIN_LEFT,
  VIDEO_MARGIN_RIGHT,
  VIDEO_MARGIN_TOP,
} from "./constants";

export const thickness = (isLarge: boolean): number => (isLarge ? 20 : 5);

// Normalizes a corner + signed-delta rectangle (as produced while dragging a
// screenshot region, where the second corner can end up above/left of the
// first) into a proper top-left + positive width/height box.
export function normalizeRegion(
  x: number,
  y: number,
  width: number,
  height: number
): { x: number; y: number; width: number; height: number } {
  return {
    x: width < 0 ? x + width : x,
    y: height < 0 ? y + height : y,
    width: Math.abs(width),
    height: Math.abs(height),
  };
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

// Screenshot regions are captured as fractions of the *whole canvas* (so the
// on-canvas selection outline lines up with the click regardless of where
// the video sits), but the video itself only occupies the area inside the
// fixed margins, further shrunk from the top by the top-crop setting. To
// crop the actual source video frame to what was selected, that canvas
// fraction has to be re-expressed as a fraction of the video's own frame.
export function canvasRegionToVideoRegion(
  region: { x: number; y: number; width: number; height: number },
  canvasWidth: number,
  canvasHeight: number,
  topCrop: number,
): { x: number; y: number; width: number; height: number } {
  const videoWidth = canvasWidth - VIDEO_MARGIN_LEFT - VIDEO_MARGIN_RIGHT;
  const widthChangePercent = videoWidth / canvasWidth;
  const fullVideoHeight = canvasHeight * widthChangePercent;
  const clampedTopCrop = Math.max(0, Math.min(topCrop, fullVideoHeight));

  const px = region.x * canvasWidth;
  const py = region.y * canvasHeight;
  const pw = region.width * canvasWidth;
  const ph = region.height * canvasHeight;

  const x = clamp01((px - VIDEO_MARGIN_LEFT) / videoWidth);
  const y = clamp01((clampedTopCrop + py - VIDEO_MARGIN_TOP) / fullVideoHeight);
  const right = clamp01((px + pw - VIDEO_MARGIN_LEFT) / videoWidth);
  const bottom = clamp01((clampedTopCrop + py + ph - VIDEO_MARGIN_TOP) / fullVideoHeight);

  return { x, y, width: Math.max(0, right - x), height: Math.max(0, bottom - y) };
}

// How many box+banner units fit stacked vertically in a margin of the given
// canvas height -- shared by the generator (which needs a time per slot)
// and the render loop (which needs a position per slot). layoutScale keeps
// the unit/padding/spacing amounts proportional to the canvas's own current
// size (see VideoCanvas.tsx) so the *count* that fits stays the same
// regardless of canvas size -- only pass something other than 1 when the
// canvas itself is scaled up (e.g. for recording).
export function computeDecorStackCount(canvasHeight: number, layoutScale: number = 1): number {
  const unitHeight = (DECOR_BOX_SIZE + DECOR_BANNER_BOTTOM_NUDGE) * layoutScale;
  const padding = DECOR_PADDING * layoutScale;
  const spacing = DECOR_STACK_SPACING * layoutScale;
  const availableHeight = canvasHeight - padding;
  return Math.max(1, Math.floor((availableHeight + spacing) / (unitHeight + spacing)));
}

// Fills the given box by repeating `pattern` at its native pixel size, like
// CSS `background-repeat: repeat` (no `background-size` scaling).
export function drawTiledBackground(
  context: CanvasRenderingContext2D,
  pattern: CanvasPattern,
  boxWidth: number,
  boxHeight: number,
): void {
  context.fillStyle = pattern;
  context.fillRect(0, 0, boxWidth, boxHeight);
}

// Rounds all four corners to the same radius and sets it as the active clip path.
export function clipToRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  context.beginPath();
  context.roundRect(x, y, width, height, r);
  context.clip();
}

// Draws a square source tile as a 9-slice panel: corners stay at their native
// size, edges stretch along one axis, and the center stretches on both --
// so a small bordered tile can scale up to any box without warping the border.
export function draw9SlicePanel(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  sourceSize: number,
  border: number,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const s = sourceSize;
  const b = Math.min(border, s / 2);
  const innerSource = s - b * 2;
  const innerWidth = Math.max(0, width - b * 2);
  const innerHeight = Math.max(0, height - b * 2);

  // corners
  context.drawImage(image, 0, 0, b, b, x, y, b, b);
  context.drawImage(image, s - b, 0, b, b, x + width - b, y, b, b);
  context.drawImage(image, 0, s - b, b, b, x, y + height - b, b, b);
  context.drawImage(
    image,
    s - b,
    s - b,
    b,
    b,
    x + width - b,
    y + height - b,
    b,
    b,
  );

  // edges
  context.drawImage(image, b, 0, innerSource, b, x + b, y, innerWidth, b);
  context.drawImage(
    image,
    b,
    s - b,
    innerSource,
    b,
    x + b,
    y + height - b,
    innerWidth,
    b,
  );
  context.drawImage(image, 0, b, b, innerSource, x, y + b, b, innerHeight);
  context.drawImage(
    image,
    s - b,
    b,
    b,
    innerSource,
    x + width - b,
    y + b,
    b,
    innerHeight,
  );

  // center
  context.drawImage(
    image,
    b,
    b,
    innerSource,
    innerSource,
    x + b,
    y + b,
    innerWidth,
    innerHeight,
  );
}

// Draws a horizontal 3-slice banner: fixed-size end caps (kept at their
// native square aspect) with the middle piece stretched to fill the rest.
// The middle tile is deliberately over-drawn past the caps (by a hand-tuned
// pixel amount) to hide a fold-seam artifact in the source art -- that
// overlap has to grow with everything else, or it stops covering the seam
// once width/height are scaled up (e.g. for recording), so layoutScale
// applies to it too.
export function drawBanner(
  context: CanvasRenderingContext2D,
  leftCap: CanvasImageSource,
  middle: CanvasImageSource,
  rightCap: CanvasImageSource,
  x: number,
  y: number,
  width: number,
  height: number,
  layoutScale: number = 1,
): void {
  const capWidth = Math.min(height, width / 2);
  const middleWidth = Math.max(0, width - capWidth * 2);
  context.drawImage(leftCap, x, y, capWidth, height);
  context.drawImage(rightCap, x + capWidth + middleWidth, y, capWidth, height);
  context.drawImage(
    middle,
    x + capWidth - 25 * layoutScale,
    y - 2 * layoutScale,
    middleWidth + 50 * layoutScale,
    height,
  );
}

export function rotatePoint(
  pointA: Point,
  pointB: Point,
  theta: number,
): Point {
  const radians = (theta * Math.PI) / 180;
  const dx = pointA.x - pointB.x;
  const dy = pointA.y - pointB.y;
  const x_new = pointB.x + dx * Math.cos(radians) - dy * Math.sin(radians);
  const y_new = pointB.y + dx * Math.sin(radians) + dy * Math.cos(radians);
  return { x: x_new, y: y_new };
}

export function normalizePoint(point: Point): Point {
  const magnitude = Math.sqrt(point.x * point.x + point.y * point.y);
  if (magnitude === 0) {
    return { x: 0, y: 0 };
  }
  return { x: point.x / magnitude, y: point.y / magnitude };
}

export function spline(
  P0: Point,
  P1: Point,
  P2: Point,
  P3: Point,
  percent: number,
): Point {
  const t = Math.min(Math.max(percent, 0), 1);
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  const x = mt3 * P0.x + 3 * mt2 * t * P1.x + 3 * mt * t2 * P2.x + t3 * P3.x;
  const y = mt3 * P0.y + 3 * mt2 * t * P1.y + 3 * mt * t2 * P2.y + t3 * P3.y;

  return { x, y };
}

export function generateArrowHead(
  P0: Point,
  P1: Point,
  P2: Point,
  P3: Point,
  percent: number,
  lineThickness: number,
): [Point, Point, Point] {
  const arrowSize = lineThickness * 4;
  const a = spline(P0, P1, P2, P3, percent - 0.01);
  const b = spline(P0, P1, P2, P3, percent);

  const d = normalizePoint({
    x: a.x - b.x,
    y: a.y - b.y,
  });

  const left = rotatePoint(
    {
      x: b.x + d.x * arrowSize,
      y: b.y + d.y * arrowSize,
    },
    b,
    45,
  );

  const right = rotatePoint(
    {
      x: b.x + d.x * arrowSize,
      y: b.y + d.y * arrowSize,
    },
    b,
    -45,
  );

  return [left, b, right];
}

export function drawMedia(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  media: Media | MediaPreview,
  progress: number,
  isLarge: boolean,
  isPlaying: boolean,
  isRecording: boolean,
): void {
  // Recording draws circles/arrows at isLarge's normal (bold, made-for-export)
  // thickness, but that reads as too heavy once actually burned into the
  // recording -- halved just for that pass, independent of isLarge's other
  // meaning (ThumbnailPreview always passes isLarge=true for its own reasons,
  // unrelated to recording, and should keep its normal thickness).
  const lineThickness = isRecording ? thickness(isLarge) / 2 : thickness(isLarge);

  if (media.type === "circle") {
    context.save();
    const sx = canvas.width * media.width;
    const sy = canvas.height * media.height;
    context.scale(sx, sy);
    context.beginPath();
    context.arc(
      (media.x * canvas.width) / sx,
      (media.y * canvas.height) / sy,
      1,
      Math.max(0, (progress - 0.5) * 2) * (2 * Math.PI + Math.PI / 4),
      Math.min(1, 2 * progress) * (2 * Math.PI + Math.PI / 4),
    );
    context.restore();
    context.strokeStyle = "black";
    context.lineWidth = 2 * lineThickness;

    context.stroke();
    context.strokeStyle = "white";
    context.lineWidth = lineThickness;

    context.stroke();
  } else if (media.type === "arrow") {
    context.beginPath();
    let moved = false;
    for (
      let from = Math.max(progress * 200 - 100, 0);
      from <= Math.min(progress * 200, 100);
      from += 1
    ) {
      const point = spline(...media.points, from / 100);
      if (moved) {
        context.lineTo(point.x * canvas.width, point.y * canvas.height);
      } else {
        context.moveTo(point.x * canvas.width, point.y * canvas.height);
        moved = true;
      }
    }
    const scaledPoints = media.points.map(({ x, y }) => ({
      x: x * canvas.width,
      y: y * canvas.height,
    })) as [Point, Point, Point, Point];
    const arrowHead = generateArrowHead(
      ...scaledPoints,
      Math.min(progress * 200, 100) / 100,
      lineThickness,
    );
    context.lineTo(arrowHead[1].x, arrowHead[1].y);
    context.lineTo(arrowHead[0].x, arrowHead[0].y);
    context.moveTo(arrowHead[1].x, arrowHead[1].y);
    context.lineTo(arrowHead[2].x, arrowHead[2].y);
    context.strokeStyle = "black";
    context.lineWidth = 2 * lineThickness;

    context.stroke();
    context.strokeStyle = "white";
    context.lineWidth = lineThickness;

    context.stroke();
  } else if (media.type === "focus") {
    if (!isPlaying) {
      context.fillStyle = "yellow";
      context.fillRect(
        media.x * canvas.width - 5,
        media.y * canvas.height - 5,
        10,
        10,
      );
    }
  } else if (media.type === "screenshot") {
    // The outline is an editing aid for placing/spotting the capture region --
    // it shouldn't show up burned into the actual recorded/exported output.
    if (isRecording) return;
    const region = normalizeRegion(media.x, media.y, media.width, media.height);
    const rx = region.x * canvas.width;
    const ry = region.y * canvas.height;
    const rw = region.width * canvas.width;
    const rh = region.height * canvas.height;
    context.strokeStyle = "black";
    context.lineWidth = 2 * thickness(isLarge);
    context.strokeRect(rx, ry, rw, rh);
    context.strokeStyle = "white";
    context.lineWidth = thickness(isLarge);
    context.strokeRect(rx, ry, rw, rh);
  }
}
