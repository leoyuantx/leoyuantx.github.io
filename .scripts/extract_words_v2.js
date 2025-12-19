#!/usr/bin/env node
/**
 * Extract words from PDF using pdf-parse (simpler approach).
 * Usage: node extract_words_v2.js <pdf-path> <output-html>
 */
const fs = require('fs');
const path = require('path');

async function extractWordsFromPDF(pdfPath) {
  const { PDFParse } = require('pdf-parse');
  const dataBuffer = fs.readFileSync(pdfPath);
  const pdf = new PDFParse();
  const data = await pdf.parseBuffer(dataBuffer);
  return data.text;
}

function extractWords(text) {
  const tokens = text.match(/[A-Za-zÀ-ÖØ-öø-ÿ'-]+/g) || [];
  const normalized = tokens
    .map(t => t.replace(/^[-']+|[-']+$/g, ''))
    .filter(t => /[A-Za-z]/.test(t));

  const seen = new Map();
  for (const word of normalized) {
    const key = word.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, word);
    }
  }

  return Array.from(seen.values()).sort((a, b) => 
    a.toLowerCase().localeCompare(b.toLowerCase())
  );
}

function buildHTML(words, title = 'Words of Champions') {
  const wordChips = words
    .map(w => `  <span class="word">${w}</span>`)
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial;
      margin: 20px;
    }
    h1 { color: #333; }
    .stats { font-size: 16px; margin-bottom: 20px; color: #666; }
    .words-container { max-width: 1200px; }
    .word {
      display: inline-block;
      padding: 8px 12px;
      margin: 4px;
      border-radius: 4px;
      background: #f5f5f5;
      border: 1px solid #ddd;
      font-size: 14px;
    }
    .word:hover { background: #efefef; border-color: #999; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="stats"><strong>${words.length}</strong> words</div>
  <div class="words-container">
${wordChips}
  </div>
</body>
</html>`;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Usage: node extract_words_v2.js <pdf-path> <output-html>');
    process.exit(1);
  }

  const [pdfPath, outPath] = args;
  if (!fs.existsSync(pdfPath)) {
    console.error(`PDF not found: ${pdfPath}`);
    process.exit(1);
  }

  try {
    console.log(`Extracting words from ${pdfPath}...`);
    const text = await extractWordsFromPDF(pdfPath);
    const words = extractWords(text);
    const html = buildHTML(words, `Words from ${path.basename(pdfPath)}`);
    fs.writeFileSync(outPath, html, 'utf-8');
    console.log(`✓ Wrote ${words.length} words to ${outPath}`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
