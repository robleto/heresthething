import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
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
