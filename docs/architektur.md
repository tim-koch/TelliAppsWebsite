# Architektur

## Zielbild

Ein Astro-Build erzeugt drei klar getrennte statische Websites. Ein interner nginx-
Container ordnet die Ausgabe den jeweiligen Domains zu:

| Domain                     | Build-Verzeichnis  | Zweck                    |
| -------------------------- | ------------------ | ------------------------ |
| `www.telli-apps.de`        | `dist/`            | Marke und App Collection |
| `planteller.telli-apps.de` | `dist/planteller/` | PlanTeller               |
| `planparty.telli-apps.de`  | `dist/planparty/`  | PlanParty                |

Gemeinsame, von Astro optimierte Assets liegen unter `dist/_astro/`. Der Container stellt
sie auf allen drei Hosts bereit. Auf dem bestehenden Server leitet der bereits laufende
Host-nginx Anfragen an `127.0.0.1:8088` weiter und verwaltet TLS. Dadurch bleiben die
vorhandenen PlanTeller-VHosts und die API unangetastet.

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
- `deploy/nginx/default.conf`: internes Host-Routing, Deep-Links und Caching
- `deploy/server/nginx-telliapps.conf`: konfliktfreier Proxy im vorhandenen Host-nginx
- `Caddyfile`: optionale Standalone-Alternative für einen separaten Server
- `.env.example`: optionale cookielose Reichweitenmessung

## PlanTeller-Deep-Links

Die Pfade `/recipe-share`, `/collection-share`, `/invite` und `/reset-password` bleiben
mit angehängten Tokens erreichbar. nginx rewritet dynamische Varianten auf die jeweilige
statische Einstiegsseite; JavaScript versucht anschließend den App-Link und bietet einen
kopierbaren Browser-Fallback. `/.well-known/assetlinks.json` ist für Android App Links
vorbereitet.
