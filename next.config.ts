import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  devIndicators: {
    position: "bottom-right",
  },
  experimental: {
    proxyClientMaxBodySize: "250mb",
    staleTimes: {
      dynamic: 0,
      static: 30,
    },
  },
  async redirects() {
    // TEMPORARY: only the home page is designed so far. Every other storefront page sends
    // visitors back to "/" until it is built. Remove a path from this list to switch that page back on.
    // (dashboard, login/signup/password pages, api and checkout are left alone on purpose.)
    const notBuiltYet = [
      "about", "about-us", "blog", "bulk-order", "bulk-orders", "careers", "contact", "contact-us",
      "downloads", "find-a-store", "firmware-updates", "orders", "pickup-drop-service", "privacy-choices",
      "privacy-policy", "product", "repair-replacement", "service-centers", "shop", "support",
      "terms-of-use", "terms-policy", "troubleshooting", "warranty", "warranty-registration", "warranty-terms",
    ];
    return notBuiltYet.flatMap((page) => [
      { source: `/${page}`, destination: "/", permanent: false },
      { source: `/${page}/:path*`, destination: "/", permanent: false },
    ]);
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
          { key: "Surrogate-Control", value: "no-store" },
        ],
      },
      {
        source: "/dashboard/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
      {
        source: "/",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
          { key: "Surrogate-Control", value: "no-store" },
        ],
      },
      {
        source: "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
          { key: "Surrogate-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;

// Trigger restart for config fix
