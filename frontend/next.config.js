/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/acuaponia',
  assetPrefix: '/acuaponia',
  trailingSlash: false,
  publicRuntimeConfig: {
    basePath: '/acuaponia',
  },
  images: {
    unoptimized: true, 
    domains: ['tesorostpatl.com.co'], 
  },

  async rewrites() {
    return [
      {
        source: '/dashboard/:path*',
        destination: '/acuaponia/dashboard/:path*'
      }
    ]
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ]
  },
}

module.exports = nextConfig 