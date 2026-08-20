import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://www.telli-apps.de",
  output: "static",
  trailingSlash: "always",
  build: {
    format: "directory",
    inlineStylesheets: "always",
  },
  compressHTML: true,
});
