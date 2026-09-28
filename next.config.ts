import type { NextConfig } from "next";

// Moderate Content-Security-Policy, mirroring the Mowatt prototype's approach.
// Tighten the script policy with nonces when this moves toward production.
const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
      : null;
  } catch {
    return null;
  }
})();

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  // Supabase Storage serves uploaded listing photos and Home Reports.
  //
  // The OpenStreetMap allowance below is currently unused: `leaflet` and
  // `@types/leaflet` are in package.json but have zero imports anywhere in
  // src/, and the Scotland area picker (components/home/area-finder.tsx) is a
  // text search over lib/areas.ts, not a map. The allowance and the dependency
  // are both left in place because CLAUDE.md still lists Leaflet maps as part
  // of the intended stack — if the map picker is not coming, drop
  // `leaflet`/`@types/leaflet` and this tile origin together.
  `img-src 'self' data: blob: https://tile.openstreetmap.org https://*.tile.openstreetmap.org${supabaseHost ? ` https://${supabaseHost}` : ""}`,
  "font-src 'self' data:",
  `connect-src 'self'${supabaseHost ? ` https://${supabaseHost}` : ""}`,
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

// The internal project board (/board-uvy2tlvzvc42) is the one page that
// loads Poppins/Inter from Google Fonts — everything else self-hosts. Its
// headers entry sits after the catch-all so these two values win there.
const boardCsp = csp
  .replace(
    "style-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  )
  .replace(
    "font-src 'self' data:",
    "font-src 'self' data: https://fonts.gstatic.com",
  );

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  images: supabaseHost
    ? {
        remotePatterns: [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ],
      }
    : {},
  experimental: {
    serverActions: {
      // Listing photo + Home Report uploads (multiple files per submit).
      bodySizeLimit: "25mb",
    },
    viewTransition: true,
  },
  // Make sure the board HTML ships inside the serverless bundle on Vercel.
  outputFileTracingIncludes: {
    "/board-uvy2tlvzvc42": ["./src/app/board-uvy2tlvzvc42/board.html"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/board-uvy2tlvzvc42",
        headers: [
          { key: "Content-Security-Policy", value: boardCsp },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
};

export default nextConfig;
