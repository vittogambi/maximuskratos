import { redirect } from 'next/navigation';

export default function LabQaRedirectPage() {
  redirect('/admin/lab/coverage');
}
