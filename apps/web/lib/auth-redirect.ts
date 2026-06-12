/** Post-login/register destination for this phase (no /app). */
export function getPostAuthPath(role: string): string {
  return role === 'ADMIN' ? '/admin' : '/panel';
}
