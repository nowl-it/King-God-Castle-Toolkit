'use client';

import { cn } from '@/lib/utils';
import { EDITOR_TABS } from '@/utils/consts';
import { Folder, Stars, Swords } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function EditorTab() {
	const pathname = usePathname();

	return (
		<ul className='flex h-full w-full flex-col items-center justify-start'>
			{EDITOR_TABS.map(tab => (
				<li key={tab} className='w-full border-b border-transparent'>
					<Link
						href={`/editor/${tab}`}
						className={cn(
							'hover:bg-accent relative flex h-12 w-full flex-col items-center justify-center px-1 py-2 text-xs transition-all duration-300',
							pathname === `/editor/${tab}`
								? 'bg-accent text-accent-foreground border-l-primary border-l-2'
								: 'text-muted-foreground hover:text-foreground'
						)}
						title={tab.charAt(0).toUpperCase() + tab.slice(1)}
					>
						<Icon tab={tab} />
					</Link>
				</li>
			))}
		</ul>
	);
}

const Icon = ({ tab }: { tab: string }) => {
	switch (tab) {
		case EDITOR_TABS[0]:
			return <Folder className='size-6' />;
		case EDITOR_TABS[1]:
			return <Swords className='size-6' />;
		case EDITOR_TABS[2]:
			return <Stars className='size-6' />;
		default:
			return <div className='mb-1 size-6 rounded bg-current opacity-20' />;
	}
};
