import type { NextConfig } from 'next';
import { version } from './package.json';

const nextConfig: NextConfig = {
	reactStrictMode: true,
	output: 'export',
	images: {
		qualities: [100],
		unoptimized: true, // Required for static export
	},
	distDir: 'dist',
	trailingSlash: true, // Helps with static routing,
	env: {
		APP_VERSION: version,
	},
	devIndicators: false,
};

export default nextConfig;
