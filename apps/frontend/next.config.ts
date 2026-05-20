import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@remotehask/shared-types', '@remotehask/shared-utils', '@heroui/react'],
};

export default nextConfig;
