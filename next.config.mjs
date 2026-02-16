/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  output: 'standalone',
  allowedDevOrigins: ['http://localhost:3000', '192.168.2.136'],
};

export default nextConfig;
