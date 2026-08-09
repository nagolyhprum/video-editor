import { useEffect, useMemo, useRef, useState } from "react";
import { useEditorState } from "../../state/store";
import { FPS } from "../../lib/constants";
import { seekVideo } from "../../lib/media";
import { getCachedVideo } from "../../lib/videoElement";
import type { Clip } from "../../state/types";

const THUMBNAIL_HEIGHT = 50;

interface Tile {
  index: number;
  width: number;
  seekAt: number;
}

// One small canvas per tile (rather than one huge canvas per clip) keeps each
// element cheap and bounded, so a long clip doesn't need one giant bitmap.
function computeTiles(clip: Clip, tileWidth: number): Tile[] {
  const clipWidthPx = Math.round(clip.length * FPS);
  if (tileWidth <= 0 || clipWidthPx <= 0) return [];
  const tileCount = Math.ceil(clipWidthPx / tileWidth);
  const tiles: Tile[] = [];
  for (let i = 0; i < tileCount; i++) {
    // last tile is clipped to whatever width remains, rather than overflowing
    // past the clip's own boundary -- it still shows the frame at its own start.
    const width = i === tileCount - 1 ? clipWidthPx - i * tileWidth : tileWidth;
    tiles.push({ index: i, width, seekAt: clip.start + (i * tileWidth) / FPS });
  }
  return tiles;
}

export default function Thumbnails() {
  const timeline = useEditorState((s) => s.timeline);
  const project = useEditorState((s) => s.project);
  const [tileWidth, setTileWidth] = useState<number | null>(null);
  const canvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const drawnTileKeys = useRef<Set<string>>(new Set());

  useEffect(() => {
    setTileWidth(null);
    drawnTileKeys.current.clear();
    if (!project) return;
    let cancelled = false;
    getCachedVideo(`/api/download/projects/${project}/video.mp3`).then((video) => {
      if (cancelled) return;
      setTileWidth(video.videoWidth ? video.videoWidth * (THUMBNAIL_HEIGHT / video.videoHeight) : THUMBNAIL_HEIGHT);
    });
    return () => {
      cancelled = true;
    };
  }, [project]);

  const clipTiles = useMemo(() => {
    if (!tileWidth) return [];
    return timeline.map((clip) => ({ clip, tiles: computeTiles(clip, tileWidth) }));
  }, [timeline, tileWidth]);

  useEffect(() => {
    if (!tileWidth || !project) return;
    let cancelled = false;

    (async () => {
      const video = await getCachedVideo(`/api/download/projects/${project}/video.mp3`);
      if (cancelled) return;

      // Sequential on purpose: every tile shares the same cached video
      // element, so concurrent seeks on it would race and clobber each other.
      for (const { clip, tiles } of clipTiles) {
        for (const tile of tiles) {
          if (cancelled) return;
          const key = `${clip.id}:${tile.index}`;
          if (drawnTileKeys.current.has(key)) continue;
          const canvas = canvasRefs.current.get(key);
          if (!canvas) continue;

          await seekVideo(video, tile.seekAt);
          if (cancelled) return;
          const context = canvas.getContext("2d")!;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          drawnTileKeys.current.add(key);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clipTiles, project, tileWidth]);

  return (
    <div id="thumbnails" className="whitespace-nowrap select-none">
      {clipTiles.map(({ clip, tiles }) => (
        <div
          key={clip.id}
          id={clip.id}
          className="relative inline-block align-top"
          style={{ width: Math.round(clip.length * FPS), height: THUMBNAIL_HEIGHT }}
        >
          {tiles.map((tile) => {
            const key = `${clip.id}:${tile.index}`;
            return (
              <canvas
                key={key}
                ref={(el) => {
                  if (el) canvasRefs.current.set(key, el);
                  else canvasRefs.current.delete(key);
                }}
                width={Math.max(1, Math.round(tile.width))}
                height={THUMBNAIL_HEIGHT}
                draggable={false}
                className="inline-block select-none align-top"
              />
            );
          })}
          <div
            className={`pointer-events-none absolute inset-0 box-border border-[10px] ${
              clip.type === "video" ? "border-purple-600" : "border-orange-500"
            }`}
          />
        </div>
      ))}
    </div>
  );
}
