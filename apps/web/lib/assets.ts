/**
 * Asset registry — maps stable keys to public paths.
 * Components reference keys, not raw paths.
 */

export const LANDING_IMAGES = {
  statueClean:    '/images/landing/statue-clean.jpg',
  statueBroken:   '/images/landing/statue-broken.jpg',
  statueAligned:  '/images/landing/statue-aligned.jpg',
  /** Hero signature: pre-beam dark still (composition matches beam video). */
  statueBeamDark: '/images/landing/statue-beam-dark.jpg?v=19',
  statueBeamDarkWebp: '/images/landing/statue-beam-dark.webp?v=19',
  statueBeamDarkSm: '/images/landing/statue-beam-dark-sm.jpg?v=19',
  statueBeamDarkSmWebp: '/images/landing/statue-beam-dark-sm.webp?v=19',
  /** Hero signature: illuminated still after beam. Desktop uses lossless HD PNG. */
  statueBeamLit:  '/images/landing/statue-beam-lit.jpg?v=19',
  statueBeamLitHd: '/images/landing/statue-beam-lit-hd.png?v=19',
  statueBeamLitWebp: '/images/landing/statue-beam-lit.webp?v=19',
  statueBeamLitSm: '/images/landing/statue-beam-lit-sm.jpg?v=19',
  statueBeamLitSmWebp: '/images/landing/statue-beam-lit-sm.webp?v=19',
  phase01:        '/images/landing/phase-01.jpg',
  phase02:        '/images/landing/phase-02.jpg',
  phase03:        '/images/landing/phase-03.jpg',
  phase05:        '/images/landing/phase-05.jpg',
  bgArquitecturaSentido: '/images/backgrounds/arquitectura-sentido-columns.png',
  bgMarcoCentral:        '/images/backgrounds/marco-central.png',
  bgAboutSystems:        '/images/backgrounds/about-systems.png',
  eventosHero:           '/images/eventos/hero-council.jpg',
  eventosQuote:          '/images/eventos/quote-brotherhood.jpg',
  contactoHero:          '/images/contacto/hero-listening.jpg',
  ikigaiDiagram:           '/images/ikigai/ikigai-diagram.png',
  ikigaiHero:              '/images/ikigai/ikigai-hero.png',
} as const;

/** Hero darkness-to-direction beam clip (~3s, cut before fade-back). */
export const LANDING_VIDEO = {
  statueBeam: '/video/statue-beam.mp4?v=19',
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
