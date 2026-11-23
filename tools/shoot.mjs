// Screenshots of the built site for review (review/, which git ignores because the pages show
// Justin's photos), and the share card docs/og.png drawn from tools/og.html (type only, no photo).
// Usage: node tools/shoot.mjs [page ...]     pages by name: home, self-tape, coaching, ...
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { launch, pages, root } from "./cdp.mjs";

const want = process.argv.slice(2);
const phone = { w: 390, h: 844, dpr: 2, mobile: true };
const views = [
  { tag: "desktop", w: 1440, h: 900 },
  { tag: "phone", ...phone },
];
mkdirSync(join(root, "review"), { recursive: true });
const browser = await launch({ timeout: 90000 });
const shot = async (tab, opts) => Buffer.from((await tab.send("Page.captureScreenshot", opts)).data, "base64");
let failed = false;
try {
  if (!want.length || want.includes("og")) {
    const tab = await browser.open(pathToFileURL(join(root, "tools/og.html")).href, { w: 1200, h: 630 });
    writeFileSync(join(root, "docs/og.png"), await shot(tab, { format: "png" }));
    console.log("wrote docs/og.png");
    await tab.close();
  }
  for (const page of pages.filter((p) => !want.length || want.includes(p.name))) {
    for (const v of views) {
      const tab = await browser.open(page.url + "?still", v);
      // Let lazy pictures load: scroll through once, then back to the top.
      await tab.evaluate(`(async () => {
        document.querySelectorAll("img[loading=lazy]").forEach((img) => { img.loading = "eager"; });
        for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
        await Promise.race([
          Promise.all([...document.images].map((img) => img.complete ? 1 : new Promise((r) => { img.onload = img.onerror = r; }))),
          new Promise((r) => setTimeout(r, 25000)),
        ]);
        scrollTo(0, 0); await new Promise(r => setTimeout(r, 600));
      })()`);
      const m = await tab.send("Page.getLayoutMetrics");
      const width = await tab.evaluate("document.documentElement.scrollWidth");
      if (width > v.w) { console.error(`${page.name} ${v.tag}: page is ${width}px wide in a ${v.w}px window`); failed = true; }
      const h = Math.ceil(m.cssContentSize.height);
      const buf = await shot(tab, { format: "jpeg", quality: 72, captureBeyondViewport: true, clip: { x: 0, y: 0, width: v.w, height: h, scale: 1 } });
      writeFileSync(join(root, `review/${page.name}-${v.tag}.jpg`), buf);
      console.log(`wrote review/${page.name}-${v.tag}.jpg (${h}px)`);
      await tab.close();
    }
  }
} catch (e) { console.error(e.message); failed = true; }
await browser.close();
process.exit(failed ? 1 : 0);
