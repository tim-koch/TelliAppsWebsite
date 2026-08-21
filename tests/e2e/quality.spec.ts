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
    const images = page.locator("img:not([data-lightbox-image])");
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
  for (const path of [
    "/media/planteller-intro.webm",
    "/media/planteller-intro-dark.webm",
    "/media/planparty-intro.webm",
    "/media/planparty-intro-dark.webm",
  ]) {
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
    const videoBox = await video.boundingBox();
    expect(videoBox?.width ?? 0).toBeGreaterThan(390);
    await expect
      .poll(() =>
        page
          .locator(".loop-preview")
          .evaluate((element) => getComputedStyle(element).borderTopWidth),
      )
      .toBe("0px");
    await expect
      .poll(() =>
        video.evaluate((element) => getComputedStyle(element).borderTopLeftRadius),
      )
      .not.toBe("0px");
    await expect
      .poll(() => video.evaluate((element) => getComputedStyle(element).maskImage))
      .not.toBe("none");
    await page.getByRole("button", { name: "Animation pausieren" }).click();
    await expect
      .poll(() => video.evaluate((element) => (element as HTMLVideoElement).paused))
      .toBe(true);
  }
});

test("Hero-Videos laufen im Dark Mode weicher in den Hintergrund aus", async ({
  page,
}) => {
  test.skip(test.info().project.name !== "desktop", "Ein Desktop-Durchlauf genügt");
  await page.addInitScript(() => localStorage.setItem("telliapps-theme", "dark"));
  for (const path of ["/planteller/", "/planparty/"]) {
    await page.goto(path);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    const video = page.locator(".loop-preview video");
    await expect
      .poll(() => video.evaluate((element) => (element as HTMLVideoElement).currentSrc))
      .toContain("-dark.webm");
    await expect
      .poll(() =>
        video.evaluate((element) => ({
          fadeX: getComputedStyle(element).getPropertyValue("--preview-fade-x").trim(),
          fadeY: getComputedStyle(element).getPropertyValue("--preview-fade-y").trim(),
          mask: getComputedStyle(element).maskImage,
        })),
      )
      .toEqual({ fadeX: "4%", fadeY: "2%", mask: expect.stringContaining("4%") });
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

test("Screenshot-Strecken öffnen eine große Ansicht im Seitendialog", async ({
  page,
}) => {
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
    expect(imageBox?.width ?? 0).toBeGreaterThan(200);
    expect(imageBox?.width ?? 0).toBeLessThan(280);
    const openButton = firstCard.getByRole("button", { name: /Groß ansehen/ });
    await openButton.click();
    const dialog = page.locator("dialog[data-screenshot-dialog]");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("[data-lightbox-image]")).toHaveAttribute(
      "src",
      /_astro\//,
    );
    await expect
      .poll(() =>
        dialog
          .locator("[data-lightbox-image]")
          .evaluate((element) => (element as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
    const results = await new AxeBuilder({ page })
      .include("dialog[data-screenshot-dialog]")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(openButton).toBeFocused();
  }
});

test("Vertikales Scrollen über der Screenshot-Strecke bewegt die Seite", async ({
  page,
}) => {
  test.skip(test.info().project.name !== "desktop", "Ein Desktop-Durchlauf genügt");
  await page.goto("/planteller/");
  const track = page.locator("[data-screenshot-track]");
  await track.scrollIntoViewIfNeeded();
  const box = await track.boundingBox();
  expect(box).not.toBeNull();
  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.move((box?.x ?? 0) + 100, (box?.y ?? 0) + 100);
  await page.mouse.wheel(0, 420);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(before + 200);
  await expect.poll(() => track.evaluate((element) => element.scrollTop)).toBe(0);
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
