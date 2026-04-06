import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, X, Download, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  images: string[];
  downloadable?: boolean;
  vaultName?: string;
  onBack: () => void;
}

const Gallery = ({ images, downloadable, vaultName, onBack }: Props) => {
  const [current, setCurrent] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [touchStart, setTouchStart] = useState(0);

  const next = useCallback(() => setCurrent((p) => Math.min(p + 1, images.length - 1)), [images.length]);
  const prev = useCallback(() => setCurrent((p) => Math.max(p - 1, 0)), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, onBack]);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart - e.changedTouches[0].clientX;
    if (diff > 50) next();
    else if (diff < -50) prev();
  };

  const downloadImage = async () => {
    if (!downloadable || !images[current]) return;
    const a = document.createElement("a");
    a.href = images[current];
    a.download = `vault-image-${current + 1}.jpg`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background screenshot-protect" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-background to-transparent">
        <Button size="icon" variant="ghost" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <span className="text-sm text-muted-foreground">{current + 1} / {images.length}</span>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={() => setZoom((z) => Math.max(1, z - 0.5))}><ZoomOut className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={() => setZoom((z) => Math.min(3, z + 0.5))}><ZoomIn className="h-4 w-4" /></Button>
          {downloadable && <Button size="icon" variant="ghost" onClick={downloadImage}><Download className="h-4 w-4" /></Button>}
        </div>
      </div>

      {/* Image */}
      <div className="h-full flex items-center justify-center overflow-hidden">
        <img
          src={images[current] || "/placeholder.svg"}
          alt={`${vaultName} ${current + 1}`}
          className="max-h-full max-w-full object-contain transition-transform duration-300"
          style={{ transform: `scale(${zoom})` }}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>

      {/* Nav arrows (desktop) */}
      {current > 0 && (
        <button onClick={prev} className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 items-center justify-center rounded-full bg-card/80 hover:bg-card">
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {current < images.length - 1 && (
        <button onClick={next} className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 items-center justify-center rounded-full bg-card/80 hover:bg-card">
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
    </div>
  );
};

export default Gallery;
