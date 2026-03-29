import { useEffect, useCallback } from "react";
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react";

interface LightboxProps {
  imageUrl: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

const Lightbox = ({ imageUrl, onClose, onPrev, onNext, hasPrev, hasNext }: LightboxProps) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowLeft" && onPrev && hasPrev) onPrev();
    if (e.key === "ArrowRight" && onNext && hasNext) onNext();
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex items-center justify-center" onClick={onClose}>
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <a
          href={imageUrl}
          download
          target="_blank"
          rel="noopener"
          onClick={(e) => e.stopPropagation()}
          className="p-2.5 rounded-xl bg-card/80 border border-border/50 text-foreground hover:bg-card transition-colors"
        >
          <Download className="w-5 h-5" />
        </a>
        <button onClick={onClose} className="p-2.5 rounded-xl bg-card/80 border border-border/50 text-foreground hover:bg-card transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {hasPrev && onPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-card/80 border border-border/50 text-foreground hover:bg-card transition-colors z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {hasNext && onNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-card/80 border border-border/50 text-foreground hover:bg-card transition-colors z-10"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      <img
        src={imageUrl}
        alt="Lightbox"
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl"
        onClick={(e) => e.stopPropagation()}
        loading="lazy"
      />
    </div>
  );
};

export default Lightbox;
