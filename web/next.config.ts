import type { NextConfig } from "next";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const rootEnvPath = resolve(process.cwd(), "..", ".env.local");
if (existsSync(rootEnvPath)) {
  for (const line of readFileSync(rootEnvPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    process.env[key] ??= rest.join("=");
  }
}

const nextConfig: NextConfig = {};

export default nextConfig;
