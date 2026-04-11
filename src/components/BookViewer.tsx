import { useState, useCallback, useEffect, useRef } from 'react';
import { useSwipe } from '../hooks/useSwipe';
import PinchZoom from './PinchZoom';
import type { Book } from '../types/book';

interface BookViewerProps {
  book: Book;
  bookIndex: number;
  isFirstBook: boolean;
  isLastBook: boolean;
  direction: 'up' | 'down' | 'none';
  onCloseUp: () => void;
  onCloseDown: () => void;
  onBackToGrid: () => void;
  onGoToBook: (index: number, direction?: 'up' | 'down' | 'none') => void;
}

export default function BookViewer({
  book,
  bookIndex,
  isFirstBook,
  isLastBook,
  direction,
  onCloseUp,
  onCloseDown,
  onBackToGrid,
  onGoToBook,
}: BookViewerProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const [transitionKey, setTransitionKey] = useState(0);
  const [animClass, setAnimClass] = useState('');
  const [autoPlay, setAutoPlay] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isZoomedRef = useRef(false);
  const autoPlayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalPages = book.pages.length;

  // Reset when book changes
  useEffect(() => {
    setTransitionKey(prev => prev + 1);
    setPageIndex(0);
    isZoomedRef.current = false;
    setAutoPlay(false);

    if (direction === 'up') {
      setAnimClass('animate-slide-down');
    } else if (direction === 'down') {
      setAnimClass('animate-slide-up');
    } else {
      setAnimClass('animate-fade-in');
    }
  }, [book.id, direction]);

  // Auto play logic
  useEffect(() => {
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }

    if (autoPlay) {
      autoPlayTimerRef.current = setInterval(() => {
        setPageIndex(prev => {
          if (prev >= totalPages - 1) {
            // Reached last page, stay here and stop
            setAutoPlay(false);
            return prev;
          }
          return prev + 1;
        });
      }, 4000);
    }

    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    };
  }, [autoPlay, totalPages]);

  const goToPrevPage = useCallback(() => {
    if (isZoomedRef.current || pageIndex <= 0) return;
    setPageIndex(prev => prev - 1);
  }, [pageIndex]);

  const goToNextPage = useCallback(() => {
    if (isZoomedRef.current || pageIndex >= totalPages - 1) return;
    setPageIndex(prev => prev + 1);
  }, [pageIndex, totalPages]);

  const goToPrevBook = useCallback(() => {
    if (isFirstBook) return;
    setAutoPlay(false);
    onGoToBook(bookIndex - 1);
  }, [bookIndex, isFirstBook, onGoToBook]);

  const goToNextBook = useCallback(() => {
    if (isLastBook) return;
    setAutoPlay(false);
    onGoToBook(bookIndex + 1);
  }, [bookIndex, isLastBook, onGoToBook]);

  const toggleAutoPlay = useCallback(() => {
    setAutoPlay(prev => !prev);
  }, []);

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
  const isFirstPage = pageIndex === 0;
  const isLastPage = pageIndex === totalPages - 1;

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
      {/* Top-left: Home button */}
      <div className="absolute top-0 left-0 z-40">
        <button
          onClick={(e) => { e.stopPropagation(); onBackToGrid(); }}
          className="mt-10 ml-4 flex items-center gap-2 px-3 py-2 rounded-lg
                     bg-black/20 hover:bg-black/40 active:bg-black/50
                     backdrop-blur-sm transition-all duration-200 cursor-pointer"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="text-white/80 font-body text-sm">主页</span>
        </button>
      </div>

      {/* Right side: Auto play (above right arrow), Right arrow, Prev/Next book (below right arrow) */}
      <div className="fixed right-2 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-2">
        {/* Auto play button */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleAutoPlay(); }}
          className={`w-12 h-12 md:w-14 md:h-12 flex items-center justify-center rounded-xl
                     transition-all duration-200 cursor-pointer
                     ${autoPlay
                       ? 'bg-warm-orange/70 hover:bg-warm-orange/80 active:bg-warm-orange/90'
                       : 'hover:opacity-100 active:opacity-80'
                     }`}
          style={{ background: autoPlay ? undefined : 'rgba(0,0,0,0.15)', backdropFilter: 'blur(4px)' }}
        >
          {autoPlay ? (
            // Pause icon
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            // Play icon
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>

        {/* Right arrow (next page) */}
        <button
          onClick={(e) => { e.stopPropagation(); goToNextPage(); }}
          className={`w-12 h-16 md:w-14 md:h-24 flex items-center justify-center rounded-xl
                     transition-all duration-200
                     ${isLastPage
                       ? 'opacity-30 cursor-not-allowed'
                       : 'opacity-100 hover:opacity-100 active:opacity-80 cursor-pointer'
                     }`}
          style={{ background: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(4px)' }}
          disabled={isLastPage}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-white">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        {/* Next book */}
        <button
          onClick={(e) => { e.stopPropagation(); goToNextBook(); }}
          className={`w-12 h-10 md:w-14 md:h-10 flex items-center justify-center rounded-xl
                     transition-all duration-200
                     ${isLastBook
                       ? 'opacity-30 cursor-not-allowed'
                       : 'opacity-100 hover:opacity-100 active:opacity-80 cursor-pointer'
                     }`}
          style={{ background: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(4px)' }}
          disabled={isLastBook}
        >
          <div className="flex flex-col items-center leading-none">
            <span className="text-white/80 text-[10px] font-body whitespace-nowrap">下一本</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </button>

        {/* Prev book */}
        <button
          onClick={(e) => { e.stopPropagation(); goToPrevBook(); }}
          className={`w-12 h-10 md:w-14 md:h-10 flex items-center justify-center rounded-xl
                     transition-all duration-200
                     ${isFirstBook
                       ? 'opacity-30 cursor-not-allowed'
                       : 'opacity-100 hover:opacity-100 active:opacity-80 cursor-pointer'
                     }`}
          style={{ background: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(4px)' }}
          disabled={isFirstBook}
        >
          <div className="flex flex-col items-center leading-none">
            <span className="text-white/80 text-[10px] font-body whitespace-nowrap">上一本</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </div>
        </button>
      </div>

      {/* Left arrow (prev page) */}
      <button
        onClick={(e) => { e.stopPropagation(); goToPrevPage(); }}
        className={`fixed left-2 top-1/2 -translate-y-1/2 z-40 w-12 h-16 md:w-14 md:h-24
                    flex items-center justify-center rounded-xl transition-all duration-200
                    ${isFirstPage
                      ? 'opacity-30 cursor-not-allowed'
                      : 'opacity-100 hover:opacity-100 active:opacity-80 cursor-pointer'
                    }`}
        style={{ background: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(4px)' }}
        disabled={isFirstPage}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-white">
          <path d="M15 18l-6-6 6-6" />
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
