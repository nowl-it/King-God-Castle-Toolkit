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
import { openUrl } from '@tauri-apps/plugin-opener';
import Link from 'next/link';
import { redirect } from 'next/navigation';

function MenubarComponent() {
	const setPath = useProjectStore(store => store.setPath);

	async function openProject() {
		const project_path = await open({
			title: 'Open Project',
			directory: true,
			multiple: false,
		});

		if (project_path && typeof project_path === 'string') {
			setPath(project_path);
			redirect('/editor');
		}
	}

	return (
		<Menubar className='fixed top-0 z-40 w-full rounded-none'>
			<MenubarMenu>
				<MenubarTrigger>File</MenubarTrigger>
				<MenubarContent>
					<MenubarItem onClick={openProject}>
						Open Project... <MenubarShortcut>⌘O</MenubarShortcut>
					</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
			<MenubarMenu>
				<MenubarTrigger>Tool</MenubarTrigger>
				<MenubarContent>
					<MenubarItem asChild>
						<Link href='/tool/install'>Install Game</Link>
					</MenubarItem>
					<MenubarItem asChild>
						<Link href='/tool/c2u'>Convert to Unity</Link>
					</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
			<MenubarMenu>
				<MenubarTrigger>Help</MenubarTrigger>
				<MenubarContent>
					<MenubarItem onClick={() => openUrl('https://github.com/nowl-it/King-God-Castle-Toolkit/wiki')}>
						Documentation
					</MenubarItem>
					<MenubarItem
						onClick={() => openUrl('https://github.com/nowl-it/King-God-Castle-Toolkit/issues/new')}
					>
						Report Issue
					</MenubarItem>
					<MenubarItem asChild>
						<Link href='/about'>About</Link>
					</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
		</Menubar>
	);
}

export default MenubarComponent;
