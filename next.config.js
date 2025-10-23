/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'puppeteer'],
  },
  api: {
    bodyParser: false,
  },
}

module.exports = nextConfig
