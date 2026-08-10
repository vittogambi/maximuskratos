import type { NextConfig } from 'next';

const apiOrigin = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const useLocalProxy =
  apiOrigin.includes('localhost:') || apiOrigin.includes('127.0.0.1:');

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    if (!useLocalProxy) return [];
    return [
      { source: '/api/v1/:path*', destination: `${apiOrigin}/api/v1/:path*` },
      { source: '/health', destination: `${apiOrigin}/health` },
    ];
  },
  async headers() {
    // public/ files aren't content-hashed like _next/static, so Next serves
    // them with max-age=0 by default (safe, but means every visit re-fetches
    // multi-MB hero/background assets). These paths already follow a manual
    // cache-busting convention (?v=N query strings on assets that get
    // replaced), so long-lived caching is safe: bump the query string (as the
    // hero assets already do) when replacing a file in place.
    const longCache = [
      { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
    ];
    // Security headers for HTML/document responses. CSP is intentionally
    // omitted (no report endpoint yet; Report-Only would be inert noise).
    const securityHeaders = [
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), payment=()',
      },
    ];
    return [
      { source: '/images/:path*', headers: longCache },
      { source: '/video/:path*', headers: longCache },
      { source: '/fonts/:path*', headers: longCache },
      { source: '/brand/:path*', headers: longCache },
      { source: '/:path*', headers: securityHeaders },
    ];
  },
  async redirects() {
    return [
      {
        source: '/prestaciones',
        destination: '/sistema',
        permanent: true,
      },
      {
        source: '/quienes-somos',
        destination: '/manifiesto',
        permanent: true,
      },
      {
        source: '/porque-mk',
        destination: '/manifiesto',
        permanent: true,
      },
      {
        source: '/base-conceptual',
        destination: '/marco-central',
        permanent: true,
      },
    ];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 828, 1080, 1200, 1440, 1920, 2560, 3840],
  },
};

export default nextConfig;
