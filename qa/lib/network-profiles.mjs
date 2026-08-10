// Lighthouse throttling presets (ms latency, kbps up/down), so numbers are
// comparable to any external Lighthouse/PSI run against the same URLs.
export const NETWORK_PROFILES = {
  fast: null, // no throttling
  '4g': {
    offline: false,
    downloadThroughput: (1.6 * 1024 * 1024) / 8, // 1.6 Mbps
    uploadThroughput: (750 * 1024) / 8, // 750 Kbps
    latency: 150,
  },
  '3g': {
    offline: false,
    downloadThroughput: (400 * 1024) / 8, // 400 Kbps
    uploadThroughput: (400 * 1024) / 8,
    latency: 400,
  },
  offline: {
    offline: true,
    downloadThroughput: 0,
    uploadThroughput: 0,
    latency: 0,
  },
};

export const CPU_THROTTLE = {
  fast: 1,
  '4g': 4,
  '3g': 4,
  offline: 1,
};

export const VIEWPORTS = {
  mobile360: { width: 360, height: 800, category: 'mobile' },
  mobile390: { width: 390, height: 844, category: 'mobile' },
  mobile430: { width: 430, height: 932, category: 'mobile' },
  tablet768: { width: 768, height: 1024, category: 'tablet' },
  laptop1366: { width: 1366, height: 768, category: 'laptop' },
  desktop1440: { width: 1440, height: 900, category: 'desktop' },
  desktop1920: { width: 1920, height: 1080, category: 'desktop' },
};

export const MOBILE_LANDSCAPE = {
  mobile360Landscape: { width: 800, height: 360, category: 'mobile-landscape' },
  mobile390Landscape: { width: 844, height: 390, category: 'mobile-landscape' },
  mobile430Landscape: { width: 932, height: 430, category: 'mobile-landscape' },
};

export const PUBLIC_ROUTES = [
  '/',
  '/manifiesto',
  '/sistema',
  '/marco-central',
  '/ikigai',
  '/precios',
  '/eventos',
  '/contacto',
  '/privacidad',
  '/terminos',
];

export const PERF_PRIORITY_ROUTES = ['/', '/precios', '/manifiesto', '/sistema'];

export const STAGING_WEB = 'https://mkweb-staging.up.railway.app';
export const STAGING_API = 'https://mkapi-staging.up.railway.app';
