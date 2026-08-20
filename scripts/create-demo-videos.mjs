import { chromium } from "@playwright/test";
import { mkdir, readFile, rm } from "node:fs/promises";
import { extname, resolve } from "node:path";

const outputDirectory = resolve("public/media");
const temporaryDirectory = resolve(".media-tmp");

const demos = [
  {
    id: "planteller",
    name: "PlanTeller",
    color: "#667d62",
    background: "#f5f1eb",
    frames: [
      ["src/assets/planteller/hero.png", "Rezepte an einem Ort"],
      ["src/assets/planteller/impression-3.png", "Einkauf gemeinsam erledigen"],
      ["src/assets/planteller/impression-5.png", "Die Woche entspannt planen"],
      ["src/assets/planteller/impression-4.png", "Vorräte im Blick behalten"],
    ],
  },
  {
    id: "planparty",
    name: "PlanParty",
    color: "#4f19b7",
    background: "#faf8fc",
    frames: [
      ["src/assets/planparty/start.png", "In etwa einer Minute starten"],
      ["src/assets/planparty/event.png", "Anlass und Gäste beschreiben"],
      ["src/assets/planparty/result.png", "Realistische Richtwerte erhalten"],
      ["src/assets/planparty/checklist.png", "Einkauf und Aufgaben abhaken"],
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

async function renderDemo(browser, demo) {
  const context = await browser.newContext({
    viewport: { width: 720, height: 1280 },
    colorScheme: "light",
    recordVideo: { dir: temporaryDirectory, size: { width: 360, height: 640 } },
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
              radial-gradient(circle at 80% 8%, ${demo.color}26, transparent 27%),
              ${demo.background};
            color: #211f1d;
            font-family: "Segoe UI", system-ui, sans-serif;
          }
          .brand { position: absolute; z-index: 10; top: 56px; left: 56px; }
          .brand small { display: block; color: ${demo.color}; font-size: 22px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
          .brand strong { display: block; margin-top: 2px; font-size: 48px; letter-spacing: -.04em; }
          .stage { position: absolute; inset: 150px 0 0; }
          .frame {
            position: absolute;
            inset: 0;
            display: grid;
            grid-template-rows: 1fr auto;
            place-items: center;
            padding: 40px 56px 64px;
            opacity: 0;
            transform: translateX(70px) scale(.98);
            transition: opacity .55s ease, transform .65s cubic-bezier(.2,.8,.2,1);
          }
          .frame.active { opacity: 1; transform: none; }
          .phone {
            width: min(500px, 86%);
            height: 900px;
            display: grid;
            place-items: center;
            padding: 17px;
            overflow: hidden;
            border: 8px solid #1d1b20;
            border-radius: 58px;
            background: #111;
            box-shadow: 0 34px 80px rgba(25,20,31,.22);
          }
          .phone img { width: 100%; height: 100%; object-fit: contain; border-radius: 40px; background: #fff; }
          .label { min-height: 105px; display: grid; place-items: center; padding: 20px; text-align: center; }
          .label strong { max-width: 560px; color: ${demo.color}; font-size: 36px; line-height: 1.12; letter-spacing: -.025em; }
          .progress { position: absolute; z-index: 10; right: 56px; bottom: 38px; left: 56px; height: 5px; overflow: hidden; border-radius: 10px; background: ${demo.color}2b; }
          .progress::after { content: ""; display: block; width: 100%; height: 100%; background: ${demo.color}; transform-origin: left; animation: progress 10s linear forwards; }
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

  await page.waitForTimeout(10_200);
  const video = page.video();
  await context.close();
  await video.saveAs(resolve(outputDirectory, `${demo.id}-intro.webm`));
}

await mkdir(outputDirectory, { recursive: true });
await rm(temporaryDirectory, { recursive: true, force: true });
await mkdir(temporaryDirectory, { recursive: true });

const browser = await chromium.launch(
  process.env.CI ? { headless: true } : { headless: true, channel: "msedge" },
);
try {
  for (const demo of demos) await renderDemo(browser, demo);
} finally {
  await browser.close();
  await rm(temporaryDirectory, { recursive: true, force: true });
}
