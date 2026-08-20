import { describe, expect, it } from "vitest";
import { SITES, siteUrl } from "../src/config/sites";

describe("Domain-Konfiguration", () => {
  it("liefert für jede Marke eine HTTPS-Domain", () => {
    for (const site of Object.values(SITES)) {
      expect(new URL(site.origin).protocol).toBe("https:");
    }
  });

  it("erzeugt kanonische URLs ohne Pfadverlust", () => {
    expect(siteUrl(SITES.planteller, "/beta/")).toBe(
      "https://planteller.telli-apps.de/beta/",
    );
  });
});
