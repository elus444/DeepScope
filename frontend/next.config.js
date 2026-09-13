/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // No `output: "standalone"` here -- that mode bundles a minimal
  // self-hosted server (for Docker/Node hosting) and its build step
  // skips emitting `.next/next-server.js.nft.json`. Vercel's own build
  // pipeline expects that trace file to build its serverless functions,
  // so pairing it with "standalone" fails every deploy with
  // "ENOENT: .../next-server.js.nft.json". This frontend only ever
  // deploys to Vercel (the backend is the one with a Dockerfile), so
  // there's no self-hosting case to support -- just use Vercel's default
  // build output.
};

module.exports = nextConfig;
