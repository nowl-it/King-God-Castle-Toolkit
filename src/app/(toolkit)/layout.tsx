'use client';

import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { Check, Download, Languages, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ToolkitLayout({ children }: { children: React.ReactNode }) {
	const { t, language, changeLanguage } = useTranslation();
	const pathname = usePathname();

	return (
		<div className='bg-background text-foreground flex h-screen overflow-hidden'>
			{/* Sidebar Navigation */}
			<aside className='bg-card flex w-72 flex-col border-r'>
				<div className='border-b p-6'>
					<div className='mb-1 flex items-center gap-3'>
						<div className='bg-primary text-primary-foreground flex size-14 items-center justify-center overflow-hidden rounded-lg shadow-sm'>
							<Image
								className='size-full'
								src='/favicon.ico'
								alt={t('pages.toolkit.sidebar.appTitle')}
								width={56}
								height={56}
							/>
						</div>
						<div>
							<span className='text-lg font-bold tracking-tight'>
								{t('pages.toolkit.sidebar.appTitle')}
							</span>
							<p className='text-muted-foreground text-xs font-medium'>
								{t('pages.toolkit.sidebar.appSubtitle')}
							</p>
						</div>
					</div>
				</div>

				<ScrollArea className='flex-1 px-4 py-6'>
					<nav className='space-y-2'>
						<Link
							href='/install'
							className={cn(
								'flex h-14 w-full items-center gap-4 rounded-lg px-4 transition-colors',
								pathname.includes('/install')
									? 'bg-secondary text-secondary-foreground'
									: 'hover:bg-accent hover:text-accent-foreground'
							)}>
							<div
								className={cn(
									'flex size-8 items-center justify-center rounded-md transition-colors',
									pathname.includes('/install') ? 'bg-background shadow-sm' : 'bg-muted/50'
								)}>
								<Download className='size-4' />
							</div>
							<div className='flex flex-col items-start text-sm'>
								<span className='font-semibold'>{t('pages.toolkit.sidebar.install')}</span>
								<span className='text-muted-foreground text-xs font-normal'>
									{t('pages.toolkit.sidebar.installDesc')}
								</span>
							</div>
						</Link>

						<Link
							href='/convert'
							className={cn(
								'flex h-14 w-full items-center gap-4 rounded-lg px-4 transition-colors',
								pathname.includes('/convert')
									? 'bg-secondary text-secondary-foreground'
									: 'hover:bg-accent hover:text-accent-foreground'
							)}>
							<div
								className={cn(
									'flex size-8 items-center justify-center rounded-md transition-colors',
									pathname.includes('/install') ? 'bg-background shadow-sm' : 'bg-muted/50'
								)}>
								<RefreshCw className='size-4' />
							</div>
							<div className='flex flex-col items-start text-sm'>
								<span className='font-semibold'>{t('pages.toolkit.sidebar.convert')}</span>
								<span className='text-muted-foreground text-xs font-normal'>
									{t('pages.toolkit.sidebar.convertDesc')}
								</span>
							</div>
						</Link>
					</nav>
				</ScrollArea>

				<div className='bg-muted/10 space-y-3 border-t p-4'>
					{/* Language Switcher */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant='outline' className='w-full justify-start gap-2' size='sm'>
								<Languages className='size-4' />
								<span className='flex-1 text-left'>{language === 'vi' ? 'Tiếng Việt' : 'English'}</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end' className='w-[240px]'>
							<DropdownMenuItem
								onClick={() => changeLanguage('vi')}
								className='flex items-center justify-between'>
								<span>Tiếng Việt</span>
								{language === 'vi' && <Check className='size-4' />}
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => changeLanguage('en')}
								className='flex items-center justify-between'>
								<span>English</span>
								{language === 'en' && <Check className='size-4' />}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					<Separator />

					{/* System Status */}
					<div className='bg-background flex items-center gap-3 rounded-lg border p-3 shadow-sm'>
						<div className='relative'>
							<div className='size-2.5 rounded-full bg-emerald-500' />
							<div className='absolute -inset-0.5 animate-pulse rounded-full bg-emerald-500 opacity-30' />
						</div>
						<div className='flex flex-col'>
							<span className='text-xs font-medium'>{t('pages.toolkit.sidebar.systemReady')}</span>
							<span className='text-muted-foreground text-[10px]'>v{process.env.APP_VERSION}</span>
						</div>
					</div>
				</div>
			</aside>

			{/* Main Content Area */}
			<main className='bg-muted/5 flex-1 overflow-y-auto'>
				<div className='mx-auto max-w-5xl p-8'>{children}</div>
			</main>
		</div>
	);
}
