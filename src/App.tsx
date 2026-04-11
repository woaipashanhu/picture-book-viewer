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
  const [checking, setChecking] = useState(false);

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
        newIndex = prev.bookIndex === totalBooks - 1 ? 0 : prev.bookIndex + 1;
        return { screen: 'viewer', bookIndex: newIndex, slideDirection: 'from-bottom' };
      } else {
        newIndex = prev.bookIndex === 0 ? totalBooks - 1 : prev.bookIndex - 1;
        return { screen: 'viewer', bookIndex: newIndex, slideDirection: 'from-top' };
      }
    });
  }, [totalBooks]);

  const backToGrid = useCallback(() => {
    setViewState({ screen: 'grid' });
  }, []);

  const handleUpdate = useCallback(async () => {
    setChecking(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          return;
        }
        await registration.update();
        setTimeout(() => {
          setChecking(false);
          window.location.reload();
        }, 1500);
      } else {
        window.location.reload();
      }
    } catch {
      window.location.reload();
    }
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

  return (
    <>
      {viewState.screen === 'grid' ? (
        <>
          {/* Update button on grid page */}
          <button
            onClick={handleUpdate}
            disabled={checking}
            className="fixed bottom-6 right-6 z-[100] w-16 h-16 rounded-full
                       bg-black/30 backdrop-blur-md
                       border border-white/20
                       flex flex-col items-center justify-center gap-0.5
                       active:bg-black/50 transition-all duration-200 cursor-pointer"
          >
            {checking ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            )}
            <span className="text-white text-[10px] font-bold leading-none">{checking ? '中' : '刷新'}</span>
          </button>
          <BookGrid books={books} onSelect={openBook} />
        </>
      ) : (
        <BookViewer
          book={books[viewState.bookIndex]}
          bookIndex={viewState.bookIndex}
          totalBooks={totalBooks}
          slideDirection={viewState.slideDirection}
          onCloseUp={() => closeToGrid('up')}
          onCloseDown={() => closeToGrid('down')}
          onBackToGrid={backToGrid}
          onGoToBook={goToBook}
        />
      )}
    </>
  );
}
