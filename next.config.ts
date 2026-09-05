import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  serverExternalPackages: ['argon2', 'pg'],
  allowedDevOrigins: ['10.10.10.100'],
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
