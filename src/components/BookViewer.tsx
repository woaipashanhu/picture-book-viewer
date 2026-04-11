import { useState, useCallback, useEffect, useRef } from 'react';
import { useSwipe } from '../hooks/useSwipe';
import PinchZoom from './PinchZoom';
import type { Book } from '../types/book';

interface BookViewerProps {
  book: Book;
  direction: 'up' | 'down' | 'none';
  onCloseUp: () => void;
  onCloseDown: () => void;
  onBackToGrid: () => void;
}

export default function BookViewer({
  book,
  direction,
  onCloseUp,
  onCloseDown,
  onBackToGrid,
}: BookViewerProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const [transitionKey, setTransitionKey] = useState(0);
  const [animClass, setAnimClass] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const isZoomedRef = useRef(false);

  const totalPages = book.pages.length;

  useEffect(() => {
    setTransitionKey(prev => prev + 1);
    setPageIndex(0);
    isZoomedRef.current = false;

    if (direction === 'up') {
      setAnimClass('animate-slide-down');
    } else if (direction === 'down') {
      setAnimClass('animate-slide-up');
    } else {
      setAnimClass('animate-fade-in');
    }
  }, [book.id, direction]);

  const goToPrevPage = useCallback(() => {
    if (isZoomedRef.current || pageIndex <= 0) return;
    setPageIndex(prev => prev - 1);
  }, [pageIndex]);

  const goToNextPage = useCallback(() => {
    if (isZoomedRef.current || pageIndex >= totalPages - 1) return;
    setPageIndex(prev => prev + 1);
  }, [pageIndex, totalPages]);

  const swipeHandlers = useSwipe({
    onSwipeLeft: goToNextPage,
    onSwipeRight: goToPrevPage,
    onSwipeUp: () => {
      if (isZoomedRef.current) return;
      if (pageIndex === 0) onCloseUp();
    },
    onSwipeDown: () => {
      if (isZoomedRef.current) return;
      if (pageIndex === totalPages - 1) onCloseDown();
    },
  }, !isZoomedRef.current);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft': goToPrevPage(); break;
        case 'ArrowRight': goToNextPage(); break;
        case 'Escape': onBackToGrid(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevPage, goToNextPage, onBackToGrid]);

  const handleZoomChange = useCallback((zoomed: boolean) => {
    isZoomedRef.current = zoomed;
  }, []);

  const currentImage = book.pages[pageIndex] || book.cover;
  const isFirst = pageIndex === 0;
  const isLast = pageIndex === totalPages - 1;

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 bg-bark flex flex-col overflow-hidden ${animClass}`}
      key={`${book.id}-${transitionKey}`}
      onTouchStart={(e) => {
        if (!isZoomedRef.current) swipeHandlers.onTouchStart(e);
      }}
      onTouchMove={(e) => {
        if (!isZoomedRef.current) swipeHandlers.onTouchMove(e);
      }}
      onTouchEnd={(e) => {
        if (!isZoomedRef.current) swipeHandlers.onTouchEnd(e);
      }}
      style={{ touchAction: 'none', userSelect: 'none' }}
    >
      {/* Back button - always visible, positioned below top safe area */}
      <div className="absolute top-0 left-0 z-40">
        <button
          onClick={(e) => { e.stopPropagation(); onBackToGrid(); }}
          className="mt-10 ml-4 flex items-center gap-2 px-3 py-2 rounded-lg
                     bg-black/20 hover:bg-black/40 active:bg-black/50
                     backdrop-blur-sm transition-all duration-200 cursor-pointer"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span className="text-white/80 font-body text-sm">Back</span>
        </button>
      </div>

      {/* Navigation arrows - fixed to viewport edges */}
      {/* Left arrow */}
      <button
        onClick={(e) => { e.stopPropagation(); goToPrevPage(); }}
        className={`fixed left-2 top-1/2 -translate-y-1/2 z-40 w-12 h-16 md:w-14 md:h-24
                    flex items-center justify-center rounded-xl transition-all duration-200
                    ${isFirst
                      ? 'opacity-30 cursor-not-allowed'
                      : 'opacity-100 hover:opacity-100 active:opacity-80 cursor-pointer'
                    }`}
        style={{ background: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(4px)' }}
        disabled={isFirst}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-white">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      {/* Right arrow */}
      <button
        onClick={(e) => { e.stopPropagation(); goToNextPage(); }}
        className={`fixed right-2 top-1/2 -translate-y-1/2 z-40 w-12 h-16 md:w-14 md:h-24
                    flex items-center justify-center rounded-xl transition-all duration-200
                    ${isLast
                      ? 'opacity-30 cursor-not-allowed'
                      : 'opacity-100 hover:opacity-100 active:opacity-80 cursor-pointer'
                    }`}
        style={{ background: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(4px)' }}
        disabled={isLast}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-white">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* Image area */}
      <div className="flex-1 px-16 py-2 flex items-center justify-center">
        <PinchZoom onZoomChange={handleZoomChange}>
          <img
            src={currentImage}
            alt={`${book.title} - Page ${pageIndex + 1}`}
            className="max-w-full max-h-full object-contain rounded-lg select-none"
            draggable={false}
          />
        </PinchZoom>
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 z-30">
        <div className="bg-gradient-to-t from-black/50 to-transparent px-5 pt-6 pb-6">
          <p className="text-white/80 text-center font-display text-sm font-semibold">
            {book.title}
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            {book.pages.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === pageIndex
                    ? 'w-6 h-2 bg-warm-orange'
                    : 'w-2 h-2 bg-white/40'
                }`}
              />
            ))}
          </div>
          <p className="text-white/50 text-center text-xs mt-2 font-body">
            {pageIndex + 1} / {totalPages}
          </p>
        </div>
      </div>
    </div>
  );
}
