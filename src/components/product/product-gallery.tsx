"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ZoomIn, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: { url: string; altText?: string | null }[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

  const safeImages = images.length > 0
    ? images
    : [{ url: "https://placehold.co/600x600/FDF8F0/D4843A?text=Magadh+Recipe", altText: productName }];

  const currentImage = safeImages[selectedIdx];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const prev = () => setSelectedIdx((i) => (i - 1 + safeImages.length) % safeImages.length);
  const next = () => setSelectedIdx((i) => (i + 1) % safeImages.length);

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative group">
        <div
          className={cn(
            "relative rounded-2xl overflow-hidden bg-cream-200 aspect-square cursor-zoom-in",
            isZoomed && "cursor-zoom-out"
          )}
          onClick={() => setIsZoomed(!isZoomed)}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setIsZoomed(false)}
        >
          <Image
            src={currentImage.url}
            alt={currentImage.altText ?? productName}
            fill
            className={cn(
              "object-cover transition-all duration-300",
              isZoomed && "scale-150"
            )}
            style={
              isZoomed
                ? {
                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  }
                : undefined
            }
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />

          {/* Zoom hint */}
          <div className="absolute bottom-3 right-3 bg-black/40 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="w-3 h-3" />
            Hover to zoom
          </div>

          {/* Nav arrows */}
          {safeImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand-50"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand-50"
                aria-label="Next image"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Image counter */}
        {safeImages.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/40 text-white text-xs px-2 py-1 rounded-full">
            {selectedIdx + 1} / {safeImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {safeImages.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
          {safeImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIdx(idx)}
              className={cn(
                "shrink-0 relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all",
                idx === selectedIdx
                  ? "border-brand-500 shadow-brand"
                  : "border-transparent hover:border-brand-200 opacity-70 hover:opacity-100"
              )}
              aria-label={`View image ${idx + 1}`}
            >
              <Image
                src={img.url}
                alt={img.altText ?? `${productName} ${idx + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
