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
  const [showInfo, setShowInfo] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isZoomedRef = useRef(false);

  const totalPages = book.pages.length;

  useEffect(() => {
    setTransitionKey(prev => prev + 1);
    setPageIndex(0);
    setShowInfo(false);
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
      {/* Top bar */}
      <div
        className={`absolute top-0 left-0 right-0 z-30 transition-all duration-300 ${
          showInfo ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-gradient-to-b from-black/50 to-transparent px-5 pt-safe-top pb-6">
          <button
            onClick={(e) => { e.stopPropagation(); onBackToGrid(); }}
            className="flex items-center gap-2 text-white/90 active:text-white transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="font-body text-sm">Back</span>
          </button>
        </div>
      </div>

      {/* Image with pinch zoom */}
      <div className="flex-1 p-2 relative">
        <PinchZoom onZoomChange={handleZoomChange}>
          <img
            src={currentImage}
            alt={`${book.title} - Page ${pageIndex + 1}`}
            className="max-w-full max-h-full object-contain rounded-lg select-none"
            draggable={false}
          />
        </PinchZoom>

        {/* Left arrow - always visible, disabled when first page */}
        <button
          onClick={(e) => { e.stopPropagation(); goToPrevPage(); }}
          className={`absolute left-1 top-1/2 -translate-y-1/2 w-14 h-24 flex items-center justify-center rounded-xl transition-all duration-200 z-20 ${
            isFirst
              ? 'bg-black/5 cursor-not-allowed'
              : 'bg-black/20 hover:bg-black/40 active:bg-black/50 backdrop-blur-sm cursor-pointer'
          }`}
          disabled={isFirst}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isFirst ? 'stroke-gray-400/40' : 'stroke-white/70'}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Right arrow - always visible, disabled when last page */}
        <button
          onClick={(e) => { e.stopPropagation(); goToNextPage(); }}
          className={`absolute right-1 top-1/2 -translate-y-1/2 w-14 h-24 flex items-center justify-center rounded-xl transition-all duration-200 z-20 ${
            isLast
              ? 'bg-black/5 cursor-not-allowed'
              : 'bg-black/20 hover:bg-black/40 active:bg-black/50 backdrop-blur-sm cursor-pointer'
          }`}
          disabled={isLast}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isLast ? 'stroke-gray-400/40' : 'stroke-white/70'}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
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
