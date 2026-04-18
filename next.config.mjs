/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["puppeteer", "pdf-parse"],
  },
};

export default nextConfig;
