import { useEffect } from "react";
import { getState, setState, useEditorState } from "../../state/store";
import { downloadFile, uploadFile } from "../../lib/api";
import { getBlobText } from "../../lib/media";

export default function TopCropInput() {
  const topCrop = useEditorState((s) => s.topCrop);
  const project = useEditorState((s) => s.project);

  useEffect(() => {
    if (!project) return;
    (async () => {
      try {
        const blob = await downloadFile({ pathname: `projects/${project}/topCrop.json` });
        if (!blob) throw new Error("no topCrop file");
        const text = await getBlobText(blob);
        setState({ topCrop: JSON.parse(text) });
      } catch {
        setState({ topCrop: 0 });
      }
    })();
  }, [project]);

  useEffect(() => {
    if (!getState().project) return;
    uploadFile({
      pathname: `projects/${getState().project}/topCrop.json`,
      file: new Blob([JSON.stringify(topCrop)]),
    });
  }, [topCrop]);

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
