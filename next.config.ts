import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here - triggering rebuild 20 */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['*'],
    },
  },
  serverExternalPackages: ['firebase-admin'],
};

export default nextConfig;
