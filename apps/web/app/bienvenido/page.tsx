'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Legacy route — redirects to /panel. */
export default function BienvenidoRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/panel');
  }, [router]);

  return (
    <div className="auth-loading" style={{ minHeight: '50vh', display: 'grid', placeItems: 'center' }}>
      <span className="auth-spinner" aria-hidden />
      <p>Redirigiendo a tu panel…</p>
    </div>
  );
}
