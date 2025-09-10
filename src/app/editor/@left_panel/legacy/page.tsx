export default function LegacyLeftPanel() {
	return (
		<div className='bg-background flex h-full w-full flex-col border-r p-4'>
			<h3 className='mb-4 font-semibold'>Legacy Tools</h3>
			<div className='space-y-2'>
				<div className='hover:bg-muted rounded border p-2 text-sm'>
					<div className='font-medium'>Old Formats</div>
					<div className='text-muted-foreground'>Support legacy files</div>
				</div>
				<div className='hover:bg-muted rounded border p-2 text-sm'>
					<div className='font-medium'>Converters</div>
					<div className='text-muted-foreground'>Convert old to new</div>
				</div>
				<div className='hover:bg-muted rounded border p-2 text-sm'>
					<div className='font-medium'>Migration</div>
					<div className='text-muted-foreground'>Data migration tools</div>
				</div>
			</div>
		</div>
	);
}
