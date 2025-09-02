import { open, OpenDialogOptions } from '@tauri-apps/plugin-dialog';

export async function selectSavePath(config?: OpenDialogOptions): Promise<string | null> {
	const selected = await open({
		directory: true,
		multiple: false,
		save: true,
		title: 'Chọn nơi lưu file',
		...config,
	});
	if (typeof selected === 'string') return selected;
	return null;
}
