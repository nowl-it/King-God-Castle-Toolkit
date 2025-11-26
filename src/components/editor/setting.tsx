import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CogIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const locales = [
	{ code: 'vi', name: 'Tiếng Việt', flag: <span className='text-lg'>🇻🇳</span> },
	{ code: 'en', name: 'English', flag: <span className='text-lg'>🇺🇸</span> },
];

export default function Setting() {
	return (
		<div className='text-muted-foreground mt-auto p-2 text-center text-xs'>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant='ghost' className='size-8 rounded-full p-0'>
						<CogIcon className='size-6' />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className='w-56' align='start'>
					<DropdownMenuLabel>Account (Coming soon...)</DropdownMenuLabel>
					<DropdownMenuGroup>
						<DropdownMenuItem disabled>
							Profile
							<DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
						</DropdownMenuItem>
						<DropdownMenuItem disabled>
							Settings
							<DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
						</DropdownMenuItem>
						<DropdownMenuItem disabled>
							Keyboard shortcuts
							<DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
						</DropdownMenuItem>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						<DropdownMenuSub>
							<DropdownMenuSubTrigger>Language</DropdownMenuSubTrigger>
							<DropdownMenuPortal>
								<LanguageSwitcher />
							</DropdownMenuPortal>
						</DropdownMenuSub>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuItem disabled>
						Log out
						<DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

export function LanguageSwitcher() {
	const { i18n } = useTranslation();

	const handleLanguageChange = (newLocale: string) => {
		i18n.changeLanguage(newLocale);
	};

	return (
		<DropdownMenuSubContent asChild>
			<DropdownMenuRadioGroup value={i18n.language} onValueChange={handleLanguageChange}>
				{locales.map((locale) => (
					<DropdownMenuRadioItem key={locale.code} value={locale.code}>
						<span className='flex items-center gap-2'>
							{locale.flag} {locale.name}
						</span>
					</DropdownMenuRadioItem>
				))}
			</DropdownMenuRadioGroup>
		</DropdownMenuSubContent>
	);
}
