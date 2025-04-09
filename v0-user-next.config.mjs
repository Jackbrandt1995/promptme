/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/.well-known/ai-plugin.json',
        destination: '/api/well-known/ai-plugin'
      },
      {
        source: '/.well-known/openapi.yaml',
        destination: '/api/well-known/openapi'
      }
    ]
  }
}

export default nextConfig
