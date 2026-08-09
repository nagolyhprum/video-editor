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

export type Media = CircleMedia | ArrowMedia | FocusMedia | AudioMedia;
export type MediaPreview = CircleMedia | ArrowMedia | FocusMedia;

export type ClipType = "video" | "image";

export interface Clip {
  id: string;
  start: number;
  length: number;
  type: ClipType;
  media: Media[];
  text: string;
}

export interface EditorState {
  projects: string[];
  project: string;
  timeline: Clip[];
  time: number;
  preview: MediaPreview | null;
  isPlaying: boolean;
  isRecording: boolean;
  isMobile: boolean;
  scale: number;
  duration: number;
  topCrop: number;
}

export interface ActiveClip {
  clip: Clip;
  start: number;
  index: number;
}
