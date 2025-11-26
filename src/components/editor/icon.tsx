import { EDITOR_TAB_KEYS } from '@/utils/consts';
import { BookText, Folder, Stars, Swords, TestTube } from 'lucide-react';

const Icon = ({ tab }: { tab: string }) => {
	const tabs = Object.values(EDITOR_TAB_KEYS);
	switch (tab) {
		case tabs[0]:
			return <Folder className='size-6' />;
		case tabs[1]:
			return <Swords className='size-6' />;
		case tabs[2]:
			return <Stars className='size-6' />;
		case tabs[3]:
			return <div className='mb-1 size-6 rounded bg-current opacity-20' />;
		case tabs[4]:
			return <BookText className='size-6' />;
		case tabs[5]:
			return <TestTube className='size-6' />;
		default:
			return <div className='mb-1 size-6 rounded bg-current opacity-20' />;
	}
};

export default Icon;
