'use client';

import type { Hero, HeroSkin } from '@/store/project/store';
import { useProjectStore } from '@/store/project/store';
import { log } from '@/utils/logger';
import { invoke } from '@tauri-apps/api/core';
import { useCallback, useEffect, useState } from 'react';

export interface HeroesState {
	heroes: Hero[];
	loading: boolean;
	error: string | null;
}

export interface AssetCropInfo {
	x: number;
	y: number;
	width: number;
	height: number;
}

export function useHeroes() {
	const {
		path: projectPath,
		selectedHero,
		setSelectedHero,
		heroesLoading,
		setHeroesLoading,
		cacheHero,
		getCachedHero,
		isCacheValid,
		clearHeroesCache,
	} = useProjectStore();
	const [state, setState] = useState<HeroesState>({
		heroes: [],
		loading: false,
		error: null,
	});

	// Parse hero folder name to extract ID and name
	const parseHeroFolder = useCallback((folderName: string): { id: string; name: string } | null => {
		// Pattern: Fx_<hero_id> (<hero_name>)
		// Example: Fx_001 (Knight), Fx_002 (Archer)
		const match = folderName.match(/^Fx_(\d+)\s*\(([^)]+)\)$/);
		if (match) {
			return {
				id: match[1],
				name: match[2].trim(),
			};
		}
		return null;
	}, []);

	// Convert hero_id to new format for avatar path
	// Logic: remove first and last digit, keep middle digits
	const getAvatarHeroId = useCallback((heroId: string): string => {
		if (heroId.length <= 2) {
			// If ID is too short, return as is
			return heroId;
		}
		// Remove first and last character, keep middle part
		return heroId.slice(1, -1);
	}, []);

	// Discover available skins for a hero (including multi-color support)
	const discoverHeroSkins = async (hero: Hero, projectPath: string): Promise<HeroSkin[]> => {
		try {
			// Look for skins in the Unit Image directory first
			const unitImageDir = `${projectPath}/Assets/00_Unit/#Image`;

			// Check if the directory exists
			const exists = await invoke<boolean>('check_path_exists', {
				path: unitImageDir,
			});
			if (!exists) {
				log.hero.asset(hero.id, `Unit Image directory not found: ${unitImageDir}`);
				return [];
			}

			const files = await invoke<string[]>('read_directory', {
				path: unitImageDir,
			});
			const skinMap: {
				[skinId: string]: { colors: Set<string>; isDefault: boolean };
			} = {};

			/**
			 * Look for skin files in Unit Image directory
			 * Patterns:
			 * - Unit_${heroId}_${skinId}.png (single color skin)
			 * - Unit_${heroId}_${skinId}_${colorId}.png (multi-color skin)
			 * - Unit_${heroId}_99_${colorId}.png (multi-color default skin)
			 */
			const singleColorPattern = new RegExp(`^Unit_${hero.id}_(\\d+[a-z]?)\\.png$`);
			const multiColorPattern = new RegExp(`^Unit_${hero.id}_(\\d+)_(\\d+)\\.png$`);

			for (const file of files) {
				if (!file.endsWith('.png')) {
					continue;
				}

				// Check for multi-color skin first
				const multiColorMatch = file.match(multiColorPattern);

				if (multiColorMatch) {
					const skinId = multiColorMatch[1];
					const colorId = multiColorMatch[2];

					if (!skinMap[skinId]) {
						skinMap[skinId] = {
							colors: new Set(),
							isDefault: skinId === '99',
						};
					}
					skinMap[skinId].colors.add(colorId);
					continue;
				}

				// Check for single color skin
				const singleColorMatch = file.match(singleColorPattern);
				if (singleColorMatch) {
					const skinId = singleColorMatch[1];

					if (!skinMap[skinId]) {
						skinMap[skinId] = {
							colors: new Set(),
							isDefault: skinId === '99',
						};
					}
					// Single color skins don't add to colors set
				}
			}

			// Find god skins by skinId pattern (e.g. 001a, 002b, etc.), normalize by removing trailing letter, and deduplicate
			const godSkins = Array.from(
				new Set(
					Object.keys(skinMap)
						.filter((skinId) => /[a-z]$/i.test(skinId))
						.map((skinId) => skinId.replace(/[a-z]$/i, ''))
				)
			);

			// Group duplicate skins (e.g. 001a and 001b) to one
			const groupedSkinMap: {
				[skinId: string]: {
					colors: Set<string>;
					isDefault: boolean;
					isGodSkin: boolean;
				};
			} = {};
			for (const [skinId, data] of Object.entries(skinMap)) {
				// Normalize skin ID by removing trailing letters (e.g. 001a -> 001)
				const normalizedSkinId = skinId.replace(/[a-z]$/i, '');

				if (!groupedSkinMap[normalizedSkinId]) {
					groupedSkinMap[normalizedSkinId] = {
						colors: new Set(),
						isDefault: data.isDefault,
						isGodSkin: false,
					};
				}

				// Merge colors
				data.colors.forEach((color) => {
					groupedSkinMap[normalizedSkinId].colors.add(color);
				});

				if (godSkins.includes(normalizedSkinId)) {
					groupedSkinMap[normalizedSkinId].isGodSkin = true;
				}
			}

			// Convert map to HeroSkin array
			const skins: HeroSkin[] = Object.entries(groupedSkinMap).map(([skinId, data]) => {
				const colors = Array.from(data.colors).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

				return {
					id: skinId,
					name: data.isDefault ? 'Default' : `Skin ${skinId}`,
					isDefault: data.isDefault,
					isGodSkin: data.isGodSkin,
					colors: colors.length > 0 ? colors : undefined,
					selectedColor: colors.length > 0 ? colors[0] : undefined, // Default to first color
				};
			});

			// Sort skins: default (99) first, then numerically
			skins.sort((a, b) => {
				if (a.isDefault && !b.isDefault) return -1;
				if (!a.isDefault && b.isDefault) return 1;
				return parseInt(a.id, 10) - parseInt(b.id, 10);
			});

			log.hero.asset(hero.id, `Found ${skins.length} skins`, {
				skins: skins.map((s) => ({
					id: s.id,
					isDefault: s.isDefault,
					hasColors: !!s.colors,
					colorCount: s.colors?.length || 0,
					isGodSkin: s.isGodSkin,
				})),
				directory: unitImageDir,
			});

			return skins;
		} catch (error) {
			log.hero.error(hero.id, 'Failed to discover skins', error);
			return [];
		}
	};

	// Load hero avatar image with optional skin and color support
	const loadHeroAvatar = async (
		hero: Hero,
		projectPath: string,
		skinId?: string,
		colorId?: string
	): Promise<void> => {
		try {
			// Build asset path based on whether it's a skin or default
			let assetFileName: string;
			let useDefaultAvatar = false;
			let unitImageFileName: string;

			// Use new avatar path logic
			const avatarHeroId = getAvatarHeroId(hero.id);

			if (skinId) {
				// For skin avatar, try skin-specific avatar first
				assetFileName = `Avatar_${avatarHeroId}_${skinId}.asset`;

				// For unit image, check if it has color variants
				if (colorId) {
					// Try multi-color skin first: Unit_${heroId}_${skinId}_${colorId}.png
					unitImageFileName = `Unit_${hero.id}_${skinId}_${colorId}.png`;
				} else {
					// Try single color skin: Unit_${heroId}_${skinId}.png
					unitImageFileName = `Unit_${hero.id}_${skinId}.png`;
				}

				const skinAssetPath = `${projectPath}/Assets/02_UI/UI_Avatar/${assetFileName}`;

				// Check if skin avatar exists
				const skinAssetExists = await invoke<boolean>('check_path_exists', {
					path: skinAssetPath,
				});
				if (!skinAssetExists) {
					log.hero.skin(hero.id, skinId, 'Skin avatar not found, using default avatar');
					useDefaultAvatar = true;
					assetFileName = `Avatar_${avatarHeroId}.asset`;
				}
			} else {
				// Default avatar
				assetFileName = `Avatar_${avatarHeroId}.asset`;

				// For default with color (skin 99 with color)
				if (colorId) {
					unitImageFileName = `Unit_${hero.id}_99_${colorId}.png`;
				} else {
					unitImageFileName = `Unit_${hero.id}.png`;
				}
			}

			const assetPath = `${projectPath}/Assets/02_UI/UI_Avatar/${assetFileName}`;

			log.hero.asset(hero.id, 'Looking for avatar asset', {
				assetPath,
				originalId: hero.id,
				avatarId: avatarHeroId,
				skinId: skinId || 'default',
				fallbackToDefault: useDefaultAvatar,
			});

			// Check if asset file exists
			const assetExists = await invoke<boolean>('check_path_exists', {
				path: assetPath,
			});
			if (!assetExists) {
				log.hero.asset(hero.id, `Avatar asset file not found: ${assetPath}`);
				// If even default asset not found and it's a skin request, skip
				if (skinId && !useDefaultAvatar) {
					log.hero.skin(hero.id, skinId, 'Skin not found, falling back to default');
					return loadHeroAvatar(hero, projectPath); // Recursive call without skinId
				}
				return;
			}

			// Read the asset file to get the image information
			const assetContent = await invoke<string>('read_text_file', {
				path: assetPath,
			});

			// For .asset files in UI_Avatar, we might need to parse differently
			// Let's try to parse it and see what information we can extract
			try {
				const cropInfo = await invoke<AssetCropInfo>('parse_asset_file', {
					assetContent,
				});

				// Find the combined avatar texture file by pattern
				const textureDir = `${projectPath}/Assets/Texture2D`;
				const textureFiles = await invoke<string[]>('read_directory', {
					path: textureDir,
				});

				// Look for file matching pattern: sactx-0-2048x1024-Uncompressed-UI_Avatar-<random_id>.png
				const avatarTextureFile = textureFiles.find((file) =>
					file.match(/^sactx-0-2048x1024-Uncompressed-UI_Avatar-[a-f0-9]+\.png$/)
				);

				if (!avatarTextureFile) {
					log.hero.error(hero.id, `Combined avatar texture not found in: ${textureDir}`);
					log.hero.error(hero.id, `Available files:`, textureFiles);
					return;
				}

				const combinedTexturePath = `${textureDir}/${avatarTextureFile}`;
				log.hero.asset(hero.id, `Using combined texture: ${combinedTexturePath}`);

				// Check if the combined texture file exists (should exist since we found it)
				const textureExists = await invoke<boolean>('check_path_exists', {
					path: combinedTexturePath,
				});
				if (!textureExists) {
					log.hero.error(hero.id, `Combined avatar texture not found: ${combinedTexturePath}`);
					return;
				}

				// Read the combined texture file
				const imageBytes = await invoke<number[]>('read_file_as_bytes', {
					path: combinedTexturePath,
				});

				log.hero.asset(hero.id, `Crop info for hero ${skinId ? `skin ${skinId}` : 'default'}`, cropInfo);

				let finalImageBytes: number[];
				let avatarType: 'cropped' | 'full' = 'cropped';

				// Crop the avatar from the combined texture using asset information
				try {
					finalImageBytes = await invoke<number[]>('crop_image_from_bytes', {
						imageBytes,
						x: cropInfo.x,
						y: cropInfo.y,
						width: cropInfo.width,
						height: cropInfo.height,
					});
					log.hero.asset(
						hero.id,
						`Successfully cropped avatar${skinId ? ` for skin ${skinId}` : ''} from combined texture`
					);
				} catch (error) {
					log.hero.error(
						hero.id,
						`Failed to crop avatar${skinId ? ` for skin ${skinId}` : ''} from combined texture, trying unit image`,
						error
					);

					// Fallback to unit image file
					const unitImagePath = `${projectPath}/Assets/00_Unit/#Image/${unitImageFileName}`;
					const unitImageExists = await invoke<boolean>('check_path_exists', {
						path: unitImagePath,
					});

					if (unitImageExists) {
						log.hero.asset(hero.id, `Fallback to unit image: ${unitImagePath}`);
						const unitImageBytes = await invoke<number[]>('read_file_as_bytes', { path: unitImagePath });
						finalImageBytes = unitImageBytes;
						avatarType = 'full';
					} else {
						log.hero.error(hero.id, `Unit image not found: ${unitImagePath}`);
						return;
					}
				}

				// Convert to base64 for display
				const base64 = btoa(String.fromCharCode(...finalImageBytes));
				const dataUrl = `data:image/png;base64,${base64}`;

				// Update hero object
				hero.avatar = dataUrl;
				hero.avatarPath = combinedTexturePath;
				hero.assetPath = assetPath;
				hero.avatarType = avatarType;

				log.hero.loading(
					hero.id,
					`Successfully loaded avatar${skinId ? ` for skin ${skinId}` : ''} from combined texture`
				);
			} catch (parseError) {
				log.hero.error(hero.id, 'Failed to parse asset file', parseError);
			}
		} catch (error) {
			log.hero.error(hero.id, 'Failed to load avatar', error);
		}
	};

	// Load heroes from Assets/01_Fx/1_Hero/ directory
	const loadHeroes = async (): Promise<void> => {
		if (!projectPath) {
			setState((prev) => ({
				...prev,
				heroes: [],
				error: 'No project selected',
			}));
			return;
		}

		setState((prev) => ({ ...prev, loading: true, error: null }));
		setHeroesLoading(true);

		try {
			const heroesPath = `${projectPath}/Assets/01_Fx/1_Hero`;
			log.info('Loading heroes from path', 'Heroes', { heroesPath });

			// Check if the heroes directory exists
			const exists = await invoke<boolean>('check_path_exists', {
				path: heroesPath,
			});
			if (!exists) {
				setState((prev) => ({
					...prev,
					loading: false,
					error: 'Heroes directory not found: Assets/01_Fx/1_Hero',
					heroes: [],
				}));
				setHeroesLoading(false);
				return;
			}

			// Read directory contents
			const entries = await invoke<string[]>('read_directory', {
				path: heroesPath,
			});
			log.debug('Directory entries found', 'Heroes', {
				entries,
				count: entries.length,
			});

			// Filter and parse hero folders
			const heroes: Hero[] = [];

			for (const entry of entries) {
				const entryPath = `${heroesPath}/${entry}`;

				// Check if it's a directory
				const isDir = await invoke<boolean>('check_is_directory', {
					path: entryPath,
				});
				if (!isDir) continue;

				// Parse hero info from folder name
				const heroInfo = parseHeroFolder(entry);
				if (heroInfo) {
					// Check cache first
					const cachedHero = getCachedHero(heroInfo.id);

					if (cachedHero && isCacheValid(heroInfo.id)) {
						log.hero.cache(heroInfo.id, 'Using cached hero');
						heroes.push(cachedHero);
					} else {
						log.hero.cache(heroInfo.id, 'Cache miss or expired');

						const hero: Hero = {
							id: heroInfo.id,
							name: heroInfo.name,
							folderName: entry,
							folderPath: entryPath,
							isGodSkin: false,
						};

						// Discover available skins for this hero
						const skins = await discoverHeroSkins(hero, projectPath);
						hero.skins = skins;

						// Load default avatar and cache result
						await loadHeroAvatar(hero, projectPath);
						cacheHero(heroInfo.id, hero, !!hero.avatar);
						heroes.push(hero);
					}
				}
			}

			// Sort heroes by ID
			heroes.sort((a, b) => a.id.localeCompare(b.id));

			log.info('Successfully loaded heroes', 'Heroes', {
				count: heroes.length,
				heroIds: heroes.map((h) => h.id),
				withSkins: heroes.filter((h) => h.skins && h.skins.length > 0).length,
			});

			setState((prev) => ({
				...prev,
				loading: false,
				heroes,
				error: null,
			}));
			setHeroesLoading(false);
		} catch (error) {
			log.error('Failed to load heroes', 'Heroes', error);
			setState((prev) => ({
				...prev,
				loading: false,
				error: error instanceof Error ? error.message : 'Failed to load heroes',
				heroes: [],
			}));
			setHeroesLoading(false);
		}
	};

	// Select a hero
	const selectHero = (hero: Hero | null) => {
		setSelectedHero(hero);
	};

	// Refresh heroes list (clear cache and reload)
	const refreshHeroes = () => {
		log.info('Refreshing heroes list and clearing cache', 'Heroes');
		// Clear selected hero to force right panel to show loading
		setSelectedHero(null);
		clearHeroesCache();
		loadHeroes();
	};

	// Load avatar for a specific hero by ID (force reload)
	const loadHeroAvatarById = async (heroId: string, forceReload = false) => {
		if (!projectPath) return;

		const hero = state.heroes.find((h) => h.id === heroId);
		if (!hero) return;

		// Check cache first unless force reload
		if (!forceReload) {
			const cachedHero = getCachedHero(heroId);
			if (cachedHero && isCacheValid(heroId) && cachedHero.avatar) {
				log.debug('Using cached avatar for hero', 'Heroes', { heroId });
				return;
			}
		}

		log.info('Loading/reloading avatar for hero', 'Heroes', {
			heroId,
			forceReload,
		});
		await loadHeroAvatar(hero, projectPath);

		// Update cache
		cacheHero(heroId, hero, !!hero.avatar);

		// Update the state with the modified hero
		setState((prev) => ({
			...prev,
			heroes: prev.heroes.map((h) => (h.id === heroId ? hero : h)),
		}));

		// Update selected hero if it's the same one
		if (selectedHero?.id === heroId) {
			setSelectedHero(hero);
		}
	};

	// Load skin for a specific hero
	const loadHeroSkin = async (heroId: string, skinId: string, colorId?: string) => {
		if (!projectPath) return;

		const hero = state.heroes.find((h) => h.id === heroId);
		if (!hero) {
			log.error('Hero not found for skin loading', 'Heroes', {
				heroId,
				skinId,
				colorId,
			});
			return;
		}

		log.info('Loading skin for hero', 'Heroes', {
			heroId,
			skinId,
			colorId,
		});

		// Load avatar with skin and color
		await loadHeroAvatar(hero, projectPath, skinId, colorId);

		// Update selected skin and color
		hero.selectedSkin = skinId;
		hero.selectedColor = colorId;
		hero.isGodSkin = hero.skins?.some((s) => s.id === skinId && s.isGodSkin) || false;

		// Update the skin's selected color if it exists
		if (hero.skins) {
			const skin = hero.skins.find((s) => s.id === skinId);
			if (skin) {
				skin.selectedColor = colorId;
			}
		}

		// Update cache
		cacheHero(heroId, hero, !!hero.avatar);

		// Update the state with the modified hero
		setState((prev) => ({
			...prev,
			heroes: prev.heroes.map((h) => (h.id === heroId ? hero : h)),
		}));

		// Update selected hero if it's the same one
		if (selectedHero?.id === heroId) {
			setSelectedHero(hero);
		}
	};

	// Load specific color for a hero's skin
	const loadHeroSkinColor = async (heroId: string, skinId: string, colorId: string) => {
		return loadHeroSkin(heroId, skinId, colorId);
	};

	// Reset to default skin
	const resetToDefaultSkin = async (heroId: string) => {
		if (!projectPath) return;

		const hero = state.heroes.find((h) => h.id === heroId);
		if (!hero) {
			log.error('Hero not found for default skin reset', 'Heroes', {
				heroId,
			});
			return;
		}

		log.info('Resetting to default skin for hero', 'Heroes', { heroId });

		// Load default avatar
		await loadHeroAvatar(hero, projectPath);

		// Clear selected skin and color
		hero.selectedSkin = undefined;
		hero.selectedColor = undefined;

		// Update cache
		cacheHero(heroId, hero, !!hero.avatar);

		// Update the state with the modified hero
		setState((prev) => ({
			...prev,
			heroes: prev.heroes.map((h) => (h.id === heroId ? hero : h)),
		}));

		// Update selected hero if it's the same one
		if (selectedHero?.id === heroId) {
			setSelectedHero(hero);
		}
	};

	// Load heroes when project path changes
	// biome-ignore lint: react-hooks/exhaustive-deps
	useEffect(() => {
		void loadHeroes();
	}, [projectPath]);

	return {
		...state,
		selectedHero,
		heroesLoading,
		loadHeroes,
		selectHero,
		refreshHeroes,
		loadHeroAvatar: loadHeroAvatarById,
		loadHeroSkin,
		loadHeroSkinColor,
		resetToDefaultSkin,
		clearCache: clearHeroesCache,
		isCacheValid,
		discoverHeroSkins,
	};
}
