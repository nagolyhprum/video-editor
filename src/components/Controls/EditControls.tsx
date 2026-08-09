import { deleteClip, makeStill, mergeMediaClips, restoreClip, splitClip } from "../../state/actions";

const buttonClass = "rounded bg-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-300";

export default function EditControls() {
  return (
    <div>
      Edits
      <div className="flex flex-wrap gap-2 pt-1">
        <button id="still" onClick={makeStill} className={buttonClass}>
          Still
        </button>
        <button id="split" onClick={splitClip} className={buttonClass}>
          Split
        </button>
        <button id="delete" onClick={deleteClip} className={buttonClass}>
          Delete
        </button>
        <button id="restore" onClick={restoreClip} className={buttonClass}>
          Restore
        </button>
        <button id="media-clip" onClick={mergeMediaClips} className={buttonClass}>
          Media Clip
        </button>
      </div>
    </div>
  );
}
