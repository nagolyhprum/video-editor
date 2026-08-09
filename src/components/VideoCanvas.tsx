import { useEffect, useRef } from "react";
import { getState, setState, useEditorState } from "../state/store";
import { getActiveClip } from "../state/actions";
import { drawMedia } from "../lib/canvas";
import { getSharedVideoElement } from "../lib/videoElement";
import { setMainCanvas } from "../lib/mainCanvas";
import { getPlaybackOrigin } from "../lib/playback";
import type { Media, MediaPreview } from "../state/types";

function average(media: Media | MediaPreview, canvasWidth: number): number {
  if (media.type === "circle") {
    return (0.5 - media.x) * canvasWidth;
  }
  if (media.type === "arrow") {
    return (
      (media.points.reduce((total, { x }) => total + (0.5 - x), 0) / media.points.length) * canvasWidth
    );
  }
  if (media.type === "focus") {
    return (0.5 - media.x) * canvasWidth;
  }
  return 0;
}

function conditionalTimeUpdate(video: HTMLVideoElement, time: number): void {
  const offset = Math.abs(video.currentTime - time);
  if (offset > 1 / 16) {
    video.currentTime = time;
  }
}

export default function VideoCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const project = useEditorState((s) => s.project);
  const time = useEditorState((s) => s.time);
  const isPlaying = useEditorState((s) => s.isPlaying);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas: HTMLCanvasElement = canvasRef.current;
    setMainCanvas(canvas);
    const context = canvas.getContext("2d")!;
    const videoElement = getSharedVideoElement();

    const getXTargetsBasedOnMediaAndTime = (): number[] => {
      const mobileHeight = canvas.height;
      const mobileWidth = (mobileHeight * 9) / 16;
      const min = canvas.width / 2 - mobileWidth / 2;
      const xTargets: number[] = [];
      let offset = 0;
      getState().timeline.forEach((clip) => {
        for (let i = Math.ceil(offset); i < offset + clip.length; i++) {
          const medias = clip.media.filter(
            (media) =>
              ["arrow", "circle", "focus"].includes(media.type) &&
              media.start + offset <= i &&
              media.start + offset + media.length >= i
          );
          const total = medias.reduce((sum, media) => sum + average(media, canvas.width), 0);
          xTargets.push(Math.min(Math.max(-min, total / (medias.length || 1)), min));
        }
        offset += clip.length;
      });
      return xTargets;
    };

    function drawVideoFrame() {
      rafRef.current = requestAnimationFrame(drawVideoFrame);
      const state = getState();
      const isMobile = state.isMobile;

      canvas.width = canvas.width;
      context.lineCap = "round";
      context.lineJoin = "round";

      const scale = state.scale / 100;
      const width = canvas.width * scale;
      const height = canvas.height * scale;

      const mobileHeight = canvas.height;
      const mobileWidth = (mobileHeight * 9) / 16;
      if (isMobile) {
        context.beginPath();
        context.rect(canvas.width / 2 - mobileWidth / 2, 0, mobileWidth, mobileHeight);
        context.clip();
      }
      context.save();
      if (isMobile) {
        const targets = getXTargetsBasedOnMediaAndTime();
        const from = Math.floor(state.time);
        const to = from + 1;
        const delta = state.time - from;
        context.translate((targets[to] - targets[from]) * delta + targets[from], 0);
      }
      context.drawImage(videoElement, canvas.width / 2 - width / 2, canvas.height / 2 - height / 2, width, height);

      const preview = state.preview;
      if (preview) {
        drawMedia(canvas, context, preview, 0.5, false, state.isPlaying);
      }

      const result = getActiveClip();
      if (result) {
        const { clip, start } = result;
        clip.media.forEach((media) => {
          const myStart = start + media.start;
          const myEnd = myStart + media.length;
          if (state.time >= myStart && state.time <= myEnd) {
            drawMedia(canvas, context, media, (state.time - myStart) / media.length, state.isRecording, state.isPlaying);
          }
        });
        context.restore();
        if (clip.text && clip.type === "image") {
          const OFFSET = (state.isRecording ? 50 : 10) * devicePixelRatio;
          context.textBaseline = "top";
          context.textAlign = "center";
          context.font = `bold ${(state.isRecording ? 75 : 24) * devicePixelRatio}px sans-serif`;
          context.strokeStyle = "black";
          context.lineWidth = 10;
          context.fillStyle = "white";

          const text = clip.text.split("\n")[0];
          if (isMobile) {
            context.font = `bold ${state.isRecording ? 50 : 20}px sans-serif`;
            context.strokeText(text, canvas.width / 2, OFFSET + 40, canvas.width - OFFSET * 2);
            context.fillText(text, canvas.width / 2, OFFSET + 40, canvas.width - OFFSET * 2);
          } else {
            context.strokeText(text, canvas.width / 2, OFFSET, canvas.width - OFFSET * 2);
            context.fillText(text, canvas.width / 2, OFFSET, canvas.width - OFFSET * 2);
          }
        } else {
          context.restore();
        }
      }

      if (state.isPlaying) {
        const { startTime, startOffset } = getPlaybackOrigin();
        setState({ time: startOffset + (Date.now() - startTime) / 1000 });
      }
    }
    drawVideoFrame();

    const handleClick = () => {
      const preview = getState().preview;
      if (!preview) return;
      if (preview.type === "circle") {
        if (preview.clicks === 0) {
          setState({ preview: { ...preview, clicks: preview.clicks + 1 } });
          return;
        }
      } else if (preview.type === "arrow") {
        if (preview.clicks + 1 < preview.points.length) {
          setState({ preview: { ...preview, clicks: preview.clicks + 1 } });
          return;
        }
      }

      const result = getActiveClip();
      if (!result) return;
      const { clip, index } = result;
      const state = getState();
      setState({
        preview: null,
        timeline: [
          ...state.timeline.slice(0, index),
          {
            ...clip,
            id: crypto.randomUUID(),
            length: Math.max(clip.length, preview.length + preview.start),
            media: [...clip.media, preview],
          },
          ...state.timeline.slice(index + 1),
        ],
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      const bounds = canvas.getBoundingClientRect();
      const x = (e.pageX - bounds.left) / canvas.width;
      const y = (e.pageY - bounds.top) / canvas.height;
      const preview = getState().preview;
      if (!preview) return;
      if (preview.type === "circle") {
        if (preview.clicks === 0) {
          setState({ preview: { ...preview, x, y } });
        } else {
          setState({
            preview: { ...preview, width: Math.abs(x - preview.x), height: Math.abs(y - preview.y) },
          });
        }
      } else if (preview.type === "arrow") {
        const remap = [0, 3, 1, 2];
        const idx = remap[preview.clicks];
        setState({
          preview: {
            ...preview,
            points: [...preview.points.slice(0, idx), { x, y }, ...preview.points.slice(idx + 1)] as typeof preview.points,
          },
        });
      } else if (preview.type === "focus") {
        setState({ preview: { ...preview, x, y } });
      }
    };

    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("mousemove", handleMouseMove);

    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("mousemove", handleMouseMove);
      setMainCanvas(null);
    };
  }, []);

  useEffect(() => {
    const videoElement = getSharedVideoElement();
    if (!getState().isPlaying) {
      const result = getActiveClip();
      if (result) {
        const { clip, start } = result;
        const elapsed = clip.type === "video" ? time - start : 0;
        videoElement.currentTime = clip.start + elapsed;
      }
    }
  }, [time]);

  useEffect(() => {
    const videoElement = getSharedVideoElement();
    const timeouts: number[] = [];
    if (isPlaying) {
      let startOffset = 0;
      const state = getState();
      state.timeline.forEach((clip) => {
        if (clip.length + startOffset >= state.time) {
          const offset = Math.max(0, state.time - startOffset);
          const clipStartOffset = startOffset;
          timeouts.push(
            window.setTimeout(() => {
              if (clip.type === "video") {
                conditionalTimeUpdate(videoElement, clip.start + offset);
                videoElement.play();
              } else if (clip.type === "image") {
                videoElement.currentTime = clip.start;
                videoElement.pause();
              }
            }, (clipStartOffset - state.time) * 1000)
          );
        }
        clip.media.forEach((media) => {
          if (media.start + startOffset + media.length >= state.time) {
            const finalOffset = startOffset;
            timeouts.push(
              window.setTimeout(() => {
                if (media.type === "audio") {
                  const audio = new Audio(media.src);
                  audio.currentTime = Math.max(state.time - (finalOffset + media.start), 0);
                  audio.play();
                }
              }, (startOffset + media.start - state.time) * 1000)
            );
          }
        });
        startOffset += clip.length;
      });
    } else {
      videoElement.pause();
    }
    return () => {
      while (timeouts.length) clearTimeout(timeouts.pop());
    };
  }, [isPlaying]);

  useEffect(() => {
    const videoElement = getSharedVideoElement();
    if (project) {
      videoElement.src = `/api/download/projects/${project}/video.mp3`;
      videoElement.onloadeddata = () => {
        videoElement.currentTime = 0;
        setState({ duration: videoElement.duration });
      };
    }
  }, [project]);

  return <canvas ref={canvasRef} id="videoCanvas" width={960} height={540} className="bg-black" />;
}
