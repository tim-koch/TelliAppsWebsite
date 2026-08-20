import { strict as assert } from "node:assert";
import { readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";

const basePath = (process.env.PAGES_BASE_PATH || "/TelliAppsWebsite").replace(/\/$/, "");
const pagesOrigin = (
  process.env.PUBLIC_GITHUB_PAGES_ORIGIN || "https://tim-koch.github.io"
).replace(/\/$/, "");
const output = resolve("dist");

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return htmlFiles(path);
      return entry.name.endsWith(".html") ? [path] : [];
    }),
  );
  return nested.flat();
}

const files = await htmlFiles(output);
assert(files.length >= 29, `Nur ${files.length} HTML-Seiten im Pages-Build gefunden.`);

for (const file of files) {
  const html = await readFile(file, "utf8");
  const rootRelativeReferences = [
    ...html.matchAll(/(?:href|src|poster)=["'](\/(?!\/)[^"']*)["']/g),
  ].map((match) => match[1]);

  for (const reference of rootRelativeReferences) {
    assert(
      reference === basePath || reference.startsWith(`${basePath}/`),
      `${file}: ${reference} enthält den Pages-Basispfad ${basePath} nicht.`,
    );
  }
}

const homepage = await readFile(join(output, "index.html"), "utf8");
assert(
  homepage.includes(`${basePath}/_astro/`),
  "Astro-Assets nutzen den Basispfad nicht.",
);
assert(
  homepage.includes(`${pagesOrigin}${basePath}/planteller`),
  "Der PlanTeller-Link zeigt nicht auf die Pages-Vorschau.",
);
assert(
  homepage.includes(`${pagesOrigin}${basePath}/planparty`),
  "Der PlanParty-Link zeigt nicht auf die Pages-Vorschau.",
);

process.stdout.write(
  `${files.length} HTML-Seiten sind für ${pagesOrigin}${basePath}/ bereit.\n`,
);
