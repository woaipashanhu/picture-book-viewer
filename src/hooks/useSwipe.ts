import { useEffect, useRef, useCallback } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

const THRESHOLD = 40;

/**
 * iOS PWA-compatible swipe hook.
 * Uses native addEventListener with { passive: false } to ensure
 * preventDefault() works, preventing Safari from hijacking touches.
 */
export function useSwipe(handlers: SwipeHandlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const stateRef = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    isSwiping: false,
    direction: null as 'horizontal' | 'vertical' | null,
    isMultiTouch: false,
  });

  const onTouchStart = useCallback((e: TouchEvent) => {
    // Ignore multi-touch (reserved for pinch-zoom)
    if (e.touches.length > 1) {
      stateRef.current.isMultiTouch = true;
      stateRef.current.isSwiping = false;
      return;
    }
    stateRef.current.isMultiTouch = false;
    stateRef.current.isSwiping = true;
    stateRef.current.direction = null;
    stateRef.current.startX = e.touches[0].clientX;
    stateRef.current.startY = e.touches[0].clientY;
    stateRef.current.startTime = Date.now();
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    const state = stateRef.current;

    if (!state.isSwiping || state.isMultiTouch) return;

    const deltaX = e.touches[0].clientX - state.startX;
    const deltaY = e.touches[0].clientY - state.startY;

    // Lock direction after a small movement threshold
    if (!state.direction) {
      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
        state.direction = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
      } else {
        return;
      }
    }

    // Prevent browser default (scroll, back, etc.)
    e.preventDefault();
  }, []);

  const onTouchEnd = useCallback((e: TouchEvent) => {
    const state = stateRef.current;

    if (!state.isSwiping || state.isMultiTouch) {
      state.isSwiping = false;
      state.isMultiTouch = false;
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - state.startX;
    const deltaY = touch.clientY - state.startY;
    const elapsed = Date.now() - state.startTime;

    state.isSwiping = false;
    state.direction = null;

    // Ignore slow drags (not a swipe)
    if (elapsed > 800) return;

    // Check both horizontal and vertical independently
    if (Math.abs(deltaX) > THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY) * 0.5) {
      if (deltaX < 0) handlersRef.current.onSwipeLeft?.();
      else handlersRef.current.onSwipeRight?.();
    }

    if (Math.abs(deltaY) > THRESHOLD && Math.abs(deltaY) > Math.abs(deltaX) * 0.5) {
      if (deltaY < 0) handlersRef.current.onSwipeUp?.();
      else handlersRef.current.onSwipeDown?.();
    }
  }, []);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Must use { passive: false } so preventDefault() works in iOS PWA
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd]);

  return ref;
}
