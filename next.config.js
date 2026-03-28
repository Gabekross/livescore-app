/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverActions: true,
  },
  images: {
    remotePatterns: [
      {
        // Supabase Storage — covers all Supabase project URLs
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        // Supabase Storage — alternative domain
        protocol: 'https',
        hostname: '**.supabase.in',
      },
    ],
  },
}

module.exports = nextConfig
