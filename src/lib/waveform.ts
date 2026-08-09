import { FPS } from "./constants";

export async function drawAudioWaveform(src: string): Promise<HTMLCanvasElement> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const result = await fetch(src);
  const arrayBuffer = await result.arrayBuffer();
  return new Promise((resolve) => {
    audioContext.decodeAudioData(arrayBuffer, (buffer) => {
      const canvas = document.createElement("canvas");
      canvas.width = buffer.duration * FPS;
      canvas.height = 100;
      const width = canvas.width;
      const height = canvas.height;
      const ctx = canvas.getContext("2d")!;
      const data = buffer.getChannelData(0);
      const bufferLength = data.length;
      const sliceWidth = width / bufferLength;
      let x = 0;

      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = "rgb(0, 0, 0)";
      ctx.lineWidth = 1;
      ctx.beginPath();

      for (let i = 0; i < bufferLength; i++) {
        const v = data[i];
        const y = (v + 1) * (height / 2);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      resolve(canvas);
    });
  });
}
