import type { APIRoute } from "astro";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import mime from "mime-types";
import { resolveUploadPath } from "../../../lib/fsPaths";

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  const filePath = resolveUploadPath(params.pathname);
  if (!filePath) {
    return new Response(JSON.stringify({ error: "Invalid path" }), { status: 404 });
  }

  try {
    const stat = await fsp.stat(filePath);
    const contentType = mime.lookup(filePath) || "application/octet-stream";
    const filename = path.basename(filePath);
    const commonHeaders = {
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
      "Content-Disposition": `attachment; filename="${filename}"`,
    };

    const range = request.headers.get("range");
    if (range) {
      const match = /bytes=(\d*)-(\d*)/.exec(range);
      const start = match?.[1] ? parseInt(match[1], 10) : 0;
      const end = match?.[2] ? parseInt(match[2], 10) : stat.size - 1;
      const stream = fs.createReadStream(filePath, { start, end });
      return new Response(Readable.toWeb(stream) as ReadableStream, {
        status: 206,
        headers: {
          ...commonHeaders,
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Content-Length": String(end - start + 1),
        },
      });
    }

    const stream = fs.createReadStream(filePath);
    return new Response(Readable.toWeb(stream) as ReadableStream, {
      status: 200,
      headers: {
        ...commonHeaders,
        "Content-Length": String(stat.size),
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 404 });
  }
};
