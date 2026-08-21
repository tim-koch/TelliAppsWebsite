import { DEPLOY_BASE } from "./deployment";

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

const pagesOrigin = import.meta.env.PUBLIC_GITHUB_PAGES_ORIGIN?.replace(/\/$/, "");
const pagesRoot = pagesOrigin ? `${pagesOrigin}${DEPLOY_BASE}` : undefined;

function configuredOrigin(id: SiteId, productionOrigin: string): string {
  if (!pagesRoot) return productionOrigin;
  return id === "telliapps" ? pagesRoot : `${pagesRoot}/${id}`;
}

export const SITES = {
  telliapps: {
    id: "telliapps",
    name: "TelliApps",
    legalName: "TelliApps · Tim Koch",
    origin: configuredOrigin("telliapps", "https://www.telli-apps.de"),
    description:
      "Praktische Apps, die Planung im Alltag verständlicher und ruhiger machen.",
    email: "kontakt@telli-apps.de",
    contactEndpoint: "/api/forms/contact",
    themeColor: "#355f52",
    locale: "de_DE",
  },
  planteller: {
    id: "planteller",
    name: "PlanTeller",
    legalName: "PlanTeller · Tim Koch",
    origin: configuredOrigin("planteller", "https://planteller.telli-apps.de"),
    description:
      "Rezepte, Wochenplanung und Einkauf gemeinsam an einem Ort organisieren.",
    email: "planteller@telli-apps.de",
    status: "Geschlossene Android-Beta",
    contactEndpoint: "/api/forms/contact",
    betaEndpoint: "/api/forms/beta",
    themeColor: "#667d62",
    locale: "de_DE",
  },
  planparty: {
    id: "planparty",
    name: "PlanParty",
    legalName: "PlanParty · Tim Koch",
    origin: configuredOrigin("planparty", "https://planparty.telli-apps.de"),
    description:
      "Realistische Einkaufs- und Getränkemengen für Feiern in etwa einer Minute planen.",
    email: "planparty@telli-apps.de",
    status: "Geschlossener Android-Test",
    contactEndpoint: "/api/forms/contact",
    betaEndpoint: "/api/forms/beta",
    themeColor: "#4f19b7",
    locale: "de_DE",
  },
} as const satisfies Record<SiteId, SiteConfig>;

export function siteUrl(site: SiteConfig, path = "/"): string {
  const normalizedPath = path.replace(/^\/+/, "");
  return new URL(normalizedPath, `${site.origin.replace(/\/$/, "")}/`).toString();
}

export const LEGAL_OWNER = {
  name: "Tim Koch",
  street: "Konrad-Adenauer-Allee 101",
  city: "61118 Bad Vilbel",
} as const;
