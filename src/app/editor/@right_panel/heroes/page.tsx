'use client';

import { Badge } from '@/components/ui/badge';
import { useHeroes } from '@/hooks/useHeroes';
import { useProjectStore } from '@/store/project/store';
import { log } from '@/utils/logger';
import { invoke } from '@tauri-apps/api/core';
import { Palette, User } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function HeroesRightPanel() {
	const { selectedHero, heroes, loading, heroesLoading, loadHeroAvatar, isCacheValid } = useHeroes();
	const { path: projectPath } = useProjectStore();
	const [skinImages, setSkinImages] = useState<{ [key: string]: string }>({});

	// Helper function to get skin image path
	const getSkinImagePath = (heroId: string, skinId: string | null, colorId?: string): string => {
		const unitImageDir = `${projectPath}/ExportedProject/Assets/00_Unit/#Image`;

		if (skinId) {
			if (colorId) {
				// Multi-color skin: Unit_${heroId}_${skinId}_${colorId}.png
				return `${unitImageDir}/Unit_${heroId}_${skinId}_${colorId}.png`;
			} else {
				// Single color skin: Unit_${heroId}_${skinId}.png
				return `${unitImageDir}/Unit_${heroId}_${skinId}.png`;
			}
		} else {
			// Default skin: Unit_${heroId}.png
			return `${unitImageDir}/Unit_${heroId}.png`;
		}
	};

	// Load skin image as data URL
	const loadSkinImage = async (
		heroId: string,
		skinId: string | null = null,
		colorId?: string
	): Promise<string | null> => {
		try {
			const imagePath = getSkinImagePath(heroId, skinId, colorId);
			const exists = await invoke<boolean>('check_path_exists', { path: imagePath });

			if (!exists) {
				log.debug('Skin image not found', 'RightPanel', { imagePath });
				return null;
			}

			const imageBytes = await invoke<number[]>('read_file_as_bytes', { path: imagePath });
			const base64 = btoa(String.fromCharCode(...imageBytes));
			return `data:image/png;base64,${base64}`;
		} catch (error) {
			log.error('Failed to load skin image', 'RightPanel', { heroId, skinId, colorId, error });
			return null;
		}
	};

	const loadSelectedSkinImage = async () => {
		if (!selectedHero || !projectPath) return;

		const defaultImage = await loadSkinImage(selectedHero.id, selectedHero.selectedSkin);
		setSkinImages({ [selectedHero.selectedSkin ?? 'default']: defaultImage || '' });

		if (!selectedHero.selectedSkin) {
			// Load default skin
			const altImage = await loadSkinImage(selectedHero.id, '99_00');
			const altImage2 = await loadSkinImage(selectedHero.id, '99_01');

			if (altImage) setSkinImages(prev => ({ ...prev, '99_00': altImage }));
			if (altImage2) setSkinImages(prev => ({ ...prev, '99_01': altImage2 }));

			return;
		}

		// Load selected skin (with possible colors)
		const skinId = selectedHero.selectedSkin;
		const colors = selectedHero.skins?.find(s => s.id === skinId)?.colors;

		if (colors && colors.length > 0) {
			for (const colorId of colors) {
				const img = await loadSkinImage(selectedHero.id, skinId, colorId);
				if (img) setSkinImages(prev => ({ ...prev, [`${skinId}_${colorId}`]: img }));
			}
		}
	};

	// Load selected skin image for the selected hero
	useEffect(() => {
		loadSelectedSkinImage();
	}, [selectedHero, selectedHero?.selectedSkin, selectedHero?.selectedColor, projectPath]);

	// Load avatar when hero is selected (only if not cached or cache expired)
	useEffect(() => {
		if (selectedHero && (!selectedHero.avatar || !isCacheValid(selectedHero.id))) {
			log.debug('Loading avatar for selected hero in right panel', 'RightPanel', { heroId: selectedHero.id });
			loadHeroAvatar(selectedHero.id);
		}
	}, [selectedHero, loadHeroAvatar, isCacheValid]);

	// No hero selected or heroes are loading
	if (!selectedHero || heroesLoading) {
		return (
			<div className='flex h-full w-full flex-col p-6'>
				<div className='mb-6'>
					<h2 className='text-2xl font-bold'>Hero</h2>
				</div>

				<div className='flex flex-1 items-center justify-center'>
					<div className='text-center'>
						{heroesLoading ? (
							<>
								<div className='mx-auto h-16 w-16 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500' />
								<h3 className='mt-4 text-lg font-medium'>Loading Heroes...</h3>
								<p className='text-muted-foreground mt-2'>
									Please wait while we refresh the heroes list
								</p>
							</>
						) : (
							<>
								<User className='text-muted-foreground/50 mx-auto h-16 w-16' />
								<h3 className='mt-4 text-lg font-medium'>No Hero Selected</h3>
								<p className='text-muted-foreground mt-2'>
									Select a hero from the left panel to view details
								</p>
							</>
						)}
						{!loading && !heroesLoading && heroes.length === 0 && (
							<div className='bg-muted mt-4 rounded-lg p-4 text-sm'>
								<p className='text-muted-foreground'>
									No heroes found in{' '}
									<code className='bg-muted-foreground/10 rounded px-1'>Assets/01_Fx/1_Hero/</code>
								</p>
								<p className='text-muted-foreground/70 mt-1'>
									Make sure your project contains hero folders with format: <br />
									<code className='bg-muted-foreground/10 rounded px-1'>Fx_001 (Knight)</code>
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className='relative flex h-full w-full flex-col overflow-y-auto'>
			<div className='bg-background sticky top-0 right-0 left-0 z-20 mb-6 border-b px-4 py-2'>
				<h2 className='text-2xl font-bold capitalize'>{selectedHero.name}</h2>
				<span className='text-muted-foreground text-xs'>ID: {selectedHero.id}</span>
			</div>

			<div className='flex flex-col gap-6 p-6'>
				{/* Hero Images */}
				<div className='w-fit rounded-lg border p-4'>
					<div className='mb-4 flex items-center gap-2'>
						<User className='h-5 w-5 text-purple-500' />
						<h3 className='font-semibold'>Hero Avatar</h3>
						{selectedHero.selectedSkin && (
							<Badge variant='secondary' className='text-xs'>
								Skin {selectedHero.selectedSkin}
								{selectedHero.selectedColor && ` - Color ${selectedHero.selectedColor}`}
							</Badge>
						)}
					</div>
					{selectedHero.avatar ? (
						<img
							src={selectedHero.avatar}
							alt={`${selectedHero.name} avatar`}
							className='border-border h-40 rounded-lg border-2 object-contain p-2'
						/>
					) : (
						<div className='border-border bg-muted flex items-center justify-center rounded-lg border-2 p-2'>
							<div className='text-center'>
								<User className='text-muted-foreground mx-auto size-40' />
								<div className='text-muted-foreground mt-2 text-xs'>Loading avatar...</div>
							</div>
						</div>
					)}
				</div>

				{/* Current Skin Section */}
				<div className='rounded-lg border p-4'>
					<div className='mb-4 flex items-center gap-2'>
						<Palette className='h-5 w-5 text-blue-500' />
						<h3 className='font-semibold'>Skin</h3>
					</div>

					<div className='space-y-4'>
						{Object.keys(skinImages).length > 0 && (
							<div className='space-y-2'>
								<div>
									<h4 className='text-muted-foreground mb-2 text-sm font-medium'>
										Skin {selectedHero.selectedSkin}
									</h4>
									<div className='grid grid-cols-3 items-start justify-start gap-4'>
										<SelectedSkinImages images={skinImages} />
									</div>
								</div>
							</div>
						)}
						{Object.keys(skinImages).length === 0 && (
							<div className='text-muted-foreground text-center text-sm'>No skin image available</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function SelectedSkinImages({ images }: { images: { [key: string]: string } }) {
	return Object.entries(images).map(([key, img]) => (
		<img key={key} src={img} alt={`Skin ${key}`} className='w-full rounded border p-4' />
	));
}
