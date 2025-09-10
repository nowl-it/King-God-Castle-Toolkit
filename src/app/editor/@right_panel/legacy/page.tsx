import { Suspense } from 'react';

export const experimental_ppr = true;

export default function LegacyRightPanel() {
	return (
		<Suspense fallback={<div>Loading legacy tools...</div>}>
			<div className='flex h-full w-full flex-col p-6'>
				<div className='mb-6'>
					<h2 className='text-2xl font-bold'>Legacy Tools</h2>
					<p className='text-muted-foreground'>Tools for working with legacy game data</p>
				</div>

				<div className='grid flex-1 gap-4'>
					<div className='rounded-lg border p-4'>
						<h3 className='mb-2 font-semibold'>File Converter</h3>
						<p className='text-muted-foreground mb-4 text-sm'>Convert old game files to new format</p>
						<div className='space-y-2'>
							<button className='bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded px-4 py-2'>
								Select Legacy Files
							</button>
							<div className='text-muted-foreground text-xs'>Supported: .dat, .old, .legacy</div>
						</div>
					</div>

					<div className='rounded-lg border p-4'>
						<h3 className='mb-2 font-semibold'>Data Migration</h3>
						<p className='text-muted-foreground mb-4 text-sm'>Migrate save data and configurations</p>
						<div className='space-y-2'>
							<button className='bg-secondary text-secondary-foreground hover:bg-secondary/80 w-full rounded px-4 py-2'>
								Start Migration
							</button>
							<div className='text-muted-foreground text-xs'>Backup will be created automatically</div>
						</div>
					</div>
				</div>
			</div>
		</Suspense>
	);
}
