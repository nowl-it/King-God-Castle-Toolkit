'use client';

import { cn } from '@/lib/utils';
import { EDITOR_TAB_KEYS } from '@/utils/consts';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from './icon';

export default function Tab() {
	const pathname = usePathname();

	function parseTitle(tab: string) {
		return tab
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}



	return (
		<ul className='h-full w-full overflow-auto border-b'>
			{Object.values(EDITOR_TAB_KEYS).map((tab) => (
				<li key={tab} className='w-full border-b border-transparent'>
					<Link
						href={`/editor/${tab}`}
						className={cn(
							'hover:bg-accent relative flex h-12 w-full flex-col items-center justify-center px-1 py-2 text-xs transition-all duration-300',
							pathname.includes(tab)
								? 'bg-accent text-accent-foreground border-l-primary border-l-2'
								: 'text-muted-foreground hover:text-foreground'
						)}
						title={parseTitle(tab)}>
						<Icon tab={tab} />
					</Link>
				</li>
			))}
		</ul>
	);
}
