import { useRef } from "react";
import {
  createArrowPreview,
  createCirclePreview,
  createFocusPreview,
  createPhotoMedia,
  createScreenshotPreview,
} from "../../state/actions";
import { toggleAudioRecording } from "../../lib/audioRecording";

const buttonClass = "rounded bg-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-300";

export default function MediaButtons() {
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so picking the exact same file again still fires onChange.
    e.target.value = "";
    if (file) createPhotoMedia(file);
  };

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
        <button
          id="image"
          onClick={() => imageInputRef.current?.click()}
          className={`${buttonClass} bg-pink-600 text-white hover:bg-pink-700`}
        >
          Image
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />
      </div>
    </div>
  );
}
