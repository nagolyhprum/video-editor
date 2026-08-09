import { useEffect, useRef } from "react";
import { useEditorState } from "../state/store";
import { saveProjectProps } from "../state/actions";

const AUTO_SAVE_DEBOUNCE_MS = 1500;

// Silently persists the project a beat after edits stop, so work isn't lost
// if the user navigates away without hitting the (still-present) Save
// button. Renders nothing.
export default function AutoSave() {
  const project = useEditorState((s) => s.project);
  const timeline = useEditorState((s) => s.timeline);
  const scale = useEditorState((s) => s.scale);
  const topCrop = useEditorState((s) => s.topCrop);
  const loadedProjectRef = useRef<string | null>(null);

  useEffect(() => {
    if (!project) return;
    // The first fire right after a project (re)loads is the freshly-loaded
    // data settling into state, not an edit -- record it and skip saving,
    // then arm it for every actual change after.
    if (loadedProjectRef.current !== project) {
      loadedProjectRef.current = project;
      return;
    }
    const timeoutId = window.setTimeout(() => {
      saveProjectProps();
    }, AUTO_SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(timeoutId);
  }, [project, timeline, scale, topCrop]);

  return null;
}
