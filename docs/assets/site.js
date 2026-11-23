// Justin David Coaching: the few things the pages do, in plain JavaScript (no framework).
(() => {
  const html = document.documentElement;
  const root = html.dataset.root || "./";
  const q = new URLSearchParams(location.search);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  html.classList.remove("no-js");
  if (q.has("still")) html.classList.add("still");

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* private mode */ } },
  };

  // Where a visitor came from, kept for the session so the 30 on Me answers can carry it.
  try {
    const src = {};
    for (const k of ["utm_source", "utm_campaign", "utm_content", "fbclid", "gclid"]) if (q.get(k)) src[k] = q.get(k);
    if (Object.keys(src).length) sessionStorage.setItem("jd_src", JSON.stringify(src));
  } catch { /* storage off */ }
  function source() {
    let saved = null;
    try { saved = JSON.parse(sessionStorage.getItem("jd_src") || "null"); } catch { /* storage off */ }
    const get = (k) => q.get(k) || (saved && saved[k]) || "";
    const click = get("fbclid") ? "fbclid" : get("gclid") ? "gclid" : "";
    if (!get("utm_source") && !click) return "direct or organic";
    return [get("utm_source") || "unknown", get("utm_campaign"), get("utm_content"), click].filter(Boolean).join(" / ");
  }

  // Motion: the REC button pauses every loop on the page, and the choice is remembered.
  const still = () => html.classList.contains("still") || html.classList.contains("paused") || reduce.matches;
  if (store.get("jd-motion") === "paused") html.classList.add("paused");
  for (const rec of document.querySelectorAll("[data-motion]")) {
    const sync = () => {
      const paused = html.classList.contains("paused");
      rec.setAttribute("aria-pressed", String(paused));
      rec.setAttribute("aria-label", paused ? "Play the page's motion" : "Pause the page's motion");
    };
    sync();
    rec.addEventListener("click", () => {
      html.classList.toggle("paused");
      store.set("jd-motion", html.classList.contains("paused") ? "paused" : null);
      document.querySelectorAll("[data-motion]").forEach((b) => b.dispatchEvent(new Event("sync")));
      walk && walk.sync();
    });
    rec.addEventListener("sync", sync);
  }

  // Timecode, counting up from 01:00:00:00 at 24 frames a second.
  const tcs = document.querySelectorAll("[data-tc]");
  if (tcs.length) {
    const start = Date.now();
    const two = (n) => String(n).padStart(2, "0");
    const tick = () => {
      if (still()) return;
      const ms = Date.now() - start, s = Math.floor(ms / 1000);
      const text = `01:${two(Math.floor(s / 60) % 60)}:${two(s % 60)}:${two(Math.floor((ms % 1000) / 1000 * 24))}`;
      tcs.forEach((el) => { el.textContent = text; });
    };
    setInterval(tick, 100);
  }

  // Phone menu.
  const menu = document.querySelector(".menu-btn");
  const nav = document.getElementById("site-nav");
  if (menu && nav) {
    menu.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      menu.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("open")) { nav.classList.remove("open"); menu.setAttribute("aria-expanded", "false"); menu.focus(); }
    });
  }

  // Tickers: each has its own pause button; hovering pauses too.
  for (const btn of document.querySelectorAll(".marquee-pause")) {
    const m = document.querySelector(btn.dataset.target) || btn.closest(".marquee");
    btn.addEventListener("click", () => {
      const stopped = m.classList.toggle("stopped");
      btn.setAttribute("aria-pressed", String(stopped));
    });
  }

  // "Inside your session": four parts that step on every six seconds, with a pause button.
  let walk = null;
  const walkEl = document.querySelector("[data-walk]");
  if (walkEl) {
    const tabs = [...walkEl.querySelectorAll("[role=tab]")];
    const panels = [...walkEl.querySelectorAll("[role=tabpanel]")];
    const pause = walkEl.querySelector(".walk-pause");
    let i = 0, p = 0, stopped = false;
    const show = (n, focus) => {
      i = (n + tabs.length) % tabs.length; p = 0;
      tabs.forEach((t, k) => { t.setAttribute("aria-selected", String(k === i)); t.tabIndex = k === i ? 0 : -1; t.style.setProperty("--p", "0%"); });
      panels.forEach((el, k) => { el.hidden = k !== i; });
      if (focus) tabs[i].focus();
    };
    const sync = () => {
      const off = stopped || still();
      walkEl.classList.toggle("stopped", off);
      pause.setAttribute("aria-pressed", String(stopped));
      pause.querySelector("span").textContent = stopped ? "Play" : "Pause";
      tabs[i].style.setProperty("--p", off && !stopped ? "100%" : `${Math.round(p * 100)}%`);
    };
    tabs.forEach((t, k) => {
      t.addEventListener("click", () => { show(k); stopped = true; sync(); });
      t.addEventListener("keydown", (e) => {
        const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (d) { e.preventDefault(); show(i + d, true); stopped = true; sync(); }
      });
    });
    pause.addEventListener("click", () => { stopped = !stopped; sync(); });
    walkEl.addEventListener("focusin", () => { if (!stopped) { stopped = true; sync(); } });
    setInterval(() => {
      if (stopped || still()) return;
      p += 0.1 / 6;
      if (p >= 1) show(i + 1);
      tabs[i].style.setProperty("--p", `${Math.round(p * 100)}%`);
    }, 100);
    show(0); sync();
    walk = { sync };
  }

  // The credits reel: arrows scroll it a card at a time.
  for (const box of document.querySelectorAll("[data-reel]")) {
    const list = box.querySelector(".reel");
    box.querySelectorAll("[data-dir]").forEach((b) => b.addEventListener("click", () => {
      const card = list.querySelector("li");
      const step = card ? card.getBoundingClientRect().width + 18 : 378;
      list.scrollBy({ left: Number(b.dataset.dir) * step, behavior: still() ? "auto" : "smooth" });
    }));
  }

  // Coaching packages: three packages at two paces.
  const PACKAGES = [
    { name: "The Start", label: "PACKAGE ONE", d: "Your first block of sessions. Enough volume to feel the work start to change, and the honest way in with no minimum attached.", sessions: 8, hours: 12, w2: "4 wks", w3: "3 wks", c2: "8 sessions at 2 times a week. Tuesday and Thursday each week.", c3: "8 sessions at 3 times a week. Monday, Wednesday and Friday, wrapped up inside three weeks.", price: "$1,000", per: "$125 a session, for ninety full minutes", list: "List value $1,800. You save $800 at founding pricing.", pts: ["Your first block of 8 sessions", "In depth analysis on your tapes", "Craft work and business work, both"] },
    { name: "The Season", label: "PACKAGE TWO · MOST CHOSEN", d: "The right pace for most actors. Two blocks of steady volume, real change, and room to live your life around it.", sessions: 16, hours: 24, w2: "8 wks", w3: "6 wks", c2: "16 sessions at 2 times a week. Tuesday and Thursday each week. Two months in total.", c3: "16 sessions at 3 times a week. Monday, Wednesday and Friday, done in just under six weeks.", price: "$1,900", per: "About $119 a session, for ninety full minutes", list: "List value $3,600. You save $1,700 at founding pricing.", pts: ["Two blocks of 8 sessions each", "In depth analysis on your tapes", "A lower per session price than The Start"] },
    { name: "The Intensive", label: "PACKAGE THREE", d: "The deepest stack of the three. For the actor in a real season of auditions, or the actor who is done moving slowly and wants the volume turned all the way up.", sessions: 24, hours: 36, w2: "12 wks", w3: "8 wks", c2: "24 sessions at 2 times a week. Tuesday and Thursday each week. Three months in total.", c3: "24 sessions at 3 times a week. Monday, Wednesday and Friday each week.", price: "$2,700", per: "$112.50 a session, for ninety full minutes", list: "List value $5,400. You save $2,700 at founding pricing.", pts: ["Three blocks of 8, the most sessions of the three", "The lowest per session price of the three", "An audition is almost never more than a day from a session"] },
  ];
  for (const box of document.querySelectorAll("[data-packages]")) {
    let pk = 1, pace = 2;
    const $ = (sel) => box.querySelector(sel);
    const set = (sel, text) => { const el = $(sel); if (el) el.textContent = text; };
    const render = () => {
      const d = PACKAGES[pk];
      box.querySelectorAll("[data-pk]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.pk) === pk)));
      box.querySelectorAll("[data-pace]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.pace) === pace)));
      set("[data-f=label]", d.label); set("[data-f=name]", d.name); set("[data-f=d]", d.d);
      set("[data-f=sessions]", d.sessions); set("[data-f=hours]", d.hours);
      set("[data-f=weeks]", pace === 2 ? d.w2 : d.w3); set("[data-f=days]", pace === 2 ? "Tue and Thu" : "Mon, Wed and Fri");
      set("[data-f=cadence]", pace === 2 ? "Stretched out: " + d.c2 : "Kept down tight: " + d.c3);
      set("[data-f=big]", d.hours + " hrs"); set("[data-f=in]", "of one on one work on you, in " + (pace === 2 ? d.w2 : d.w3));
      set("[data-f=class]", `A typical class gives you about 1 hour a month on you. That is ${d.hours} months of class.`);
      set("[data-f=month]", `${pace === 2 ? 12 : 18} hrs a month at ${pace}x a week`);
      set("[data-f=price]", d.price); set("[data-f=per]", d.per); set("[data-f=list]", d.list);
      const meter = $("[data-f=meter]"); if (meter) meter.style.width = Math.round(d.hours / 36 * 100) + "%";
      const pts = $("[data-f=pts]"); if (pts) pts.replaceChildren(...d.pts.map((t) => Object.assign(document.createElement("li"), { textContent: t })));
    };
    box.querySelectorAll("[data-pk]").forEach((b) => b.addEventListener("click", () => { pk = Number(b.dataset.pk); render(); }));
    box.querySelectorAll("[data-pace]").forEach((b) => b.addEventListener("click", () => { pace = Number(b.dataset.pace); render(); }));
    const next = $("[data-next]"); if (next) next.addEventListener("click", () => { pk = (pk + 1) % 3; render(); });
    render();
  }

  // Booking: one dialog for every "book" button, preset to the session that button names.
  const ACUITY = "https://justindavidcoaching.as.me/";
  const CHOICES = [
    { id: "free", title: "First 30 on me", meta: "30 minute Reader Session · First time actors working with me", price: "$0", href: root + "30-on-me", d: "Bring a scene. We’ll work on the scene. It’s already free: no code and no card needed. One first session per actor, subject to availability." },
    { id: "30", title: "The Reader", meta: "30 minutes · Live on Zoom", price: "$75", href: ACUITY + "?appointmentType=99945435", d: "For prepared material. A live reader, specific notes, and playback within your booked time." },
    { id: "60", title: "Coach + Reader", meta: "60 minutes · Live on Zoom", price: "$150", href: ACUITY + "?appointmentType=99945434", d: "Room to break down what’s happening, try choices, and tape together." },
    { id: "120", title: "The Long Session", meta: "120 minutes · Live on Zoom or in the Atlanta area", price: "$200", href: ACUITY + "?appointmentType=100284073", d: "For longer scenes or multiple auditions. Time to build the role and work through your material. For in person, message me first so we can agree on location and any travel fee." },
    { id: "consult", title: "Free coaching consultation", meta: "For one on one coaching · Goals, schedule and fit", price: "Free", href: ACUITY + "?appointmentType=100533768", d: "A talk, not a tape session. We go over where you are, what you want to book, and whether a package fits." },
  ];
  const dialog = document.getElementById("book");
  if (dialog && typeof dialog.showModal === "function") {
    const list = dialog.querySelector(".choices");
    list.replaceChildren(...CHOICES.map((c) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "choice"; b.dataset.choice = c.id;
      b.innerHTML = `<span><b></b><small></small></span><span class="p"></span>`;
      b.querySelector("b").textContent = c.title;
      b.querySelector("small").textContent = c.meta;
      b.querySelector(".p").textContent = c.price;
      b.addEventListener("click", () => choose(c.id));
      return b;
    }));
    const choose = (id) => {
      const c = CHOICES.find((x) => x.id === id) || CHOICES[0];
      dialog.querySelector(".book-title").textContent = c.title + ".";
      dialog.querySelectorAll(".choice").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.choice === c.id)));
      dialog.querySelector(".book-d").textContent = c.d;
      const steps = dialog.querySelectorAll(".book-steps li");
      steps[1].textContent = c.id === "free" ? "Answer the short intake questions and agree to the terms." : c.id === "consult" ? "Answer the short intake questions." : "Check the session length, price, and terms before confirming.";
      steps[2].textContent = c.id === "consult" ? "Use your confirmation email to join the call." : "Send your sides, then use your confirmation email to join.";
      dialog.querySelector(".book-terms").hidden = c.id !== "free";
      const go = dialog.querySelector(".book-go");
      go.href = c.href;
      go.textContent = c.id === "free" ? "Apply for your free 30" : "Open the booking calendar";
      if (c.href.startsWith("http")) { go.target = "_blank"; go.rel = "noopener"; } else { go.removeAttribute("target"); go.removeAttribute("rel"); }
    };
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-book]");
      if (!b) return;
      e.preventDefault();
      choose(b.dataset.book);
      dialog.showModal();
    });
    dialog.querySelector(".book-close").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
  }

  // Forms. In this draft nothing is sent anywhere: each form checks its fields and shows what a
  // visitor would see next. The live build posts to Justin's own Google Sheet (README, "Forms").
  const POINTS = {
    "Just curious about acting": 0, "Starting out or taking classes": 1, "Actively auditioning or working": 2,
    "Building an acting career": 2, "Improving my acting or audition skills": 2, "Exploring acting as a hobby": 0,
    "Immediately": 2, "Within 30 days": 1, "Just researching for now": 0,
    "Yes, I’m actively looking": 2, "Possibly, depending on the fit": 1, "No, I’m only interested in the free session": 0,
  };
  const FREE_ONLY = "No, I’m only interested in the free session";
  const FREE_URL = ACUITY + "?appointmentType=100672927";
  for (const form of document.querySelectorAll("form[data-form]")) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const val = (k) => String(data.get(k) || "").trim();
      if (["website", "company"].some((k) => val(k))) return; // a bot filled the hidden traps
      const done = document.getElementById(form.dataset.done);
      if (form.dataset.form === "thirty") {
        const answers = ["Acting journey", "Help with", "Start training", "Paid coaching"].map(val);
        const score = answers.reduce((n, a) => n + (POINTS[a] ?? 0), 0);
        const qualified = answers[3] !== FREE_ONLY && score >= 4;
        const result = form.querySelector("input[name=Result]");
        if (result) result.value = `${qualified ? "QUALIFIED" : "NOT A FIT YET"} (score ${score} of 8) | Source: ${source()}`;
        const [first, ...rest] = val("Name").split(/\s+/).filter(Boolean);
        const url = new URL(FREE_URL);
        if (first) url.searchParams.set("firstName", first);
        if (rest.length) url.searchParams.set("lastName", rest.join(" "));
        if (val("Email")) url.searchParams.set("email", val("Email"));
        if (val("Phone")) url.searchParams.set("phone", val("Phone"));
        done.querySelectorAll("[data-when]").forEach((el) => { el.hidden = el.dataset.when !== (qualified ? "in" : "curious"); });
        done.querySelectorAll("[data-first]").forEach((el) => { el.textContent = first ? ", " + first : ""; });
        done.querySelector("[data-pick]").href = url.href;
        done.querySelectorAll("[data-score]").forEach((el) => { el.textContent = result.value; });
      }
      form.hidden = true;
      done.hidden = false;
      done.focus();
    });
  }
})();
