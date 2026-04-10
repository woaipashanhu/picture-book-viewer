import fs from 'fs';
import path from 'path';

const BOOKS_DIR = path.resolve('books');
const OUTPUT = path.resolve('public/books.json');

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

  const books = entries.map(entry => {
    const dirPath = path.join(BOOKS_DIR, entry.name);
    const info = parseInfoMd(path.join(dirPath, 'info.md'));

    const files = fs.readdirSync(dirPath)
      .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
      .sort();

    const coverFile = files.find(f => /^cover\./i.test(f)) || files[0];
    const pageFiles = files.filter(f => !/^cover\./i.test(f));

    return {
      id: entry.name,
      title: info.title || entry.name,
      description: info.description || '',
      date: info.date || '',
      cover: `./books/${entry.name}/${coverFile}`,
      pages: pageFiles.map(f => `./books/${entry.name}/${f}`),
    };
  });

  return books;
}

const books = scanBooks();
fs.writeFileSync(OUTPUT, JSON.stringify(books, null, 2));
console.log(`Generated ${books.length} books -> ${OUTPUT}`);
