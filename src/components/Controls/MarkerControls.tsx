import { goToBeginning, goToClipStart, seekLeft, seekRight } from "../../state/actions";

const buttonClass = "rounded bg-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-300";

export default function MarkerControls() {
  return (
    <div>
      Marker
      <div className="flex flex-wrap gap-2 pt-1">
        <button id="start" onClick={goToClipStart} className={buttonClass}>
          Start of clip
        </button>
        <button id="beginning" onClick={goToBeginning} className={buttonClass}>
          Start of video
        </button>
        <button id="left" onClick={seekLeft} className={buttonClass}>
          Left
        </button>
        <button id="right" onClick={seekRight} className={buttonClass}>
          Right
        </button>
      </div>
    </div>
  );
}
