import type { APIRoute } from "astro";
import fsp from "node:fs/promises";
import { resolveUploadPath } from "../../../lib/fsPaths";

export const prerender = false;

export const DELETE: APIRoute = async ({ params }) => {
  const filePath = resolveUploadPath(params.pathname);
  if (!filePath) {
    return new Response(JSON.stringify({ error: "Invalid path" }), { status: 400 });
  }
  try {
    await fsp.unlink(filePath);
    return new Response(JSON.stringify({ message: "File deleted successfully" }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 404 });
  }
};
