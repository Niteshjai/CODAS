import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { FOCUS } from './format';

/** Icon button that copies a value; announces "Copied" politely. 44px on phones, 32px from sm up. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard?.writeText(value).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); });
        }}
        aria-label={`Copy ${label}`}
        title={`Copy ${label}`}
        className={`size-11 sm:size-8 shrink-0 rounded-lg grid place-items-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ${FOCUS}`}
      >
        {done ? <Check className="size-4 text-emerald-700 dark:text-emerald-400" /> : <Copy className="size-4" />}
      </button>
      <span className="sr-only" aria-live="polite">{done ? `${label} copied` : ''}</span>
    </>
  );
}
