/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mark native/heavy packages as external so they run in Node.js directly
  // instead of being bundled by webpack (required for tesseract.js & pdf-parse)
  serverExternalPackages: ['tesseract.js', 'pdf-parse'],
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
