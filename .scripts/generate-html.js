#!/usr/bin/env node
const fs = require('fs');

// Read raw_words.txt
const text = fs.readFileSync('./spelling_bee/raw_words.txt', 'utf-8');
const lines = text.split('\n').map(line => line.trim());

// Parse by pages
const pageWords = {};
let currentPage = null;

for (const line of lines) {
  if (!line) continue;
  
  // Check if it's a page marker
  if (/^page\s+/i.test(line)) {
    currentPage = line.toLowerCase();
    pageWords[currentPage] = [];
    continue;
  }
  
  // Skip definition lines (too long or contain keywords)
  if (line.includes('state') || line.includes('condition') || line.length > 50) {
    continue;
  }
  
  // Keep if it's a real word (letters, hyphens, apostrophes)
  if (/^[A-Za-z][A-Za-z\-']*$/.test(line)) {
    if (currentPage) {
      pageWords[currentPage].push(line);
    }
  }
}

// Deduplicate within each page
const dedupedPages = {};
for (const page in pageWords) {
  const seen = new Set();
  dedupedPages[page] = [];
  for (const word of pageWords[page]) {
    const lower = word.toLowerCase();
    if (!seen.has(lower)) {
      dedupedPages[page].push(word);
      seen.add(lower);
    }
  }
}

const pageList = Object.keys(dedupedPages);
console.log(`Found ${pageList.length} pages:`);
pageList.forEach(p => console.log(`  ${p}: ${dedupedPages[p].length} words`));

// Generate word links HTML
const generateWordLinks = (words) => {
  return words.map(w => {
    const encodeWord = encodeURIComponent(w);
    const url = `https://translate.google.com/?sl=auto&tl=zh-CN&op=translate&text=${encodeWord}`;
    return `      <a href="${url}" target="_blank" class="word" title="Translate ${w}">${w}</a>`;
  }).join('\n');
};

// Generate tab buttons
const tabButtons = pageList.map((page, idx) => {
  const isActive = idx === 0 ? ' active' : '';
  const pageNum = page.replace('page ', '');
  return `    <button class="tab-btn${isActive}" data-page="${idx}">📖 ${pageNum}</button>`;
}).join('\n');

// Generate tab contents
const tabContents = pageList.map((page, idx) => {
  const isActive = idx === 0 ? ' active' : '';
  const words = dedupedPages[page];
  const wordLinks = generateWordLinks(words);
  return `    <div class="tab-content${isActive}" id="tab-${idx}">
      <h2>${page}</h2>
      <div class="stats">
        <div class="stat-item">
          <div class="stat-number">${words.length}</div>
          <div class="stat-label">Words</div>
        </div>
      </div>
      <div class="words-grid">
${wordLinks}
      </div>
    </div>`;
}).join('\n');

const totalWords = pageList.reduce((sum, page) => sum + dedupedPages[page].length, 0);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Words of Champions - Spelling Bee</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 40px 20px;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      padding: 40px;
    }
    
    h1 {
      color: #222;
      text-align: center;
      margin-bottom: 10px;
      font-size: 2.5em;
    }
    
    h2 {
      color: #333;
      margin-bottom: 20px;
      font-size: 1.5em;
      text-transform: capitalize;
    }
    
    .subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 30px;
      font-size: 16px;
    }
    
    .tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 30px;
      flex-wrap: wrap;
      border-bottom: 2px solid #eee;
    }
    
    .tab-btn {
      padding: 12px 24px;
      border: none;
      background: transparent;
      color: #666;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      border-bottom: 3px solid transparent;
      margin-bottom: -2px;
    }
    
    .tab-btn:hover {
      color: #667eea;
      background: #f9f9f9;
      border-radius: 4px;
    }
    
    .tab-btn.active {
      color: #667eea;
      border-bottom-color: #667eea;
    }
    
    .tab-contents {
      display: flex;
      flex-direction: column;
    }
    
    .tab-content {
      display: none;
    }
    
    .tab-content.active {
      display: block;
      animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .stats {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-bottom: 30px;
      padding: 20px;
      background: #f9f9f9;
      border-radius: 8px;
      flex-wrap: wrap;
    }
    
    .stat-item {
      text-align: center;
    }
    
    .stat-number {
      font-size: 32px;
      font-weight: bold;
      color: #667eea;
    }
    
    .stat-label {
      font-size: 14px;
      color: #999;
      margin-top: 5px;
    }
    
    .words-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 12px;
    }
    
    .word {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 6px;
      text-align: center;
      font-weight: 500;
      font-size: 14px;
      cursor: pointer;
      text-decoration: none;
      user-select: none;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      word-break: break-word;
      min-height: 48px;
    }
    
    .word:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
    }
    
    .overall-stats {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-bottom: 30px;
      padding: 20px;
      background: #f9f9f9;
      border-radius: 8px;
      flex-wrap: wrap;
    }
    
    .stat-item {
      text-align: center;
    }
    
    .stat-number {
      font-size: 32px;
      font-weight: bold;
      color: #667eea;
    }
    
    .stat-label {
      font-size: 14px;
      color: #999;
      margin-top: 5px;
    }
    
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      color: #999;
      font-size: 12px;
    }
    
    @media (max-width: 768px) {
      .container {
        padding: 20px;
      }
      h1 {
        font-size: 1.8em;
      }
      .tabs {
        gap: 5px;
      }
      .tab-btn {
        padding: 10px 16px;
        font-size: 14px;
      }
      .words-grid {
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 8px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📚 Words of Champions</h1>
    <p class="subtitle">Spelling Bee Word List</p>
    
    <div class="overall-stats">
      <div class="stat-item">
        <div class="stat-number">${totalWords}</div>
        <div class="stat-label">Total Words</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">${pageList.length}</div>
        <div class="stat-label">Pages</div>
      </div>
    </div>
    
    <div class="tabs">
${tabButtons}
    </div>
    
    <div class="tab-contents">
${tabContents}
    </div>
    
    <div class="footer">
      <p>✏️ Spelling Bee Word List | Last updated: December 2025</p>
    </div>
  </div>
  
  <script>
    document.querySelectorAll('.tab-btn').forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        // Remove active class from all buttons and contents
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked button and corresponding content
        btn.classList.add('active');
        document.getElementById('tab-' + idx).classList.add('active');
      });
    });
  </script>
</body>
</html>`;

// Write to file
fs.writeFileSync('./spelling_bee/words.html', html, 'utf-8');
console.log(`✅ Written to ./spelling_bee/words.html`);
console.log(`Total: ${totalWords} words across ${pageList.length} pages`);
