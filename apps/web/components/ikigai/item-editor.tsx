'use client';

import { useEffect, useRef, useState } from 'react';

export function IkigaiItemEditor({
  htmlId = 'ik-item-text',
  initial = '',
  maxLength = 140,
  placeholder,
  label = 'Escribe una actividad',
  submitLabel = 'Añadir',
  onSubmit,
  onCancel,
  onRemove,
}: {
  htmlId?: string;
  initial?: string;
  maxLength?: number;
  placeholder?: string;
  label?: string;
  submitLabel?: string;
  onSubmit: (text: string) => void;
  onCancel: () => void;
  onRemove?: () => void;
}) {
  const [text, setText] = useState(initial);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const ready = text.trim().length >= 3 && text.length <= maxLength;

  return (
    <div className="ik-editor">
      <label htmlFor={htmlId}>{label}</label>
      <textarea
        id={htmlId}
        ref={ref}
        className="ik-area"
        rows={3}
        maxLength={maxLength}
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <p className={`ik-count${text.length >= maxLength ? ' is-over' : ''}`}>
        {text.length} / {maxLength}
      </p>
      <div className="ik-editor__actions">
        <div className="ik-editor__aux">
          {onRemove ? (
            <button type="button" className="ik-text" onClick={onRemove}>
              Quitar
            </button>
          ) : null}
          <button type="button" className="ik-text" onClick={onCancel}>
            Cancelar
          </button>
        </div>
        <button
          type="button"
          className="ag-btn-primary font-label-lg"
          disabled={!ready}
          onClick={() => onSubmit(text.trim())}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
