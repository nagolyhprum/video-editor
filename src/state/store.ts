import { useSyncExternalStore } from "react";
import type { EditorState } from "./types";

const initialState: EditorState = {
  projects: [],
  project: "",
  timeline: [],
  time: 0,
  preview: null,
  isPlaying: false,
  isRecording: false,
  isMobile: false,
  scale: 100,
  duration: 0,
  topCrop: 0,
  marginThumbnails: [],
};

let state: EditorState = initialState;
const listeners = new Set<() => void>();

export function getState(): EditorState {
  return state;
}

export function setState(partial: Partial<EditorState>): void {
  state = { ...state, ...partial };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useEditorState<T>(selector: (state: EditorState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state));
}
