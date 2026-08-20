# Architektur

## Zielbild

Ein Astro-Build erzeugt drei klar getrennte statische Websites. Caddy ordnet die
Ausgabe beim Hosting den jeweiligen Domains zu:

| Domain                     | Build-Verzeichnis  | Zweck                    |
| -------------------------- | ------------------ | ------------------------ |
| `www.telli-apps.de`        | `dist/`            | Marke und App Collection |
| `planteller.telli-apps.de` | `dist/planteller/` | PlanTeller               |
| `planparty.telli-apps.de`  | `dist/planparty/`  | PlanParty                |

Gemeinsame, von Astro optimierte Assets liegen unter `dist/_astro/`. Caddy stellt sie
auf allen drei Hosts bereit. Dadurch bleiben Gestaltung, Komponenten, Barrierefreiheit
und Wartung einheitlich, während jede App eigene Farben, Inhalte und Metadaten erhält.

## Rollen bei Änderungen

- Produktarchitektur: Informationsstruktur, Domain-Zuordnung und Produktgrenzen
- UX/UI-Design: mobile Abläufe, visuelle Hierarchie und markenspezifische Themen
- Senior-Webentwicklung: Komponenten, Build, Routing und wartbarer Code
- Accessibility Engineering: WCAG-Prüfungen, Tastaturwege und reduzierte Bewegung
- SEO/Content: Suchintention, strukturierte Daten, Sitemaps und verständliche Texte
- DevOps/QA: Container, Header, CI, Browser-, Link- und Performanceprüfungen
- Datenschutz/Legal Ops: technische Umsetzung und Kennzeichnung offener Rechtsprüfung

## Zentrale Stellen

- `src/config/sites.ts`: Domains, Produktdaten und Formular-Endpunkte
- `src/data/navigation.ts`: Navigation und Footer je Marke
- `src/styles/global.css`: Designsystem und responsive Regeln
- `Caddyfile`: Host-Routing, Deep-Links, Kompression und Sicherheitsheader
- `.env.example`: optionale cookielose Reichweitenmessung

## PlanTeller-Deep-Links

Die Pfade `/recipe-share`, `/collection-share`, `/invite` und `/reset-password` bleiben
mit angehängten Tokens erreichbar. Caddy rewritet dynamische Varianten auf die jeweilige
statische Einstiegsseite; JavaScript versucht anschließend den App-Link und bietet einen
kopierbaren Browser-Fallback. `/.well-known/assetlinks.json` ist für Android App Links
vorbereitet.
