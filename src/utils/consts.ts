export const APP_PACKAGE_ID = 'com.awesomepiece.castle';

// Define keys for translated content
export const EDITOR_TAB_KEYS = {
	EXPLORER: 'explorer',
	HEROES: 'heroes',
};

export function getEditorTabs(t: (key: string) => string) {
	return [t(`editor.${EDITOR_TAB_KEYS.EXPLORER}.title`), t(`editor.${EDITOR_TAB_KEYS.HEROES}.title`)];
}
