/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  trailingSlash: true,
  images: {
    unoptimized: true, 
  },
  output: 'standalone',
};

export default nextConfig;
