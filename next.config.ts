import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	reactStrictMode: true,
	output: 'export',
	images: {
		qualities: [100],
		unoptimized: true, // Required for static export
	},
	distDir: 'dist',
	trailingSlash: true, // Helps with static routing
};

export default nextConfig;
