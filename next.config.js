/** @type {import('next').NextConfig} */
const nextConfig = {
  // basePath: "/capital2",
  // assetPrefix: "/capital2/",

  output: "export",
  // trailingSlash: true,
  reactStrictMode: true,
  images: {
    unoptimized: true, // Disable image optimization for static export
  },
};

module.exports = nextConfig;
// ---------------------------------------------------------------------------------------------

// /** @type {import('next').NextConfig} */

// const withBundleAnalyzer = require('@next/bundle-analyzer')({
//   enabled: process.env.ANALYZE === 'true', // Only enable when needed
// });

// const nextConfig = {
//   // basePath: "/capital", // Uncomment if needed
//   output: "export",
//   // trailingSlash: true,
//   reactStrictMode: true,
//   images: {
//     unoptimized: true,
//   },
// };

// module.exports = withBundleAnalyzer(nextConfig);

// ---------------------------------------------------------------------------------------------

// next.config.js (or next.config.mjs)

// next.config.js (or next.config.mjs)

// import nextPwa from "next-pwa";

// const withPWA = nextPwa({
//   dest: "public",
//   register: true,
//   skipWaiting: true,
// });

// const nextConfig = {
//   output: "export",
//   reactStrictMode: true,
//   images: {
//     unoptimized: true,
//   },
// };

// export default withPWA(nextConfig);
// npm install next-pwa
