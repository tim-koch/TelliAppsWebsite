import { chromium } from "@playwright/test";
import { mkdir, readFile, rm } from "node:fs/promises";
import { extname, resolve } from "node:path";

/* global document */

const outputDirectory = resolve("public/media");
const posterDirectory = resolve("public/assets");
const temporaryDirectory = resolve(".media-tmp");

const demos = [
  {
    id: "planteller",
    name: "PlanTeller",
    color: "#667d62",
    background: "#f5f1eb",
    darkColor: "#a5b59b",
    darkBackground: "#1b1b1b",
    darkInk: "#f0e9df",
    frames: [
      [
        "src/assets/planteller/screenshots/recipes.png",
        "Eigene Rezepte durchsuchen und filtern",
      ],
      [
        "src/assets/planteller/screenshots/weekly-plan-detail.png",
        "Ein geplantes Abendessen öffnen und ändern",
      ],
      [
        "src/assets/planteller/screenshots/smart-shopping-list.png",
        "Den Einkauf nach dem Regalprofil sortieren",
      ],
      [
        "src/assets/planteller/screenshots/telli-helper.png",
        "Telli hilft beim Einkauf und in der App",
      ],
    ],
  },
  {
    id: "planparty",
    name: "PlanParty",
    color: "#4f19b7",
    background: "#faf8fc",
    darkColor: "#c4a5ff",
    darkBackground: "#110d1b",
    darkInk: "#f8f5fc",
    frames: [
      ["src/assets/planparty/start.png", "Eine neue Party planen"],
      ["src/assets/planparty/event.png", "Den passenden Anlass auswählen"],
      ["src/assets/planparty/result.png", "Einkaufsmengen und Packungsgrößen prüfen"],
      ["src/assets/planparty/checklist.png", "Party-Aufgaben vorbereiten und abhaken"],
    ],
  },
];

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character];
  });
}

async function dataUrl(path) {
  const content = await readFile(resolve(path));
  const mime = extname(path) === ".jpg" ? "image/jpeg" : "image/png";
  return `data:${mime};base64,${content.toString("base64")}`;
}

async function renderDemo(browser, demo, theme) {
  const dark = theme === "dark";
  const color = dark ? demo.darkColor : demo.color;
  const background = dark ? demo.darkBackground : demo.background;
  const ink = dark ? demo.darkInk : "#211f1d";
  const suffix = dark ? "-dark" : "";
  const context = await browser.newContext({
    viewport: { width: 720, height: 1280 },
    colorScheme: theme,
    recordVideo: { dir: temporaryDirectory, size: { width: 720, height: 1280 } },
  });
  const page = await context.newPage();
  const frames = await Promise.all(
    demo.frames.map(async ([path, label], index) => ({
      index,
      label,
      source: await dataUrl(path),
    })),
  );

  await page.setContent(`<!doctype html>
    <html lang="de">
      <head>
        <meta charset="utf-8">
        <style>
          * { box-sizing: border-box; }
          html, body { width: 720px; height: 1280px; margin: 0; overflow: hidden; }
          body {
            position: relative;
            background:
              radial-gradient(circle at 80% 8%, ${color}26, transparent 27%),
              ${background};
            color: ${ink};
            font-family: "Segoe UI", system-ui, sans-serif;
          }
          .brand { position: absolute; z-index: 10; top: 64px; left: 88px; }
          .brand small { display: block; color: ${color}; font-size: 18px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
          .brand strong { display: block; margin-top: 1px; font-size: 42px; letter-spacing: -.04em; }
          .stage { position: absolute; inset: 118px 0 0; }
          .frame {
            position: absolute;
            inset: 0;
            display: grid;
            grid-template-rows: minmax(0, 1fr) 92px;
            place-items: center;
            padding: 18px 48px 38px;
            opacity: 0;
            transform: translateX(70px) scale(.98);
            transition: opacity .55s ease, transform .65s cubic-bezier(.2,.8,.2,1);
          }
          .frame.active { opacity: 1; transform: none; }
          .phone {
            height: 100%;
            aspect-ratio: 1080 / 2392;
            display: grid;
            place-items: center;
            overflow: hidden;
            border-radius: 48px;
            background: #fff;
            box-shadow: 0 30px 72px rgba(25,20,31,.18);
          }
          .phone img { width: 100%; height: 100%; object-fit: contain; border-radius: inherit; background: #fff; }
          .label { display: grid; place-items: center; padding: 14px 20px 0; text-align: center; }
          .label strong { max-width: 580px; color: ${color}; font-size: 30px; line-height: 1.12; letter-spacing: -.025em; }
          .progress { position: absolute; z-index: 10; right: 56px; bottom: 38px; left: 56px; height: 5px; overflow: hidden; border-radius: 10px; background: ${color}2b; }
          .progress::after { content: ""; display: block; width: 100%; height: 100%; background: ${color}; transform-origin: left; animation: progress 10s linear forwards; }
          @keyframes progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        </style>
      </head>
      <body>
        <div class="brand"><small>TelliApps Collection</small><strong>${escapeHtml(demo.name)}</strong></div>
        <div class="stage">
          ${frames.map((frame) => `<div class="frame${frame.index === 0 ? " active" : ""}" data-frame="${frame.index}"><div class="phone"><img src="${frame.source}" alt=""></div><div class="label"><strong>${escapeHtml(frame.label)}</strong></div></div>`).join("")}
        </div>
        <div class="progress"></div>
        <script>
          const frames = [...document.querySelectorAll('[data-frame]')];
          let active = 0;
          const timer = setInterval(() => {
            frames[active].classList.remove('active');
            active = (active + 1) % frames.length;
            frames[active].classList.add('active');
          }, 2400);
          setTimeout(() => clearInterval(timer), 9800);
        </script>
      </body>
    </html>`);

  await page.waitForFunction(() => [...document.images].every((image) => image.complete));
  await page.waitForTimeout(200);
  await page.screenshot({
    path: resolve(posterDirectory, `${demo.id}-video-poster${suffix}.webp`),
    type: "webp",
    quality: 90,
  });
  await page.waitForTimeout(10_000);
  const video = page.video();
  await context.close();
  await video.saveAs(resolve(outputDirectory, `${demo.id}-intro${suffix}.webm`));
}

await mkdir(outputDirectory, { recursive: true });
await mkdir(posterDirectory, { recursive: true });
await rm(temporaryDirectory, { recursive: true, force: true });
await mkdir(temporaryDirectory, { recursive: true });

const browser = await chromium.launch(
  process.env.CI ? { headless: true } : { headless: true, channel: "msedge" },
);
try {
  for (const demo of demos) {
    await renderDemo(browser, demo, "light");
    await renderDemo(browser, demo, "dark");
  }
} finally {
  await browser.close();
  await rm(temporaryDirectory, { recursive: true, force: true });
}
