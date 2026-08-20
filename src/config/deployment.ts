const rawBase = import.meta.env.BASE_URL || "/";

export const DEPLOY_BASE = rawBase === "/" ? "" : rawBase.replace(/\/$/, "");

export function withBase(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${DEPLOY_BASE}${normalizedPath}`;
}
