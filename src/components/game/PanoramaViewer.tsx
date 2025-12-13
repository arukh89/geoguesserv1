'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Info } from 'lucide-react';
import { Attribution } from './Attribution';

type Shot = { provider: 'mapillary'|'kartaview'; imageId?: string; imageUrl?: string };

interface PanoramaViewerProps {
  imageUrl?: string; // legacy static images
  shot?: Shot; // new provider-based imagery
  onLoad?: () => void;
  allowMove?: boolean;
}

const DynamicMapillary = dynamic(() => import('./MapillaryViewer'), { ssr: false });

export default function PanoramaViewer({ imageUrl, shot, onLoad, allowMove = true }: PanoramaViewerProps) {
  // Legacy simple draggable image viewer hooks must be unconditional
  const viewerRef = useRef<HTMLDivElement>(null);
  const isLegacy = !shot && !!imageUrl;

  useEffect(() => {
    if (!isLegacy || !viewerRef.current) return;

    const viewer = viewerRef.current;
    let isDragging = false;
    let startX = 0;
    let scrollLeft = 0;

    const handleMouseDown = (e: MouseEvent): void => {
      isDragging = true;
      startX = e.pageX - viewer.offsetLeft;
      scrollLeft = viewer.scrollLeft;
      viewer.style.cursor = 'grabbing';
    };

    const handleMouseUp = (): void => {
      isDragging = false;
      viewer.style.cursor = 'grab';
    };

    const handleMouseMove = (e: MouseEvent): void => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - viewer.offsetLeft;
      const walk = (x - startX) * 2;
      viewer.scrollLeft = scrollLeft - walk;
    };

    const handleTouchStart = (e: TouchEvent): void => {
      isDragging = true;
      startX = e.touches[0].pageX - viewer.offsetLeft;
      scrollLeft = viewer.scrollLeft;
    };

    const handleTouchEnd = (): void => {
      isDragging = false;
    };

    const handleTouchMove = (e: TouchEvent): void => {
      if (!isDragging) return;
      const x = e.touches[0].pageX - viewer.offsetLeft;
      const walk = (x - startX) * 2;
      viewer.scrollLeft = scrollLeft - walk;
    };

    viewer.addEventListener('mousedown', handleMouseDown);
    viewer.addEventListener('mouseup', handleMouseUp);
    viewer.addEventListener('mousemove', handleMouseMove);
    viewer.addEventListener('mouseleave', handleMouseUp);
    viewer.addEventListener('touchstart', handleTouchStart);
    viewer.addEventListener('touchend', handleTouchEnd);
    viewer.addEventListener('touchmove', handleTouchMove);

    return () => {
      viewer.removeEventListener('mousedown', handleMouseDown);
      viewer.removeEventListener('mouseup', handleMouseUp);
      viewer.removeEventListener('mousemove', handleMouseMove);
      viewer.removeEventListener('mouseleave', handleMouseUp);
      viewer.removeEventListener('touchstart', handleTouchStart);
      viewer.removeEventListener('touchend', handleTouchEnd);
      viewer.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isLegacy]);

  return (
    <div className="relative w-full h-full bg-black">
      {/* background rain now rendered globally in layout */}
      {shot?.provider === 'mapillary' && shot.imageId ? (
        <DynamicMapillary imageId={shot.imageId} allowMove={allowMove} />
      ) : shot?.provider === 'kartaview' && (shot.imageUrl || imageUrl) ? (
        <div className="relative w-full h-full">
          <Image
            src={(shot.imageUrl || imageUrl!) as string}
            alt="Street"
            fill
            sizes="100vw"
            style={{ objectFit: 'cover', pointerEvents: 'none', userSelect: 'none' }}
            className="pointer-events-none select-none"
            draggable={false}
            onLoad={onLoad}
            priority
          />
          {!allowMove && (
            <div className="absolute inset-0 bg-transparent" style={{ pointerEvents: 'auto' }} />
          )}
          {/* Scanline + vignette overlays */}
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{
            backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0 2px, rgba(0,255,65,0.18) 2px 3px)'
          }} />
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_100%,rgba(0,0,0,.6),transparent)]" />
        </div>
      ) : (
        <div
          ref={viewerRef}
          className="w-full h-full overflow-hidden cursor-grab select-none"
          style={{ touchAction: 'none' }}
        >
          {imageUrl && (
            <div className="relative w-full h-full">
              <Image
                src={imageUrl}
                alt="Panoramic view"
                fill
                sizes="100vw"
                style={{ objectFit: 'cover', pointerEvents: 'none', userSelect: 'none' }}
                className="pointer-events-none select-none"
                draggable={false}
                onLoad={onLoad}
                priority
              />
              {!allowMove && (
                <div className="absolute inset-0 bg-transparent" style={{ pointerEvents: 'auto' }} />
              )}
              {/* Overlays */}
              <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{
                backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0 2px, rgba(0,255,65,0.18) 2px 3px)'
              }} />
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_100%,rgba(0,0,0,.6),transparent)]" />
            </div>
          )}
        </div>
      )}

      {shot?.provider && (
        <div className="absolute bottom-2 left-2">
          <Attribution provider={shot.provider} />
        </div>
      )}

      {isLegacy && (
        <div className="absolute top-4 left-4 mx-panel px-4 py-2 rounded-lg flex items-center gap-2">
          <Info className="w-4 h-4 text-[var(--accent)]" />
          <span className="text-sm text-[color:rgba(151,255,151,0.9)]">Drag to look around</span>
        </div>
      )}
    </div>
  );
}
