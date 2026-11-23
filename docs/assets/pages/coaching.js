// /coaching: the story timeline. Picking an entry shows its photo, caption and counter.
(() => {
  const box = document.querySelector(".timeline");
  if (!box) return;
  const imgs = [...box.querySelectorAll(".tl-frame img")];
  const buttons = [...box.querySelectorAll(".tl button")];
  const cap = box.querySelector("[data-tl-cap]");
  const count = box.querySelector("[data-tl-count]");
  const show = (i) => {
    imgs.forEach((img, k) => { img.hidden = k !== i; });
    buttons.forEach((b, k) => b.setAttribute("aria-pressed", String(k === i)));
    cap.textContent = imgs[i].dataset.caption;
    count.innerHTML = "";
    const n = document.createElement("b");
    n.className = "display";
    n.textContent = String(i + 1).padStart(2, "0");
    count.append(n, ` / ${String(imgs.length).padStart(2, "0")} · ${buttons[i].dataset.eye}`);
  };
  buttons.forEach((b, i) => b.addEventListener("click", () => show(i)));
})();
