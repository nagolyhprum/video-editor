export interface Point {
  x: number;
  y: number;
}

export interface CircleMedia {
  id: string;
  type: "circle";
  clicks: number;
  width: number;
  height: number;
  x: number;
  y: number;
  length: number;
  start: number;
}

export interface ArrowMedia {
  id: string;
  type: "arrow";
  clicks: number;
  points: [Point, Point, Point, Point];
  length: number;
  start: number;
}

export interface FocusMedia {
  id: string;
  type: "focus";
  clicks: number;
  x: number;
  y: number;
  start: number;
  length: number;
}

export interface AudioMedia {
  id: string;
  type: "audio";
  src: string;
  start: number;
  length: number;
}

export interface ScreenshotMedia {
  id: string;
  type: "screenshot";
  clicks: number;
  // (x, y) is the first-clicked corner (anchor), fixed once clicks >= 1.
  // width/height are the *signed* delta to the second corner -- can be
  // negative while the user is still dragging, normalized (via
  // normalizeRegion) whenever the region is actually needed.
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  start: number;
  length: number;
}

// An uploaded (not captured-from-video) image, labeled and shown in the same
// left-margin stack as screenshots. Named "photo" rather than "image" to
// avoid colliding with ClipType's own unrelated "image" (a still-frame clip).
export interface PhotoMedia {
  id: string;
  type: "photo";
  src: string;
  label: string;
  start: number;
  length: number;
}

export type Media = CircleMedia | ArrowMedia | FocusMedia | AudioMedia | ScreenshotMedia | PhotoMedia;
export type MediaPreview = CircleMedia | ArrowMedia | FocusMedia | ScreenshotMedia;

export type ClipType = "video" | "image";

export interface Clip {
  id: string;
  start: number;
  length: number;
  type: ClipType;
  media: Media[];
  text: string;
}

export interface MarginThumbnail {
  id: string;
  label: string;
  canvas: HTMLCanvasElement;
  absoluteTime: number;
}

export interface EditorState {
  projects: string[];
  project: string;
  video: string;
  timeline: Clip[];
  time: number;
  preview: MediaPreview | null;
  isPlaying: boolean;
  isRecording: boolean;
  isMobile: boolean;
  scale: number;
  duration: number;
  topCrop: number;
  // Generated thumbnails for each screenshot/photo media item, keyed by
  // media id -- shared here (rather than kept local to whichever component
  // generates them) since both the left-margin stack and the timeline's
  // media track need to display them.
  marginThumbnails: MarginThumbnail[];
}

export interface ActiveClip {
  clip: Clip;
  start: number;
  index: number;
}
