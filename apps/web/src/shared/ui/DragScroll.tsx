'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';

/** Pixels the pointer must move before a press counts as a drag (not a click). */
const DRAG_THRESHOLD = 5;
/** Momentum after release: per-frame decay of the throw speed. */
const FRICTION = 0.92;

/**
 * Horizontal row that scrolls natively (touch, trackpad, Shift+wheel) and can
 * also be dragged with the mouse, with a little momentum on release, like the
 * reference store's sliders. A drag never triggers the click on a link inside.
 */
export function DragScroll({ className, children, label }: { className?: string; children: ReactNode; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let startX = 0;
    let startScroll = 0;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0;
    let dragging = false;
    let moved = false;
    let frame = 0;

    const glide = () => {
      if (Math.abs(velocity) < 0.3) return;
      el.scrollLeft -= velocity;
      velocity *= FRICTION;
      frame = requestAnimationFrame(glide);
    };

    const onDown = (e: PointerEvent) => {
      // touch and pen already scroll natively
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      cancelAnimationFrame(frame);
      dragging = true;
      moved = false;
      startX = lastX = e.clientX;
      lastT = e.timeStamp;
      startScroll = el.scrollLeft;
      velocity = 0;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) < DRAG_THRESHOLD) return;
      if (!moved) {
        moved = true;
        el.setPointerCapture(e.pointerId);
        el.dataset.dragging = 'true';
      }
      el.scrollLeft = startScroll - dx;
      const dt = Math.max(1, e.timeStamp - lastT);
      velocity = ((e.clientX - lastX) / dt) * 16;
      lastX = e.clientX;
      lastT = e.timeStamp;
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      delete el.dataset.dragging;
      if (moved) frame = requestAnimationFrame(glide);
    };
    // swallow the click that ends a drag, so a dragged tile does not open
    const onClick = (e: MouseEvent) => {
      if (!moved) return;
      e.preventDefault();
      e.stopPropagation();
      moved = false;
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('click', onClick, true);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('click', onClick, true);
    };
  }, []);

  return (
    <div
      ref={ref}
      role={label ? 'region' : undefined}
      aria-label={label}
      // native image dragging would fight the row drag
      onDragStart={(e) => e.preventDefault()}
      className={cn(
        'no-scrollbar flex cursor-grab select-none overflow-x-auto overscroll-x-contain data-[dragging=true]:cursor-grabbing [&_a]:cursor-[inherit]',
        className,
      )}
    >
      {children}
    </div>
  );
}
