#!/usr/bin/env sh
set -eu

assert_contains() {
  body=$1
  expected=$2
  label=$3
  if ! printf '%s' "$body" | grep -F "$expected" >/dev/null; then
    echo "Fehler bei $label: '$expected' fehlt." >&2
    exit 1
  fi
  echo "OK: $label"
}

root_headers=$(curl --fail --silent --show-error --head https://telli-apps.de/)
assert_contains "$root_headers" "https://www.telli-apps.de/" "Weiterleitung der Hauptdomain"

main_html=$(curl --fail --silent --show-error https://www.telli-apps.de/)
plan_teller_html=$(curl --fail --silent --show-error https://planteller.telli-apps.de/)
plan_party_html=$(curl --fail --silent --show-error https://planparty.telli-apps.de/)
legal_html=$(curl --fail --silent --show-error https://www.telli-apps.de/impressum/)

assert_contains "$main_html" "https://www.telli-apps.de/" "TelliApps-Canonical"
assert_contains "$plan_teller_html" "https://planteller.telli-apps.de/" "PlanTeller-Canonical"
assert_contains "$plan_party_html" "https://planparty.telli-apps.de/" "PlanParty-Canonical"
assert_contains "$legal_html" 'content="noindex, follow"' "Noindex für Rechtliches"

asset_links=$(curl --fail --silent --show-error \
  https://planteller.telli-apps.de/.well-known/assetlinks.json)
assert_contains "$asset_links" 'de.timkoch.kochbuch' "Android Asset Links"

api_health=$(curl --fail --silent --show-error https://api.planteller.de/health)
assert_contains "$api_health" '"status":"ready"' "Unveränderte PlanTeller-API"

echo "Alle Live-Prüfungen waren erfolgreich."
