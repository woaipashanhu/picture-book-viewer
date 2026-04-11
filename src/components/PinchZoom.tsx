import { useState, useRef, useCallback, useEffect } from 'react';

interface PinchZoomProps {
  children: React.ReactNode;
  onZoomChange?: (zoomed: boolean) => void;
}

export default function PinchZoom({ children, onZoomChange }: PinchZoomProps) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const isZoomedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(1);

  const lastDistance = useRef(0);
  const lastCenter = useRef({ x: 0, y: 0 });
  const lastDragPos = useRef({ x: 0, y: 0 });
  const isPinching = useRef(false);
  const isDragging = useRef(false);
  const hadTwoFingers = useRef(false);
  const lastTapTime = useRef(0);

  const notifyZoom = useCallback((zoomed: boolean) => {
    if (isZoomedRef.current !== zoomed) {
      isZoomedRef.current = zoomed;
      onZoomChange?.(zoomed);
    }
  }, [onZoomChange]);

  // Keep scaleRef in sync
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      setScale(1);
      scaleRef.current = 1;
      setTranslate({ x: 0, y: 0 });
      notifyZoom(false);
    }
    lastTapTime.current = now;
  }, [notifyZoom]);

  const getDistance = (t1: Touch, t2: Touch) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        hadTwoFingers.current = true;
        isPinching.current = true;
        isDragging.current = false;
        lastDistance.current = getDistance(e.touches[0], e.touches[1]);
        lastCenter.current = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
        e.preventDefault();
      } else if (e.touches.length === 1 && isZoomedRef.current && !hadTwoFingers.current) {
        isDragging.current = true;
        lastDragPos.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        e.preventDefault();
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isPinching.current && e.touches.length >= 2) {
        e.preventDefault();
        const distance = getDistance(e.touches[0], e.touches[1]);
        const center = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };

        const scaleFactor = distance / lastDistance.current;
        const newScale = Math.max(1, Math.min(5, scaleRef.current * scaleFactor));
        setScale(newScale);
        scaleRef.current = newScale;

        if (newScale > 1) {
          const dx = center.x - lastCenter.current.x;
          const dy = center.y - lastCenter.current.y;
          setTranslate(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        }

        lastDistance.current = distance;
        lastCenter.current = center;
      } else if (isDragging.current && e.touches.length === 1) {
        e.preventDefault();
        const dx = e.touches[0].clientX - lastDragPos.current.x;
        const dy = e.touches[0].clientY - lastDragPos.current.y;
        lastDragPos.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        setTranslate(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        isPinching.current = false;
        if (scaleRef.current <= 1) {
          setScale(1);
          scaleRef.current = 1;
          setTranslate({ x: 0, y: 0 });
          notifyZoom(false);
        } else {
          notifyZoom(true);
        }
      }
      if (e.touches.length === 0) {
        isDragging.current = false;
        hadTwoFingers.current = false;
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [notifyZoom]);

  useEffect(() => {
    if (!isZoomedRef.current) {
      setTranslate({ x: 0, y: 0 });
    }
  }, [isZoomedRef.current]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center overflow-hidden"
      style={{ touchAction: 'none' }}
      onClick={!isZoomedRef.current ? handleTap : undefined}
    >
      <div
        className="flex items-center justify-center will-change-transform"
        style={{
          transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}