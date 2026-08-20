import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const homepages = ["/", "/planteller/", "/planparty/"];
const formPages = [
  "/kontakt/",
  "/planteller/kontakt/",
  "/planteller/beta/",
  "/planparty/kontakt/",
  "/planparty/beta/",
];
const generatedPages = [
  "/barrierefreiheit/",
  "/datenschutz/",
  "/impressum/",
  "/kontakt/",
  "/planteller/agb/",
  "/planteller/beta/",
  "/planteller/datenschutz/",
  "/planteller/hinweise/",
  "/planteller/impressum/",
  "/planteller/ki-hinweise/",
  "/planteller/kontakt/",
  "/planteller/konto-loeschen/",
  "/planparty/beta/",
  "/planparty/daten-loeschen/",
  "/planparty/datenschutz/",
  "/planparty/impressum/",
  "/planparty/kontakt/",
  "/planparty/nutzungsbedingungen/",
  "/planparty/quellen/",
];

for (const path of homepages) {
  test(`${path} hat keinen horizontalen Überlauf`, async ({ page }) => {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    const overflow = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      offenders: [...document.querySelectorAll<HTMLElement>("body *")]
        .filter((node) => {
          if (node.closest(".screenshot-gallery")) return false;
          const box = node.getBoundingClientRect();
          return box.right > document.documentElement.clientWidth + 1 || box.left < -1;
        })
        .slice(0, 10)
        .map((node) => `${node.tagName.toLowerCase()}.${node.className}`),
    }));
    expect(overflow, JSON.stringify(overflow)).toEqual({
      clientWidth: overflow.clientWidth,
      scrollWidth: overflow.clientWidth,
      offenders: [],
    });
  });

  test(`${path} hat keine automatisiert erkennbaren A11y-Verstöße @a11y`, async ({
    page,
  }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test(`${path} lädt sichtbare Bilder vollständig`, async ({ page }) => {
    await page.goto(path);
    const images = page.locator("img");
    const imageCount = await images.count();
    for (let index = 0; index < imageCount; index += 1) {
      const image = images.nth(index);
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          image.evaluate((node) => {
            const element = node as HTMLImageElement;
            return element.complete && element.naturalWidth > 0;
          }),
        )
        .toBe(true);
    }
    const broken = await images.evaluateAll((nodes) =>
      nodes
        .map((node) => node as HTMLImageElement)
        .filter((image) => !image.complete || image.naturalWidth === 0)
        .map((image) => image.getAttribute("src")),
    );
    expect(broken).toEqual([]);
  });
}

for (const path of formPages) {
  test(`${path} ist im Formularbereich barrierefrei @a11y`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

test("Alle statisch erzeugten Inhaltsseiten antworten erfolgreich", async ({ page }) => {
  test.skip(test.info().project.name !== "mobile", "Ein HTTP-Durchlauf genügt");
  for (const path of generatedPages) {
    const response = await page.goto(path);
    expect(response?.ok(), path).toBe(true);
  }
});

test("Beide App-Videos sind erreichbar", async ({ request }) => {
  for (const path of ["/media/planteller-intro.webm", "/media/planparty-intro.webm"]) {
    const response = await request.get(path);
    expect(response.ok(), path).toBe(true);
    expect(response.headers()["content-type"]).toContain("video/webm");
  }
});

test("App-Vorschauen laufen im Hero und lassen sich pausieren", async ({ page }) => {
  test.skip(test.info().project.name !== "desktop", "Ein Browser-Durchlauf genügt");
  for (const path of ["/planteller/", "/planparty/"]) {
    await page.goto(path);
    const video = page.locator(".loop-preview video");
    await expect(video).toHaveAttribute("autoplay", "");
    await expect(video).toHaveAttribute("loop", "");
    await expect
      .poll(() => video.evaluate((element) => !(element as HTMLVideoElement).paused))
      .toBe(true);
    await page.getByRole("button", { name: "Animation pausieren" }).click();
    await expect
      .poll(() => video.evaluate((element) => (element as HTMLVideoElement).paused))
      .toBe(true);
  }
});

test("App-Auswahl bleibt auf kleinen Displays zweispaltig", async ({ page }) => {
  test.skip(test.info().project.name !== "mobile", "Nur für kleine Displays relevant");
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  const cards = page.locator(".app-card");
  await expect(cards).toHaveCount(2);
  const first = await cards.nth(0).boundingBox();
  const second = await cards.nth(1).boundingBox();
  expect(first).not.toBeNull();
  expect(second).not.toBeNull();
  expect(Math.abs((first?.y ?? 0) - (second?.y ?? 0))).toBeLessThan(2);
});

test("Screenshot-Strecken zeigen große Bilder mit Originalansicht", async ({ page }) => {
  test.skip(test.info().project.name !== "mobile", "Nur ein mobiler Durchlauf nötig");
  for (const path of ["/planteller/", "/planparty/"]) {
    await page.goto(path);
    const firstCard = page.locator(".screenshot-card").first();
    await firstCard.scrollIntoViewIfNeeded();
    const image = firstCard.locator("img");
    await expect
      .poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
    const imageBox = await image.boundingBox();
    expect(imageBox?.width ?? 0).toBeGreaterThan(300);
    await expect(firstCard.getByRole("link")).toHaveAttribute("target", "_blank");
  }
});

test("App-Seiten verwenden ihre offiziellen Favicons", async ({ page }) => {
  for (const [path, favicon] of [
    ["/planteller/", "/planteller/favicon.png"],
    ["/planparty/", "/planparty/favicon.png"],
  ] as const) {
    await page.goto(path);
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", favicon);
  }
});

test("Mobile Navigation ist per Tastatur bedienbar", async ({ page }) => {
  test.skip(test.info().project.name !== "mobile", "Nur für den mobilen Header relevant");
  await page.goto("/planparty/");
  const menu = page.locator("[data-menu-button]");
  await menu.focus();
  await page.keyboard.press("Enter");
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("navigation", { name: "Hauptnavigation" })).toBeVisible();
});

test("App-Deep-Links behalten ihren Token", async ({ page }) => {
  await page.goto("/planteller/recipe-share/demo-token?source=test");
  await expect(page.locator("h1")).toContainText("Rezept");
  await expect(page.locator("[data-share-token]")).toHaveText("demo-token");
});

test("Kanonische URLs zeigen auf die vorgesehenen Hosts", async ({ page }) => {
  const expectations = [
    ["/", "https://www.telli-apps.de/"],
    ["/planteller/", "https://planteller.telli-apps.de/"],
    ["/planparty/", "https://planparty.telli-apps.de/"],
  ] as const;
  for (const [path, canonical] of expectations) {
    await page.goto(path);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      canonical,
    );
  }
});
