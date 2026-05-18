import { useState, useRef, useEffect, useCallback } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

export default function ChartZoomModal({ chart, onClose }) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const lastPinch = useRef(null);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(s => Math.max(0.5, Math.min(4, s + delta)));
  }, []);

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinch.current = Math.sqrt(dx * dx + dy * dy);
    } else if (e.touches.length === 1) {
      setIsDragging(true);
      setStartPos({ x: e.touches[0].clientX - translate.x, y: e.touches[0].clientY - translate.y });
    }
  }, [translate]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && lastPinch.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const delta = (distance - lastPinch.current) / 200;
      setScale(s => Math.max(0.5, Math.min(4, s + delta)));
      lastPinch.current = distance;
    } else if (e.touches.length === 1 && isDragging) {
      setTranslate({
        x: e.touches[0].clientX - startPos.x,
        y: e.touches[0].clientY - startPos.y
      });
    }
  }, [isDragging, startPos]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    lastPinch.current = null;
  }, []);

  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    setStartPos({ x: e.clientX - translate.x, y: e.clientY - translate.y });
  }, [translate]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      setTranslate({
        x: e.clientX - startPos.x,
        y: e.clientY - startPos.y
      });
    }
  }, [isDragging, startPos]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const reset = () => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onClick={handleOverlayClick}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
      >
        <X size={20} />
      </button>

      {/* Zoom controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
          <ZoomOut size={18} />
        </button>
        <button onClick={() => setScale(s => Math.min(4, s + 0.25))} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
          <ZoomIn size={18} />
        </button>
        <button onClick={reset} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Scale indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium">
        {Math.round(scale * 100)}%
      </div>

      {/* Chart image */}
      <div 
        ref={containerRef}
        className="max-w-[90vw] max-h-[80vh] overflow-hidden cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img 
          src={chart.preview} 
          alt="Chart"
          className="max-w-none"
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}