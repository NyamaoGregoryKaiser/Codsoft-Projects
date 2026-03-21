/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Optional: Add custom webpack configurations
  webpack: (config, { isServer }) => {
    // For example, if you need to load SVGs
    // config.module.rules.push({
    //   test: /\.svg$/,
    //   use: ['@svgr/webpack'],
    // });
    return config;
  },
};

export default nextConfig;