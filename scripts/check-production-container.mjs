import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import http from "node:http";
import { stdout } from "node:process";

const containerHost = process.env.CONTAINER_HOST || "127.0.0.1";
const containerPort = Number(process.env.CONTAINER_PORT || 8088);

function request(host, path) {
  return new Promise((resolve, reject) => {
    const call = http.request(
      {
        host: containerHost,
        port: containerPort,
        path,
        method: "GET",
        headers: { Host: host },
      },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () =>
          resolve({
            status: response.statusCode,
            headers: response.headers,
            body: Buffer.concat(chunks).toString("utf8"),
          }),
        );
      },
    );
    call.setTimeout(5_000, () => call.destroy(new Error("Zeitüberschreitung")));
    call.on("error", reject);
    call.end();
  });
}

const checks = [
  ["www.telli-apps.de", "/", 200],
  ["www.telli-apps.de", "/kontakt/", 200],
  ["planteller.telli-apps.de", "/", 200],
  ["planteller.telli-apps.de", "/invite/demo-token", 200],
  ["planteller.telli-apps.de", "/recipe-share/demo-token", 200],
  ["planteller.telli-apps.de", "/.well-known/assetlinks.json", 200],
  ["planparty.telli-apps.de", "/", 200],
  ["planparty.telli-apps.de", "/nicht-vorhanden", 404],
];

for (const [host, path, expectedStatus] of checks) {
  const response = await request(host, path);
  assert.equal(response.status, expectedStatus, `${host}${path}`);
  assert.equal(response.headers["x-content-type-options"], "nosniff", host);
}

const redirect = await request("telli-apps.de", "/beispiel/?quelle=test");
assert.equal(redirect.status, 308);
assert.equal(
  redirect.headers.location,
  "https://www.telli-apps.de/beispiel/?quelle=test",
);

const homepage = await request("www.telli-apps.de", "/");
assert.match(homepage.body, /content="index, follow, max-image-preview:large"/);
assert.match(homepage.body, /https:\/\/www\.telli-apps\.de\//);

const legalPage = await request("www.telli-apps.de", "/impressum/");
assert.match(legalPage.body, /content="noindex, follow"/);

const assetLinks = await request(
  "planteller.telli-apps.de",
  "/.well-known/assetlinks.json",
);
assert.match(assetLinks.body, /de\.timkoch\.kochbuch/);

const assetPath = homepage.body.match(/(?:src|href)="(\/_astro\/[^"?]+)"/)?.[1];
assert.ok(assetPath, "Kein gehashtes Asset in der Startseite gefunden.");
const asset = await request("www.telli-apps.de", assetPath);
assert.equal(asset.status, 200);
assert.match(asset.headers["cache-control"] || "", /max-age=31536000/);

stdout.write(`${checks.length + 5} Produktionscontainer-Prüfungen erfolgreich.\n`);
