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
    async headers() {
        return [
            {
                // Service worker must never be cached, so updates roll out immediately
                source: '/sw.js',
                headers: [
                    { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
                    { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
                    { key: 'Service-Worker-Allowed', value: '/' }
                ]
            }
        ];
    },
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
