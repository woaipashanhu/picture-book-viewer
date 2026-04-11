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
  isSwiping: boolean;
  direction: 'horizontal' | 'vertical' | null;
}

const THRESHOLD = 50;
const DIRECTION_LOCK_THRESHOLD = 15;

export function useSwipe(handlers: SwipeHandlers) {
  const stateRef = useRef<SwipeState>({
    startX: 0,
    startY: 0,
    isSwiping: false,
    direction: null,
  });

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    stateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      isSwiping: true,
      direction: null,
    };
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!stateRef.current.isSwiping || stateRef.current.direction) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - stateRef.current.startX;
    const deltaY = touch.clientY - stateRef.current.startY;

    if (Math.abs(deltaX) > DIRECTION_LOCK_THRESHOLD || Math.abs(deltaY) > DIRECTION_LOCK_THRESHOLD) {
      stateRef.current.direction = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
    }
  }, []);

  const onTouchEnd = useCallback((_e?: React.TouchEvent) => {
    const { startX, startY, direction, isSwiping } = stateRef.current;
    if (!isSwiping) return;

    // Get the actual end position from the event if available
    const currentTouch = _e?.changedTouches?.[0];
    const endX = currentTouch?.clientX ?? startX;
    const endY = currentTouch?.clientY ?? startY;

    const deltaX = endX - startX;
    const deltaY = endY - startY;

    // If direction was determined, use it; otherwise check both
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
  }, [handlers]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}