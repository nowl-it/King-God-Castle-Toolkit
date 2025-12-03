import Providers from '@/components/providers';
import { Toaster } from '@/components/ui/sonner';
import '@/styles/globals.css';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

export const metadata: Metadata = {
	title: 'King God Castle Toolkit',
	description: 'Bộ công cụ hỗ trợ quản lý assets và chuyển đổi game King God Castle',
	applicationName: 'KGC Toolkit',
	keywords: ['King God Castle', 'Unity', 'Game Assets', 'Toolkit'],
	authors: [{ name: 'nowl' }],
	creator: 'nowl',
	other: {
		'tauri-app': 'true',
	},
};

export const viewport: Viewport = {
	themeColor: [{ media: '(prefers-color-scheme: dark)', color: '#0a0a0a' }],
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
};

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='vi' className='dark' suppressHydrationWarning>
			<body className={`${geistSans.variable} ${geistMono.variable} relative w-full overflow-hidden antialiased`}>
				<Providers>
					<div className='flex min-h-dvh flex-col'>
						<main className='flex-1 overflow-auto'>{children}</main>
					</div>
					<Toaster position='bottom-right' richColors expand={false} closeButton duration={4000} />
				</Providers>
			</body>
		</html>
	);
}
