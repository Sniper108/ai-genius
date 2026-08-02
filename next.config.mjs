/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The Claude bridge spawns the `claude` CLI as a child process from an API
  // route, which already runs on the Node.js runtime — no extra config needed.
};

export default nextConfig;
