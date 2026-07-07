import { useState, useCallback, useEffect, useRef } from 'react';
import { useSwipe } from '../hooks/useSwipe';
import PinchZoom from './PinchZoom';
import type { Book } from '../types/book';

interface BookViewerProps {
  book: Book;
  bookIndex: number;
  totalBooks: number;
  slideDirection: 'from-bottom' | 'from-top' | 'none';
  initialPage?: number;
  onCloseUp: () => void;
  onCloseDown: () => void;
  onBackToGrid: () => void;
  onGoToBook: (index: number, slideDirection?: 'from-bottom' | 'from-top' | 'none') => void;
}

export default function BookViewer({
  book,
  bookIndex,
  totalBooks,
  slideDirection,
  initialPage = 0,
  onCloseUp,
  onCloseDown,
  onBackToGrid,
  onGoToBook,
}: BookViewerProps) {
  const [pageIndex, setPageIndex] = useState(initialPage);
  const [transitionKey, setTransitionKey] = useState(0);
  const [animClass, setAnimClass] = useState('');
  const [autoPlay, setAutoPlay] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const containerRef = useRef<HTMLDivElement>(null);
  const isZoomedRef = useRef(false);
  const autoPlayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pageChangeLockRef = useRef(false);

  const totalPages = book.pages.length;

  useEffect(() => {
    setTransitionKey(prev => prev + 1);
    setPageIndex(initialPage);
    isZoomedRef.current = false;
    setAutoPlay(false);
    setVoiceOn(true);

    // Cleanup audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    switch (slideDirection) {
      case 'from-bottom':
        setAnimClass('animate-slide-in-bottom');
        break;
      case 'from-top':
        setAnimClass('animate-slide-in-top');
        break;
      default:
        setAnimClass('animate-fade-in');
    }
  }, [book.id, slideDirection]);

  useEffect(() => {
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }

    // Voice on: page turns driven by audio ended event, no timer needed
    if (autoPlay && !voiceOn) {
      autoPlayTimerRef.current = setInterval(() => {
        setPageIndex(prev => {
          if (prev >= totalPages - 1) {
            setAutoPlay(false);
            return prev;
          }
          return prev + 1;
        });
      }, 5000);
    }

    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    };
  }, [autoPlay, totalPages, voiceOn]);

  // Keep autoPlay in a ref so audio ended handler always sees latest value
  const autoPlayRef = useRef(autoPlay);
  autoPlayRef.current = autoPlay;

  // 保存阅读位置到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`book-last-page-${book.id}`, String(pageIndex));
    } catch {
      // silently fail
    }
  }, [pageIndex, book.id]);

  // Play audio when page changes (if voice is on)
  useEffect(() => {
    if (!voiceOn) return;

    const texts = language === 'zh' ? book.pageTexts : book.pageTextsEn;
    if (!texts || !texts[pageIndex]) return;

    // Skip if audio is already playing for this page (e.g. started by toggleAutoPlay)
    if (audioRef.current && !audioRef.current.paused && !audioRef.current.ended) {
      return;
    }

    const lang = language === 'zh' ? 'zh' : 'en';
    const audioBookId = language === 'en' && book.bookIdEn ? book.bookIdEn : book.id;
    const audioPath = `./audio/${audioBookId}/page-${String(pageIndex).padStart(2, '0')}-${lang}.mp3`;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(audioPath);
    audioRef.current = audio;
    audio.play().catch(() => {
      // Auto-play may be blocked, silently fail
    });

    // When audio ends, if autoPlay is on, advance to next page
    const goNext = () => {
      if (autoPlayRef.current && pageIndex < totalPages - 1 && !pageChangeLockRef.current) {
        pageChangeLockRef.current = true;
        setPageIndex(prev => {
          if (prev >= totalPages - 1) {
            setAutoPlay(false);
            return prev;
          }
          return prev + 1;
        });
        setTimeout(() => { pageChangeLockRef.current = false; }, 500);
      }
    };

    audio.addEventListener('ended', goNext);

    // Fallback: if audio fails to load, still advance after 5s when autoPlay+voiceOn
    audio.addEventListener('error', () => {
      if (voiceOn && autoPlayRef.current) {
        setTimeout(goNext, 5000);
      }
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [pageIndex, voiceOn, language, book.id, book.pageTexts, book.pageTextsEn, totalPages]);

  const goToPrevPage = useCallback(() => {
    if (isZoomedRef.current || pageIndex <= 0) return;
    setPageIndex(prev => prev - 1);
  }, [pageIndex]);

  const goToNextPage = useCallback(() => {
    if (isZoomedRef.current || pageIndex >= totalPages - 1) return;
    setPageIndex(prev => prev + 1);
  }, [pageIndex, totalPages]);

  const goToNextBook = useCallback(() => {
    setAutoPlay(true);
    const newIndex = bookIndex === totalBooks - 1 ? 0 : bookIndex + 1;
    onGoToBook(newIndex, 'from-bottom');
  }, [bookIndex, totalBooks, onGoToBook]);

  const goToFirstPage = useCallback(() => {
    if (isZoomedRef.current) return;
    setPageIndex(0);
  }, []);

  const goToPrevBook = useCallback(() => {
    setAutoPlay(true);
    const newIndex = bookIndex === 0 ? totalBooks - 1 : bookIndex - 1;
    onGoToBook(newIndex, 'from-top');
  }, [bookIndex, totalBooks, onGoToBook]);

  const toggleAutoPlay = useCallback(() => {
    setAutoPlay(prev => {
      const next = !prev;
      // When turning on autoPlay, also turn on voice if it's off
      if (next && !voiceOn) {
        setVoiceOn(true);
      }
      return next;
    });
    // User gesture: try to play current page audio (browser allows it)
    const texts = language === 'zh' ? book.pageTexts : book.pageTextsEn;
    if (texts && texts[pageIndex]) {
      const lang = language === 'zh' ? 'zh' : 'en';
      const audioBookId = language === 'en' && book.bookIdEn ? book.bookIdEn : book.id;
    const audioPath = `./audio/${audioBookId}/page-${String(pageIndex).padStart(2, '0')}-${lang}.mp3`;
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(audioPath);
      audioRef.current = audio;
      // Attach ended listener for auto-advance (needed here because useEffect
      // may not re-run when autoPlay changes if voiceOn was already true)
      audio.addEventListener('ended', () => {
        if (autoPlayRef.current && pageIndex < totalPages - 1 && !pageChangeLockRef.current) {
          pageChangeLockRef.current = true;
          setPageIndex(prev => {
            if (prev >= totalPages - 1) {
              setAutoPlay(false);
              return prev;
            }
            return prev + 1;
          });
          setTimeout(() => { pageChangeLockRef.current = false; }, 500);
        }
      });
      audio.play().catch(() => {});
    }
  }, [voiceOn, language, book.id, book.pageTexts, book.pageTextsEn, pageIndex, totalPages]);

  const toggleVoice = useCallback(() => {
    setVoiceOn(prev => {
      const next = !prev;
      if (!next && audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      return next;
    });
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => {
      const next = prev === 'zh' ? 'en' : 'zh';
      return next;
    });
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

  const currentImage = language === 'en' && book.pagesEn && book.pagesEn[pageIndex]
    ? book.pagesEn[pageIndex]
    : (book.pages[pageIndex] || book.cover);
  const isFirstPage = pageIndex === 0;
  const isLastPage = pageIndex === totalPages - 1;

  const btnBase = 'flex items-center justify-center rounded-xl transition-all duration-200';
  const btnBg = { background: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(4px)' };

  // Display current language label
  const langLabel = language === 'zh' ? '中' : 'EN';
  const hasPageTexts = book.pageTexts && book.pageTexts.length > 0 && book.pageTexts.some(t => t.length > 0);

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


      {/* Right side controls */}
      <div className="fixed right-3 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center">
        {/* 1. Auto play button */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleAutoPlay(); }}
          className={`w-11 h-11 md:w-12 md:h-12 ${btnBase} cursor-pointer
                     ${autoPlay
                       ? 'bg-warm-orange/70 hover:bg-warm-orange/80 active:bg-warm-orange/90'
                       : 'hover:opacity-100 active:opacity-80'
                     }`}
          style={{ background: autoPlay ? undefined : 'rgba(0,0,0,0.15)', backdropFilter: 'blur(4px)' }}
        >
          {autoPlay ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>

        <div className="h-3" />

        {/* 2. Right arrow (next page) */}
        <button
          onClick={(e) => { e.stopPropagation(); goToNextPage(); }}
          className={`w-11 h-14 md:w-12 md:h-20 ${btnBase}
                     ${isLastPage
                       ? 'opacity-30 cursor-not-allowed'
                       : 'opacity-100 hover:opacity-100 active:opacity-80 cursor-pointer'
                     }`}
          style={btnBg}
          disabled={isLastPage}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-white">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        <div className="h-3" />

        {/* 3. Voice on/off button */}
        {hasPageTexts && (
          <button
            onClick={(e) => { e.stopPropagation(); toggleVoice(); }}
            className={`w-11 h-11 md:w-12 md:h-12 ${btnBase} cursor-pointer
                       ${voiceOn
                         ? 'bg-warm-orange/70 hover:bg-warm-orange/80 active:bg-warm-orange/90'
                         : 'hover:opacity-100 active:opacity-80'
                       }`}
            style={{ background: voiceOn ? undefined : 'rgba(0,0,0,0.15)', backdropFilter: 'blur(4px)' }}
          >
            {voiceOn ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            )}
          </button>
        )}

        <div className="h-3" />

        {/* 4. Language toggle: zh/EN */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleLanguage(); }}
          className={`w-11 h-11 md:w-12 md:h-12 ${btnBase} cursor-pointer
                     ${language === 'en'
                       ? 'bg-warm-orange/70 hover:bg-warm-orange/80 active:bg-warm-orange/90'
                       : 'hover:opacity-100 active:opacity-80'
                     } font-bold text-white`}
          style={{ background: language === 'en' ? undefined : 'rgba(0,0,0,0.15)', backdropFilter: 'blur(4px)', fontSize: '15px' }}
        >
          {langLabel}
        </button>

        <div className="h-3" />

        {/* 5. Prev book (up arrow) */}
        <button
          onClick={(e) => { e.stopPropagation(); goToPrevBook(); }}
          className={`w-11 h-11 md:w-12 md:h-12 ${btnBase} opacity-100 hover:opacity-100 active:opacity-80 cursor-pointer`}
          style={btnBg}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5" />
            <path d="M5 12l7-7 7 7" />
          </svg>
        </button>

        <div className="h-3" />

        {/* 6. Next book (down arrow) */}
        <button
          onClick={(e) => { e.stopPropagation(); goToNextBook(); }}
          className={`w-11 h-11 md:w-12 md:h-12 ${btnBase} opacity-100 hover:opacity-100 active:opacity-80 cursor-pointer`}
          style={btnBg}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" />
            <path d="M19 12l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Left side: Home button at top-left */}
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

      {/* Left side controls */}
      <div className="fixed left-3 z-40 flex flex-col items-center" style={{ marginTop: "calc(50vh - 55px)" }}>
        {/* Left arrow (prev page) */}
        <button
          onClick={(e) => { e.stopPropagation(); goToPrevPage(); }}
          className={`w-12 h-16 md:w-14 md:h-24 ${btnBase}
                     ${isFirstPage
                       ? 'opacity-30 cursor-not-allowed'
                       : 'opacity-100 hover:opacity-100 active:opacity-80 cursor-pointer'
                     }`}
          style={btnBg}
          disabled={isFirstPage}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-white">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="h-3" />

        {/* Go to cover (first page) */}
        <button
          onClick={(e) => { e.stopPropagation(); goToFirstPage(); }}
          className={`w-12 h-14 md:w-16 md:h-14 ${btnBase}
                     ${isFirstPage
                       ? 'opacity-30 cursor-not-allowed'
                       : 'opacity-100 hover:opacity-100 active:opacity-80 cursor-pointer'
                     }`}
          style={btnBg}
          disabled={isFirstPage}
        >
          <div className="flex flex-col items-center leading-none">
            <span className="text-white/80 text-[10px] font-body whitespace-nowrap">封面</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5">
              <path d="M11 17l-5-5 5-5" />
              <path d="M18 17l-5-5 5-5" />
            </svg>
          </div>
        </button>
      </div>

      {/* Image area - reduced horizontal padding to avoid buttons covering image */}
      <div className="flex-1 px-4 py-2 flex items-center justify-center">
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