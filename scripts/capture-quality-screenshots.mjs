import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

/* global localStorage */

const output = resolve("test-results/visual");
await mkdir(output, { recursive: true });
const browser = await chromium.launch(
  process.env.CI ? { headless: true } : { headless: true, channel: "msedge" },
);

async function waitForImage(image) {
  await image.evaluate(async (element) => {
    if (element.complete && element.naturalWidth > 0) return;
    await new Promise((resolveLoad) =>
      element.addEventListener("load", resolveLoad, { once: true }),
    );
  });
}

async function waitForFirstScreenshot(page) {
  await waitForImage(page.locator(".screenshot-card img").first());
  await page.waitForTimeout(300);
}

async function waitForDialogScreenshot(page) {
  await waitForImage(page.locator("[data-lightbox-image]"));
  await page.waitForTimeout(100);
}

try {
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: "light",
  });
  for (const [name, path] of [
    ["telliapps", "/"],
    ["planteller", "/planteller/"],
    ["planparty", "/planparty/"],
  ]) {
    const page = await desktop.newPage();
    await page.goto(`http://127.0.0.1:4321${path}`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: resolve(output, `${name}-desktop.png`) });
    if (name === "telliapps") {
      await page.locator(".app-collection").scrollIntoViewIfNeeded();
      await page.locator(".app-collection").screenshot({
        path: resolve(output, `${name}-app-collection.png`),
      });
    } else {
      if (name === "planteller") {
        await page.locator(".telli-section").scrollIntoViewIfNeeded();
        await page.locator(".telli-section").screenshot({
          path: resolve(output, `${name}-telli-section.png`),
        });
      }
      await page.locator("#einblicke").scrollIntoViewIfNeeded();
      await waitForFirstScreenshot(page);
      await page
        .locator(".screenshot-card")
        .first()
        .screenshot({
          path: resolve(output, `${name}-screenshot-card.png`),
        });
      await page.locator("[data-screenshot-open]").first().click();
      await waitForDialogScreenshot(page);
      await page.locator("[data-screenshot-dialog]").screenshot({
        path: resolve(output, `${name}-screenshot-dialog.png`),
      });
      await page.keyboard.press("Escape");
    }
    await page.close();
  }
  await desktop.close();

  const darkDesktop = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: "dark",
  });
  await darkDesktop.addInitScript(() => {
    localStorage.setItem("telliapps-theme", "dark");
  });
  for (const [name, path] of [
    ["planteller", "/planteller/"],
    ["planparty", "/planparty/"],
  ]) {
    const page = await darkDesktop.newPage();
    await page.goto(`http://127.0.0.1:4321${path}`);
    await page.locator(".loop-preview video").waitFor();
    await page.waitForTimeout(300);
    await page.locator(".app-hero__visual").screenshot({
      path: resolve(output, `${name}-hero-dark.png`),
    });
    await page.close();
  }
  await darkDesktop.close();

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: "light",
    isMobile: true,
    deviceScaleFactor: 1,
  });
  for (const [name, path] of [
    ["telliapps", "/"],
    ["planteller", "/planteller/"],
    ["planparty", "/planparty/"],
    ["planparty-beta", "/planparty/beta/"],
  ]) {
    const page = await mobile.newPage();
    await page.goto(`http://127.0.0.1:4321${path}`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: resolve(output, `${name}-mobile.png`) });
    if (name === "telliapps") {
      await page.locator(".app-collection").scrollIntoViewIfNeeded();
      await page.locator(".app-collection").screenshot({
        path: resolve(output, `${name}-app-collection-mobile.png`),
      });
    } else if (name === "planteller" || name === "planparty") {
      await page.locator("#einblicke").scrollIntoViewIfNeeded();
      await waitForFirstScreenshot(page);
      await page
        .locator(".screenshot-card")
        .first()
        .screenshot({
          path: resolve(output, `${name}-screenshot-card-mobile.png`),
        });
      await page.locator("[data-screenshot-open]").first().click();
      await waitForDialogScreenshot(page);
      await page.locator("[data-screenshot-dialog]").screenshot({
        path: resolve(output, `${name}-screenshot-dialog-mobile.png`),
      });
      await page.keyboard.press("Escape");
    }
    await page.close();
  }
  await mobile.close();

  const small = await browser.newContext({
    viewport: { width: 320, height: 568 },
    colorScheme: "light",
    isMobile: true,
    deviceScaleFactor: 1,
  });
  const smallPage = await small.newPage();
  await smallPage.goto("http://127.0.0.1:4321/");
  await smallPage.waitForLoadState("networkidle");
  await smallPage.screenshot({ path: resolve(output, "telliapps-small.png") });
  await smallPage.locator(".app-collection").scrollIntoViewIfNeeded();
  await smallPage.locator(".app-collection").screenshot({
    path: resolve(output, "telliapps-app-collection-small.png"),
  });
  await small.close();
} finally {
  await browser.close();
}
