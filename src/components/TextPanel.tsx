import { useEditorState } from "../state/store";
import { getActiveClip, updateClipText } from "../state/actions";

export default function TextPanel() {
  useEditorState((s) => s.time);
  useEditorState((s) => s.timeline);
  const activeClip = getActiveClip();

  return (
    <textarea
      id="text"
      value={activeClip?.clip.text ?? ""}
      onChange={(e) => updateClipText(e.target.value)}
      className="min-h-[200px] min-w-[400px] rounded border border-neutral-300 p-2"
    />
  );
}
