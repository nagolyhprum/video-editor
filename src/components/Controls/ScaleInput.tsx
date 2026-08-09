import { useEffect } from "react";
import { getState, setState, useEditorState } from "../../state/store";
import { downloadFile, uploadFile } from "../../lib/api";
import { getBlobText } from "../../lib/media";

export default function ScaleInput() {
  const scale = useEditorState((s) => s.scale);
  const project = useEditorState((s) => s.project);

  useEffect(() => {
    if (!project) return;
    (async () => {
      try {
        const blob = await downloadFile({ pathname: `projects/${project}/scale.json` });
        if (!blob) throw new Error("no scale file");
        const text = await getBlobText(blob);
        setState({ scale: JSON.parse(text) });
      } catch {
        setState({ scale: 100 });
      }
    })();
  }, [project]);

  useEffect(() => {
    if (!getState().project) return;
    uploadFile({
      pathname: `projects/${getState().project}/scale.json`,
      file: new Blob([JSON.stringify(scale)]),
    });
  }, [scale]);

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
