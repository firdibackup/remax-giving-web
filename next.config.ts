import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = supabaseUrl ? new URL(supabaseUrl) : null;

const nextConfig: NextConfig = {
  basePath: "/giving",
  experimental: {
    serverActions: {
      // Files go through uploadChunk in ~750 KB pieces (the remax.co.id proxy
      // may reject bodies over 1 MB), so no action needs a larger body.
      bodySizeLimit: "2mb",
      // The site is served through the remax.co.id reverse proxy, so the
      // browser Origin (remax.co.id) differs from the Vercel host
      // (remax-giving.vercel.app). Without whitelisting the proxy domain,
      // Next.js aborts every Server Action POST (e.g. login) with a 500.
      allowedOrigins: ["remax.co.id", "www.remax.co.id"],
    },
  },
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: supabaseHost.protocol.replace(":", "") as "http" | "https",
            hostname: supabaseHost.hostname,
            port: supabaseHost.port || undefined,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
