import MenubarComponent from '@/components/menubar';
import Providers from '@/components/providers';
import { Toaster } from '@/components/ui/sonner';
import '@/styles/globals.css';
import { Geist, Geist_Mono } from 'next/font/google';

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
		<html lang='vi' className='dark'>
			<body className={`${geistSans.variable} ${geistMono.variable} relative w-full antialiased`}>
				<Providers>
					<main className='grid min-h-dvh grid-cols-1 grid-rows-1 pt-9'>{children}</main>
					<Toaster />
				</Providers>
			</body>
		</html>
	);
}
