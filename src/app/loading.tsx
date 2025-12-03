import { Spinner } from '@/components/ui/spinner';

export default function Loading() {
	return (
		<div className='animate-in fade-in flex h-full w-full flex-col items-center justify-center gap-4 duration-500'>
			<Spinner size='large' />
			<p className='text-muted-foreground animate-pulse text-sm'>Đang tải...</p>
		</div>
	);
}
