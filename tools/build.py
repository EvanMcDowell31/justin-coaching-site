"""Builds the site into docs/ from src/: the shared frame in src/layout.html around each page in
src/pages/. Standard library only.

Each page starts with one line of JSON in an HTML comment:
  <!--{"path": "self-tape", "title": "...", "description": "...", "jsonld": "home.json",
       "css": ["self-tape.css"], "js": ["self-tape.js"]}-->
"css" and "js" (optional) name files in docs/assets/pages/ that only that page loads.
"path" is where the page is served ("" for the home page). GitHub Pages and Cloudflare Pages
both serve docs/self-tape.html at /self-tape, so every address stays what it is on Framer.

Usage: python3 tools/build.py
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
OUT = ROOT / "docs"
SITE = json.loads((SRC / "site.json").read_text())

DRAFT = """<div class="draft" role="note"><div class="wrap"><b>Draft</b><span>Justin David Coaching, rebuilt without Framer for Justin to compare. Not the official site, which is at <a href="https://www.justindavidcoaching.com/">justindavidcoaching.com</a>. Booking and checkout buttons go to his real Acuity and Stripe pages. Forms don’t send anything yet.</span></div></div>
"""
IRIE = '<p class="irie">Made with <a href="https://irie-people.github.io/irie/">Irie</a></p>'


def build():
    layout = (SRC / "layout.html").read_text()
    pages = sorted((SRC / "pages").glob("*.html"))
    sitemap = []
    for src in pages:
        text = src.read_text()
        m = re.match(r"<!--(\{.*?\})-->\n", text)
        if not m:
            raise SystemExit(f"{src.name}: the first line must be <!--{{json}}-->")
        meta = json.loads(m.group(1))
        body = text[m.end():]
        path = meta["path"]
        depth = path.count("/")
        root = "../" * depth if depth else "./"
        canonical = SITE["base"] + path
        jsonld = ""
        if meta.get("jsonld"):
            data = json.loads((SRC / "jsonld" / meta["jsonld"]).read_text())
            jsonld = '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "</script>\n"
        extra = ""
        for css in meta.get("css", []):
            extra += f'<link rel="stylesheet" href="{{{{root}}}}assets/pages/{css}">\n'
        for js in meta.get("js", []):
            extra += f'<script src="{{{{root}}}}assets/pages/{js}" defer></script>\n'
        page = layout
        swaps = {
            "title": html.escape(meta["title"]),
            "description": html.escape(meta["description"]),
            "canonical": canonical,
            "og_image": SITE["og_image"],
            "robots": '<meta name="robots" content="noindex, nofollow">\n' if SITE["draft"] else "",
            "draft": DRAFT if SITE["draft"] else "",
            "irie": IRIE,
            "jsonld": jsonld + extra,
            "body": body.strip(),
        }
        for k, v in swaps.items():
            page = page.replace("{{" + k + "}}", v)
        page = re.sub(r"\{\{cur:([a-z0-9/-]+)\}\}", lambda c: ' aria-current="page"' if c.group(1) == path else "", page)
        page = page.replace("{{root}}", root)
        left = re.findall(r"\{\{[^}]*\}\}", page)
        if left:
            raise SystemExit(f"{src.name}: unfilled {left}")
        out = OUT / ("index.html" if path == "" else path + ".html")
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(page)
        sitemap.append(canonical)
        print("wrote", out.relative_to(ROOT))
    (OUT / ".nojekyll").write_text("")
    urls = "".join(f"  <url><loc>{html.escape(u)}</loc></url>\n" for u in sitemap)
    (OUT / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n')
    robots = "User-agent: *\nDisallow: /\n" if SITE["draft"] else f"User-agent: *\nAllow: /\n\nSitemap: {SITE['base']}sitemap.xml\n"
    (OUT / "robots.txt").write_text(robots)


if __name__ == "__main__":
    build()
