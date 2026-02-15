/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/:path*', destination: 'https://aadhyaserene.com/:path*' }
      ]
    };
  }
};

export default nextConfig;
