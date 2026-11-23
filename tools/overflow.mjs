// Lists what sticks out past the right edge of a phone-width window, for each page named.
// Usage: node tools/overflow.mjs [page ...]
import { launch, pages } from "./cdp.mjs";
const want = process.argv.slice(2);
const browser = await launch();
for (const page of pages.filter((p) => !want.length || want.includes(p.name))) {
  for (const w of [390, 320]) {
    const tab = await browser.open(page.url + "?still", { w, h: 800, mobile: true, dpr: 2 });
    const out = await tab.evaluate(`(() => {
      const vw = document.documentElement.clientWidth;
      return { vw, sw: document.documentElement.scrollWidth, wide: [...document.querySelectorAll("body *")].filter((el) => {
        if (el.closest(".marquee, .reel, [hidden], dialog")) return false;
        const r = el.getBoundingClientRect(); return r.width && r.right > vw + 0.5;
      }).slice(0, 8).map((el) => el.tagName.toLowerCase() + "." + [...el.classList].join(".") + " right=" + Math.round(el.getBoundingClientRect().right)) };
    })()`);
    console.log(page.name, w, JSON.stringify(out));
    await tab.close();
  }
}
await browser.close();
