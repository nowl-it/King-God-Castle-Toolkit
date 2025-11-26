import { load } from "@tauri-apps/plugin-store";
import { create } from "zustand";
import {
	createJSONStorage,
	persist,
	type StateStorage,
} from "zustand/middleware";

type AppSettingState = object;

// Create Tauri-compatible storage that handles async operations
const storage: StateStorage = {
	getItem: async (name: string): Promise<string | null> => {
		try {
			const store = await load("setting.json");
			const data = await store.get<string>(name);
			return data || null;
		} catch (error) {
			console.error(`Error getting item ${name} from setting.json:`, error);
			return null;
		}
	},
	setItem: async (name: string, value: string): Promise<void> => {
		try {
			const store = await load("setting.json");
			await store.set(name, value);
			await store.save();
		} catch (error) {
			console.error(`Error setting item ${name} in setting.json:`, error);
		}
	},
	removeItem: async (name: string): Promise<void> => {
		try {
			const store = await load("setting.json");
			await store.delete(name);
			await store.save();
		} catch (error) {
			console.error(`Error removing item ${name} from setting.json:`, error);
		}
	},
};

export const useAppSettingStore = create<AppSettingState>()(
	persist(() => ({}), {
		name: "app-setting-store",
		storage: createJSONStorage(() => storage),
	}),
);
