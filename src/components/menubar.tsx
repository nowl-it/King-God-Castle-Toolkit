'use client';

import {
	Menubar,
	MenubarContent,
	MenubarItem,
	MenubarMenu,
	MenubarShortcut,
	MenubarTrigger,
} from '@/components/ui/menubar';
import { useProjectStore } from '@/store/project/store';
import { open } from '@tauri-apps/plugin-dialog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

function MenubarComponent() {
	const setPath = useProjectStore((store) => store.setPath);
	const router = useRouter();
	const { t } = useTranslation();

	async function openProject() {
		const projectPath = await open({
			title: 'Open Project',
			directory: true,
			multiple: false,
		});

		if (projectPath && typeof projectPath === 'string') {
			setPath(projectPath);
			router.push('/editor');
		}
	}

	return (
		<Menubar className='fixed top-0 z-40 w-full rounded-none'>
			<MenubarMenu>
				<MenubarTrigger>{t('menubar.file')}</MenubarTrigger>
				<MenubarContent>
					<MenubarItem onClick={openProject}>
						{t('menubar.openProject')} <MenubarShortcut>⌘O</MenubarShortcut>
					</MenubarItem>
				</MenubarContent>
			</MenubarMenu>

			<MenubarMenu>
				<MenubarTrigger>{t('menubar.tool')}</MenubarTrigger>
				<MenubarContent>
					<MenubarItem asChild>
						<Link href='/tool'>{t('menubar.installGame')}</Link>
					</MenubarItem>
					<MenubarItem asChild>
						<Link href='/tool'>{t('menubar.convertToUnity')}</Link>
					</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
			<MenubarMenu>
				<MenubarTrigger>{t('menubar.help')}</MenubarTrigger>
				<MenubarContent>
					<MenubarItem asChild>
						<Link href='/about'>{t('menubar.about')}</Link>
					</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
		</Menubar>
	);
}

export default MenubarComponent;
