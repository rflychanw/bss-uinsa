/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  experimental: {
    agentUpgrade: "security",
  },
};

export default nextConfig;
