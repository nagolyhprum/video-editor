import path from "node:path";

export const UPLOADS_ROOT = path.join(process.cwd(), "uploads");

/**
 * Resolves a request-supplied pathname against the uploads root, rejecting
 * anything that escapes it (e.g. via "..") instead of trusting the caller.
 */
export function resolveUploadPath(pathname: string | undefined): string | null {
  const resolved = path.resolve(UPLOADS_ROOT, pathname ?? "");
  const rootWithSep = UPLOADS_ROOT.endsWith(path.sep) ? UPLOADS_ROOT : UPLOADS_ROOT + path.sep;
  if (resolved !== UPLOADS_ROOT && !resolved.startsWith(rootWithSep)) {
    return null;
  }
  return resolved;
}
