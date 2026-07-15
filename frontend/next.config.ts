import type { NextConfig } from "next";
import fs from "fs";
import path from "path";
import withSerwistInit from "@serwist/next";

// Manually parse and load parent or local .env if exists
try {
  const envPaths = [
    path.resolve(__dirname, "../.env"), // Local monorepo root
    path.resolve(__dirname, "./.env"),  // Docker container root
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const envConfig = fs.readFileSync(envPath, "utf-8");
      envConfig.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const parts = trimmed.split("=");
          if (parts.length >= 2) {
            const key = parts[0].trim();
            const val = parts.slice(1).join("=").trim();
            const cleanedVal = val.replace(/^["']|["']$/g, "");
            if (!process.env[key]) {
              process.env[key] = cleanedVal;
            }
          }
        }
      });
      break;
    }
  }
} catch (e) {
  console.warn("Failed to load .env file in next.config.ts:", e);
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Content Security Policy.
 * - script-src: allows self, Paystack inline.js, Google Sign-In
 * - connect-src: allows self and the backend API URL
 * - 'unsafe-inline' for scripts is only included for Paystack compat; remove once migrated to @paystack/inline-js npm package
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.paystack.co https://accounts.google.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://paystack.com https://accounts.google.com",
  "font-src 'self' https://fonts.gstatic.com",
  `img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com ${apiUrl}`,
  `connect-src 'self' ${apiUrl} https://api.paystack.co https://accounts.google.com`,
  "frame-src https://accounts.google.com https://checkout.paystack.com/",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(), camera=(), microphone=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  turbopack: {},
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
      }
    ],
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);
