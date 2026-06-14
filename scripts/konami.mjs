import { chromium } from "playwright";
let b; for (const ch of ["msedge","chrome"]) { try { b = await chromium.launch({channel:ch}); break; } catch {} }
if(!b) b = await chromium.launch();
const errs=[];
const page = await b.newPage({ viewport:{width:1280,height:800} });
page.on("pageerror",e=>errs.push("PAGEERR:"+e.message));
await page.goto("http://localhost:3000/", { waitUntil:"networkidle" });
await page.click("body");
const seq=["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
const t0=Date.now();
for (const k of seq){ await page.keyboard.press(k); await page.waitForTimeout(25); }
const marks=[500,1000,1700,2600,2950];
for (const m of marks){ const wait=m-(Date.now()-t0); if(wait>0) await page.waitForTimeout(wait); await page.screenshot({path:`scripts/shots/cb-${m}.png`}); }
console.log("errors:",JSON.stringify(errs));
await b.close();
