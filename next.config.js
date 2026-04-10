/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  // Supabase Storage'daki görsellere izin ver
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        // Supabase URL'inizi buraya girin (env'den okunur)
        hostname: process.env.NEXT_PUBLIC_SUPABASE_URL
          ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
          : '*.supabase.co',
      },
    ],
  },

  // PWA için gerekli header'lar
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
