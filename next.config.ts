import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactStrictMode: true,
	output: "export",
	images: {
		unoptimized: true,
	},
	distDir: "dist",
	staticPageGenerationTimeout: 180,
	experimental: {
		cpus: 1
	}
};

export default nextConfig;
