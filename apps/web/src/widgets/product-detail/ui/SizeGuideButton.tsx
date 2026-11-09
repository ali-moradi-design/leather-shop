'use client';

import { useRef, type ReactNode } from 'react';
import { Icon } from '@/shared/ui';

/** "Size guide" link that opens the (server-rendered) size table in a modal dialog. */
export function SizeGuideButton({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} className="text-[13px] text-ink underline underline-offset-4">
        Size guide
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="size-guide-title"
        onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
        className="m-auto w-[min(520px,calc(100vw-32px))] bg-white p-0 backdrop:bg-black/50"
      >
        <div className="max-h-[80vh] overflow-y-auto p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="size-guide-title" className="heading text-[22px]">Size guide</h2>
            <button type="button" onClick={() => dialog.current?.close()} aria-label="Close size guide" className="grid h-9 w-9 place-items-center">
              <Icon name="close" />
            </button>
          </div>
          {children}
        </div>
      </dialog>
    </>
  );
}
