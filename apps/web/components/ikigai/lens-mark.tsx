import { AppIcon } from '@/components/app-icon';
import type { IkigaiFieldKey } from '@/lib/ikigai-api';
import { LENS_ICONS } from '@/lib/ikigai-ui/format';

export function IkigaiLensMark({
  field,
  size = 14,
}: {
  field: IkigaiFieldKey;
  size?: number;
}) {
  return (
    <span className="ik-lens-mark" aria-hidden>
      <AppIcon name={LENS_ICONS[field]} size={size} />
    </span>
  );
}
