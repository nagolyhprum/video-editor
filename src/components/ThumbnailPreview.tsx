import { useEffect, useRef } from "react";
import { getState, useEditorState } from "../state/store";
import { getActiveClip } from "../state/actions";
import { drawMedia } from "../lib/canvas";
import { getSharedVideoElement } from "../lib/videoElement";
import { DECOR_TEXT_REFERENCE_WIDTH, TEXT_SIZE_AT_1080P } from "../lib/constants";

export default function ThumbnailPreview() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const time = useEditorState((s) => s.time);
  const timeline = useEditorState((s) => s.timeline);
  const scale = useEditorState((s) => s.scale);
  const preview = useEditorState((s) => s.preview);
  const isRecording = useEditorState((s) => s.isRecording);

  useEffect(() => {
    if (isRecording) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const videoElement = getSharedVideoElement();

    canvas.width = 1280;
    canvas.height = 720;
    const scalePercent = scale / 100;
    const width = canvas.width * scalePercent;
    const height = canvas.height * scalePercent;
    const context = canvas.getContext("2d")!;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.drawImage(videoElement, canvas.width / 2 - width / 2, canvas.height / 2 - height / 2, width, height);

    const result = getActiveClip();
    if (result) {
      const { clip, start } = result;
      if (clip.text && clip.type === "image") {
        const OFFSET = 10;
        const fontSize = TEXT_SIZE_AT_1080P * (canvas.width / DECOR_TEXT_REFERENCE_WIDTH);
        context.textBaseline = "top";
        context.textAlign = "center";
        context.strokeStyle = "black";
        context.lineWidth = fontSize * 0.18;
        context.fillStyle = "white";
        context.font = `bold ${fontSize}px sans-serif`;
        const text = clip.text.split("\n")[0];
        context.strokeText(text, canvas.width / 2, OFFSET, canvas.width - OFFSET * 2);
        context.fillText(text, canvas.width / 2, OFFSET, canvas.width - OFFSET * 2);
      }
      if (preview) {
        drawMedia(canvas, context, preview, 0.5, true, getState().isPlaying, false);
      }
      clip.media.forEach((media) => {
        const myStart = start + media.start;
        const myEnd = myStart + media.length;
        if (time >= myStart && time <= myEnd) {
          drawMedia(canvas, context, media, (time - myStart) / media.length, true, getState().isPlaying, false);
        }
      });
    }
  }, [time, timeline, scale, preview, isRecording]);

  return <canvas ref={canvasRef} id="thumbnail" className="h-[180px] w-auto" />;
}
