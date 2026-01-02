import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // Minificação habilitada por padrão no Next.js 15 (SWC)
  // Removido webpack override que desabilitava minimize
  async redirects() {
    return [
      {
        source: '/apoiar',
        destination: '/premium',
        permanent: true, // 301 redirect
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ]
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Otimização de imagens habilitada para melhor performance
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
