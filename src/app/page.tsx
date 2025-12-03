'use client';

import { redirect } from 'next/navigation';

export default function HomePage() {
	// Redirect to install page by default
	redirect('/install');
}
