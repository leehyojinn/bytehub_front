/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-left',
  },
  images: {
    domains: ['localhost'],
  },
};

export default nextConfig;
