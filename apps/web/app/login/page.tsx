'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { AuthFooterLink, AuthShell } from '@/components/auth-shell';
import { PasswordInput } from '@/components/password-input';
import { LOGIN_INVALID_CREDENTIALS } from '@/lib/auth-errors';
import { apiLogin } from '@/lib/api';
import { setAccessToken } from '@/lib/auth-storage';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      setAccessToken(data.accessToken);
      router.push('/app');
    } catch {
      setError(LOGIN_INVALID_CREDENTIALS);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Iniciar sesión"
      description="Accede con tu email y contraseña."
      footer={
        <AuthFooterLink
          text="¿Primera vez aquí?"
          linkText="Crear cuenta"
          href="/register"
        />
      }
    >
      <form className="auth-form" onSubmit={onSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="tu@email.com"
          />
        </label>
        <label>
          Contraseña
          <PasswordInput
            value={password}
            onChange={setPassword}
            minLength={8}
            autoComplete="current-password"
            placeholder="Mínimo 8 caracteres"
          />
        </label>
        {error ? <p className="auth-error">{error}</p> : null}
        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </AuthShell>
  );
}
