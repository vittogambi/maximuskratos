import { redirect } from 'next/navigation';

export default function DiagnosticResultRedirectPage() {
  redirect('/memoria?vista=documentos');
}
