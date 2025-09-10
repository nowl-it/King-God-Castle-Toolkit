import { LazyStore } from '@tauri-apps/plugin-store';
import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';

const store = new LazyStore('history.json');

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

interface AppHistoryState {
	// State
	project: string | null;
	// Actions
	setProject: (project: string | null) => void;
	// Internal helpers
}

export const useAppHistoryStore = create<AppHistoryState>()(
	persist(
		(set, get) => ({
			project: null,
			setProject: (project: string | null) => set({ project }),
		}),
		{
			name: 'app-history-store',
			storage: createJSONStorage(() => storage),
		}
	)
);
