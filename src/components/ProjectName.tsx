import { useEditorState } from "../state/store";

export default function ProjectName() {
  const project = useEditorState((s) => s.project);
  return (
    <div id="project" className="text-lg font-semibold">
      {project}
    </div>
  );
}
