import { AppIcon } from '@/components/app-icon';
import type { AppIconName } from '@/components/icons/registry';

type AdminKpiCardProps = {
  icon: AppIconName;
  label: string;
  value: number;
  hint?: string;
  trend?: number;
};

export function AdminKpiCard({ icon, label, value, hint, trend }: AdminKpiCardProps) {
  return (
    <article className="admin-kpi">
      <div className="admin-kpi__icon" aria-hidden>
        <AppIcon name={icon} size={18} />
      </div>
      <div className="admin-kpi__body">
        <p className="admin-kpi__label">{label}</p>
        <p className="admin-kpi__value">{value.toLocaleString('es-CL')}</p>
        {hint ? <p className="admin-kpi__hint">{hint}</p> : null}
        {trend !== undefined && trend > 0 ? (
          <p className="admin-kpi__trend">+{trend} últimos 7 días</p>
        ) : null}
      </div>
    </article>
  );
}
