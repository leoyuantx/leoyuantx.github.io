const fs = require('fs');
const path = require('path');

const folder = path.resolve(__dirname, '..', '2027', 'sounds');
if (!fs.existsSync(folder)) {
  fs.mkdirSync(folder, { recursive: true });
}
const sourceFile = ['mp3.html', 'raw.html']
  .map(name => path.join(__dirname, name))
  .find(file => fs.existsSync(file)) || path.join(__dirname, 'mp3.html');

function decodeHtmlEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function sanitizeFileName(name) {
  const cleaned = decodeHtmlEntities(name)
    .trim()
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, ' ')
    .replace(/\.+$/g, '')
    .trim();
  return cleaned || 'sound';
}

function extractSoundEntries(html) {
  const entries = [];
  const pattern = /<p class="sound__text">(.*?)<\/p>[\s\S]*?(?:href|src)="(https?:\/\/[^\s"']+?\.mp3(?:\?[^\s"']+)?)"/gi;

  let match;
  while ((match = pattern.exec(html)) !== null) {
    const text = (match[1] || '').replace(/<[^>]+>/g, '').trim();
    const url = (match[2] || '').trim();
    if (!text || !url) continue;
    entries.push({ text, url });
  }

  const deduped = new Map();
  for (const entry of entries) {
    const key = entry.url.toLowerCase();
    if (!deduped.has(key)) deduped.set(key, entry);
  }

  return [...deduped.values()];
}

async function downloadFile(url, outputFile) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputFile, buffer);
  return outputFile;
}

async function main() {
  if (!fs.existsSync(sourceFile)) {
    throw new Error(`Missing source file: ${sourceFile}`);
  }

  const html = fs.readFileSync(sourceFile, 'utf8');
  const entries = extractSoundEntries(html);

  if (entries.length === 0) {
    console.log('No sound entries found in HTML');
    return;
  }

  console.log(`Found ${entries.length} unique sound entries in ${path.basename(sourceFile)}`);

  let downloaded = 0;
  for (const entry of entries) {
    const outputPath = path.join(folder, `${sanitizeFileName(entry.text)}.mp3`);
    await downloadFile(entry.url, outputPath);
    console.log(`Saved: ${path.basename(outputPath)}`);
    downloaded += 1;
  }

  console.log(`\nDownloaded ${downloaded} files to ${folder}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
