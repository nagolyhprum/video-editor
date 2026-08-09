import { useEffect, useRef } from "react";
import { getState, setState, useEditorState } from "../../state/store";
import { FPS } from "../../lib/constants";
import { saveTimeline } from "../../state/actions";
import Thumbnails from "./Thumbnails";
import MediaTrack from "./MediaTrack";

const isNumber = (n: unknown): boolean => !isNaN(parseFloat(n as string));
const EDGE_SCROLL_MARGIN = 60;

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
      const time = (e.clientX - bounds.left + timelineDiv.scrollLeft) / FPS;
      setState({ time, isPlaying: false });

      const markerX = time * FPS;
      const viewportLeft = timelineDiv.scrollLeft;
      const viewportWidth = timelineDiv.clientWidth;
      if (markerX - viewportLeft < EDGE_SCROLL_MARGIN) {
        timelineDiv.scrollLeft = Math.max(0, markerX - EDGE_SCROLL_MARGIN);
      } else if (viewportLeft + viewportWidth - markerX < EDGE_SCROLL_MARGIN) {
        timelineDiv.scrollLeft = markerX - viewportWidth + EDGE_SCROLL_MARGIN;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        e.preventDefault();
        moveMarker(e);
      }
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (mouseDownRef.current) {
        e.preventDefault();
        moveMarker(e);
      }
    };
    const handleMouseUp = () => {
      mouseDownRef.current = false;
    };
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    timelineDiv.addEventListener("mousedown", handleMouseDown);
    timelineDiv.addEventListener("mousemove", handleMouseMove);
    timelineDiv.addEventListener("mouseleave", handleMouseUp);
    timelineDiv.addEventListener("mouseup", handleMouseUp);
    timelineDiv.addEventListener("dragstart", handleDragStart);

    return () => {
      timelineDiv.removeEventListener("mousedown", handleMouseDown);
      timelineDiv.removeEventListener("mousemove", handleMouseMove);
      timelineDiv.removeEventListener("mouseleave", handleMouseUp);
      timelineDiv.removeEventListener("mouseup", handleMouseUp);
      timelineDiv.removeEventListener("dragstart", handleDragStart);
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
    <div id="timeline" ref={timelineRef} className="relative w-full select-none overflow-auto">
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
