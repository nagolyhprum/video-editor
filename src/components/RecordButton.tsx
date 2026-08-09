import { getMainCanvas } from "../lib/mainCanvas";
import { getSharedVideoElement } from "../lib/videoElement";
import { startFullscreenRecording } from "../lib/playback";

export default function RecordButton() {
  const handleClick = () => {
    const canvas = getMainCanvas();
    if (!canvas) return;
    startFullscreenRecording(canvas, getSharedVideoElement());
  };

  return (
    <button
      id="record"
      onClick={handleClick}
      className="rounded bg-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-300"
    >
      Record
    </button>
  );
}
