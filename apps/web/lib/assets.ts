/**
 * Asset registry — maps stable keys to public paths.
 * Drop image/model files into the matching public/... folder and update paths here.
 * Components always reference keys, never raw paths.
 */

export type StatueKey  = 'warrior' | 'builder' | 'king' | 'mentor' | 'visionario';
export type HeroKey    = 'main' | 'app' | 'auth';
export type TextureKey = 'marble_light' | 'marble_dark' | 'stone';
export type BackgroundKey = 'landscape' | 'coliseum' | 'library';
export type ModelKey   = 'marble_bust';

// ── Cinematic landing hero statue ──────────────────────────────────────────
// Single image, clipped into fragments by StatueTransition.
// Replace path with a higher-resolution asset when ready.
export const HERO_STATUE: string = '/images/statues/hero-statue.png';

// ── Aethelgard landing imagery ─────────────────────────────────────────────
export const LANDING_IMAGES = {
  statueClean:    '/images/landing/statue-clean.jpg',
  statueBroken:   '/images/landing/statue-broken.jpg',
  statueAligned:  '/images/landing/statue-aligned.jpg',
  statueSovereign: '/images/landing/statue-sovereign.jpg',
  phase01:        '/images/landing/phase-01.jpg',
  phase02:        '/images/landing/phase-02.jpg',
  phase03:        '/images/landing/phase-03.jpg',
  phase04:        '/images/landing/phase-04.jpg',
  phase05:        '/images/landing/phase-05.jpg',
  greekColumns:   '/images/backgrounds/greek-columns.png',
  bgArquitecturaSentido: '/images/backgrounds/arquitectura-sentido-columns.png',
  bgMarcoCentral:        '/images/backgrounds/marco-central.png',
  bgAboutSystems:        '/images/backgrounds/about-systems.png',
  bgCtaGateway:          '/images/backgrounds/cta-gateway.png',
  eventosHero:           '/images/eventos/hero-council.jpg',
  eventosQuote:          '/images/eventos/quote-brotherhood.jpg',
  contactoHero:          '/images/contacto/hero-listening.jpg',
  ikigaiDiagram:           '/images/ikigai/ikigai-diagram.png',
  ikigaiHero:              '/images/ikigai/ikigai-hero.png',
} as const;

export type AuthAtmosphereVariant = 'login' | 'register' | 'default';

export const AUTH_ATMOSPHERE: Record<
  AuthAtmosphereVariant,
  { src: string; objectPosition: string; quote: string }
> = {
  login: {
    src: LANDING_IMAGES.statueAligned,
    objectPosition: 'center 22%',
    quote: 'El orden precede al poder. Retoma tu construcción.',
  },
  register: {
    src: LANDING_IMAGES.statueBroken,
    objectPosition: 'center 26%',
    quote: 'El propósito no se descubre, se construye.',
  },
  default: {
    src: LANDING_IMAGES.statueClean,
    objectPosition: 'center 20%',
    quote: 'Ningún hombre es libre si no es dueño de sí mismo.',
  },
};

// ── Fragment overrides ─────────────────────────────────────────────────────
// Default null → StatueTransition clips the hero statue into the fragment region.
// Set to a real image path to override that fragment with its own image.
export type FragmentKey = 'mind' | 'body' | 'spirit' | 'relationships' | 'legacy';

export const STATUE_FRAGMENTS: Record<FragmentKey, string | null> = {
  mind:          null, // /images/statues/fragment-mind.jpg
  body:          null,
  spirit:        null,
  relationships: null,
  legacy:        null,
};

// ── Archetype statues ──────────────────────────────────────────────────────
export const STATUES: Record<StatueKey, string | null> = {
  warrior:    '/images/archetypes/guerrero.png',
  builder:    '/images/archetypes/constructor.png',
  king:       '/images/archetypes/rey.png',
  mentor:     '/images/archetypes/mentor.png',
  visionario: '/images/archetypes/visionario.png',
};

// ── Hero images (full-bleed backgrounds) ──────────────────────────────────
export const HEROES: Record<HeroKey, string | null> = {
  main: null,
  app:  null,
  auth: null,
};

// ── Texture overlays ───────────────────────────────────────────────────────
export const TEXTURES: Record<TextureKey, string | null> = {
  marble_light: null,
  marble_dark:  null,
  stone:        null,
};

// ── Background section images ──────────────────────────────────────────────
export const BACKGROUNDS: Record<BackgroundKey, string | null> = {
  landscape: null,
  coliseum:  null,
  library:   null,
};

// ── 3D models (GLB) ────────────────────────────────────────────────────────
export const MODELS: Record<ModelKey, string | null> = {
  marble_bust: null,
};

/** Returns the resolved path or null (callers render placeholder when null). */
export function getAsset<K extends string>(
  registry: Record<K, string | null>,
  key: K,
): string | null {
  return registry[key] ?? null;
}
