import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cuestionario guardado',
  robots: { index: false, follow: false },
};

export default function DiagnosticStoredPage() {
  return (
    <main
      style={{
        flex: 1,
        overflow: 'auto',
        padding: '32px 20px 48px',
        maxWidth: 640,
        margin: '0 auto',
        width: '100%',
      }}
    >
      <p style={{ letterSpacing: '0.08em', fontSize: 12, marginBottom: 8 }}>MK · CUESTIONARIO</p>
      <h1 style={{ fontSize: 32, lineHeight: 1.15, margin: '0 0 16px' }}>Tus respuestas quedaron guardadas</h1>
      <p style={{ fontSize: 18, lineHeight: 1.5, margin: '0 0 12px' }}>
        Esta pantalla no es un informe, un perfil ni un puntaje. MK no interpreta aquí fortalezas, dificultades ni un resultado clínico.
      </p>
      <p style={{ fontSize: 18, lineHeight: 1.5, margin: '0 0 24px' }}>
        Si marcaste no sé, no aplica o no quiero responder, esa excepción está en el ámbito correspondiente, dentro de Inicio.
      </p>
      <p style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <Link href="/panel">Volver a Inicio</Link>
        <Link href="/disenar">Diseñar un plan</Link>
      </p>
    </main>
  );
}
