import { EDITOR_TABS } from '@/utils/consts';
import { redirect } from 'next/navigation';

export default function RightPanelDefault() {
	return redirect(`/editor/${EDITOR_TABS[0]}`);
}
