import { ResultPage } from '@/components/ikigai/result-page';

export default async function IkigaiResultRoute({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <ResultPage sessionId={sessionId} />;
}
