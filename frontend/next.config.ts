import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

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
      break; // Found and loaded an .env file
    }
  }
} catch (e) {
  console.warn("Failed to load .env file in next.config.ts:", e);
}

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "",
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || ""
  }
};

export default nextConfig;
