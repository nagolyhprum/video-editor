import { getState, setState } from "./store";
import { deleteFile, downloadFile, listFiles, uploadFile } from "../lib/api";
import { getBlobText, getVideoDuration } from "../lib/media";
import type { ActiveClip, ArrowMedia, CircleMedia, Clip, FocusMedia, PhotoMedia, ScreenshotMedia } from "./types";

export function getActiveClip(): ActiveClip | null {
  const state = getState();
  let start = 0;
  for (let index = 0; index < state.timeline.length; index++) {
    const clip = state.timeline[index];
    if (start + clip.length > state.time) {
      return { clip, start, index };
    }
    start += clip.length;
  }
  return null;
}

export function getTimelineDuration(): number {
  return getState().timeline.reduce((total, clip) => total + clip.length, 0);
}

// getActiveClip's own boundary check is a strict `>`, so clamping to exactly
// getTimelineDuration() lands on a value no clip's range actually contains --
// nudge just inside it instead, so a clamped time always resolves to the
// last clip rather than falling through to no active clip at all.
export function clampTime(seconds: number): number {
  const duration = getTimelineDuration();
  return Math.max(0, Math.min(seconds, Math.max(0, duration - 1e-6)));
}

const LAST_PROJECT_STORAGE_KEY = "video-editor:lastProject";

export async function init(): Promise<void> {
  const projects = await listFiles({ pathname: "projects" });
  setState({ projects });
  const lastProject = localStorage.getItem(LAST_PROJECT_STORAGE_KEY);
  if (lastProject && projects.includes(lastProject)) {
    await setProject(lastProject);
  }
}

interface ProjectProps {
  timeline: Clip[];
  scale: number;
  topCrop: number;
}

export async function saveProjectProps(): Promise<void> {
  const state = getState();
  if (!state.project) return;
  const props: ProjectProps = {
    timeline: state.timeline,
    scale: state.scale,
    topCrop: state.topCrop,
  };
  await uploadFile({
    file: new Blob([JSON.stringify(props)]),
    pathname: `projects/${state.project}/project.json`,
  });
}

// Loads a project saved before props were consolidated into one file --
// timeline.json is required (its absence means the project doesn't exist
// at all); scale.json/topCrop.json are optional, since older projects
// predate those features too.
async function loadLegacyProjectProps(name: string): Promise<ProjectProps | null> {
  const timelineBlob = await downloadFile({ pathname: `projects/${name}/timeline.json` });
  if (!timelineBlob) return null;

  const [scaleBlob, topCropBlob] = await Promise.all([
    downloadFile({ pathname: `projects/${name}/scale.json` }),
    downloadFile({ pathname: `projects/${name}/topCrop.json` }),
  ]);

  return {
    timeline: JSON.parse(await getBlobText(timelineBlob)),
    scale: scaleBlob ? JSON.parse(await getBlobText(scaleBlob)) : 100,
    topCrop: topCropBlob ? JSON.parse(await getBlobText(topCropBlob)) : 0,
  };
}

export async function setProject(name: string): Promise<void> {
  const projectBlob = await downloadFile({ pathname: `projects/${name}/project.json` });
  let props: ProjectProps | null;
  if (projectBlob) {
    props = JSON.parse(await getBlobText(projectBlob)) as ProjectProps;
  } else {
    props = await loadLegacyProjectProps(name);
    if (!props) return;
    // Migrate onto the consolidated file so future loads/saves take the
    // single-file path -- the old per-prop files are left in place, unused.
    await uploadFile({
      file: new Blob([JSON.stringify(props)]),
      pathname: `projects/${name}/project.json`,
    });
  }
  setState({
    project: name,
    timeline: props.timeline,
    scale: props.scale,
    topCrop: props.topCrop,
  });
  localStorage.setItem(LAST_PROJECT_STORAGE_KEY, name);
}

export async function handleFileUpload(files: FileList | File[]): Promise<void> {
  const fileList = Array.from(files);
  if (!fileList.length) return;
  const project = prompt("What would you like to name your new project?", fileList[0].name);
  if (!project) return;

  const timeline: Clip[] = [
    {
      id: crypto.randomUUID(),
      start: 0,
      length: await getVideoDuration(fileList[0]),
      type: "video",
      media: [],
      text: "",
    },
  ];
  await uploadFile({ file: fileList[0], pathname: `projects/${project}/video.mp3` });
  const props: ProjectProps = { timeline, scale: 100, topCrop: 0 };
  await uploadFile({ file: new Blob([JSON.stringify(props)]), pathname: `projects/${project}/project.json` });
  setState({
    projects: getState().projects.concat(project),
  });
  await setProject(project);
}

export function seekLeft(): void {
  setState({ time: clampTime(getState().time - 1 / 16) });
}

export function seekRight(): void {
  setState({ time: clampTime(getState().time + 1 / 16) });
}

export function goToBeginning(): void {
  setState({ time: 0 });
}

export function goToClipStart(): void {
  const result = getActiveClip();
  if (!result) return;
  setState({ time: result.start });
}

export function splitClip(): void {
  const result = getActiveClip();
  if (!result) return;
  const { clip, start, index } = result;
  const state = getState();
  const length = state.time - start;
  setState({
    timeline: [
      ...state.timeline.slice(0, index),
      {
        ...clip,
        id: crypto.randomUUID(),
        length,
        media: clip.media.filter((media) => media.start < length),
      },
      {
        ...clip,
        id: crypto.randomUUID(),
        start: length + clip.start,
        length: clip.length - length,
        text: "",
        media: clip.media
          .filter((media) => media.start >= length)
          .map((media) => ({ ...media, id: crypto.randomUUID(), start: media.start - length })),
      },
      ...state.timeline.slice(index + 1),
    ],
  });
}

export function makeStill(): void {
  const result = getActiveClip();
  if (!result) return;
  const { clip, start, index } = result;
  const state = getState();
  const length = state.time - start;
  setState({
    timeline: [
      ...state.timeline.slice(0, index),
      {
        ...clip,
        id: crypto.randomUUID(),
        length,
        media: clip.media.filter((media) => media.start < length),
      },
      {
        id: crypto.randomUUID(),
        type: "image",
        start: length + clip.start,
        length: 5,
        media: [],
        text: "",
      },
      {
        ...clip,
        id: crypto.randomUUID(),
        start: length + clip.start,
        length: clip.length - length,
        text: "",
        media: clip.media
          .filter((media) => media.start >= length)
          .map((media) => ({ ...media, id: crypto.randomUUID(), start: media.start - length })),
      },
      ...state.timeline.slice(index + 1),
    ],
  });
}

export function deleteClip(): void {
  const result = getActiveClip();
  if (!result) return;
  const { index } = result;
  const state = getState();
  setState({
    timeline: [...state.timeline.slice(0, index), ...state.timeline.slice(index + 1)],
  });
}

export function restoreClip(): void {
  const result = getActiveClip();
  if (!result) return;
  const { clip, start, index } = result;
  const state = getState();
  const side = Math.round((state.time - start) / clip.length) * 2 - 1;
  const lowerSide = state.timeline[Math.min(index, index + side)];
  const upperSide = state.timeline[Math.max(index, index + side)];
  const newStart = lowerSide.start;
  const outIndex = Math.min(index, index + side);

  if (!upperSide) {
    setState({
      timeline: [
        ...state.timeline.slice(0, outIndex),
        {
          id: crypto.randomUUID(),
          type: "video",
          start: newStart,
          length: state.duration - newStart,
          text: `${lowerSide.text}`,
          media: lowerSide.media,
        },
      ],
    });
  } else {
    setState({
      timeline: [
        ...state.timeline.slice(0, outIndex),
        {
          id: crypto.randomUUID(),
          type: "video",
          start: newStart,
          length: upperSide.start + upperSide.length - newStart,
          text: `${lowerSide.text} ${upperSide.text}`,
          media: [
            ...lowerSide.media,
            ...upperSide.media.map((media) => ({
              ...media,
              id: crypto.randomUUID(),
              start: media.start + (upperSide.start - lowerSide.start),
            })),
          ],
        },
        ...state.timeline.slice(outIndex + 2),
      ],
    });
  }
}

export function createCirclePreview(): void {
  const result = getActiveClip();
  if (!result) return;
  const { start } = result;
  const state = getState();
  const preview: CircleMedia = {
    id: crypto.randomUUID(),
    type: "circle",
    clicks: 0,
    width: 0.1,
    height: 0.1,
    x: 0.5,
    y: 0.5,
    length: 2,
    start: state.time - start,
  };
  setState({ preview });
}

export function createArrowPreview(): void {
  const result = getActiveClip();
  if (!result) return;
  const { start } = result;
  const state = getState();
  const preview: ArrowMedia = {
    id: crypto.randomUUID(),
    type: "arrow",
    clicks: 0,
    points: [
      { x: 0.25, y: 0.25 },
      { x: 0.75, y: 0.25 },
      { x: 0.25, y: 0.75 },
      { x: 0.75, y: 0.75 },
    ],
    length: 2,
    start: state.time - start,
  };
  setState({ preview });
}

export function createFocusPreview(): void {
  const result = getActiveClip();
  if (!result) return;
  const { start } = result;
  const state = getState();
  const length = Number(prompt("Enter a value", "1"));
  const preview: FocusMedia = {
    id: crypto.randomUUID(),
    type: "focus",
    clicks: 0,
    x: 0.5,
    y: 0.5,
    start: state.time - start,
    length,
  };
  setState({ preview });
}

export function createScreenshotPreview(): void {
  const result = getActiveClip();
  if (!result) return;
  const { start } = result;
  const state = getState();
  const preview: ScreenshotMedia = {
    id: crypto.randomUUID(),
    type: "screenshot",
    clicks: 0,
    x: 0.25,
    y: 0.25,
    width: 0.5,
    height: 0.5,
    label: "",
    start: state.time - start,
    length: 2,
  };
  setState({ preview });
}

/** Prompts for a file, then a label, then uploads and adds it to the active
 * clip at the current time -- same left-margin stack and timeline treatment
 * as a screenshot, just sourced from an upload instead of a video crop. */
export async function createPhotoMedia(file: File): Promise<void> {
  const result = getActiveClip();
  if (!result) return;
  const { clip, start, index } = result;
  const label = prompt("Enter a label for this image");
  if (label === null) return;
  const state = getState();
  if (!state.project) return;

  const extension = file.name.split(".").pop() || "png";
  const path = `projects/${state.project}/images/${crypto.randomUUID()}.${extension}`;
  await uploadFile({ file, pathname: path });

  const media: PhotoMedia = {
    id: crypto.randomUUID(),
    type: "photo",
    src: `/api/download/${path}`,
    label,
    start: state.time - start,
    length: 2,
  };
  setState({
    timeline: [
      ...state.timeline.slice(0, index),
      { ...clip, media: [...clip.media, media] },
      ...state.timeline.slice(index + 1),
    ],
  });
}

export interface MarginMediaScreenshot {
  kind: "screenshot";
  media: ScreenshotMedia;
  absoluteTime: number;
  // Position in the *raw source file* (video.mp3) this screenshot's clip
  // was taken from -- clip.start is a source-file offset, not an edited-
  // timeline one, so this is what an independent <video> seek needs to land
  // on the actual captured frame.
  sourceTime: number;
}

export interface MarginMediaPhoto {
  kind: "photo";
  media: PhotoMedia;
  absoluteTime: number;
}

export type MarginMediaItem = MarginMediaScreenshot | MarginMediaPhoto;

/** Every screenshot/photo media item across the whole timeline, with its
 * edited-timeline capture/placement time -- used to drive the left-margin
 * box stack, which isn't scoped to the active clip. */
export function getAllMarginMedia(): MarginMediaItem[] {
  const state = getState();
  const results: MarginMediaItem[] = [];
  let clipStart = 0;
  for (const clip of state.timeline) {
    for (const media of clip.media) {
      if (media.type === "screenshot") {
        results.push({
          kind: "screenshot",
          media,
          absoluteTime: clipStart + media.start,
          sourceTime: clip.start + media.start,
        });
      } else if (media.type === "photo") {
        results.push({ kind: "photo", media, absoluteTime: clipStart + media.start });
      }
    }
    clipStart += clip.length;
  }
  return results.sort((a, b) => a.absoluteTime - b.absoluteTime);
}

export function deleteMedia(clip: Clip, mediaId: string): void {
  const state = getState();
  const clipIndex = state.timeline.indexOf(clip);
  if (clipIndex === -1) return;
  const media = clip.media.find((m) => m.id === mediaId);
  setState({
    timeline: [
      ...state.timeline.slice(0, clipIndex),
      { ...clip, media: clip.media.filter((m) => m.id !== mediaId) },
      ...state.timeline.slice(clipIndex + 1),
    ],
  });

  // audio media has an actual uploaded file backing it -- annotations
  // (circle/arrow/focus) are pure timeline data, nothing to clean up server-side.
  if (media?.type === "audio") {
    const pathname = media.src.replace(/^\/api\/download\//, "");
    deleteFile({ pathname });
  }
}

export function updateMediaStart(clip: Clip, mediaId: string, start: number): void {
  const state = getState();
  setState({
    timeline: state.timeline.map((innerClip) => {
      if (innerClip.id !== clip.id) return innerClip;
      return {
        ...innerClip,
        media: innerClip.media.map((innerMedia) =>
          innerMedia.id === mediaId ? { ...innerMedia, start } : innerMedia
        ),
      };
    }),
  });
}

export function updateClipText(text: string): void {
  const result = getActiveClip();
  if (!result) return;
  const { clip, index } = result;
  const state = getState();
  setState({
    timeline: [
      ...state.timeline.slice(0, index),
      { ...clip, text },
      ...state.timeline.slice(index + 1),
    ],
  });
}

/**
 * Merges every clip's media (and image-still clips) into padded time spans,
 * splitting the timeline along those spans so unrelated footage can be
 * trimmed away. Ported as-is from the original media-clip.js.
 */
export function mergeMediaClips(): void {
  const offsetInput = prompt("Offset", "3");
  const OFFSET = parseFloat(offsetInput ?? "3");
  const state = getState();

  const media = state.timeline.flatMap((clip) =>
    clip.type === "image"
      ? [{ from: clip.start - OFFSET, to: clip.start + OFFSET, clipId: clip.id }]
      : clip.media.map((item) => ({
          from: clip.start + item.start - OFFSET,
          to: clip.start + item.start + item.length + OFFSET,
          clipId: clip.id,
        }))
  );

  for (let i = 0; i < media.length; i++) {
    for (let j = 0; j < media.length; j++) {
      if (i !== j) {
        if (
          (media[i].from <= media[j].from && media[j].from <= media[i].to) ||
          (media[i].from <= media[j].to && media[j].to <= media[i].to) ||
          (media[j].from <= media[i].from && media[i].from <= media[j].to) ||
          (media[j].from <= media[i].to && media[i].to <= media[j].to)
        ) {
          media[i].from = Math.min(media[i].from, media[j].from);
          media[i].to = Math.max(media[i].to, media[j].to);
          media.splice(j, 1);
          j--;
        }
      }
    }
  }

  const output: Clip[] = state.timeline.flatMap((clip) => {
    if (clip.type === "image") {
      return [clip];
    }
    const overlaps = media.filter((span) => {
      const a = span.from <= clip.start && clip.start <= span.to;
      const b = span.from <= clip.start + clip.length && clip.start + clip.length <= span.to;
      const c = clip.start <= span.from && span.from <= clip.start + clip.length;
      const d = clip.start <= span.to && span.to <= clip.start + clip.length;
      return a || b || c || d;
    });
    return overlaps.map((overlap, index) => {
      const start = Math.max(overlap.from, clip.start);
      const length = Math.min(overlap.to, clip.start + clip.length) - start;
      return {
        id: crypto.randomUUID(),
        start,
        length,
        media: clip.media
          .filter(
            (item) =>
              clip.start + item.start >= overlap.from && clip.start + item.start + item.length <= overlap.to
          )
          .map((item) => ({ ...item, start: clip.start - start + item.start })),
        text: index === 0 ? clip.text : "",
        type: clip.type,
      };
    });
  });

  setState({ timeline: output });
}
