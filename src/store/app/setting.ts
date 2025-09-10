import { LazyStore } from '@tauri-apps/plugin-store';
import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';

const store = new LazyStore('setting.json');

const storage: StateStorage = {
	getItem: async (name: string) => {
		const data = await store.get(name);
		return data ? JSON.stringify(data) : null;
	},
	setItem: async (name: string, value: string) => {
		await store.set(name, JSON.parse(value));
		await store.save();
	},
	removeItem: async (name: string) => {
		await store.delete(name);
		await store.save();
	},
};

interface AppSettingState {
	// State
	// Actions
	// Internal helpers
}

export const useAppSettingStore = create<AppSettingState>()(
	persist((set, get) => ({}), {
		name: 'app-setting-store',
		storage: createJSONStorage(() => storage),
	})
);
