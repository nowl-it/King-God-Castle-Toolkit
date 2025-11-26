'use client';

import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { useEffect, useState } from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';

let isInitialized = false;

export function I18nProvider({ children }: { children: React.ReactNode }) {
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		async function initI18n() {
			if (!isInitialized) {
				try {
					// Fetch translation files from public folder
					const [enResponse, viResponse] = await Promise.all([
						fetch('/locales/en.json'),
						fetch('/locales/vi.json'),
					]);

					const [enTranslations, viTranslations] = await Promise.all([enResponse.json(), viResponse.json()]);

					const resources = {
						en: {
							translation: enTranslations,
						},
						vi: {
							translation: viTranslations,
						},
					};

					await i18n
						.use(LanguageDetector)
						.use(initReactI18next)
						.init({
							resources,
							fallbackLng: 'vi', // Default to Vietnamese
							debug: process.env.NODE_ENV === 'development',

							// Language detection configuration
							detection: {
								order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
								caches: ['localStorage'],
							},

							interpolation: {
								escapeValue: false, // React already escapes values
							},

							// Namespace configuration
							defaultNS: 'translation',
							ns: ['translation'],
						});

					isInitialized = true;
					setIsReady(true);
				} catch (error) {
					console.error('Failed to initialize i18n:', error);
					setIsReady(true); // Show content even if i18n fails
				}
			} else {
				setIsReady(true);
			}
		}

		initI18n();
	}, []);

	if (!isReady) {
		// Show loading state while i18n is initializing
		return <div>{children}</div>;
	}

	return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
