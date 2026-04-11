import { useState, useCallback } from 'react';
import { useBooks } from './hooks/useBooks';
import BookGrid from './components/BookGrid';
import BookViewer from './components/BookViewer';

type ViewState =
  | { screen: 'grid' }
  | { screen: 'viewer'; bookIndex: number; slideDirection: 'from-bottom' | 'from-top' | 'none' };

export default function App() {
  const { books, loading } = useBooks();
  const [viewState, setViewState] = useState<ViewState>({ screen: 'grid' });

  const totalBooks = books.length;

  const openBook = useCallback((index: number) => {
    setViewState({ screen: 'viewer', bookIndex: index, slideDirection: 'none' });
  }, []);

  const goToBook = useCallback((index: number, slideDirection: 'from-bottom' | 'from-top' | 'none' = 'none') => {
    setViewState({ screen: 'viewer', bookIndex: index, slideDirection });
  }, []);

  const closeToGrid = useCallback((swipeDir: 'up' | 'down') => {
    setViewState(prev => {
      if (prev.screen !== 'viewer') return prev;
      let newIndex: number;
      if (swipeDir === 'up') {
        // User swiped up = wants next book
        newIndex = prev.bookIndex === totalBooks - 1 ? 0 : prev.bookIndex + 1;
        // Next book slides in from bottom
        return { screen: 'viewer', bookIndex: newIndex, slideDirection: 'from-bottom' };
      } else {
        // User swiped down = wants prev book
        newIndex = prev.bookIndex === 0 ? totalBooks - 1 : prev.bookIndex - 1;
        // Prev book slides in from top
        return { screen: 'viewer', bookIndex: newIndex, slideDirection: 'from-top' };
      }
    });
  }, [totalBooks]);

  const backToGrid = useCallback(() => {
    setViewState({ screen: 'grid' });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-cream">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-warm-orange border-t-transparent rounded-full animate-spin" />
          <p className="text-bark-light font-body text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (viewState.screen === 'grid') {
    return <BookGrid books={books} onSelect={openBook} />;
  }

  const book = books[viewState.bookIndex];

  return (
    <BookViewer
      book={book}
      bookIndex={viewState.bookIndex}
      totalBooks={totalBooks}
      slideDirection={viewState.slideDirection}
      onCloseUp={() => closeToGrid('up')}
      onCloseDown={() => closeToGrid('down')}
      onBackToGrid={backToGrid}
      onGoToBook={goToBook}
    />
  );
}
