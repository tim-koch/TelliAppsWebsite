# Go-live-Checkliste

## Vor dem öffentlichen Start zwingend klären

- [ ] Impressum, Datenschutz, AGB/Nutzungsbedingungen und KI-Hinweise anwaltlich prüfen
- [ ] Finale Hosting-Firma, Serverstandort, Log-Aufbewahrung und AV-Verträge eintragen
- [ ] Formspree-Projekte, Empfänger, Aufbewahrung und Spam-Schutz produktiv verifizieren
- [ ] Google Group `planteller@googlegroups.com` öffentlich auffindbar bzw. beitretbar machen
- [ ] PlanParty-Paketname, Store-Link und finalen Bereich „Datensicherheit“ ergänzen
- [ ] `assetlinks.json` gegen finales PlanTeller-Paket und Signaturzertifikat prüfen
- [ ] DNS-A/AAAA-Einträge für alle drei Hosts auf den Webserver setzen
- [ ] Website-Container auf `127.0.0.1:8088` starten und Host-nginx-Konfiguration prüfen
- [ ] TLS-Zertifikat für Hauptdomain, `www`, `planteller` und `planparty` ausstellen
- [ ] Alte `planteller.de`-Website erst nach bewusster Migration mit 301-Weiterleitungen ersetzen

## Google und Indexierung

- [ ] DNS-Domain-Property `telli-apps.de` in der Google Search Console bestätigen
- [ ] `https://www.telli-apps.de/sitemap.xml` einreichen
- [ ] `https://planteller.telli-apps.de/sitemap.xml` einreichen
- [ ] `https://planparty.telli-apps.de/sitemap.xml` einreichen
- [ ] Start-, Beta- und Kontaktseiten mit der URL-Prüfung kontrollieren
- [ ] Prüfen, dass Rechtliches, Löschseiten und die GitHub-Pages-Vorschau `noindex` liefern

## Analytics

Ohne Umgebungsvariablen wird kein Analyse-Skript geladen und kein Cookie-Banner
benötigt. Für cookieloses, bevorzugt selbst gehostetes Umami:

1. `.env.example` nach `.env` kopieren.
2. Skript-URL und Website-ID setzen.
3. Datenschutztext gegen die konkrete Instanz, den Standort und die Löschfristen prüfen.
4. Mit „Do Not Track“, deaktiviertem JavaScript und Browser-Schutzmechanismen testen.

Bei GitHub Pages werden die Werte als Repository-Variablen `PUBLIC_UMAMI_SRC` und
`PUBLIC_UMAMI_WEBSITE_ID` gepflegt. Die Vorschau wird dann unter dem GitHub-Pages-Host
gemessen; im Produktivbetrieb werden `www`, `planteller` und `planparty` gemeinsam
erfasst. Ohne beide Variablen bleibt Analytics deaktiviert.

Wenn später Cookies, Werbung, Fingerprinting oder andere einwilligungspflichtige Dienste
hinzukommen, muss vor deren Laden ein Consent-Management ergänzt werden.

## Technische Abnahme

```sh
npm ci
npm run format:check
npm run lint
npm run check
npm test
npm run build
npm run test:e2e
npm run test:links
npm run test:lighthouse
docker build -t telliapps-web .
docker compose -f deploy/compose.yml up -d --build
npm run test:container
```

Danach reale Geräte (Android/iOS), Formulare ohne Testdatenversand, Deep-Links, 404-Seiten,
Sitemaps, Videos, reduzierte Bewegung, Dark Mode und 320-Pixel-Breite prüfen.
