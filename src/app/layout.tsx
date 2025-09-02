import { Geist, Geist_Mono } from 'next/font/google';
import '@/styles/globals.css';
import Providers from '@/components/providers';
import MenubarComponent from '@/components/menubar';
import { Toaster } from '@/components/ui/sonner';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en' className='dark'>
			<body
				className={`${geistSans.variable} ${geistMono.variable} relative h-dvh w-full overflow-hidden antialiased`}
			>
				<MenubarComponent />
				<main className='h-full overflow-auto'>
					<Providers>{children}</Providers>
				</main>
				<Toaster />
			</body>
		</html>
	);
}
