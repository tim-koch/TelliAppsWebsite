import { describe, expect, it, vi } from "vitest";
import { formatMessage, validateSubmission } from "../deploy/forms/validation.mjs";

function common() {
  return {
    site: "planparty",
    quelle: "/beta/",
    datenschutz_bestaetigt: "ja",
    startedAt: Date.now() - 3000,
    website: "",
  };
}

describe("Formularvalidierung", () => {
  it("akzeptiert eine vollständige Kontaktanfrage", () => {
    const result = validateSubmission("contact", {
      ...common(),
      anliegen: "feedback",
      name: "Elli",
      email: "elli@example.de",
      message: "Die Einkaufsliste hilft mir sehr.",
    });
    expect(result).toMatchObject({ kind: "contact", site: "planparty", spam: false });
    expect(formatMessage(result)).toContain("Die Einkaufsliste hilft mir sehr.");
  });

  it("akzeptiert für die Beta nur Google-Adressen", () => {
    expect(() =>
      validateSubmission("beta", {
        ...common(),
        name: "Tim",
        email: "tim@example.de",
        weitere_personen: "Keine",
      }),
    ).toThrow("Gmail- oder Googlemail-Adresse");
  });

  it("behandelt den Honeypot ohne Mailversand als Erfolg", () => {
    expect(validateSubmission("contact", { website: "Werbung" })).toEqual({ spam: true });
  });

  it("weist unrealistisch schnelle Übermittlungen ab", () => {
    vi.setSystemTime(new Date("2026-08-21T12:00:00Z"));
    expect(() =>
      validateSubmission("contact", {
        ...common(),
        startedAt: Date.now(),
        anliegen: "allgemein",
        email: "mail@example.de",
        message: "Eine ausreichend lange Nachricht.",
      }),
    ).toThrow("Formular neu");
    vi.useRealTimers();
  });
});
