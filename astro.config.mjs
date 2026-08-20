/* global process */

import { defineConfig } from "astro/config";

const pagesBase = process.env.PAGES_BASE_PATH || "/";
const pagesOrigin = process.env.PUBLIC_GITHUB_PAGES_ORIGIN;

export default defineConfig({
  site: pagesOrigin || "https://www.telli-apps.de",
  base: pagesOrigin ? pagesBase : "/",
  output: "static",
  trailingSlash: "always",
  build: {
    format: "directory",
    inlineStylesheets: "always",
  },
  compressHTML: true,
});
