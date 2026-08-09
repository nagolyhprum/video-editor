import { getState, setState } from "./store";
import { downloadFile, listFiles, uploadFile } from "../lib/api";
import { getBlobText, getVideoDuration } from "../lib/media";
import type { ActiveClip, ArrowMedia, CircleMedia, Clip, FocusMedia } from "./types";

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

export async function init(): Promise<void> {
  const projects = await listFiles({ pathname: "projects" });
  setState({ projects });
}

export async function saveTimeline(): Promise<void> {
  const state = getState();
  if (!state.project) return;
  await uploadFile({
    file: new Blob([JSON.stringify(state.timeline)]),
    pathname: `projects/${state.project}/timeline.json`,
  });
}

export async function setProject(name: string): Promise<void> {
  const timeline = await downloadFile({ pathname: `projects/${name}/timeline.json` });
  if (!timeline) return;
  setState({
    project: name,
    timeline: JSON.parse(await getBlobText(timeline)),
  });
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
  await uploadFile({ file: new Blob([JSON.stringify(timeline)]), pathname: `projects/${project}/timeline.json` });
  setState({
    projects: getState().projects.concat(project),
  });
  await setProject(project);
}

export function moveMarker(seconds: number): void {
  setState({ time: seconds, isPlaying: false });
}

export function seekLeft(): void {
  setState({ time: getState().time - 1 / 16 });
}

export function seekRight(): void {
  setState({ time: getState().time + 1 / 16 });
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

export function deleteMedia(clip: Clip, mediaId: string): void {
  const state = getState();
  const clipIndex = state.timeline.indexOf(clip);
  if (clipIndex === -1) return;
  setState({
    timeline: [
      ...state.timeline.slice(0, clipIndex),
      { ...clip, media: clip.media.filter((media) => media.id !== mediaId) },
      ...state.timeline.slice(clipIndex + 1),
    ],
  });
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
