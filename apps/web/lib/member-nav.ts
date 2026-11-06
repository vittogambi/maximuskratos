/** Side nav active state for member shell routes. */
export function isMemberNavActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  switch (href) {
    case '/memoria':
      return pathname.startsWith('/memoria') || pathname.startsWith('/diagnostico/resultado');
    case '/panel':
      return pathname.startsWith('/ambito/');
    case '/planes':
      return pathname.startsWith('/planes');
    case '/semana':
      return pathname.startsWith('/semana');
    case '/disenar':
      return pathname.startsWith('/disenar');
    default:
      return false;
  }
}
