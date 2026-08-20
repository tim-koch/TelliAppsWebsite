import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const port = Number(process.env.PORT ?? 4173);
const root = resolve("dist");
const contentTypes = {
  ".avif": "image/avif",
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webm": "video/webm",
  ".webp": "image/webp",
  ".xml": "application/xml; charset=utf-8",
};

function resolveRequest(pathname) {
  const safePath = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const candidate = resolve(root, `.${safePath}`);
  if (!candidate.startsWith(root)) return undefined;

  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  if (existsSync(candidate) && statSync(candidate).isDirectory()) {
    const index = join(candidate, "index.html");
    if (existsSync(index)) return index;
  }

  const deepLink = safePath.match(
    /^[/\\](planteller)[/\\](recipe-share|collection-share|invite|reset-password)(?:[/\\].*)?$/,
  );
  if (deepLink) return join(root, deepLink[1], deepLink[2], "index.html");

  if (safePath.startsWith("/planteller"))
    return join(root, "planteller", "404", "index.html");
  if (safePath.startsWith("/planparty"))
    return join(root, "planparty", "404", "index.html");
  return join(root, "404.html");
}

const server = createServer((request, response) => {
  const pathname = new URL(request.url ?? "/", `http://${request.headers.host}`).pathname;
  const file = resolveRequest(pathname);

  if (!file || !existsSync(file)) {
    response.writeHead(404).end("Not found");
    return;
  }

  const isFallback =
    file.endsWith("404.html") || file.endsWith(join("404", "index.html"));
  response.writeHead(isFallback ? 404 : 200, {
    "Content-Type": contentTypes[extname(file)] ?? "application/octet-stream",
    "Cache-Control": "no-store",
  });
  createReadStream(file).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`Testserver läuft auf http://127.0.0.1:${port}\n`);
});

process.on("SIGTERM", () => server.close());
process.on("SIGINT", () => server.close());
