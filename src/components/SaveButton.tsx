import { useState } from "react";
import { saveProjectProps } from "../state/actions";
import { useEditorState } from "../state/store";

export default function SaveButton() {
  const project = useEditorState((s) => s.project);
  const [justSaved, setJustSaved] = useState(false);

  const handleClick = async () => {
    await saveProjectProps();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1500);
  };

  return (
    <button
      id="save"
      onClick={handleClick}
      disabled={!project}
      className="rounded bg-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-300 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {justSaved ? "Saved" : "Save"}
    </button>
  );
}
