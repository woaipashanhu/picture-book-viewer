import { useState, useRef, useCallback, useEffect } from 'react';

interface PinchZoomProps {
  children: React.ReactNode;
  onZoomChange?: (zoomed: boolean) => void;
}

export default function PinchZoom({ children, onZoomChange }: PinchZoomProps) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const isZoomedRef = useRef(false);

  const lastDistance = useRef(0);
  const lastCenter = useRef({ x: 0, y: 0 });
  const lastTouchPos = useRef({ x: 0, y: 0 });
  const isPinching = useRef(false);
  const isDragging = useRef(false);
  const isTwoFinger = useRef(false);
  const lastTapTime = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const notifyZoom = useCallback((zoomed: boolean) => {
    if (isZoomedRef.current !== zoomed) {
      isZoomedRef.current = zoomed;
      onZoomChange?.(zoomed);
    }
  }, [onZoomChange]);

  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
      notifyZoom(false);
    }
    lastTapTime.current = now;
  }, [notifyZoom]);

  const getDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getCenter = (touches: React.TouchList) => {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  };

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      isPinching.current = true;
      isTwoFinger.current = true;
      isDragging.current = false;
      lastDistance.current = getDistance(e.touches);
      lastCenter.current = getCenter(e.touches);
      lastTouchPos.current = getCenter(e.touches);
    } else if (e.touches.length === 1 && isZoomedRef.current && !isTwoFinger.current) {
      isDragging.current = true;
      lastTouchPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (isPinching.current && e.touches.length === 2) {
      e.preventDefault();
      const distance = getDistance(e.touches);
      const center = getCenter(e.touches);
      const scaleFactor = distance / lastDistance.current;

      let newScale = scale * scaleFactor;
      newScale = Math.max(1, Math.min(5, newScale));

      if (newScale > 1) {
        const dx = center.x - lastCenter.current.x;
        const dy = center.y - lastCenter.current.y;
        setTranslate(prev => ({
          x: prev.x + dx,
          y: prev.y + dy,
        }));
      }

      setScale(newScale);
      notifyZoom(newScale > 1);
      lastDistance.current = distance;
      lastCenter.current = center;
    } else if (isDragging.current && e.touches.length === 1) {
      const dx = e.touches[0].clientX - lastTouchPos.current.x;
      const dy = e.touches[0].clientY - lastTouchPos.current.y;
      setTranslate(prev => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));
      lastTouchPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  }, [scale, notifyZoom]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      isPinching.current = false;
      isTwoFinger.current = false;
      if (scale <= 1) {
        setScale(1);
        setTranslate({ x: 0, y: 0 });
        notifyZoom(false);
      }
    }
    if (e.touches.length === 0) {
      isDragging.current = false;
    }
  }, [scale, notifyZoom]);

  useEffect(() => {
    if (!isZoomedRef.current) {
      setTranslate({ x: 0, y: 0 });
    }
  }, [isZoomedRef.current]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center overflow-hidden"
      style={{ touchAction: isZoomedRef.current ? 'none' : 'pan-y' }}
      onClick={!isZoomedRef.current ? handleTap : undefined}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
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
