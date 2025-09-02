'use client';

import { Spinner } from '@/components/ui/spinner';
import { isServer, QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

function makeQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 5 * 60 * 1000, // 5 minutes
				gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
				retry: (failureCount, error) => {
					// Don't retry for Tauri command errors
					if (error instanceof Error && error.message.includes('invoke')) {
						return false;
					}
					return failureCount < 3;
				},
			},
			mutations: {
				retry: false,
			},
		},
	});
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
	if (isServer) {
		// Server: always make a new query client
		return makeQueryClient();
	} else {
		if (!browserQueryClient) browserQueryClient = makeQueryClient();
		return browserQueryClient;
	}
}

export default function Providers({ children }: { children: React.ReactNode }) {
	const queryClient = getQueryClient();
	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
