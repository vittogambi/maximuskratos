import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';

type AdminPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: AdminPageHeaderProps) {
  return (
    <header className="admin-page-header">
      <div className="admin-page-header__copy">
        {eyebrow ? <p className="admin-page-header__eyebrow">{eyebrow}</p> : null}
        <h1 className="admin-page-header__title">{title}</h1>
        {description ? <p className="admin-page-header__desc">{description}</p> : null}
      </div>
      {actions ? <div className="admin-page-header__actions">{actions}</div> : null}
    </header>
  );
}

export function AdminStatusBadge({ online }: { online: boolean }) {
  return (
    <Badge variant={online ? 'user' : 'muted'} className="admin-status-badge">
      <span className={`admin-status-dot${online ? ' is-online' : ''}`} aria-hidden />
      API {online ? 'en línea' : 'sin respuesta'}
    </Badge>
  );
}
