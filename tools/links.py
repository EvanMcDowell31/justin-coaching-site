"""Checks every link in docs/: internal links must reach a page or file of the site (as GitHub
Pages and Cloudflare Pages serve them: /x -> x.html), and #anchors must exist. Lists the outside
addresses the site links to. Usage: python3 tools/links.py"""
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse

DOCS = Path(__file__).resolve().parent.parent / "docs"
BASE = "https://site.invalid/"


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hrefs, self.ids = [], set()

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get("id"):
            self.ids.add(a["id"])
        for k in ("href", "src"):
            if a.get(k) and tag != "html":
                self.hrefs.append((tag, a[k]))


def target(path):
    """The file a site path is served from, or None."""
    p = path.lstrip("/")
    for cand in ([p] if p and not p.endswith("/") else []) + [p + ".html" if p and not p.endswith("/") else None, (p + "index.html") if (not p or p.endswith("/")) else p + "/index.html"]:
        if cand and (DOCS / cand).is_file():
            return DOCS / cand
    return None


pages = {f: Links() for f in DOCS.rglob("*.html")}
for f, parser in pages.items():
    parser.feed(f.read_text())
bad, outside = [], set()
for f, parser in pages.items():
    rel = f.relative_to(DOCS).as_posix()
    if rel == "404.html":
        continue  # its links start at the GitHub Pages project path
    url = BASE + ("" if rel == "index.html" else rel[:-5])
    for tag, href in parser.hrefs:
        if href.startswith(("mailto:", "tel:", "data:")):
            continue
        full = urljoin(url, href)
        u = urlparse(full)
        if u.netloc != "site.invalid":
            outside.add(full.split("#")[0])
            continue
        dest = target(u.path)
        if not dest:
            bad.append(f"{rel}: {href} -> {u.path} is not a page or file")
            continue
        if u.fragment and dest.suffix == ".html" and u.fragment not in pages[dest].ids:
            bad.append(f"{rel}: {href} -> #{u.fragment} is not on {dest.relative_to(DOCS)}")
print("outside addresses:")
for o in sorted(outside):
    print("  ", o)
for b in bad:
    print("BROKEN", b)
print(f"{len(bad)} broken internal links in {len(pages)} pages")
sys.exit(1 if bad else 0)
