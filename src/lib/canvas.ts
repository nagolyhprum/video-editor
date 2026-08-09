import type { Media, MediaPreview, Point } from "../state/types";

export const thickness = (isLarge: boolean): number => (isLarge ? 20 : 5);

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
export function drawBanner(
  context: CanvasRenderingContext2D,
  leftCap: CanvasImageSource,
  middle: CanvasImageSource,
  rightCap: CanvasImageSource,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const capWidth = Math.min(height, width / 2);
  const middleWidth = Math.max(0, width - capWidth * 2);
  context.drawImage(leftCap, x, y, capWidth, height);
  context.drawImage(rightCap, x + capWidth + middleWidth, y, capWidth, height);
  context.drawImage(middle, x + capWidth - 25, y - 2, middleWidth + 50, height);
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
  isLarge: boolean,
): [Point, Point, Point] {
  const arrowSize = thickness(isLarge) * 4;
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
): void {
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
    context.lineWidth = 2 * thickness(isLarge);

    context.stroke();
    context.strokeStyle = "white";
    context.lineWidth = thickness(isLarge);

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
      isLarge,
    );
    context.lineTo(arrowHead[1].x, arrowHead[1].y);
    context.lineTo(arrowHead[0].x, arrowHead[0].y);
    context.moveTo(arrowHead[1].x, arrowHead[1].y);
    context.lineTo(arrowHead[2].x, arrowHead[2].y);
    context.strokeStyle = "black";
    context.lineWidth = 2 * thickness(isLarge);

    context.stroke();
    context.strokeStyle = "white";
    context.lineWidth = thickness(isLarge);

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
  }
}
