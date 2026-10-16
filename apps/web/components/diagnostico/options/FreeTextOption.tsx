'use client';

type Props = {
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
};

export function FreeTextOption({ value, onChange, maxLength = 500 }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        rows={4}
        placeholder="Escribe tu respuesta."
        style={{
          background: 'var(--color-surface-1)',
          border: '1px solid var(--color-border)',
          borderRadius: 0,
          color: 'var(--color-text)',
          fontFamily: 'var(--font-body)',
          fontSize: '1rem',
          lineHeight: 1.6,
          padding: '1rem',
          resize: 'vertical',
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-focus)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border)';
        }}
      />
      <p className="dk-char-count">
        {value.length} de {maxLength}
      </p>
    </div>
  );
}
