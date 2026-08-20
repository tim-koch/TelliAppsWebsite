export type SiteId = "telliapps" | "planteller" | "planparty";

export interface SiteConfig {
  id: SiteId;
  name: string;
  legalName: string;
  origin: string;
  description: string;
  email: string;
  status?: string;
  contactEndpoint: string;
  betaEndpoint?: string;
  themeColor: string;
  locale: string;
}

export const SITES = {
  telliapps: {
    id: "telliapps",
    name: "TelliApps",
    legalName: "TelliApps · Tim Koch",
    origin: "https://www.telli-apps.de",
    description:
      "Praktische Apps, die Planung im Alltag verständlicher und ruhiger machen.",
    email: "kochbuch_app@outlook.de",
    contactEndpoint: "https://formspree.io/f/mzdnbvbz",
    themeColor: "#355f52",
    locale: "de_DE",
  },
  planteller: {
    id: "planteller",
    name: "PlanTeller",
    legalName: "PlanTeller · Tim Koch",
    origin: "https://planteller.telli-apps.de",
    description:
      "Rezepte, Wochenplanung und Einkauf gemeinsam an einem Ort organisieren.",
    email: "kochbuch_app@outlook.de",
    status: "Geschlossene Android-Beta",
    contactEndpoint: "https://formspree.io/f/mojgjzlv",
    betaEndpoint: "https://formspree.io/f/xqerklkr",
    themeColor: "#667d62",
    locale: "de_DE",
  },
  planparty: {
    id: "planparty",
    name: "PlanParty",
    legalName: "PlanParty · Tim Koch",
    origin: "https://planparty.telli-apps.de",
    description:
      "Realistische Einkaufs- und Getränkemengen für Feiern in etwa einer Minute planen.",
    email: "kochbuch_app@outlook.de",
    status: "Interner Android-Test",
    contactEndpoint: "https://formspree.io/f/mzdnbvbz",
    betaEndpoint: "https://formspree.io/f/xqerklkr",
    themeColor: "#4f19b7",
    locale: "de_DE",
  },
} as const satisfies Record<SiteId, SiteConfig>;

export function siteUrl(site: SiteConfig, path = "/"): string {
  return new URL(path, site.origin).toString();
}

export const LEGAL_OWNER = {
  name: "Tim Koch",
  street: "Konrad-Adenauer-Allee 101",
  city: "61118 Bad Vilbel",
} as const;
