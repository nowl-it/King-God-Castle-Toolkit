import { Button } from '@/components/ui/button';
import { CogIcon } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
	return (
		<div className='flex flex-col items-center justify-center px-6'>
			<div className='max-w-md text-center'>
				<div className='relative mx-auto mb-8 w-fit'>
					<CogIcon className='size-30 animate-[spin_5s_linear_infinite] text-gray-600' />
					<CogIcon className='absolute -top-5 left-10 -z-10 mx-auto size-24 animate-[spin_10s_linear_infinite] text-gray-800' />
					<CogIcon className='absolute -top-5 -left-2 -z-20 mx-auto size-20 animate-[spin_15s_linear_infinite] text-gray-900' />
				</div>

				<h1 className='text-primary mb-4 text-8xl font-extrabold'>404</h1>
				<h2 className='mb-2 text-2xl font-semibold'>Trang không tìm thấy</h2>
				<p className='text-primary/80 mb-6'>
					Rất tiếc, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
				</p>
				<Button variant='outline' size='lg'>
					<Link href='/'>Quay về trang chủ</Link>
				</Button>
			</div>
		</div>
	);
}
