# TelliApps Website

Mobile-first Marken- und Produktwebsite für TelliApps, PlanTeller und PlanParty. Eine
gemeinsame Astro-Codebasis liefert drei eigenständige Websites für:

- `www.telli-apps.de`
- `planteller.telli-apps.de`
- `planparty.telli-apps.de`

Die produktiven Subdomains werden über den mitgelieferten Caddy-Container aus einem
statischen Build bedient. Lokal sind die Bereiche unter `/planteller/` und
`/planparty/` erreichbar.

## Entwicklung

Voraussetzung ist Node.js 24 oder neuer.

```sh
npm ci
npm run dev
```

Die wichtigsten Prüfungen:

```sh
npm run format:check
npm run lint
npm run check
npm test
npm run build
npm run test:e2e
npm run test:links
```

`npm run media:build` rendert die beiden kurzen WebM-App-Demos aus den eingecheckten
Screenshots neu. Dafür wird einmalig `npx playwright install ffmpeg` benötigt.

## Reichweitenmessung

Analytics ist standardmäßig vollständig deaktiviert. Werden
`PUBLIC_UMAMI_SRC` und `PUBLIC_UMAMI_WEBSITE_ID` gesetzt, lädt der Build eine cookielose
Umami-Messung mit aktiviertem Do-Not-Track. Die konkrete Instanz muss vor Go-live in den
Datenschutzhinweisen dokumentiert werden. Ohne einwilligungspflichtige Dienste wird kein
Cookie-Banner angezeigt.

## Deployment

```sh
docker compose -f deploy/compose.yml up -d --build
```

Caddy beschafft TLS-Zertifikate automatisch, komprimiert Dateien, setzt
Sicherheitsheader und routet die Hosts. Details stehen in [docs/architektur.md](docs/architektur.md),
offene Produktionspunkte in [docs/go-live-checkliste.md](docs/go-live-checkliste.md).

## Markenstudie „Telli“

Die transparente Illustration unter `src/assets/brand/telli-helper.png` wurde im
integrierten ImageGen-Modus `stylized-concept` erzeugt. Verwendeter Prompt:

> Use case: stylized-concept. Asset type: TelliApps landing page hero character cutout.
> Create an original friendly digital helper character called Telli that can connect a
> collection of practical everyday apps. The character should feel capable, calm, warm,
> and professional, with a subtle nod to a cooking helper but broad enough to represent
> planning apps beyond food. One compact rounded helper character with a simple expressive
> face, a small soft chef-hat-inspired top shape that also resembles a chat bubble, holding
> two small abstract rounded cards; no human skin, no recognizable existing mascot.
> Premium soft 3D clay illustration, clean product-brand aesthetic, realistic soft
> materials, crisp silhouette. Full character visible, centered, generous transparent
> padding, no cropping. Soft daylight studio glow. Warm off-white, sage green, restrained
> aubergine-violet accents, charcoal details. Genuinely transparent background; no text,
> letters, logos, watermark, frame or UI mockup; all limbs and props fully visible. Avoid
> childish cartoon exaggeration, glossy plastic, clutter, food items and brand imitation.

## Rechtlicher Hinweis

Die Seiten enthalten technisch und inhaltlich vorbereitete Rechtstexte, ersetzen jedoch
keine anwaltliche Einzelfallprüfung. Vor Veröffentlichung müssen insbesondere Hosting,
Formularverarbeitung, Store-Angaben und Unternehmensstatus final bestätigt werden.
