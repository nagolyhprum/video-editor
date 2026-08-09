import {
  createArrowPreview,
  createCirclePreview,
  createFocusPreview,
  createScreenshotPreview,
} from "../../state/actions";
import { toggleAudioRecording } from "../../lib/audioRecording";

const buttonClass = "rounded bg-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-300";

export default function MediaButtons() {
  return (
    <div>
      Media
      <div className="flex flex-wrap gap-2 pt-1">
        <button id="audio" onClick={() => toggleAudioRecording()} className={buttonClass}>
          Audio
        </button>
        <button id="circle" onClick={createCirclePreview} className={`${buttonClass} bg-green-600 text-white hover:bg-green-700`}>
          Circle
        </button>
        <button id="arrow" onClick={createArrowPreview} className={`${buttonClass} bg-blue-600 text-white hover:bg-blue-700`}>
          Arrow
        </button>
        <button id="focus" onClick={createFocusPreview} className={`${buttonClass} bg-yellow-400 text-black hover:bg-yellow-500`}>
          Focus
        </button>
        <button
          id="screenshot"
          onClick={createScreenshotPreview}
          className={`${buttonClass} bg-purple-600 text-white hover:bg-purple-700`}
        >
          Screenshot
        </button>
      </div>
    </div>
  );
}
