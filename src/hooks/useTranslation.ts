import { useTranslation as useReactI18nextTranslation } from 'react-i18next';

/**
 * Custom hook for translations that provides better TypeScript support
 * and a simplified interface for the King God Castle Toolkit
 */
export function useTranslation() {
	const { t, i18n } = useReactI18nextTranslation();

	return {
		t,
		language: i18n.language,
		changeLanguage: (lng: string) => i18n.changeLanguage(lng),
		ready: i18n.isInitialized,
	};
}

/**
 * Helper function to get translation key with fallback
 */
export function translate(key: string, fallback?: string): string {
	const { t } = useReactI18nextTranslation();
	const translated = t(key);

	// If translation equals the key (meaning not found), return fallback
	if (translated === key && fallback) {
		return fallback;
	}

	return translated;
}
