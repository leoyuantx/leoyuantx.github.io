#!/usr/bin/env python3
"""
Extract words from a PDF and write a static HTML file listing the words.
Usage: python .scripts/extract_pdf_words.py <pdf-path> <out-html-path>
"""
import sys
import re
from pathlib import Path

def extract_text_from_pdf(path):
    try:
        from pypdf import PdfReader
    except Exception as e:
        raise RuntimeError("pypdf required (install with 'pip install pypdf')") from e
    reader = PdfReader(str(path))
    pages = []
    for p in reader.pages:
        txt = p.extract_text()
        if txt:
            pages.append(txt)
    return "\n".join(pages)

def extract_words(text):
    # keep letters, apostrophes and hyphens inside tokens
    tokens = re.findall(r"[A-Za-zÀ-ÖØ-öø-ÿ'-]+", text)
    # filter tokens that contain at least one letter
    tokens = [t.strip("-'") for t in tokens if re.search(r"[A-Za-z]", t)]
    # dedupe case-insensitively while preserving first-seen casing
    seen = {}
    for t in tokens:
        key = t.lower()
        if key not in seen:
            seen[key] = t
    words = list(seen.values())
    # sort alphabetically case-insensitive
    words.sort(key=lambda s: s.lower())
    return words

def build_html(words, title="Words of Champions"):
    parts = [
        "<!doctype html>",
        "<html lang=\"en\">",
        "<head>",
        "  <meta charset=\"utf-8\">",
        f"  <title>{title}</title>",
        "  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">",
        "  <style>",
        "    body{font-family:system-ui,Segoe UI,Roboto,Arial;margin:18px}",
        "    .word{display:inline-block;padding:6px 8px;margin:4px;border-radius:6px;background:#f9f9f9;border:1px solid #ddd}",
        "    .controls{margin-bottom:8px}",
        "  </style>",
        "</head>",
        "<body>",
        f"<h1>{title}</h1>",
        f"<div><strong>{len(words)} words</strong></div>",
        "<div style=\"margin-top:12px\">",
    ]
    for w in words:
        parts.append(f"  <span class=\"word\">{w}</span>")
    parts += ["</div>", "</body>", "</html>"]
    return "\n".join(parts)

def main(argv):
    if len(argv) < 3:
        print("Usage: extract_pdf_words.py <pdf-path> <out-html-path>")
        return 2
    pdf_path = Path(argv[1])
    out_path = Path(argv[2])
    if not pdf_path.exists():
        print("PDF not found:", pdf_path)
        return 3
    text = extract_text_from_pdf(pdf_path)
    words = extract_words(text)
    html = build_html(words, title=f"Words from {pdf_path.name}")
    out_path.write_text(html, encoding='utf-8')
    print(f"Wrote {len(words)} words to {out_path}")
    return 0

if __name__ == '__main__':
    raise SystemExit(main(sys.argv))
