import { setState, useEditorState } from "../../state/store";

export default function TopCropInput() {
  const topCrop = useEditorState((s) => s.topCrop);

  return (
    <label className="flex items-center gap-2 text-sm">
      Top crop
      <input
        type="number"
        id="topCrop"
        min={0}
        value={topCrop}
        onChange={(e) => setState({ topCrop: e.target.valueAsNumber || 0 })}
        className="w-24 rounded border border-neutral-300 px-2 py-1 text-sm"
      />
    </label>
  );
}
