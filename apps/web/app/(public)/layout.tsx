import { PublicLayout } from '@/components/public-layout';
import { IntroGate } from '@/components/motion/intro-gate';
import { PublicMotionProvider } from '@/components/motion/public-motion-provider';

export default function PublicRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PublicMotionProvider>
      <IntroGate />
      <PublicLayout>{children}</PublicLayout>
    </PublicMotionProvider>
  );
}
