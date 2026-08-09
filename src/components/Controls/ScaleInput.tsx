import { setState, useEditorState } from "../../state/store";

export default function ScaleInput() {
  const scale = useEditorState((s) => s.scale);

  return (
    <input
      type="number"
      id="scale"
      value={scale}
      onChange={(e) => setState({ scale: e.target.valueAsNumber })}
      className="w-24 rounded border border-neutral-300 px-2 py-1 text-sm"
    />
  );
}
