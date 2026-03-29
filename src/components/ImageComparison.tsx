import { useState, useRef, useCallback } from "react";

interface ImageComparisonProps {
  originalUrl: string;
  upscaledUrl: string;
}

const ImageComparison = ({ originalUrl, upscaledUrl }: ImageComparisonProps) => {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  }, []);

  const handleMouseDown = () => { isDragging.current = true; };
  const handleMouseUp = () => { isDragging.current = false; };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) updatePosition(e.clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    updatePosition(e.touches[0].clientX);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl cursor-col-resize select-none glass-panel"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
    >
      {/* Upscaled (full background) */}
      <img src={upscaledUrl} alt="Upscaled" className="w-full h-auto max-h-[500px] object-contain" />

      {/* Original (clipped) */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
        <img src={originalUrl} alt="Original" className="w-full h-auto max-h-[500px] object-contain" style={{ width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%' }} />
      </div>

      {/* Slider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-primary shadow-[0_0_8px_hsl(38_95%_55%/0.5)]"
        style={{ left: `${position}%` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M4 7H1M10 7H13M4 7L6 5M4 7L6 9M10 7L8 5M10 7L8 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-primary-foreground" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-background/70 backdrop-blur-sm text-xs font-medium text-muted-foreground">
        Original
      </div>
      <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-background/70 backdrop-blur-sm text-xs font-medium text-primary">
        Upscaled
      </div>
    </div>
  );
};

export default ImageComparison;
