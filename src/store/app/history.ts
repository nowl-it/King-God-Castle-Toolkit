import { load } from '@tauri-apps/plugin-store';
import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';

interface AppHistoryState {
	// State
	project: string | null;
	// Actions
	setProject: (project: string | null) => void;
	// Internal helpers
}

// Create Tauri-compatible storage that handles async operations
const storage: StateStorage = {
	getItem: async (name: string): Promise<string | null> => {
		try {
			if (typeof window === 'undefined') return null; // Ensure this runs only in Tauri environment
			const store = await load('history.json');
			const data = await store.get<string>(name);
			return data || null;
		} catch (error) {
			console.error(`Error getting item ${name} from history.json:`, error);
			return null;
		}
	},
	setItem: async (name: string, value: string): Promise<void> => {
		try {
			const store = await load('history.json');
			await store.set(name, value);
			await store.save();
		} catch (error) {
			console.error(`Error setting item ${name} in history.json:`, error);
		}
	},
	removeItem: async (name: string): Promise<void> => {
		try {
			const store = await load('history.json');
			await store.delete(name);
			await store.save();
		} catch (error) {
			console.error(`Error removing item ${name} from history.json:`, error);
		}
	},
};

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
