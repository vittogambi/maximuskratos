export type AuthErrorContext = 'login' | 'register';

/** Single message shown on any failed login attempt. */
export const LOGIN_INVALID_CREDENTIALS = 'Email o contraseña inválidas.';

const REGISTER_MESSAGE_ES: Record<string, string> = {
  'Email already registered':
    'Ya existe una cuenta con este email. Si ya te registraste, inicia sesión.',
  'Este email ya está registrado.':
    'Ya existe una cuenta con este email. Si ya te registraste, inicia sesión.',
};

const VALIDATION_HINT_ES =
  'Revisa el formulario: usa un email válido y una contraseña de al menos 8 caracteres.';

export function toAuthUserMessage(
  raw: string,
  status: number,
  context: AuthErrorContext,
): string {
  if (context === 'login') {
    return LOGIN_INVALID_CREDENTIALS;
  }

  const trimmed = raw.trim();
  if (trimmed && REGISTER_MESSAGE_ES[trimmed]) {
    return REGISTER_MESSAGE_ES[trimmed];
  }

  if (status === 400) {
    return VALIDATION_HINT_ES;
  }

  if (status === 409) {
    return REGISTER_MESSAGE_ES['Email already registered'];
  }

  if (status === 429) {
    return 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.';
  }

  if (status >= 500) {
    return 'El servidor no está disponible en este momento. Inténtalo más tarde.';
  }

  if (
    !status ||
    trimmed === 'Failed to fetch' ||
    trimmed.toLowerCase().includes('network')
  ) {
    return 'No pudimos conectar con el servidor. Comprueba que la API esté en marcha y vuelve a intentarlo.';
  }

  if (trimmed) {
    return trimmed;
  }

  return 'No se pudo crear la cuenta. Inténtalo de nuevo.';
}

export function authErrorTitle(context: AuthErrorContext): string {
  return context === 'login'
    ? 'No se pudo iniciar sesión'
    : 'No se pudo crear la cuenta';
}
