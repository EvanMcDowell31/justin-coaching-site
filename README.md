# Justin David Coaching, without Framer

A draft: justindavidcoaching.com rebuilt as a plain static site, so it can be hosted for free instead of on
Framer ($15 a month). Same pages, same addresses, same words, same look. It is a proposal for Justin to
compare with his live site; nothing here replaces it until he says so.

- Live site (Framer): https://www.justindavidcoaching.com/
- This draft: https://evanmcdowell31.github.io/justin-coaching-site/ (noindex, with a draft strip on every page)

## What changes, and what doesn't

| Part | On Framer | Here |
| --- | --- | --- |
| Pages | 9 pages in its sitemap, plus the checkout page `/coaching/enroll` | 10 HTML pages in `docs/`, at the same paths (`/self-tape`, `/coaching`, `/coaching/enroll`, …), and a 404 page |
| Look and motion | Framer components | `docs/assets/site.css` and `site.js`, no framework; every loop can be paused |
| Booking | Acuity | Unchanged: the same Acuity links and pop-up |
| Ebook | Stripe payment link, delivery by Justin's own email automation | Unchanged |
| Forms | Framer Forms | Draft: they check the answers and show the next step, but send nothing. Live: a Google Apps Script on his Google Workspace writes each one to a Google Sheet and emails him (see "Forms") |
| Photos and videos | Framer's file host | Draft: loaded from Framer's file host, never copied into this public repo. Live: copied to the new host, videos re-encoded under 25 MB |
| Analytics | Framer analytics, plus GA, Meta Pixel and Clarity slots | Draft: none. Live: Cloudflare Web Analytics (free, no cookies) if he wants it |

## Where the draft differs from the live site

His words were matched line by line against the live pages as published on 23 Nov 2026 at 21:04 UTC.
On purpose, the draft differs in these places:

- The home page's `h1` is the headline alone. Live, it also wraps the hero's decorative frame text
  (REC, timecode, "Scene 01 / Take 15").
- "About Me" goes to the About section of the home page. Live, it goes to the top of the home page.
- Every ticker has a pause button, and the REC button pauses all of the page's motion. The book cover
  doesn't sway. (WCAG 2.2.2: moving content needs a way to stop it.)
- The services timeline is a plain list with a photo beside each entry. Live, a sticky photo swaps as
  you scroll and the other entries dim.
- The checkout page has its own title. Live, it carries the home page's.
- The legal pages' "•" lines are real lists.
- No analytics. The live site has slots for Google Analytics, Meta Pixel and Clarity.

Found on the live site, for Justin:

- The 30 on Me terms differ by screen size. Desktop shows the 19 Nov version; phones show an older 16 Nov
  version (it mentions the Actors community on Skool and lacks "I may edit it…"). The draft uses the
  desktop version.
- The 404 page's title is "Page Not Found | Framer".

## Build and check

```
python3 tools/build.py          # src/ -> docs/
python3 tools/links.py          # every internal link and #anchor resolves
node tools/formtest.mjs         # the forms, 30 on Me scoring included
node tools/shoot.mjs [page]     # review/ screenshots (git-ignored) and docs/og.png
node tools/overflow.mjs [page]  # anything wider than a phone
node tools/a11y.mjs             # axe-core WCAG 2.2 AA, keyboard and motion checks
node tools/live-shots.mjs SLUG  # shots of the live Framer page, for comparison
```

Node 22+ and Playwright's cached headless shell; no window ever opens.

## How a page is made

`src/layout.html` is the frame every page shares: head, draft strip, header, footer and the booking pop-up.
`src/pages/NAME.html` is one page's `<main>`, starting with a line of JSON (path, title, description, and
optionally `jsonld`, `css` and `js`; see `tools/build.py`). Write links as `{{root}}coaching`; the build
makes them relative, so the site works at a domain root and under a GitHub Pages project path alike.

Shared pieces, in `site.css` and `site.js`:

- **Layout:** `.wrap` (1240 px column), `.section` / `.section.tight` (vertical rhythm), `.split-head`
  (heading left, text right), `.grid-2`, `.card` (+ `.card-lift` for the hover lift).
- **Type:** `.display` (Anton, upper case) with sizes `.h-hero`, `.h-xl`, `.h-lg`, `.h-md`, `.h-sm`; `.o` for
  the orange half of a heading; `.eyebrow` (+ `.dot` or `.dash`), `.lead`, `.muted`, `.small`, `.tiny`, `.label`.
- **Buttons:** `.btn` + `.btn-primary` (orange), `.btn-ghost`, `.btn-cream`, `.btn-dark`, `.btn-sm`; `.pill`; `.link`.
- **Booking:** any link with `data-book="free|30|60|120|consult"` opens the booking pop-up on that choice;
  without JavaScript it follows its own `href` (Acuity, or `30-on-me` for the free session).
- **Lists:** `.plus-list` (orange +), `.slash-list` (orange /).
- **Motion:** `.marquee` > `.marquee-track` (content twice, the second copy `aria-hidden`) with a
  `.marquee-pause` button (`data-target="#id"`); `[data-motion]` is the REC button that pauses everything;
  `html.still` (`?still` in the address) and `html.paused` stop all motion.
- **Widgets:** `[data-walk]` tabbed walkthrough that steps every 6 s (any number of `role=tab` /
  `role=tabpanel` pairs); `[data-reel]` side-scrolling cards with `[data-dir]` arrows;
  `[data-packages]` the coaching packages picker (fields marked `data-f=…`, prices included);
  `.faq details`; `.price-grid` / `.price` cards; `.video`.
- **Forms:** `form[data-form]` with `data-done="ID"` (the panel shown after a submit). The "30 on Me" form
  scores the answers exactly as the Framer site did and builds the prefilled Acuity link.

Photos and videos stay on `framerusercontent.com` in this draft, with `?scale-down-to=` sizes. Keep his
words exactly as the live site has them.

## Forms (live build)

Each form posts to one Google Apps Script web app on Justin's Google Workspace. It appends a row to a
"Website leads" sheet and emails justin@justindavidcoaching.com. Free, no monthly cap worth noticing, and
the sheet is his lead list. Fallback: Web3Forms' free plan (250 a month).

## Go live (after Justin's OK)

1. Justin invites Evan to his Cloudflare account (the domain is registered and its DNS is hosted there).
2. Copy the photos and videos into `docs/media/`, re-encode the videos under 25 MB each (Cloudflare's
   per-file limit), and point the pages at them.
3. Set up the Apps Script and point the forms at it; send a test through each.
4. Set `"draft": false` in `src/site.json`, build, and deploy `docs/` to Cloudflare Pages.
5. Point `www` and the apex at the new site in Cloudflare DNS. Leave the Google email records (MX, SPF,
   DMARC, the Google site verification) as they are.
6. Download his form submissions from Framer, then cancel Framer.

## Sources

- The live site, its sitemap and its page code, read 23 Nov 2026.
- Fonts: Anton and Inter from Google Fonts, under the SIL Open Font License (`docs/assets/fonts/OFL-*.txt`).
- `tools/cdp.mjs` comes from the owner's clinamen-site.
