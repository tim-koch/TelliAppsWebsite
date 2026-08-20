import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const output = resolve("test-results/visual");
await mkdir(output, { recursive: true });
const browser = await chromium.launch(
  process.env.CI ? { headless: true } : { headless: true, channel: "msedge" },
);

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
    if (name !== "telliapps") {
      await page.locator(".demo-section").screenshot({
        path: resolve(output, `${name}-video-section.png`),
      });
    }
    await page.close();
  }
  await desktop.close();

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
    await page.close();
  }
  await mobile.close();
} finally {
  await browser.close();
}
