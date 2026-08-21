import { Buffer } from "node:buffer";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { stdout } from "node:process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetRoot = path.join(root, "store-assets", "planparty", "google-play");
const previewRoot = path.join(assetRoot, "preview");
const sourceRoot = path.join(assetRoot, "source");
const phoneRoot = path.join(assetRoot, "smartphone-9x16");
const tabletRoot = path.join(assetRoot, "tablet-16x9");

const backgroundPath = path.join(sourceRoot, "background-planparty.png");
const markPath = path.join(sourceRoot, "planparty-mark.png");

const motifs = [
  {
    slug: "01-schnell-starten",
    route: "start",
    kicker: "IN ETWA EINER MINUTE",
    title: ["Deine Feier.", "Klar geplant."],
    subtitle: "Realistische Mengen statt Bauchgefühl.",
  },
  {
    slug: "02-anlass-auswaehlen",
    route: "event",
    kicker: "ACHT FEIERPROFILE",
    title: ["Passend zu", "deinem Anlass."],
    subtitle: "Von Grillparty bis Spieleabend.",
  },
  {
    slug: "03-mengen-berechnen",
    route: "result",
    kicker: "VERSTÄNDLICHE RICHTWERTE",
    title: ["Mengen, die du", "einkaufen kannst."],
    subtitle: "Stück, Packungen und Flaschen auf einen Blick.",
  },
  {
    slug: "04-einkauf-abhaken",
    route: "shopping-list",
    kicker: "EINKAUFSLISTE",
    title: ["Einfach abhaken.", "Einfach teilen."],
    subtitle: "Alles bleibt lokal auf deinem Gerät.",
  },
  {
    slug: "05-party-checkliste",
    route: "party-checklist",
    kicker: "PARTY-CHECKLISTE",
    title: ["Vorbereitet,", "wenn es zählt."],
    subtitle: "Automatische Vorschläge und eigene Aufgaben.",
  },
];

function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function svgBuffer(content, width, height) {
  return Buffer.from(
    `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`,
  );
}

async function roundedScreenshot(file, width, height, radius) {
  const mask = svgBuffer(
    `<rect width="${width}" height="${height}" rx="${radius}" fill="white"/>`,
    width,
    height,
  );
  return sharp(file)
    .resize(width, height, { fit: "cover", position: "centre" })
    .ensureAlpha()
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

async function backdrop(width, height) {
  return sharp(backgroundPath).resize(width, height, { fit: "fill" }).png().toBuffer();
}

function phoneText(motif) {
  const [lineOne, lineTwo] = motif.title.map(escapeXml);
  return svgBuffer(
    `<style>
      .brand { font: 800 34px 'Segoe UI', Arial, sans-serif; fill: #171229; }
      .kicker { font: 800 24px 'Segoe UI', Arial, sans-serif; letter-spacing: 2.6px; fill: #5b21b6; }
      .title { font: 800 68px 'Segoe UI', Arial, sans-serif; fill: #171229; }
      .subtitle { font: 500 29px 'Segoe UI', Arial, sans-serif; fill: #5f596c; }
    </style>
    <text class="brand" x="160" y="105">PlanParty</text>
    <text class="kicker" x="72" y="190">${escapeXml(motif.kicker)}</text>
    <text class="title" x="72" y="282">${lineOne}</text>
    <text class="title" x="72" y="360">${lineTwo}</text>
    <text class="subtitle" x="72" y="430">${escapeXml(motif.subtitle)}</text>`,
    1080,
    1920,
  );
}

function tabletText(motif) {
  const [lineOne, lineTwo] = motif.title.map(escapeXml);
  return svgBuffer(
    `<style>
      .brand { font: 800 34px 'Segoe UI', Arial, sans-serif; fill: #171229; }
      .kicker { font: 800 23px 'Segoe UI', Arial, sans-serif; letter-spacing: 2.4px; fill: #5b21b6; }
      .title { font: 800 72px 'Segoe UI', Arial, sans-serif; fill: #171229; }
      .subtitle { font: 500 28px 'Segoe UI', Arial, sans-serif; fill: #5f596c; }
      .chip { font: 700 20px 'Segoe UI', Arial, sans-serif; fill: #4d178f; }
    </style>
    <text class="brand" x="220" y="130">PlanParty</text>
    <text class="kicker" x="112" y="245">${escapeXml(motif.kicker)}</text>
    <text class="title" x="112" y="350">${lineOne}</text>
    <text class="title" x="112" y="438">${lineTwo}</text>
    <text class="subtitle" x="112" y="515">${escapeXml(motif.subtitle)}</text>
    <rect x="112" y="590" width="220" height="54" rx="27" fill="#eee5ff"/>
    <text class="chip" x="145" y="625">OHNE KONTO</text>
    <rect x="348" y="590" width="172" height="54" rx="27" fill="#eee5ff"/>
    <text class="chip" x="382" y="625">LOKAL</text>`,
    1920,
    1080,
  );
}

async function buildPhone(motif, background, mark) {
  const screenWidth = 760;
  const screenHeight = 1351;
  const screen = await roundedScreenshot(
    path.join(previewRoot, `phone-${motif.route}.png`),
    screenWidth,
    screenHeight,
    38,
  );
  const frame = svgBuffer(
    `<defs><filter id="s" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="22" stdDeviation="28" flood-color="#291153" flood-opacity=".19"/></filter></defs>
     <rect x="138" y="482" width="804" height="1395" rx="58" fill="#ffffff" stroke="#ded1f2" stroke-width="2" filter="url(#s)"/>`,
    1080,
    1920,
  );

  await sharp(background)
    .composite([
      { input: frame, left: 0, top: 0 },
      { input: screen, left: 160, top: 504 },
      { input: mark, left: 72, top: 55 },
      { input: phoneText(motif), left: 0, top: 0 },
    ])
    .flatten({ background: "#faf8fc" })
    .removeAlpha()
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(path.join(phoneRoot, `${motif.slug}.png`));
}

async function buildTablet(motif, background, mark) {
  const screenWidth = 1080;
  const screenHeight = 608;
  const screen = await roundedScreenshot(
    path.join(previewRoot, `tablet-${motif.route}.png`),
    screenWidth,
    screenHeight,
    28,
  );
  const frame = svgBuffer(
    `<defs><filter id="s" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="20" stdDeviation="26" flood-color="#291153" flood-opacity=".2"/></filter></defs>
     <rect x="720" y="196" width="1120" height="648" rx="48" fill="#ffffff" stroke="#ded1f2" stroke-width="2" filter="url(#s)"/>`,
    1920,
    1080,
  );

  await sharp(background)
    .composite([
      { input: frame, left: 0, top: 0 },
      { input: screen, left: 740, top: 216 },
      { input: mark, left: 112, top: 72 },
      { input: tabletText(motif), left: 0, top: 0 },
    ])
    .flatten({ background: "#faf8fc" })
    .removeAlpha()
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(path.join(tabletRoot, `${motif.slug}.png`));
}

await Promise.all([
  mkdir(phoneRoot, { recursive: true }),
  mkdir(tabletRoot, { recursive: true }),
]);

const [phoneBackground, tabletBackground, phoneMark, tabletMark] = await Promise.all([
  backdrop(1080, 1920),
  backdrop(1920, 1080),
  sharp(markPath).resize(70, 70, { fit: "contain" }).png().toBuffer(),
  sharp(markPath).resize(88, 88, { fit: "contain" }).png().toBuffer(),
]);

for (const motif of motifs) {
  await buildPhone(motif, phoneBackground, phoneMark);
  await buildTablet(motif, tabletBackground, tabletMark);
}

stdout.write(`${motifs.length * 2} PlanParty-Store-Assets erstellt.\n`);
