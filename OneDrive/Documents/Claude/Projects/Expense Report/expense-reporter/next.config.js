/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    serverComponentsExternalPackages: ['tesseract.js', 'pdf-parse'],
  },
  images: {
    remotePatterns: [],
  },
};

module.exports = nextConfig;
