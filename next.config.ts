import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Netlify deployments can serve `next/image` optimization differently depending
    // on runtime/adapter configuration. If the optimizer route isn't available,
    // *all* <Image /> tags will break in production.
    //
    // By disabling optimization, images are served directly from `public/`.
    unoptimized: true,
  },
};

export default nextConfig;
