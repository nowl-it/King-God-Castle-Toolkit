import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Convert to Unity',
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <>{children}</>;
}
