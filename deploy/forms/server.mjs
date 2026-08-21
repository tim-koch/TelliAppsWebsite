import { Buffer } from "node:buffer";
import http from "node:http";
import process, { stderr, stdout } from "node:process";
import { setInterval } from "node:timers";
import { URL } from "node:url";
import nodemailer from "nodemailer";
import { formatMessage, validateSubmission } from "./validation.mjs";

const PORT = Number(process.env.PORT || 3000);
const BODY_LIMIT = 32 * 1024;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT = 5;
const testTransport =
  process.env.NODE_ENV === "test" && process.env.FORM_TEST_TRANSPORT === "true";
const requiredEnvironment = [
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "MAIL_FROM",
  "MAIL_TO_TELLIAPPS",
  "MAIL_TO_PLANTELLER",
  "MAIL_TO_PLANPARTY",
];

for (const name of requiredEnvironment) {
  if (!testTransport && !process.env[name]) {
    throw new Error(`Erforderliche Umgebungsvariable fehlt: ${name}`);
  }
}

const smtpPort = Number(process.env.SMTP_PORT || 587);
const transporter = testTransport
  ? nodemailer.createTransport({ streamTransport: true, newline: "unix" })
  : nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: smtpPort === 465,
      requireTLS: smtpPort !== 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
      tls: { minVersion: "TLSv1.2" },
      connectionTimeout: 15_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });

const recipients = {
  telliapps: process.env.MAIL_TO_TELLIAPPS,
  planteller: process.env.MAIL_TO_PLANTELLER,
  planparty: process.env.MAIL_TO_PLANPARTY,
};
const allowedOrigins = new Set(
  (
    process.env.TRUSTED_ORIGINS ||
    "https://www.telli-apps.de,https://planteller.telli-apps.de,https://planparty.telli-apps.de"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);
const originBySite = {
  telliapps: "https://www.telli-apps.de",
  planteller: "https://planteller.telli-apps.de",
  planparty: "https://planparty.telli-apps.de",
};
const requestsByAddress = new Map();

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(payload));
}

function clientAddress(request) {
  return String(
    request.headers["x-forwarded-for"] || request.socket.remoteAddress || "unknown",
  )
    .split(",")[0]
    .trim();
}

function withinRateLimit(address) {
  const now = Date.now();
  const recent = (requestsByAddress.get(address) || []).filter(
    (timestamp) => now - timestamp < RATE_WINDOW_MS,
  );
  if (recent.length >= RATE_LIMIT) return false;
  recent.push(now);
  requestsByAddress.set(address, recent);
  return true;
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > BODY_LIMIT) {
        reject(new Error("Die Anfrage ist zu groß."));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new Error("Ungültige Anfrage."));
      }
    });
    request.on("error", reject);
  });
}

function validOrigin(request) {
  const origin = request.headers.origin;
  return typeof origin === "string" && allowedOrigins.has(origin);
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || "/", "http://forms.internal");

  if (request.method === "GET" && url.pathname === "/healthz") {
    sendJson(response, 200, { status: "ok" });
    return;
  }

  const match = url.pathname.match(/^\/api\/forms\/(contact|beta)$/u);
  if (request.method !== "POST" || !match) {
    sendJson(response, 404, { error: "Nicht gefunden." });
    return;
  }
  if (!validOrigin(request)) {
    sendJson(response, 403, { error: "Unzulässiger Ursprung." });
    return;
  }
  if (!String(request.headers["content-type"] || "").startsWith("application/json")) {
    sendJson(response, 415, { error: "Nur JSON wird akzeptiert." });
    return;
  }
  if (!withinRateLimit(clientAddress(request))) {
    response.setHeader("Retry-After", String(RATE_WINDOW_MS / 1000));
    sendJson(response, 429, {
      error: "Zu viele Anfragen. Bitte versuche es später erneut.",
    });
    return;
  }

  let submission;
  try {
    submission = validateSubmission(match[1], await readJson(request));
    if (submission.spam) {
      sendJson(response, 200, { ok: true });
      return;
    }
  } catch (error) {
    sendJson(response, 400, {
      error: error instanceof Error ? error.message : "Ungültige Formulardaten.",
    });
    return;
  }

  if (request.headers.origin !== originBySite[submission.site]) {
    sendJson(response, 403, { error: "Diese Anfrage gehört nicht zu dieser Website." });
    return;
  }

  try {
    const product =
      submission.site === "telliapps"
        ? "TelliApps"
        : submission.site === "planteller"
          ? "PlanTeller"
          : "PlanParty";
    const subject =
      submission.kind === "beta"
        ? `Beta-Anmeldung ${product}`
        : `${product}: ${submission.topic}`;
    await transporter.sendMail({
      from: `TelliApps Website <${process.env.MAIL_FROM}>`,
      to: recipients[submission.site],
      replyTo: submission.email,
      subject,
      text: formatMessage(submission),
    });
    sendJson(response, 200, { ok: true });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unbekannter SMTP-Fehler";
    stderr.write(`SMTP-Versand fehlgeschlagen: ${detail}\n`);
    sendJson(response, 503, { error: "Der Versand ist vorübergehend nicht möglich." });
  }
});

setInterval(() => {
  const cutoff = Date.now() - RATE_WINDOW_MS;
  for (const [address, timestamps] of requestsByAddress) {
    const recent = timestamps.filter((timestamp) => timestamp >= cutoff);
    if (recent.length) requestsByAddress.set(address, recent);
    else requestsByAddress.delete(address);
  }
}, RATE_WINDOW_MS).unref();

if (!testTransport) await transporter.verify();
server.listen(PORT, "0.0.0.0", () => {
  stdout.write(`TelliApps-Formulardienst hört auf Port ${PORT}.\n`);
});
