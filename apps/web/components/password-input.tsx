'use client';

import { useId, useState } from 'react';
import { AppIcon } from '@/components/app-icon';

type PasswordInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
  disabled?: boolean;
};

export function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete,
  minLength,
  required = true,
  disabled = false,
}: PasswordInputProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <div className="auth-password-field">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        placeholder={placeholder}
        disabled={disabled}
      />
      <button
        type="button"
        className="auth-password-toggle"
        disabled={disabled}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-controls={id}
      >
        <AppIcon name={visible ? 'eye-off' : 'eye'} size={18} />
      </button>
    </div>
  );
}
