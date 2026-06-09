import { PublicLayout } from '@/components/public-layout';

export default function PublicRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicLayout>{children}</PublicLayout>;
}
