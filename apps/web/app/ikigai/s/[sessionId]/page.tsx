import { IkigaiPlayer } from '@/components/ikigai/player';

export default async function IkigaiSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <IkigaiPlayer sessionId={sessionId} />;
}
