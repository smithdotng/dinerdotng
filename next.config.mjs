import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Resolve the "@/..." import alias explicitly (mirrors tsconfig "paths"),
    // so builds never depend on the tsconfig being picked up.
    webpack(config) {
        config.resolve.alias = { ...(config.resolve.alias || {}), '@': root };
        return config;
    },
    reactStrictMode: true,
    eslint: {
        ignoreDuringBuilds: true
    },
    experimental: {
        serverActions: {
            // photo uploads go through Server Actions
            bodySizeLimit: '12mb'
        }
    },
    images: {
        remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }]
    }
};

export default nextConfig;
