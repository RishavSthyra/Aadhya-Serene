/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sthyra.com',
      },
      {
        protocol: 'https',
        hostname: 'aadhya-serene-assets-v2.s3.amazonaws.com',
      },
    ],
    // Allow local assets through without strict dimension checking
    // This prevents "Multiply coordinates by" errors for video-extracted images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
