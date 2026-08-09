import { useEffect, useRef } from "react";
import { useEditorState } from "../../state/store";
import { deleteMedia, updateMediaStart } from "../../state/actions";
import { drawAudioWaveform } from "../../lib/waveform";
import { FPS } from "../../lib/constants";
import type { Clip, Media } from "../../state/types";

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
        <div
          key={media.id}
          id={media.id}
          onClick={(e) => handleClick(clip, media, e)}
          onContextMenu={(e) => handleContextMenu(clip, media, e)}
          className={`absolute opacity-50 hover:opacity-70 ${mediaStyleClass(media.type)}`}
          style={{ left: left * FPS, width: media.length * FPS }}
        >
          {media.type === "audio" && <AudioWaveform src={media.src} />}
        </div>
      ))}
    </div>
  );
}
