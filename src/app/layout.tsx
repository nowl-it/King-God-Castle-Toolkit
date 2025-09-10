import MenubarComponent from '@/components/menubar';
import Providers from '@/components/providers';
import { Toaster } from '@/components/ui/sonner';
import '@/styles/globals.css';
import { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: {
		template: '%s | King God Castle Toolkit',
		default: 'King God Castle Toolkit',
	},
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en' className='dark'>
			<body className={`${geistSans.variable} ${geistMono.variable} relative w-full antialiased`}>
				<Providers>
					<MenubarComponent />
					<main className='grid min-h-dvh grid-cols-1 grid-rows-1 pt-9'>{children}</main>
					<Toaster />
				</Providers>
			</body>
		</html>
	);
}
