'use client';

import { Button } from '@/components/ui/button';
import { CogIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
	const router = useRouter();
	const { t } = useTranslation();

	return (
		<div className='animate-in fade-in zoom-in-95 flex h-full flex-col items-center justify-center px-6 duration-500'>
			<div className='max-w-md text-center'>
				<div className='relative mx-auto mb-8 w-fit'>
					<CogIcon className='text-muted-foreground/60 size-30 animate-[spin_5s_linear_infinite]' />
					<CogIcon className='text-muted-foreground/40 absolute -top-5 left-10 -z-10 mx-auto size-24 animate-[spin_10s_linear_infinite]' />
					<CogIcon className='text-muted-foreground/20 absolute -top-5 -left-2 -z-20 mx-auto size-20 animate-[spin_15s_linear_infinite]' />
				</div>

				<h1 className='from-primary to-primary/50 animate-in slide-in-from-bottom-4 mb-4 bg-gradient-to-br bg-clip-text text-8xl font-extrabold text-transparent duration-700'>
					404
				</h1>
				<h2 className='animate-in slide-in-from-bottom-4 mb-2 text-2xl font-semibold delay-100 duration-700'>
					{t('pages.notFound.title')}
				</h2>
				<p className='text-muted-foreground animate-in slide-in-from-bottom-4 mb-6 delay-200 duration-700'>
					{t('pages.notFound.description')}
				</p>
				<Button
					variant='outline'
					size='lg'
					onClick={() => router.back()}
					className='animate-in slide-in-from-bottom-4 font-semibold transition-all delay-300 duration-700 hover:scale-105 active:scale-95'>
					{t('pages.notFound.backHome')}
				</Button>
			</div>
		</div>
	);
}
