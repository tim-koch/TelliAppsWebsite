# PlanParty – Google-Play-Screenshots

Die finalen Dateien basieren auf dem aktuellen App-Branch `feature/release-1` des privaten
Repositories `tim-koch/PlanParty`.

## Upload-Reihenfolge

1. Schnell starten
2. Anlass auswählen
3. Mengen berechnen
4. Einkauf abhaken und teilen
5. Party-Checkliste

## Formate

- `smartphone-9x16/`: 1080 × 1920 Pixel, PNG
- `tablet-16x9/`: 1920 × 1080 Pixel, PNG

Beide Serien erfüllen das geforderte Seitenverhältnis, liegen zwischen 320 und 3840 Pixeln
Kantenlänge und bleiben unter 8 MB pro Datei. Die Tablet-Serie kann in den Bereichen für
7-Zoll- und 10-Zoll-Tablets verwendet werden.

## Quellen und Reproduzierbarkeit

- `preview/`: unveränderte Rohaufnahmen aus Expo Web mit dem aktuellen React-Native-Code
- `source/planparty-mark.png`: aktuelles App-Markenzeichen aus dem App-Repository
- `source/background-planparty.png`: mit dem integrierten Imagegen-Werkzeug erzeugter,
  textfreier Hintergrund
- `scripts/build-planparty-play-assets.mjs`: deterministische Komposition der finalen PNGs

Die App-Oberflächen wurden mit Expo Web direkt aus dem Branch `feature/release-1` in den
Ziel-Viewports aufgenommen. Der generierte Hintergrund enthält bewusst weder Text noch
erfundene App-Oberflächen.

### Imagegen-Prompt für den Hintergrund

```text
Use case: ads-marketing
Asset type: reusable Google Play screenshot background for the PlanParty Android app
Primary request: create a premium, restrained abstract celebration background with generous clean negative space for later placement of real app screenshots and typography
Scene/backdrop: soft off-white to very pale lilac gradient, subtle layered glow, sparse elegant geometric confetti and a few delicate curved ribbons near the outer edges only
Style/medium: polished modern editorial vector-like raster background, professional mobile app brand campaign, understated rather than playful
Composition/framing: landscape master background; keep the center and upper-middle areas calm and uncluttered; decorative details confined mostly to corners and edges so it can be cropped for both portrait and landscape formats
Lighting/mood: soft luminous depth, friendly, calm, trustworthy
Color palette: PlanParty violet #5B21B6, deep ink #171229, pale lilac #F3ECFF, off-white #FAF8FC; very small restrained accents in warm coral and gold
Constraints: background only; no devices, no phones, no tablets, no interface elements, no logos, no lettering, no numbers, no symbols resembling text, no watermark; clean enough for readable overlaid German copy
Avoid: busy party scene, balloons, people, photorealism, gradients that reduce text contrast, neon cyberpunk look
```

Neu erzeugen:

```sh
node scripts/build-planparty-play-assets.mjs
```
