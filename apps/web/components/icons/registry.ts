import type { SVGProps } from 'react';

import { LucideActivity } from '@/components/icons/lucide/activity';
import { LucideAnchor } from '@/components/icons/lucide/anchor';
import { LucideArrowRight } from '@/components/icons/lucide/arrow-right';
import { LucideBookOpen } from '@/components/icons/lucide/book-open';
import { LucideBriefcase } from '@/components/icons/lucide/briefcase';
import { LucideBuilding2 } from '@/components/icons/lucide/building-2';
import { LucideCalendar } from '@/components/icons/lucide/calendar';
import { LucideCalendarCheck } from '@/components/icons/lucide/calendar-check';
import { LucideCheck } from '@/components/icons/lucide/check';
import { LucideChevronDown } from '@/components/icons/lucide/chevron-down';
import { LucideCircle } from '@/components/icons/lucide/circle';
import { LucideCircleCheck } from '@/components/icons/lucide/circle-check';
import { LucideCircleDot } from '@/components/icons/lucide/circle-dot';
import { LucideCircleX } from '@/components/icons/lucide/circle-x';
import { LucideCoins } from '@/components/icons/lucide/coins';
import { LucideColumns } from '@/components/icons/lucide/columns';
import { LucideCompass } from '@/components/icons/lucide/compass';
import { LucideCrosshair } from '@/components/icons/lucide/crosshair';
import { LucideCrown } from '@/components/icons/lucide/crown';
import { LucideBrain } from '@/components/icons/lucide/brain';
import { LucideDumbbell } from '@/components/icons/lucide/dumbbell';
import { LucideDownload } from '@/components/icons/lucide/download';
import { LucideFlag } from '@/components/icons/lucide/flag';
import { LucideFlame } from '@/components/icons/lucide/flame';
import { LucideExternalLink } from '@/components/icons/lucide/external-link';
import { LucideEye } from '@/components/icons/lucide/eye';
import { LucideEyeOff } from '@/components/icons/lucide/eye-off';
import { LucideFingerprint } from '@/components/icons/lucide/fingerprint';
import { LucideGlobe } from '@/components/icons/lucide/globe';
import { LucideHandshake } from '@/components/icons/lucide/handshake';
import { LucideHeart } from '@/components/icons/lucide/heart';
import { LucideHeartPulse } from '@/components/icons/lucide/heart-pulse';
import { LucideHelm } from '@/components/icons/lucide/helm';
import { LucideIkigai } from '@/components/icons/lucide/ikigai';
import { LucideLaurelWreath } from '@/components/icons/lucide/laurel-wreath';
import { LucideLayoutDashboard } from '@/components/icons/lucide/layout-dashboard';
import { LucideLayoutGrid } from '@/components/icons/lucide/layout-grid';
import { LucideLock } from '@/components/icons/lucide/lock';
import { LucideLogOut } from '@/components/icons/lucide/log-out';
import { LucideMail } from '@/components/icons/lucide/mail';
import { LucideMedal } from '@/components/icons/lucide/medal';
import { LucideMailPlus } from '@/components/icons/lucide/mail-plus';
import { LucideMap } from '@/components/icons/lucide/map';
import { LucideMenu } from '@/components/icons/lucide/menu';
import { LucideMoon } from '@/components/icons/lucide/moon';
import { LucideMuscles } from '@/components/icons/lucide/muscles';
import { LucideScanEye } from '@/components/icons/lucide/scan-eye';
import { LucideScanLine } from '@/components/icons/lucide/scan-line';
import { LucideShadow } from '@/components/icons/lucide/shadow';
import { LucideShield } from '@/components/icons/lucide/shield';
import { LucideShieldAlert } from '@/components/icons/lucide/shield-alert';
import { LucideSparkles } from '@/components/icons/lucide/sparkles';
import { LucideStar } from '@/components/icons/lucide/star';
import { LucideStethoscope } from '@/components/icons/lucide/stethoscope';
import { LucideSword } from '@/components/icons/lucide/sword';
import { LucideTarget } from '@/components/icons/lucide/target';
import { LucideUserCheck } from '@/components/icons/lucide/user-check';
import { LucideUserPlus } from '@/components/icons/lucide/user-plus';
import { LucideUserX } from '@/components/icons/lucide/user-x';
import { LucideUsers } from '@/components/icons/lucide/users';
import { LucideWallet } from '@/components/icons/lucide/wallet';
import { LucideWorld } from '@/components/icons/lucide/world';
import { LucideX } from '@/components/icons/lucide/x';
import { LucideZapOff } from '@/components/icons/lucide/zap-off';
import { SocialInstagram } from '@/components/icons/social/instagram';
import { SocialLinkedin } from '@/components/icons/social/linkedin';
import { SocialX as SocialBrandX } from '@/components/icons/social/x';
import { SocialYoutube } from '@/components/icons/social/youtube';

export type IconComponent = (props: SVGProps<SVGSVGElement>) => React.JSX.Element;

export const ICON_REGISTRY = {
  activity: LucideActivity,
  anchor: LucideAnchor,
  'arrow-right': LucideArrowRight,
  'book-open': LucideBookOpen,
  'brand-x': SocialBrandX,
  briefcase: LucideBriefcase,
  'building-2': LucideBuilding2,
  calendar: LucideCalendar,
  'calendar-check': LucideCalendarCheck,
  check: LucideCheck,
  'chevron-down': LucideChevronDown,
  circle: LucideCircle,
  coins: LucideCoins,
  'circle-check': LucideCircleCheck,
  'circle-dot': LucideCircleDot,
  'circle-x': LucideCircleX,
  columns: LucideColumns,
  compass: LucideCompass,
  crosshair: LucideCrosshair,
  crown: LucideCrown,
  brain: LucideBrain,
  dumbbell: LucideDumbbell,
  download: LucideDownload,
  flag: LucideFlag,
  flame: LucideFlame,
  'external-link': LucideExternalLink,
  eye: LucideEye,
  'eye-off': LucideEyeOff,
  fingerprint: LucideFingerprint,
  globe: LucideGlobe,
  handshake: LucideHandshake,
  heart: LucideHeart,
  'heart-pulse': LucideHeartPulse,
  helm: LucideHelm,
  ikigai: LucideIkigai,
  instagram: SocialInstagram,
  'laurel-wreath': LucideLaurelWreath,
  'layout-dashboard': LucideLayoutDashboard,
  'layout-grid': LucideLayoutGrid,
  linkedin: SocialLinkedin,
  lock: LucideLock,
  'log-out': LucideLogOut,
  mail: LucideMail,
  'mail-plus': LucideMailPlus,
  map: LucideMap,
  medal: LucideMedal,
  menu: LucideMenu,
  moon: LucideMoon,
  muscles: LucideMuscles,
  'scan-eye': LucideScanEye,
  'scan-line': LucideScanLine,
  shadow: LucideShadow,
  shield: LucideShield,
  'shield-alert': LucideShieldAlert,
  sparkles: LucideSparkles,
  star: LucideStar,
  stethoscope: LucideStethoscope,
  sword: LucideSword,
  target: LucideTarget,
  'user-check': LucideUserCheck,
  'user-plus': LucideUserPlus,
  'user-x': LucideUserX,
  users: LucideUsers,
  wallet: LucideWallet,
  world: LucideWorld,
  x: LucideX,
  youtube: SocialYoutube,
  'zap-off': LucideZapOff,
} as const satisfies Record<string, IconComponent>;

export type AppIconName = keyof typeof ICON_REGISTRY;

/** Legacy aliases kept for existing `lucide:*` references. */
const ICON_ALIASES: Record<string, AppIconName> = {
  'check-circle': 'circle-check',
  'x-circle': 'circle-x',
};

export function resolveIconName(name: string): AppIconName | undefined {
  const raw = name.startsWith('lucide:') ? name.slice('lucide:'.length) : name;
  const key = (ICON_ALIASES[raw] ?? raw) as AppIconName;
  return key in ICON_REGISTRY ? key : undefined;
}
