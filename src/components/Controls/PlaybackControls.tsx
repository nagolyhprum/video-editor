import { togglePlayback, toggleMobile } from "../../lib/playback";

const buttonClass = "rounded bg-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-300";

export default function PlaybackControls() {
  return (
    <>
      <button id="playButton" onClick={togglePlayback} className={buttonClass}>
        Play / Pause
      </button>
      <button id="mobile" onClick={toggleMobile} className={buttonClass}>
        Mobile
      </button>
    </>
  );
}
