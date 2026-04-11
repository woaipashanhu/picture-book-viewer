import { useState, useCallback, useEffect } from 'react';
import { useBooks } from './hooks/useBooks';
import BookGrid from './components/BookGrid';
import BookViewer from './components/BookViewer';

type ViewState =
  | { screen: 'grid' }
  | { screen: 'viewer'; bookIndex: number; slideDirection: 'from-bottom' | 'from-top' | 'none' };

export default function App() {
  const { books, loading } = useBooks();
  const [viewState, setViewState] = useState<ViewState>({ screen: 'grid' });
  const [updateReady, setUpdateReady] = useState(false);
  const [checking, setChecking] = useState(false);

  const totalBooks = books.length;

  // Listen for service worker updates
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });

    // Check for updates on load and every 120 seconds
    const checkUpdate = () => {
      setChecking(true);
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) {
          registration.update().then(() => {
            setTimeout(() => setChecking(false), 1000);
          });
        } else {
          setChecking(false);
        }
      });
    };

    // Wait a bit for initial page load, then check
    const initTimer = setTimeout(checkUpdate, 3000);

    const interval = setInterval(checkUpdate, 120 * 1000);

    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, []);

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
        // Check if there's a waiting SW
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          return;
        }
        // Otherwise force update
        await registration.update();
        // If still no waiting SW, just reload
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
      {/* Update button - always visible in top-right corner */}
      <button
        onClick={handleUpdate}
        className="fixed top-10 right-4 z-[100] flex items-center gap-1.5 px-3 py-2 rounded-lg
                   bg-black/10 hover:bg-black/20 active:bg-black/30
                   backdrop-blur-sm transition-all duration-200 cursor-pointer"
        title={updateReady ? '有新版本，点击更新' : '检查更新'}
      >
        {checking ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-bark-light animate-spin">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-bark-light">
            <path d="M21.5 2v6h-6" />
            <path d="M2.5 22v-6h6" />
            <path d="M2.11 13.51A10 10 0 0 1 20.39 6.11L21.5 8" />
            <path d="M21.89 10.49A10 10 0 0 1 3.61 17.89L2.5 16" />
          </svg>
        )}
        <span className="text-bark-light text-xs font-body">
          {checking ? '检查中' : '更新'}
        </span>
      </button>

      {viewState.screen === 'grid' ? (
        <BookGrid books={books} onSelect={openBook} />
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
