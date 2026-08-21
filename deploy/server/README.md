# Deployment auf dem bestehenden PlanTeller-Server

Der Server `116.203.132.111` verwendet bereits nginx für `planteller.de` und
`api.planteller.de`. Die TelliApps-Website belegt deshalb **nicht** selbst Port 80 oder 443. Der Container lauscht ausschließlich auf `127.0.0.1:8088`; der vorhandene
Host-nginx übernimmt öffentliche Domains und TLS.

## Benötigter Zugang

- SSH-Host: `116.203.132.111`
- SSH-Benutzer mit `sudo`-Berechtigung
- SSH-Port, falls nicht `22`
- Authentifizierung über vorhandenen SSH-Key oder einen eigens freigegebenen Public Key

Passwörter, private Schlüssel und Tokens gehören weder ins Repository noch in `.env`-Dateien,
die eingecheckt werden.

## Vorprüfung auf dem Server

```sh
nginx -v
sudo nginx -T > /tmp/nginx-before-telliapps.txt
docker --version
docker compose version
sudo ss -ltnp | grep -E ':(80|443|8088)\b'
```

Port `8088` muss frei sein. Die Sicherung `/tmp/nginx-before-telliapps.txt` dient nur der
Kontrolle; bestehende PlanTeller-VHosts werden nicht ersetzt.

## Quellcode bereitstellen

Empfohlener Zielpfad:

```sh
sudo install -d -o "$USER" -g "$USER" /opt/telliapps
git clone https://github.com/tim-koch/TelliAppsWebsite.git /opt/telliapps
cd /opt/telliapps
```

Bei einem privaten Repository muss statt eines persönlichen Tokens ein read-only Deploy
Key oder ein bereits eingerichteter GitHub-Zugang verwendet werden.

Soll Umami direkt zum Start aktiv sein, wird vorher ausschließlich auf dem Server eine
nicht eingecheckte Umgebungsdatei angelegt:

```sh
cp deploy/environment.example deploy/.env
editor deploy/.env
```

## Website und HTTP-VHost installieren

```sh
cd /opt/telliapps
chmod +x deploy/server/deploy.sh deploy/server/verify-live.sh
./deploy/server/deploy.sh
```

Das Skript baut den Container, prüft alle drei Hosts intern, sichert eine eventuell bereits
vorhandene TelliApps-nginx-Datei, führt `nginx -t` aus und lädt nginx erst danach neu.

## DNS

Die folgenden Records zeigen auf den bestehenden Server:

| Typ  | Name         | Wert                    |
| ---- | ------------ | ----------------------- |
| A    | `@`          | `116.203.132.111`       |
| AAAA | `@`          | `2a01:4f8:1c1f:bb7b::1` |
| A    | `www`        | `116.203.132.111`       |
| AAAA | `www`        | `2a01:4f8:1c1f:bb7b::1` |
| A    | `planteller` | `116.203.132.111`       |
| AAAA | `planteller` | `2a01:4f8:1c1f:bb7b::1` |
| A    | `planparty`  | `116.203.132.111`       |
| AAAA | `planparty`  | `2a01:4f8:1c1f:bb7b::1` |

Mail-, NS-, SOA- und bestehende PlanTeller-Records bleiben unverändert.

## TLS nach der DNS-Umstellung

Erst wenn alle vier Namen öffentlich auf den Server zeigen:

```sh
sudo certbot --nginx --redirect \
  -d telli-apps.de \
  -d www.telli-apps.de \
  -d planteller.telli-apps.de \
  -d planparty.telli-apps.de
sudo nginx -t
sudo systemctl reload nginx
```

Vorhandene Zertifikate für `planteller.de` oder `api.planteller.de` werden nicht verändert.

## Live-Abnahme

```sh
cd /opt/telliapps
./deploy/server/verify-live.sh
```

Danach folgen Formspree-Testsendungen, reale Android-Deep-Link-Tests, Search Console und
optional die Umami-Konfiguration.

## Aktualisierung und Rollback

Aktualisierung:

```sh
cd /opt/telliapps
git pull --ff-only
docker compose -f deploy/compose.yml up -d --build
curl --fail --header "Host: www.telli-apps.de" http://127.0.0.1:8088/healthz
```

Rollback auf einen bekannten Commit:

```sh
cd /opt/telliapps
git switch --detach COMMIT_ID
docker compose -f deploy/compose.yml up -d --build
```

Vor einem späteren Wechsel zurück auf `main` muss der gewünschte Stand ausdrücklich
bestätigt werden.
