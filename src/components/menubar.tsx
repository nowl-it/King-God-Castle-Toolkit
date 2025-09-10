'use client';

import {
	Menubar,
	MenubarCheckboxItem,
	MenubarContent,
	MenubarItem,
	MenubarMenu,
	MenubarSeparator,
	MenubarShortcut,
	MenubarSub,
	MenubarSubContent,
	MenubarSubTrigger,
	MenubarTrigger,
} from '@/components/ui/menubar';
import { useProjectStore } from '@/store/project/store';
import { open } from '@tauri-apps/plugin-dialog';
import Link from 'next/link';
import { redirect, useRouter } from 'next/navigation';

function MenubarComponent() {
	const setPath = useProjectStore(store => store.setPath);
	const router = useRouter();

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
				<MenubarTrigger>Edit</MenubarTrigger>
				<MenubarContent>
					<MenubarItem>
						Undo <MenubarShortcut>⌘Z</MenubarShortcut>
					</MenubarItem>
					<MenubarItem>
						Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
					</MenubarItem>
					<MenubarSeparator />
					<MenubarSub>
						<MenubarSubTrigger>Find</MenubarSubTrigger>
						<MenubarSubContent>
							<MenubarItem>Search the web</MenubarItem>
							<MenubarSeparator />
							<MenubarItem>Find...</MenubarItem>
							<MenubarItem>Find Next</MenubarItem>
							<MenubarItem>Find Previous</MenubarItem>
						</MenubarSubContent>
					</MenubarSub>
					<MenubarSeparator />
					<MenubarItem>Cut</MenubarItem>
					<MenubarItem>Copy</MenubarItem>
					<MenubarItem>Paste</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
			<MenubarMenu>
				<MenubarTrigger>View</MenubarTrigger>
				<MenubarContent>
					<MenubarCheckboxItem>Always Show Bookmarks Bar</MenubarCheckboxItem>
					<MenubarCheckboxItem checked>Always Show Full URLs</MenubarCheckboxItem>
					<MenubarSeparator />
					<MenubarItem inset>
						Reload <MenubarShortcut>⌘R</MenubarShortcut>
					</MenubarItem>
					<MenubarItem disabled inset>
						Force Reload <MenubarShortcut>⇧⌘R</MenubarShortcut>
					</MenubarItem>
					<MenubarSeparator />
					<MenubarItem inset>Toggle Fullscreen</MenubarItem>
					<MenubarSeparator />
					<MenubarItem inset>Hide Sidebar</MenubarItem>
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
					<MenubarItem>Documentation</MenubarItem>
					<MenubarItem>Report Issue</MenubarItem>
					<MenubarItem asChild>
						<Link href='/about'>About</Link>
					</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
		</Menubar>
	);
}

export default MenubarComponent;
