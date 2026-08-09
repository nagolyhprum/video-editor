import { useEditorState } from "../state/store";

function copyTextToClipboard(text: string): void {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
  } catch (err) {
    console.error("Unable to copy text: ", err);
  }
  document.body.removeChild(textarea);
}

export default function TranscriptButton() {
  const timeline = useEditorState((s) => s.timeline);

  const handleClick = () => {
    const transcript = timeline
      .map((clip) => clip.text.trim())
      .join("\n")
      .replace(/[\n\r]+/g, "\n\n")
      .trim();
    copyTextToClipboard(transcript);
  };

  return (
    <button
      id="transcript"
      onClick={handleClick}
      className="rounded bg-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-300"
    >
      transcript
    </button>
  );
}
