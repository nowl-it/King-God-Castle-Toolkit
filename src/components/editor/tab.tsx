'use client';

import { cn } from '@/lib/utils';
import { EDITOR_TABS } from '@/utils/consts';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function EditorTab() {
	const pathname = usePathname();

	return (
		<ul className='flex h-full w-full flex-row items-center justify-start border-b'>
			{EDITOR_TABS.map(tab => (
				<li key={tab} className='h-full border-r'>
					<Link
						href={`/editor/${tab}`}
						className={cn(
							'hover:bg-accent inline-flex h-full flex-none items-center px-4 transition-all duration-300',
							pathname === `/editor/${tab}` ? 'bg-accent' : ''
						)}
					>
						{tab.charAt(0).toUpperCase() + tab.slice(1)}
					</Link>
				</li>
			))}
		</ul>
	);
}
