import { useEffect, useMemo, useRef } from "react";
import { useEditorState } from "../../state/store";
import { deleteMedia, updateMediaStart } from "../../state/actions";
import { drawAudioWaveform } from "../../lib/waveform";
import { FPS, SCREENSHOT_TIMELINE_LABEL_MAX_WIDTH, SCREENSHOT_TIMELINE_PREVIEW_SIZE } from "../../lib/constants";
import type { Clip, Media, ScreenshotMedia } from "../../state/types";

function AudioWaveform({ src }: { src: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    drawAudioWaveform(src).then((canvas) => {
      if (cancelled || !containerRef.current) return;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.background = "red";
      // replaceChildren (not appendChild) keeps this idempotent -- appendChild
      // would stack a duplicate waveform canvas on top of the previous one
      // any time this effect re-runs on the same container (e.g. HMR).
      containerRef.current.replaceChildren(canvas);
    });
    return () => {
      cancelled = true;
    };
  }, [src]);

  return <div ref={containerRef} className="h-full w-full" />;
}

// A compact pin -- captured thumbnail (contained, not stretched) plus an
// ellipsized label -- shown above a screenshot block so the timeline says
// what was captured without needing to click into it. Fixed size regardless
// of the block's own (duration-driven, often much narrower) width, and
// pointer-events-none so it never steals the block's own click/right-click
// handlers.
function ScreenshotPreview({ media }: { media: ScreenshotMedia }) {
  const thumbnail = useEditorState((s) => s.screenshotThumbnails.find((t) => t.id === media.id));
  const dataUrl = useMemo(() => thumbnail?.canvas.toDataURL(), [thumbnail?.canvas]);
  if (!dataUrl) return null;

  return (
    <div
      className="pointer-events-none absolute top-0 z-20 flex flex-col items-center"
      style={{ width: SCREENSHOT_TIMELINE_PREVIEW_SIZE }}
    >
      <img
        src={dataUrl}
        alt={media.label}
        className="rounded-sm border border-white bg-black shadow"
        style={{
          width: SCREENSHOT_TIMELINE_PREVIEW_SIZE,
          height: SCREENSHOT_TIMELINE_PREVIEW_SIZE,
          objectFit: "contain",
        }}
      />
      <div
        className="max-w-full truncate rounded-b-sm bg-black/75 px-1 text-[10px] leading-tight text-white"
        style={{ maxWidth: SCREENSHOT_TIMELINE_LABEL_MAX_WIDTH }}
      >
        {media.label}
      </div>
    </div>
  );
}

function mediaStyleClass(type: Media["type"]): string {
  switch (type) {
    case "circle":
      return "z-10 h-full bg-green-600";
    case "arrow":
      return "z-10 h-full bg-blue-600";
    case "focus":
      return "z-10 h-1/2 bg-yellow-400";
    case "screenshot":
      return "z-10 h-full bg-purple-600";
    default:
      return "h-full";
  }
}

export default function MediaTrack() {
  const timeline = useEditorState((s) => s.timeline);

  let runningOffset = 0;
  const items: { clip: Clip; media: Media; left: number }[] = [];
  timeline.forEach((clip) => {
    clip.media.forEach((media) => {
      items.push({ clip, media, left: runningOffset + media.start });
    });
    runningOffset += clip.length;
  });

  const handleClick = (clip: Clip, media: Media, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const value = prompt("Enter a value", String(media.start));
    const start = value === null ? NaN : parseFloat(value);
    if (!isNaN(start)) {
      updateMediaStart(clip, media.id, start);
    }
  };

  const handleContextMenu = (clip: Clip, media: Media, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this media?")) {
      deleteMedia(clip, media.id);
    }
  };

  return (
    <div id="media" className="relative h-[100px]">
      {items.map(({ clip, media, left }) => (
        <div key={media.id} className="absolute top-0 h-full" style={{ left: left * FPS }}>
          <div
            id={media.id}
            onClick={(e) => handleClick(clip, media, e)}
            onContextMenu={(e) => handleContextMenu(clip, media, e)}
            className={`opacity-50 hover:opacity-70 ${mediaStyleClass(media.type)}`}
            style={{ width: media.length * FPS, height: "100%" }}
          >
            {media.type === "audio" && <AudioWaveform src={media.src} />}
          </div>
          {media.type === "screenshot" && <ScreenshotPreview media={media} />}
        </div>
      ))}
    </div>
  );
}
