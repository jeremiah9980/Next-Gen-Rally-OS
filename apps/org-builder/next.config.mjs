/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@rally/ui',
    '@rally/core-data',
    '@rally/config',
    '@rally/org-kit',
    '@rally/site-template',
    '@rally/projection',
  ],
}

export default nextConfig
