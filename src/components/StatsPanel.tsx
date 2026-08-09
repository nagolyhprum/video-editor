import { useEditorState } from "../state/store";
import { getActiveClip } from "../state/actions";

function toTime(input: number): string {
  const minutes = Math.floor(input / 60);
  const seconds = Math.floor(input % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function StatsPanel() {
  const time = useEditorState((s) => s.time);
  const timeline = useEditorState((s) => s.timeline);
  const result = getActiveClip();

  if (!result) {
    return <div id="stats" className="max-h-[360px] overflow-auto whitespace-pre text-xs" />;
  }

  const length = timeline.reduce((total, clip) => total + clip.length, 0);
  const json = {
    time: toTime(time),
    clipStart: toTime(result.clip.start),
    clipLength: toTime(result.clip.length),
    start: toTime(result.start),
    length: toTime(length),
    media: result.clip.media.length,
    stills: timeline.filter(({ type, media, text }) => type === "image" || media.length || text).length,
  };

  return (
    <div id="stats" className="max-h-[360px] overflow-auto whitespace-pre text-xs">
      {JSON.stringify(json, null, 2)}
    </div>
  );
}
