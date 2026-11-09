'use client';

import Image from 'next/image';
import { useState } from 'react';

const SIZES = '(min-width: 1440px) 300px, (min-width: 1024px) 22vw, (min-width: 768px) 33vw, 50vw';

/**
 * The card's photo, and on mouse hover its second photo. The second one is only
 * added on the first hover: rendered up front (even invisible), every card in a
 * grid downloaded two photos, and touch screens never show it.
 */
export function CardPhotos({ first, second, alt, preload }: { first?: string; second?: string; alt: string; preload?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="relative aspect-square overflow-hidden bg-soft"
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
    >
      {first && (
        <Image
          src={first}
          alt={alt}
          fill
          sizes={SIZES}
          preload={preload}
          className={`object-contain transition-opacity duration-300 ${second && hovered ? 'group-hover:opacity-0' : ''}`}
        />
      )}
      {second && hovered && (
        <Image
          src={second}
          alt=""
          fill
          sizes={SIZES}
          className="object-contain opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
      )}
    </div>
  );
}
