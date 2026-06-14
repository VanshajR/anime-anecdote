import { chromium } from "playwright";

const routes = [
  { path: "/", name: "hub" },
  { path: "/wrapped", name: "wrapped" },
];
const themes = ["light", "dark"];

let browser;
for (const channel of ["msedge", "chrome"]) {
  try {
    browser = await chromium.launch({ channel });
    console.log("launched", channel);
    break;
  } catch {
    /* try next */
  }
}
if (!browser) browser = await chromium.launch();

for (const theme of themes) {
  for (const { path, name } of routes) {
    for (const [vp, w, h] of [
      ["desktop", 1440, 900],
      ["mobile", 390, 844],
    ]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      await ctx.addInitScript((t) => {
        try {
          localStorage.setItem("anikit-theme", t);
        } catch {}
      }, theme);
      const page = await ctx.newPage();
      await page.goto("http://localhost:3001" + path, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: `scripts/shots/${name}-${theme}-${vp}.png`,
        fullPage: vp === "mobile",
      });
      console.log("shot", name, theme, vp);
      await ctx.close();
    }
  }
}
await browser.close();
