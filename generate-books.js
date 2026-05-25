import fs from 'fs';
import path from 'path';

const BOOKS_DIR = path.resolve('books');
const OUTPUT = path.resolve('public/books.json');

// Load existing pageTexts/pageTextsEn if available (preserved across CI rebuilds)
function loadExistingTexts() {
  try {
    const existing = JSON.parse(fs.readFileSync(OUTPUT, 'utf-8'));
    const map = {};
    for (const book of existing) {
      if (book.pageTexts || book.pageTextsEn) {
        map[book.id] = {};
        if (book.pageTexts) map[book.id].pageTexts = book.pageTexts;
        if (book.pageTextsEn) map[book.id].pageTextsEn = book.pageTextsEn;
      }
    }
    return map;
  } catch {
    return {};
  }
}

function parseInfoMd(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const frontMatter = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontMatter) return { title: path.basename(path.dirname(filePath)) };

  const meta = {};
  for (const line of frontMatter[1].split('\n')) {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) {
      meta[key.trim()] = rest.join(':').trim();
    }
  }
  return meta;
}

function scanBooks() {
  const entries = fs.readdirSync(BOOKS_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));

  const existingTexts = loadExistingTexts();

  const books = entries.map(entry => {
    const dirPath = path.join(BOOKS_DIR, entry.name);
    const info = parseInfoMd(path.join(dirPath, 'info.md'));

    const files = fs.readdirSync(dirPath)
      .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
      .sort();

    const coverFile = files.find(f => /^cover\./i.test(f)) || files[0];
    const pageFiles = files.filter(f => !/^cover\./i.test(f));

    const book = {
      id: entry.name,
      title: info.title || entry.name,
      description: info.description || '',
      date: info.date || '',
      cover: `./books/${entry.name}/${coverFile}`,
      pages: (!/^cover\./i.test(coverFile))
        ? pageFiles.map(f => `./books/${entry.name}/${f}`)
        : [coverFile, ...pageFiles].map(f => `./books/${entry.name}/${f}`),
    };

    // Preserve existing pageTexts and pageTextsEn
    const existing = existingTexts[entry.name];
    if (existing) {
      if (existing.pageTexts) book.pageTexts = existing.pageTexts;
      if (existing.pageTextsEn) book.pageTextsEn = existing.pageTextsEn;
    }

    return book;
  });

  return books;
}

const books = scanBooks();
fs.writeFileSync(OUTPUT, JSON.stringify(books, null, 2));
console.log(`Generated ${books.length} books -> ${OUTPUT}`);
