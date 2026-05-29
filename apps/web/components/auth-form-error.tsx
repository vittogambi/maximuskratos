import { authErrorTitle, type AuthErrorContext } from '@/lib/auth-errors';

type AuthFormErrorProps = {
  message: string;
  context: AuthErrorContext;
};

export function AuthFormError({ message, context }: AuthFormErrorProps) {
  if (!message) return null;

  return (
    <div className="auth-error" role="alert" aria-live="polite">
      <p className="auth-error-title">{authErrorTitle(context)}</p>
      <p className="auth-error-message">{message}</p>
    </div>
  );
}
