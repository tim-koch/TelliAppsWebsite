# Go-live-Checkliste

## Vor dem öffentlichen Start zwingend klären

- [ ] Impressum, Datenschutz, AGB/Nutzungsbedingungen und KI-Hinweise anwaltlich prüfen
- [ ] Finale Hosting-Firma, Serverstandort, Log-Aufbewahrung und AV-Verträge eintragen
- [ ] Formspree-Projekte, Empfänger, Aufbewahrung und Spam-Schutz produktiv verifizieren
- [ ] Google Group `planteller@googlegroups.com` öffentlich auffindbar bzw. beitretbar machen
- [ ] PlanParty-Paketname, Store-Link und finalen Bereich „Datensicherheit“ ergänzen
- [ ] `assetlinks.json` gegen finales PlanTeller-Paket und Signaturzertifikat prüfen
- [ ] DNS-A/AAAA-Einträge für alle drei Hosts auf den Webserver setzen
- [ ] Alte `planteller.de`-Website erst nach bewusster Migration mit 301-Weiterleitungen ersetzen

## Analytics

Ohne Umgebungsvariablen wird kein Analyse-Skript geladen und kein Cookie-Banner
benötigt. Für cookieloses, bevorzugt selbst gehostetes Umami:

1. `.env.example` nach `.env` kopieren.
2. Skript-URL und Website-ID setzen.
3. Datenschutztext gegen die konkrete Instanz, den Standort und die Löschfristen prüfen.
4. Mit „Do Not Track“, deaktiviertem JavaScript und Browser-Schutzmechanismen testen.

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
```

Danach reale Geräte (Android/iOS), Formulare ohne Testdatenversand, Deep-Links, 404-Seiten,
Sitemaps, Videos, reduzierte Bewegung, Dark Mode und 320-Pixel-Breite prüfen.
