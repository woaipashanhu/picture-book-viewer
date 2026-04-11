import { useRef, useCallback } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

const THRESHOLD = 50;
const MAX_TIME = 500;

interface SwipeState {
  startX: number;
  startY: number;
  startTime: number;
  isSwiping: boolean;
  direction: 'horizontal' | 'vertical' | null;
  hasMoved: boolean;
}

export function useSwipe(handlers: SwipeHandlers, enabled: boolean = true) {
  const stateRef = useRef<SwipeState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    isSwiping: false,
    direction: null,
    hasMoved: false,
  });

  const detectSwipe = useCallback((endX: number, endY: number) => {
    const { startX, startY, startTime, direction, isSwiping } = stateRef.current;
    if (!isSwiping) return;

    const elapsed = Date.now() - startTime;
    if (elapsed > MAX_TIME) {
      stateRef.current.isSwiping = false;
      return;
    }

    const deltaX = endX - startX;
    const deltaY = endY - startY;

    if (direction === 'horizontal' || (!direction && Math.abs(deltaX) > Math.abs(deltaY))) {
      if (Math.abs(deltaX) > THRESHOLD) {
        if (deltaX < 0) handlers.onSwipeLeft?.();
        else handlers.onSwipeRight?.();
      }
    } else if (direction === 'vertical' || (!direction && Math.abs(deltaY) > Math.abs(deltaX))) {
      if (Math.abs(deltaY) > THRESHOLD) {
        if (deltaY < 0) handlers.onSwipeUp?.();
        else handlers.onSwipeDown?.();
      }
    }

    stateRef.current.isSwiping = false;
    stateRef.current.direction = null;
    stateRef.current.hasMoved = false;
  }, [handlers]);

  // Touch handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;
    const touch = e.touches[0];
    stateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      isSwiping: true,
      direction: null,
      hasMoved: false,
    };
  }, [enabled]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled || !stateRef.current.isSwiping || stateRef.current.direction) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - stateRef.current.startX;
    const deltaY = touch.clientY - stateRef.current.startY;
    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (dist > 10) {
      stateRef.current.direction = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
    }
  }, [enabled]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;
    const touch = e.changedTouches[0];
    detectSwipe(touch.clientX, touch.clientY);
  }, [enabled, detectSwipe]);

  // Mouse handlers for desktop
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!enabled) return;
    e.preventDefault();
    stateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startTime: Date.now(),
      isSwiping: true,
      direction: null,
      hasMoved: false,
    };
  }, [enabled]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!enabled || !stateRef.current.isSwiping || stateRef.current.direction) return;
    const deltaX = e.clientX - stateRef.current.startX;
    const deltaY = e.clientY - stateRef.current.startY;
    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (dist > 10) {
      stateRef.current.direction = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
    }
  }, [enabled]);

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    if (!enabled) return;
    detectSwipe(e.clientX, e.clientY);
  }, [enabled, detectSwipe]);

  return { onTouchStart, onTouchMove, onTouchEnd, onMouseDown, onMouseMove, onMouseUp };
}
