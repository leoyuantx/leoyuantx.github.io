#!/usr/bin/env node
/**
 * Extract words from a PDF and generate a static HTML file.
 * Usage: node .scripts/extract_words.js <pdf-path> <output-html-path>
 */
const fs = require('fs');
const path = require('path');

// Use pdfjs-dist or another library; for simplicity, try a basic text extraction
// If pdfjs-dist isn't installed, we'll handle it gracefully.

async function extractWordsFromPDF(pdfPath) {
  let pdfjs;
  try {
    pdfjs = await import('pdfjs-dist/legacy/build/pdf.js');
  } catch (e) {
    console.error('pdfjs-dist not found. Install with: npm install pdfjs-dist');
    process.exit(1);
  }

  const pdf = await pdfjs.getDocument(pdfPath).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }

  return fullText;
}

function extractWords(text) {
  // Extract word tokens: keep letters, apostrophes, hyphens
  const tokens = text.match(/[A-Za-zÀ-ÖØ-öø-ÿ'-]+/g) || [];
  
  // Filter and normalize
  const normalized = tokens
    .map(t => t.replace(/^[-']+|[-']+$/g, '')) // strip leading/trailing hyphens/apostrophes
    .filter(t => /[A-Za-z]/.test(t)); // must contain at least one letter

  // Deduplicate case-insensitively, preserving original casing
  const seen = new Map();
  for (const word of normalized) {
    const key = word.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, word);
    }
  }

  // Sort alphabetically
  const words = Array.from(seen.values()).sort((a, b) => 
    a.toLowerCase().localeCompare(b.toLowerCase())
  );

  return words;
}

function buildHTML(words, title = 'Words of Champions') {
  const wordChips = words
    .map(w => `  <span class="word">${escapeHtml(w)}</span>`)
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
      margin: 20px;
      line-height: 1.6;
    }
    h1 {
      color: #333;
    }
    .stats {
      font-size: 16px;
      margin-bottom: 20px;
      color: #666;
    }
    .words-container {
      max-width: 1200px;
    }
    .word {
      display: inline-block;
      padding: 8px 12px;
      margin: 4px;
      border-radius: 4px;
      background: #f5f5f5;
      border: 1px solid #ddd;
      font-size: 14px;
    }
    .word:hover {
      background: #efefef;
      border-color: #999;
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <div class="stats">
    <strong>${words.length}</strong> words
  </div>
  <div class="words-container">
${wordChips}
  </div>
</body>
</html>`;
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Usage: node extract_words.js <pdf-path> <output-html>');
    process.exit(1);
  }

  const [pdfPath, outPath] = args;

  if (!fs.existsSync(pdfPath)) {
    console.error(`PDF not found: ${pdfPath}`);
    process.exit(1);
  }

  console.log(`Extracting words from ${pdfPath}...`);
  try {
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
