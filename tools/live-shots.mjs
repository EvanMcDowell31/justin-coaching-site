// Shoots the live Framer site, for reference while rebuilding it. The shots stay in review/live/,
// which git ignores: they hold Justin's photos.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { launch, root } from "./cdp.mjs";

const base = "https://www.justindavidcoaching.com/";
const slugs = (process.argv[2] || "home,self-tape,coaching,services,contact,30-on-me").split(",");
const views = [
  { tag: "desktop", w: 1440, h: 900 },
  { tag: "phone", w: 390, h: 844, dpr: 2, mobile: true },
];
const browser = await launch({ timeout: 90000 });
try {
  for (const slug of slugs) {
    for (const v of views) {
      const tab = await browser.open(base + (slug === "home" ? "" : slug), v);
      // Scroll down in steps so every "appear" animation runs, then back to the top.
      await tab.evaluate(`(async () => {
        const step = innerHeight * 0.7;
        for (let y = 0; y < document.documentElement.scrollHeight; y += step) { scrollTo(0, y); await new Promise(r => setTimeout(r, 250)); }
        scrollTo(0, 0); await new Promise(r => setTimeout(r, 800));
      })()`);
      const m = await tab.send("Page.getLayoutMetrics");
      const h = Math.min(Math.ceil(m.cssContentSize.height), 16000);
      const shot = await tab.send("Page.captureScreenshot", { format: "jpeg", quality: 70, captureBeyondViewport: true, clip: { x: 0, y: 0, width: v.w, height: h, scale: 1 } });
      const out = join(root, `review/live/${slug}-${v.tag}.jpg`);
      writeFileSync(out, Buffer.from(shot.data, "base64"));
      console.log("wrote", out, h + "px");
      await tab.close();
    }
  }
} finally { await browser.close(); }
