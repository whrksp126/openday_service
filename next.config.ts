import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
    ],
    localPatterns: [
      { pathname: '/uploads/**' },
      { pathname: '/images/**' },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: process.env.NEXTAUTH_URL ? [new URL(process.env.NEXTAUTH_URL).host] : [],
    },
  },
}

export default nextConfig
