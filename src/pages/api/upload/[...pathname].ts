import type { APIRoute } from "astro";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import busboy from "busboy";
import { resolveUploadPath } from "../../../lib/fsPaths";

export const prerender = false;

export const POST: APIRoute = async ({ params, request }) => {
  const destination = resolveUploadPath(params.pathname);
  if (!destination) {
    return new Response(JSON.stringify({ error: "Invalid path" }), { status: 400 });
  }
  if (!request.body) {
    return new Response(JSON.stringify({ error: "Missing body" }), { status: 400 });
  }

  try {
    await fsp.mkdir(path.dirname(destination), { recursive: true });
    await new Promise<void>((resolve, reject) => {
      const bb = busboy({ headers: { "content-type": request.headers.get("content-type") ?? "" } });
      let sawFile = false;
      bb.on("file", (_name, fileStream) => {
        sawFile = true;
        const writeStream = fs.createWriteStream(destination);
        fileStream.pipe(writeStream);
        writeStream.on("finish", resolve);
        writeStream.on("error", reject);
        fileStream.on("error", reject);
      });
      bb.on("error", reject);
      bb.on("finish", () => {
        if (!sawFile) resolve();
      });
      Readable.fromWeb(request.body as import("node:stream/web").ReadableStream).pipe(bb);
    });
    return new Response(JSON.stringify({ message: "File uploaded successfully" }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 404 });
  }
};
