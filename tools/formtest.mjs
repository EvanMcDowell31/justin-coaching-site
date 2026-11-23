// Fills the 30 on Me form twice (a fit and not yet a fit) and the contact form, submits each, and
// prints what the visitor would see next. Usage: node tools/formtest.mjs
import { launch, pages } from "./cdp.mjs";
const url = (name) => pages.find((p) => p.name === name).url;
const browser = await launch();
const cases = [
  { name: "fit", answers: ["Actively auditioning or working", "Improving my acting or audition skills", "Within 30 days", "Possibly, depending on the fit"] },
  { name: "curious", answers: ["Just curious about acting", "Exploring acting as a hobby", "Just researching for now", "Yes, I’m actively looking"] },
  { name: "free only", answers: ["Actively auditioning or working", "Building an acting career", "Immediately", "No, I’m only interested in the free session"] },
];
for (const c of cases) {
  const tab = await browser.open(url("30-on-me") + "?utm_source=instagram&utm_campaign=fall", { w: 1280, h: 900 });
  const out = await tab.evaluate(`(() => {
    const f = document.querySelector("form[data-form=thirty]");
    const set = (n, v) => { const el = f.elements[n]; el.value = v; };
    set("Name", "Alice Example Smith"); set("Phone", "(404) 555-0123"); set("Email", "alice@example.com");
    ${JSON.stringify(c.answers)}.forEach((v, i) => set(["Acting journey", "Help with", "Start training", "Paid coaching"][i], v));
    f.requestSubmit();
    const done = document.getElementById("thirty-done");
    const shown = [...done.querySelectorAll("[data-when]")].filter((e) => !e.hidden).map((e) => e.querySelector("h2").textContent);
    return { formHidden: f.hidden, doneShown: !done.hidden, heading: shown, first: done.querySelector("[data-first]").textContent, pick: done.querySelector("[data-pick]").href, result: f.elements.Result.value, focus: document.activeElement.id };
  })()`);
  console.log(c.name, JSON.stringify(out, null, 1));
  await tab.close();
}
const tab = await browser.open(url("30-on-me"), { w: 1280, h: 900 });
console.log("empty submit", JSON.stringify(await tab.evaluate(`(() => { const f = document.querySelector("form[data-form=thirty]"); f.requestSubmit(); return { formHidden: f.hidden, invalid: [...f.querySelectorAll(":invalid")].map((e) => e.name) }; })()`)));
await tab.close();
const ct = await browser.open(url("contact"), { w: 1280, h: 900 });
console.log("contact", JSON.stringify(await ct.evaluate(`(() => { const f = document.querySelector("form[data-form=contact]"); f.elements.Name.value = "Alice"; f.elements.Email.value = "alice@example.com"; f.requestSubmit(); return { formHidden: f.hidden, doneShown: !document.getElementById("contact-done").hidden }; })()`)));
await browser.close();
