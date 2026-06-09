export function formatAdminDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatAdminDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-CL', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeAdmin(dateIso: string): string {
  const diff = Date.now() - new Date(dateIso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${Math.max(mins, 1)} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `hace ${hours} h`;
  return formatAdminDate(dateIso);
}

export function formatOnboarding(step: string): string {
  return step
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
