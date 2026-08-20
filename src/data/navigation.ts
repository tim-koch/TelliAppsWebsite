import { SITES, siteUrl, type SiteConfig } from "../config/sites";

export interface NavItem {
  label: string;
  href: string;
}

export function navigationFor(site: SiteConfig): NavItem[] {
  if (site.id === "planteller") {
    return [
      { label: "Vorteile", href: siteUrl(site, "/#vorteile") },
      { label: "Funktionen", href: siteUrl(site, "/#funktionen") },
      { label: "Einblicke", href: siteUrl(site, "/#einblicke") },
      { label: "Beta", href: siteUrl(site, "/beta/") },
    ];
  }
  if (site.id === "planparty") {
    return [
      { label: "So funktioniert’s", href: siteUrl(site, "/#ablauf") },
      { label: "Funktionen", href: siteUrl(site, "/#funktionen") },
      { label: "Einblicke", href: siteUrl(site, "/#einblicke") },
      { label: "Beta", href: siteUrl(site, "/beta/") },
    ];
  }
  return [
    { label: "App Collection", href: siteUrl(site, "/#apps") },
    { label: "Über TelliApps", href: siteUrl(site, "/#ueber-uns") },
    { label: "Werte", href: siteUrl(site, "/#werte") },
    { label: "Kontakt", href: siteUrl(site, "/kontakt/") },
  ];
}

export const appLinks = [
  {
    name: "PlanTeller",
    href: SITES.planteller.origin,
    transition: "sage",
  },
  {
    name: "PlanParty",
    href: SITES.planparty.origin,
    transition: "violet",
  },
] as const;
