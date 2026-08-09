import { useEditorState } from "../../state/store";
import { FPS } from "../../lib/constants";

export default function Thumbnails() {
  const timeline = useEditorState((s) => s.timeline);

  return (
    <div id="thumbnails" className="whitespace-nowrap">
      {timeline.map((clip) => (
        <div
          key={clip.id}
          id={clip.id}
          className={`box-border inline-block border-[10px] ${
            clip.type === "video" ? "border-purple-600" : "border-orange-500"
          }`}
          style={{ width: Math.round(clip.length * FPS), height: 50 }}
        />
      ))}
    </div>
  );
}
