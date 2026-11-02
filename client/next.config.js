/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // lets a second dev instance (e.g. for testing) use its own build folder
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // routes from the previous UI
  async redirects() {
    return [
      { source: '/kanban', destination: '/board', permanent: false },
      { source: '/labels', destination: '/settings?tab=labels', permanent: false },
      { source: '/notifications', destination: '/dashboard', permanent: false },
    ];
  },
};

module.exports = nextConfig;
