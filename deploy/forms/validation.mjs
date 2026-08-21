const SITE_IDS = new Set(["telliapps", "planteller", "planparty"]);
const CONTACT_TOPICS = new Set(["allgemein", "beta", "feedback", "datenschutz"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const GOOGLE_EMAIL_PATTERN = /^[^\s@]+@(gmail\.com|googlemail\.com)$/iu;

function text(value, maximum, { multiline = false } = {}) {
  if (typeof value !== "string") return "";
  const normalized = value.replaceAll("\0", "").trim();
  const compact = multiline
    ? normalized.replace(/\r\n?/gu, "\n")
    : normalized.replace(/\s+/gu, " ");
  return compact.slice(0, maximum);
}

function validEmail(value, googleOnly = false) {
  if (!value || value.length > 254) return false;
  return (googleOnly ? GOOGLE_EMAIL_PATTERN : EMAIL_PATTERN).test(value);
}

function validateCommon(payload) {
  const site = text(payload.site, 20);
  const email = text(payload.email, 254).toLowerCase();
  const source = text(payload.quelle, 200);
  const consent = payload.datenschutz_bestaetigt === "ja";

  if (!SITE_IDS.has(site)) throw new Error("Ungültige Website.");
  if (!consent) throw new Error("Die Datenschutzhinweise müssen bestätigt werden.");
  if (!source) throw new Error("Die Formularquelle fehlt.");

  return { site, email, source };
}

export function validateSubmission(kind, payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Ungültige Formulardaten.");
  }

  const honeypot = text(payload.website, 200);
  if (honeypot) return { spam: true };

  const startedAt = Number(payload.startedAt);
  const elapsed = Date.now() - startedAt;
  if (
    !Number.isFinite(startedAt) ||
    elapsed < 1500 ||
    elapsed > 7 * 24 * 60 * 60 * 1000
  ) {
    throw new Error("Bitte lade das Formular neu und versuche es erneut.");
  }

  const common = validateCommon(payload);
  const name = text(payload.name, 100);

  if (kind === "contact") {
    const topic = text(payload.anliegen, 30);
    const message = text(payload.message, 5000, { multiline: true });
    if (!CONTACT_TOPICS.has(topic)) throw new Error("Bitte wähle ein gültiges Anliegen.");
    if (!validEmail(common.email))
      throw new Error("Bitte gib eine gültige E-Mail-Adresse ein.");
    if (message.length < 10) throw new Error("Die Nachricht ist zu kurz.");
    return { kind, ...common, name, topic, message, spam: false };
  }

  if (kind === "beta") {
    const additionalPeople = text(payload.weitere_personen, 1200, { multiline: true });
    if (!name) throw new Error("Bitte gib deinen Namen ein.");
    if (!validEmail(common.email, true)) {
      throw new Error("Für den Test wird eine Gmail- oder Googlemail-Adresse benötigt.");
    }
    return {
      kind,
      ...common,
      name,
      additionalPeople: additionalPeople || "Keine",
      spam: false,
    };
  }

  throw new Error("Unbekanntes Formular.");
}

export function formatMessage(submission) {
  if (submission.kind === "contact") {
    return [
      `Website: ${submission.site}`,
      `Quelle: ${submission.source}`,
      `Anliegen: ${submission.topic}`,
      `Name: ${submission.name || "Nicht angegeben"}`,
      `E-Mail: ${submission.email}`,
      "",
      "Nachricht:",
      submission.message,
    ].join("\n");
  }

  return [
    `Website: ${submission.site}`,
    `Quelle: ${submission.source}`,
    `Name: ${submission.name}`,
    `Google-E-Mail: ${submission.email}`,
    "",
    "Weitere Testpersonen:",
    submission.additionalPeople,
  ].join("\n");
}
