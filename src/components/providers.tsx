'use client';

import { isServer, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { I18nProvider } from './providers/i18n-provider';
import TitleAppProvider from './titleAppProvider';

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

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
	if (isServer) {
		// Server: always make a new query client
		return makeQueryClient();
	} else {
		if (!browserQueryClient) browserQueryClient = makeQueryClient();
		return browserQueryClient;
	}
}

export default function Providers({ children }: { children: ReactNode }) {
	const queryClient = getQueryClient();
	return (
		<QueryClientProvider client={queryClient}>
			<I18nProvider>
				<TitleAppProvider>{children}</TitleAppProvider>
			</I18nProvider>
		</QueryClientProvider>
	);
}
