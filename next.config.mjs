/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // async rewrites() {
  //   return {
  //     beforeFiles: [
  //       { source: '/:path*', destination: 'https://aadhyaserene.com/:path*' }
  //     ]
  //   };
  // }
};

export default nextConfig;
