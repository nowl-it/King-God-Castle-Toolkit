'use client';

import Setting from './setting';
import Tab from './tab';

export default function EditorTab() {
	return (
		<div className='flex h-full w-full flex-col items-center justify-start'>
			<Tab />
			<Setting />
		</div>
	);
}
