/** @type {import('next').NextConfig} */
const nextConfig = {
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
