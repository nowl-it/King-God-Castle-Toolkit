'use client';
import { useAppHistoryStore } from '@/store/app/history';
import { useProjectStore } from '@/store/project/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Component({ env }: { env: NodeJS.ProcessEnv }) {
	const { project } = useAppHistoryStore();
	const { path, setPath } = useProjectStore(store => store);
	const router = useRouter();

	useEffect(() => {
		if (project && !path) {
			setPath(project);
			router.push('/editor');
		}
	}, [project]);

	return (
		<div className='flex h-full flex-col items-center justify-center'>
			<div>
				<h1 className='text-6xl font-bold'>King God Castle Toolkit</h1>
				<p className='text-muted-foreground text-right text-lg'>v{env.npm_package_version}</p>
			</div>
		</div>
	);
}
