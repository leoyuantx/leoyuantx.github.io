#!/usr/bin/env node
/**
 * Direct PDF text extraction - final attempt with raw API.
 */
const fs = require('fs');
const path = require('path');

async function extractPDFText(filePath) {
  // Use a more direct low-level approach
  try {
    // Try using the raw pdf file buffer parsing
    const { PDFParse } = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    const parser = new PDFParse();
    
    // Set required options
    parser.options.pageNumbers = null;
    parser.options.version = 'v3';
    
    const result = await parser.parseBuffer(buffer, { version: 'v3' });
    return result.text || result.raw || '';
  } catch (e1) {
    console.error('Direct method failed:', e1.message);
    
    // Fallback: try to extract raw text from binary
    try {
      const buffer = fs.readFileSync(filePath);
      const text = buffer.toString('latin1');
      // Look for text streams in PDF
      const matches = text.match(/BT.*?ET/gs) || [];
      return text;
    } catch (e2) {
      console.error('Fallback failed:', e2.message);
      throw new Error('Could not extract text from PDF');
    }
  }
}

function extractWords(text) {
  // More aggressive extraction to catch more words
  const tokens = text.match(/[A-Za-zÀ-ÖØ-öø-ÿ\u0100-\u017F'-]{2,}/g) || [];
  
  const normalized = tokens
    .map(t => t.replace(/^[-']+|[-']+$/g, '').trim())
    .filter(t => /[A-Za-z]/.test(t) && t.length > 1);

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

function buildHTML(words) {
  const wordChips = words
    .map(w => `  <span class="word">${w}</span>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Words of Champions</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 30px;
      max-width: 1400px;
      margin-left: auto;
      margin-right: auto;
      background: #fafafa;
    }
    h1 {
      color: #222;
      border-bottom: 3px solid #007bff;
      padding-bottom: 10px;
    }
    .stats {
      font-size: 18px;
      color: #666;
      margin-bottom: 30px;
      padding: 15px;
      background: #f0f0f0;
      border-radius: 8px;
    }
    .words-container {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .word {
      display: inline-block;
      padding: 8px 14px;
      margin: 5px;
      border-radius: 6px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 14px;
      font-weight: 500;
      cursor: default;
      user-select: none;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .word:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
    }
  </style>
</head>
<body>
  <h1>Words of Champions</h1>
  <div class="stats">
    📚 <strong>${words.length}</strong> words extracted from WordsOfChampions.pdf
  </div>
  <div class="words-container">
${wordChips}
  </div>
</body>
</html>`;
}

async function main() {
  const args = process.argv.slice(2);
  const pdfPath = args[0] || './spelling_bee/WordsOfChampions.pdf';
  const outPath = args[1] || './spelling_bee/words.html';

  if (!fs.existsSync(pdfPath)) {
    console.error(`Error: PDF not found at ${pdfPath}`);
    process.exit(1);
  }

  try {
    console.log(`📖 Reading PDF from ${pdfPath}...`);
    const text = await extractPDFText(pdfPath);
    console.log(`✓ Extracted ${text.length} characters`);
    
    console.log(`🔤 Parsing words...`);
    const words = extractWords(text);
    console.log(`✓ Found ${words.length} unique words`);
    
    const html = buildHTML(words);
    fs.writeFileSync(outPath, html, 'utf-8');
    console.log(`✅ Written to ${outPath}`);
    console.log(`\nFirst 10 words: ${words.slice(0, 10).join(', ')}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
