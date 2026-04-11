import { useState, useCallback } from 'react';
import { useBooks } from './hooks/useBooks';
import BookGrid from './components/BookGrid';
import BookViewer from './components/BookViewer';

type ViewState =
  | { screen: 'grid' }
  | { screen: 'viewer'; bookIndex: number; direction: 'up' | 'down' | 'none' };

export default function App() {
  const { books, loading, getPrevBook, getNextBook } = useBooks();
  const [viewState, setViewState] = useState<ViewState>({ screen: 'grid' });

  const openBook = useCallback((index: number) => {
    setViewState({ screen: 'viewer', bookIndex: index, direction: 'none' });
  }, []);

  const closeToGrid = useCallback((direction: 'up' | 'down') => {
    setViewState(prev => {
      if (prev.screen !== 'viewer') return prev;
      const newIndex = direction === 'up'
        ? getPrevBook(prev.bookIndex)
        : getNextBook(prev.bookIndex);
      return { screen: 'viewer', bookIndex: newIndex, direction };
    });
  }, [getPrevBook, getNextBook]);

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
      direction={viewState.direction}
      onCloseUp={() => closeToGrid('up')}
      onCloseDown={() => closeToGrid('down')}
      onBackToGrid={backToGrid}
    />
  );
}
