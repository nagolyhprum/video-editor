import { useEditorState } from "../state/store";
import { setProject } from "../state/actions";

export default function ProjectsList() {
  const projects = useEditorState((s) => s.projects);

  return (
    <ul id="projects" className="flex flex-col gap-1">
      {projects.map((project) => (
        <li key={project}>
          <button onClick={() => setProject(project)} className="text-sm underline hover:no-underline">
            {project}
          </button>
        </li>
      ))}
    </ul>
  );
}
