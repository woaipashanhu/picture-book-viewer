import { useRef, useCallback } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeState {
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
  isSwiping: boolean;
  direction: 'horizontal' | 'vertical' | null;
}

const THRESHOLD = 50;

export function useSwipe(handlers: SwipeHandlers) {
  const stateRef = useRef<SwipeState>({
    startX: 0,
    startY: 0,
    deltaX: 0,
    deltaY: 0,
    isSwiping: false,
    direction: null,
  });

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    stateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      deltaX: 0,
      deltaY: 0,
      isSwiping: true,
      direction: null,
    };
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!stateRef.current.isSwiping) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - stateRef.current.startX;
    const deltaY = touch.clientY - stateRef.current.startY;

    if (!stateRef.current.direction) {
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        stateRef.current.direction = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
      }
    }

    stateRef.current.deltaX = deltaX;
    stateRef.current.deltaY = deltaY;
  }, []);

  const onTouchEnd = useCallback((_e?: React.TouchEvent) => {
    const { deltaX, deltaY, direction, isSwiping } = stateRef.current;
    if (!isSwiping) return;

    if (direction === 'horizontal' && Math.abs(deltaX) > THRESHOLD) {
      if (deltaX < 0) {
        handlers.onSwipeLeft?.();
      } else {
        handlers.onSwipeRight?.();
      }
    } else if (direction === 'vertical' && Math.abs(deltaY) > THRESHOLD) {
      if (deltaY < 0) {
        handlers.onSwipeUp?.();
      } else {
        handlers.onSwipeDown?.();
      }
    }

    stateRef.current.isSwiping = false;
    stateRef.current.direction = null;
  }, [handlers]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}
