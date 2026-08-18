import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@gestao-financeira/shared', 'recharts'],
};

export default nextConfig;
