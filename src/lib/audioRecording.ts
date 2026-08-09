import { uploadFile } from "./api";
import { getState, setState } from "../state/store";
import { getActiveClip } from "../state/actions";
import type { AudioMedia } from "../state/types";

async function findTimeOffsetOfFirstSound(audioFile: string): Promise<number> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const response = await fetch(audioFile);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = await audioContext.decodeAudioData(arrayBuffer);
  const offsetInSeconds = await analyzeAudioBuffer(buffer, audioContext);
  audioContext.close();
  return offsetInSeconds;
}

function analyzeAudioBuffer(buffer: AudioBuffer, audioContext: AudioContext): Promise<number> {
  return new Promise((resolve) => {
    const source = audioContext.createBufferSource();
    source.buffer = buffer;

    const scriptNode = audioContext.createScriptProcessor(4096, 1, 1);
    let offset = 0;
    scriptNode.onaudioprocess = (event) => {
      const inputData = event.inputBuffer.getChannelData(0);
      for (let i = 0; i < inputData.length; i++) {
        if (Math.abs(inputData[i]) >= 0.1) {
          resolve((i + offset) / audioContext.sampleRate);
          scriptNode.onaudioprocess = null;
          return;
        }
      }
      offset += inputData.length;
    };

    source.connect(scriptNode);
    scriptNode.connect(audioContext.destination);
    source.start();
  });
}

let mediaRecorder: MediaRecorder | null = null;
let recordedChunks: BlobPart[] = [];
let recordWith: string | null = null;

async function getAudioInputDeviceId(): Promise<string> {
  if (recordWith !== null) {
    return recordWith;
  }
  const devices = await navigator.mediaDevices.enumerateDevices();
  const audioInputSources = devices.filter((device) => device.kind === "audioinput");
  let message = "Select an audio input source:";
  audioInputSources.forEach((source, index) => {
    message += `\n${index + 1}. ${source.label || "Unnamed Source"}`;
  });
  const userInput = prompt(message);
  const selectedIndex = parseInt(userInput ?? "", 10) - 1;
  const selectedDevice = audioInputSources[selectedIndex];
  recordWith = selectedDevice.deviceId;
  return recordWith;
}

function onRecordingStop(): void {
  (async () => {
    const audioBlob = new Blob(recordedChunks, { type: "audio/wav" });
    recordedChunks = [];
    const path = `projects/${getState().project}/audio/${crypto.randomUUID()}.wav`;
    await uploadFile({ file: audioBlob, pathname: path });

    const offset = await findTimeOffsetOfFirstSound(`/api/download/${path}`);

    const audio = new Audio(URL.createObjectURL(audioBlob));
    audio.onseeked = () => {
      const result = getActiveClip();
      if (!result) return;
      const { clip, start, index } = result;
      const state = getState();

      if (clip.type === "video") {
        const media: AudioMedia = {
          id: crypto.randomUUID(),
          type: "audio",
          src: `/api/download/${path}`,
          start: state.time - start - offset,
          length: audio.duration,
        };
        setState({
          timeline: [
            ...state.timeline.slice(0, index),
            { ...clip, media: [...clip.media, media] },
            ...state.timeline.slice(index + 1),
          ],
        });
      } else {
        const media: AudioMedia = {
          id: crypto.randomUUID(),
          type: "audio",
          src: `/api/download/${path}`,
          start: -offset,
          length: audio.duration,
        };
        setState({
          time: start,
          timeline: [
            ...state.timeline.slice(0, index),
            { ...clip, id: crypto.randomUUID(), length: audio.duration - offset, media: [media] },
            ...state.timeline.slice(index + 1),
          ],
        });
      }
    };
    audio.currentTime = 1000;
  })();
}

export function isRecordingAudio(): boolean {
  return !!mediaRecorder && mediaRecorder.state !== "inactive";
}

export async function toggleAudioRecording(): Promise<void> {
  if (isRecordingAudio()) {
    mediaRecorder!.stop();
    return;
  }
  try {
    const deviceId = await getAudioInputDeviceId();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId } });
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };
    mediaRecorder.onstop = onRecordingStop;
    mediaRecorder.start();
  } catch (error) {
    console.error("Error accessing microphone:", error);
  }
}
