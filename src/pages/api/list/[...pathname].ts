import type { APIRoute } from "astro";
import fsp from "node:fs/promises";
import { resolveUploadPath } from "../../../lib/fsPaths";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const dirPath = resolveUploadPath(params.pathname);
  if (!dirPath) {
    return new Response(JSON.stringify({ data: [] }), { status: 200 });
  }
  try {
    const data = await fsp.readdir(dirPath);
    return new Response(JSON.stringify({ data }), { status: 200 });
  } catch {
    return new Response(JSON.stringify({ data: [] }), { status: 200 });
  }
};
