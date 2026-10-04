import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Externe domeinen waar productfoto's vandaan mogen komen. Liefst zet je foto's
    // zelf in /public/items; gebruik je toch externe URL's, voeg het domein hier toe.
    remotePatterns: [
      { protocol: "https", hostname: "cdn.shopify.com" },
    ],
  },
};

export default nextConfig;
