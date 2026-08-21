#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
COMPOSE_FILE="$REPO_DIR/deploy/compose.yml"
NGINX_SOURCE="$REPO_DIR/deploy/server/nginx-telliapps.conf"
NGINX_TARGET="/etc/nginx/sites-available/telliapps.conf"
NGINX_LINK="/etc/nginx/sites-enabled/telliapps.conf"

for command_name in docker curl nginx systemctl; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Fehlt: $command_name" >&2
    exit 1
  fi
done

cd "$REPO_DIR"

echo "Prüfe die Compose-Konfiguration …"
docker compose -f "$COMPOSE_FILE" config >/dev/null

echo "Baue und starte den internen Website-Container …"
docker compose -f "$COMPOSE_FILE" up -d --build

for host_name in www.telli-apps.de planteller.telli-apps.de planparty.telli-apps.de; do
  echo "Prüfe $host_name über 127.0.0.1:8088 …"
  attempt=1
  until curl --fail --silent --show-error \
    --header "Host: $host_name" \
    http://127.0.0.1:8088/healthz >/dev/null 2>&1; do
    if [ "$attempt" -ge 20 ]; then
      echo "$host_name war nach 20 Sekunden nicht erreichbar." >&2
      docker compose -f "$COMPOSE_FILE" ps >&2
      docker compose -f "$COMPOSE_FILE" logs --tail 50 website >&2
      exit 1
    fi

    attempt=$((attempt + 1))
    sleep 1
  done
done

echo "Installiere den zusätzlichen nginx-VHost …"
if [ -f "$NGINX_TARGET" ]; then
  backup_path="${NGINX_TARGET}.backup.$(date +%Y%m%d%H%M%S)"
  sudo cp "$NGINX_TARGET" "$backup_path"
  echo "Vorhandene Konfiguration gesichert: $backup_path"
fi

sudo install -m 0644 "$NGINX_SOURCE" "$NGINX_TARGET"
sudo ln -sfn "$NGINX_TARGET" "$NGINX_LINK"
sudo nginx -t
sudo systemctl reload nginx

echo "Website und HTTP-VHost sind vorbereitet."
echo "TLS erst nach aktiver DNS-Auflösung gemäß deploy/server/README.md einrichten."
