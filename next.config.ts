import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'kartaview.org' },
      { protocol: 'https', hostname: '*.kartaview.org' as any },
    ],
  },
};

export default nextConfig;
