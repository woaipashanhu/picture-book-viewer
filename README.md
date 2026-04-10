# Picture Book Viewer

A mobile-first picture book viewer with warm, cozy design. Swipe through books and pages with intuitive touch gestures.

## Features

- **Two-column grid** home page showing all book covers
- **Full-screen reader** with left/right swipe for page navigation
- **Vertical swipe** to switch between books (circular navigation)
- **PWA ready** - add to home screen on mobile
- **Auto-deploy** via GitHub Pages when you push to main

## How to Add Books

1. Create a new folder under `books/` with a numeric prefix for ordering:
   ```
   books/04-your-book-name/
   ```

2. Add images to the folder:
   - `cover.jpg` - the book cover (required)
   - `page-01.jpg`, `page-02.jpg`, ... - interior pages

3. Create an `info.md` file with front matter:
   ```markdown
   ---
   title: Your Book Title
   description: A brief description of the book
   date: 2026-04-09
   ---
   ```

4. Commit and push. GitHub Actions will automatically rebuild the site.

## Local Development

### Requirements
- Node.js 18+

### Setup
```bash
npm install
npm run generate
npm run dev
```

## Directory Structure

```
/
  books/              # Book content folders
    01-book-name/
      info.md         # Book metadata
      cover.jpg       # Cover image
      page-01.jpg     # Page images
  src/                # React source code
  public/             # Static assets
  generate-books.js   # Script to generate books.json from books/ folder
  .github/workflows/  # GitHub Actions for auto-deploy
```

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- GitHub Pages (deployment)
