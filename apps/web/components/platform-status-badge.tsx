import type { PlatformModuleStatus } from '@/lib/platform-status';
import { PLATFORM_STATUS_LABELS } from '@/lib/platform-status';

type PlatformStatusBadgeProps = {
  status: PlatformModuleStatus;
  label?: string;
  className?: string;
};

export function PlatformStatusBadge({ status, label, className = '' }: PlatformStatusBadgeProps) {
  return (
    <span className={`ag-platform-badge ag-platform-badge--${status} ${className}`.trim()}>
      {label ?? PLATFORM_STATUS_LABELS[status]}
    </span>
  );
}
