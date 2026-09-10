'use client';

import { IkigaiSheet } from '@/components/ikigai/sheet';

export function IkigaiQualifierSheet({
  open,
  prompt,
  options,
  value,
  onSelect,
  onSkip,
  onClose,
}: {
  open: boolean;
  prompt: string;
  options: Array<{ key: string; label: string }>;
  value: string | null;
  onSelect: (key: string) => void;
  onSkip: () => void;
  onClose: () => void;
}) {
  return (
    <IkigaiSheet open={open} title={prompt} onClose={onClose}>
      <div className="ik-choice" role="radiogroup" aria-label={prompt}>
        {options.map((opt) => (
          <button
            key={opt.key}
            type="button"
            className={value === opt.key ? 'is-on' : ''}
            aria-pressed={value === opt.key}
            onClick={() => onSelect(opt.key)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <button type="button" className="ik-text" style={{ marginTop: '0.75rem' }} onClick={onSkip}>
        Omitir
      </button>
    </IkigaiSheet>
  );
}
