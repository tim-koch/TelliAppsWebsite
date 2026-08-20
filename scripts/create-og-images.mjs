import { Buffer } from "node:buffer";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const outputDirectory = resolve("public/assets");
await mkdir(outputDirectory, { recursive: true });

const screenshot = await sharp("src/assets/planparty/start.png")
  .resize({ height: 530 })
  .png()
  .toBuffer();
const icon = await sharp("src/assets/planparty/icon.png")
  .resize(112, 112)
  .png()
  .toBuffer();
const text = Buffer.from(`
  <svg width="720" height="300" xmlns="http://www.w3.org/2000/svg">
    <style>
      .title { font: 800 92px system-ui, sans-serif; fill: #fff; letter-spacing: -4px; }
      .copy { font: 600 34px system-ui, sans-serif; fill: #eee5ff; }
    </style>
    <text class="title" x="0" y="100">PlanParty</text>
    <text class="copy" x="0" y="170">Mengen planen statt raten.</text>
    <text class="copy" x="0" y="220">Lokal. Verständlich. Testbereit.</text>
  </svg>`);

await sharp({
  create: { width: 1200, height: 630, channels: 3, background: "#351080" },
})
  .composite([
    { input: icon, left: 76, top: 64 },
    { input: text, left: 76, top: 205 },
    {
      input: Buffer.from(
        '<svg width="390" height="580" xmlns="http://www.w3.org/2000/svg"><rect width="390" height="580" rx="44" fill="#fff" opacity=".12"/></svg>',
      ),
      left: 760,
      top: 24,
    },
    { input: screenshot, left: 806, top: 50 },
  ])
  .jpeg({ quality: 86, chromaSubsampling: "4:4:4" })
  .toFile(resolve(outputDirectory, "og-planparty.jpg"));
