import { labUiLabels } from '@/lib/lab-ui/labels';

const KIND: Record<string, string> = {
  EXCEL_SOURCE: 'excel',
  MATRIX_V2: 'v2',
  V2_TRANSFORMATION: 'v2',
  V2_UNDOCUMENTED_RESULT: 'undoc',
  POST_V2_REFINEMENT: 'post',
  TECHNICAL_CORRECTION: 'tech',
  FUTURE_PROPOSAL: 'later',
};

export function OriginChip({ origin }: { origin: string | null | undefined }) {
  const kind = KIND[origin ?? ''] ?? 'v2';
  return (
    <span className={`lab-ochip lab-ochip--${kind}`}>{labUiLabels.originType(origin)}</span>
  );
}
