import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useAppHistoryStore } from '../app/history';

export interface Hero {
	id: string;
	name: string;
	folderName: string;
	folderPath: string;
	avatar?: string; // Base64 encoded cropped image
	avatarPath?: string; // Path to the original Unit_<id>.png file
	assetPath?: string; // Path to the Unit_<id>_0.asset file
	avatarType?: 'cropped' | 'full'; // Type of avatar: cropped from asset or full image
	lastModified?: number; // Timestamp for cache invalidation
	skins?: HeroSkin[]; // Available skins for this hero
	selectedSkin?: string; // Currently selected skin ID (undefined = default)
	selectedColor?: string; // Currently selected color ID for multi-color skins
}

export interface HeroSkin {
	id: string; // Skin ID (e.g., "01", "99")
	name?: string; // Display name for the skin
	isDefault?: boolean; // Whether this is the default skin (id = "99")
	colors?: string[]; // Available color IDs for multi-color skins
	selectedColor?: string; // Currently selected color for this skin
}

export interface HeroesCache {
	[heroId: string]: {
		hero: Hero;
		timestamp: number;
		avatarProcessed: boolean;
	};
}

export type ProjectState = {
	path: string;
	selectedHero: Hero | null;
	heroesCache: HeroesCache;
	heroesLoading: boolean;
};

export type ProjectActions = {
	setPath: (path: string) => void;
	setSelectedHero: (hero: Hero | null) => void;
	setHeroesLoading: (loading: boolean) => void;
	cacheHero: (heroId: string, hero: Hero, avatarProcessed?: boolean) => void;
	getCachedHero: (heroId: string) => Hero | null;
	isCacheValid: (heroId: string, maxAge?: number) => boolean;
	clearHeroesCache: () => void;
};

export type ProjectStore = ProjectState & ProjectActions;

export const initProjectStore = (): ProjectState => {
	return { path: '', selectedHero: null, heroesCache: {}, heroesLoading: false };
};

export const defaultInitState: ProjectState = {
	path: '',
	selectedHero: null,
	heroesCache: {},
	heroesLoading: false,
};

export const useProjectStore = create<ProjectStore>()(
	persist(
		(set, get) => ({
			...defaultInitState,
			setPath: (path: string) => {
				set({ path });
				// Đồng bộ với app history store sau khi update
				setTimeout(() => {
					const setProject = useAppHistoryStore.getState().setProject;
					setProject(path);
				}, 0);
			},
			setSelectedHero: (hero: Hero | null) => set({ selectedHero: hero }),
			setHeroesLoading: (loading: boolean) => set({ heroesLoading: loading }),
			cacheHero: (heroId: string, hero: Hero, avatarProcessed = false) => {
				set(state => ({
					heroesCache: {
						...state.heroesCache,
						[heroId]: {
							hero,
							timestamp: Date.now(),
							avatarProcessed,
						},
					},
				}));
			},
			getCachedHero: (heroId: string) => {
				const cached = get().heroesCache[heroId];
				return cached ? cached.hero : null;
			},
			isCacheValid: (heroId: string, maxAge = 30 * 60 * 1000) => {
				// 30 minutes default
				const cached = get().heroesCache[heroId];
				if (!cached) return false;
				return Date.now() - cached.timestamp < maxAge;
			},
			clearHeroesCache: () => set({ heroesCache: {} }),
		}),
		{
			name: 'project-storage',
			storage: createJSONStorage(() => sessionStorage),
		}
	)
);
