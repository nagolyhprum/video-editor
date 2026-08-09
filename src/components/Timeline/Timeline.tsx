import { useEffect, useRef } from "react";
import { getState, setState, useEditorState } from "../../state/store";
import { FPS } from "../../lib/constants";
import { saveTimeline } from "../../state/actions";
import Thumbnails from "./Thumbnails";
import MediaTrack from "./MediaTrack";

const isNumber = (n: unknown): boolean => !isNaN(parseFloat(n as string));

declare global {
  interface Window {
    save: () => void;
    clean: () => void;
  }
}

export default function Timeline() {
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const mouseDownRef = useRef(false);
  const time = useEditorState((s) => s.time);
  const isPlaying = useEditorState((s) => s.isPlaying);

  useEffect(() => {
    const timelineDiv = timelineRef.current;
    if (!timelineDiv) return;

    const moveMarker = (e: MouseEvent) => {
      mouseDownRef.current = true;
      const bounds = timelineDiv.getBoundingClientRect();
      setState({
        time: (e.clientX - bounds.left + timelineDiv.scrollLeft) / FPS,
        isPlaying: false,
      });
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) moveMarker(e);
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (mouseDownRef.current) moveMarker(e);
    };
    const handleMouseUp = () => {
      mouseDownRef.current = false;
    };

    timelineDiv.addEventListener("mousedown", handleMouseDown);
    timelineDiv.addEventListener("mousemove", handleMouseMove);
    timelineDiv.addEventListener("mouseleave", handleMouseUp);
    timelineDiv.addEventListener("mouseup", handleMouseUp);

    return () => {
      timelineDiv.removeEventListener("mousedown", handleMouseDown);
      timelineDiv.removeEventListener("mousemove", handleMouseMove);
      timelineDiv.removeEventListener("mouseleave", handleMouseUp);
      timelineDiv.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  useEffect(() => {
    const timelineDiv = timelineRef.current;
    if (!timelineDiv || !isPlaying) return;
    timelineDiv.scrollLeft = time * FPS - timelineDiv.clientWidth / 2;
  }, [time, isPlaying]);

  useEffect(() => {
    window.save = () => {
      saveTimeline();
    };
    window.clean = () => {
      setState({
        timeline: getState()
          .timeline.filter((clip) => isNumber(clip.start) && isNumber(clip.length))
          .map((clip) => ({
            ...clip,
            media: clip.media.filter((media) => isNumber(media.start) && isNumber(media.length)),
          })),
      });
    };
  }, []);

  return (
    <div id="timeline" ref={timelineRef} className="relative w-full overflow-auto">
      <Thumbnails />
      <MediaTrack />
      <div
        id="marker"
        className="pointer-events-none absolute top-0 h-full w-[5px] bg-red-600 opacity-70"
        style={{ left: time * FPS }}
      />
    </div>
  );
}
