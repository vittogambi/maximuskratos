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
