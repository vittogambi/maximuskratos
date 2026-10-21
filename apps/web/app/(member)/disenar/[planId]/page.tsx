import { redirect } from 'next/navigation';

type Props = { params: Promise<{ planId: string }> };

export default async function DisenarPlanRedirect({ params }: Props) {
  const { planId } = await params;
  redirect(`/planes/${planId}`);
}
