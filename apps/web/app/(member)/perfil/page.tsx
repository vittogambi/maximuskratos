import { redirect } from 'next/navigation';

export default function PerfilRedirectPage() {
  redirect('/memoria?vista=documentos');
}
