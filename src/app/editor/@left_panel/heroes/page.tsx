'use client';

import { useHeroes } from '@/hooks/useHeroes';
import { ChevronDown, ChevronRight, HelpCircle, Palette, RefreshCw, Search, Shield, User } from 'lucide-react';
import { useState } from 'react';

export default function HeroesLeftPanel() {
	const { heroes, selectedHero, loading, error, selectHero, refreshHeroes, loadHeroSkin, resetToDefaultSkin } =
		useHeroes();
	const [searchTerm, setSearchTerm] = useState('');
	const [showSearchHelp, setShowSearchHelp] = useState(false);
	const [expandedHeroId, setExpandedHeroId] = useState<string | null>(null);

	// Filter heroes based on search term with advanced search support
	const filteredHeroes = heroes.filter(hero => {
		if (!searchTerm.trim()) return true;

		// Check if it's an OR search (contains |)
		if (searchTerm.includes('|')) {
			const orTerms = searchTerm
				.split('|')
				.map(term => term.trim().toLowerCase())
				.filter(term => term.length > 0);
			if (orTerms.length === 0) return true;

			// Hero matches if it matches ANY of the OR terms
			return orTerms.some(
				term =>
					hero.name.toLowerCase().includes(term) ||
					hero.id.includes(term) ||
					hero.folderName.toLowerCase().includes(term)
			);
		}

		// Check if it's an AND search (contains +)
		if (searchTerm.includes('+')) {
			const andTerms = searchTerm
				.split('+')
				.map(term => term.trim().toLowerCase())
				.filter(term => term.length > 0);
			if (andTerms.length === 0) return true;

			// Hero matches if it matches ALL of the AND terms
			return andTerms.every(
				term =>
					hero.name.toLowerCase().includes(term) ||
					hero.id.includes(term) ||
					hero.folderName.toLowerCase().includes(term)
			);
		}

		// Default single term search
		const term = searchTerm.toLowerCase();
		return (
			hero.name.toLowerCase().includes(term) ||
			hero.id.includes(term) ||
			hero.folderName.toLowerCase().includes(term)
		);
	});

	return (
		<div className='flex h-full w-full flex-col'>
			{/* Header - VSCode style */}
			<div className='group text-muted-foreground hover:bg-accent/50 flex items-center justify-between px-3 py-2 text-xs font-medium uppercase'>
				<span>Heroes</span>
				<button
					onClick={refreshHeroes}
					className='hover:bg-accent rounded p-1 opacity-0 transition-opacity group-hover:opacity-100'
					title='Refresh Heroes'
					disabled={loading}
				>
					<RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
				</button>
			</div>

			{/* Search */}
			<div className='px-2 py-1'>
				<div className='relative'>
					<Search className='text-muted-foreground absolute top-1/2 left-2 h-3 w-3 -translate-y-1/2' />
					<input
						type='text'
						placeholder='Search heroes...'
						value={searchTerm}
						onChange={e => setSearchTerm(e.target.value)}
						className='bg-input focus:bg-background focus:ring-ring w-full rounded px-7 py-1 pr-7 text-xs focus:ring-1 focus:outline-none'
					/>
					<button
						onClick={() => setShowSearchHelp(!showSearchHelp)}
						className='hover:bg-accent absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5'
						title='Search help'
					>
						<HelpCircle className='text-muted-foreground h-3 w-3' />
					</button>
				</div>
				{showSearchHelp && (
					<div className='bg-popover text-popover-foreground mt-1 rounded border p-2 text-xs shadow-md'>
						<div className='mb-1 font-medium'>Search Tips:</div>
						<div>
							• Single term: <code className='bg-muted rounded px-1'>mara</code>
						</div>
						<div>
							• OR search: <code className='bg-muted rounded px-1'>mara|knight</code> (matches either)
						</div>
						<div>
							• AND search: <code className='bg-muted rounded px-1'>sword+10450</code> (matches both)
						</div>
						<div className='text-muted-foreground mt-1'>Searches name, ID, and folder name</div>
					</div>
				)}
				{(searchTerm.includes('|') || searchTerm.includes('+')) && (
					<div className='mt-1 text-xs text-gray-500'>
						{searchTerm.includes('|') && (
							<span>
								OR search:{' '}
								{searchTerm
									.split('|')
									.map(term => term.trim())
									.filter(term => term.length > 0)
									.join(' OR ')}
							</span>
						)}
						{searchTerm.includes('+') && (
							<span>
								AND search:{' '}
								{searchTerm
									.split('+')
									.map(term => term.trim())
									.filter(term => term.length > 0)
									.join(' AND ')}
							</span>
						)}
					</div>
				)}
			</div>

			{/* Content */}
			<div className='flex-1 overflow-y-auto'>
				{loading && (
					<div className='flex h-full items-center justify-center p-4'>
						<div className='text-center'>
							<RefreshCw className='text-muted-foreground mx-auto h-6 w-6 animate-spin' />
							<p className='text-muted-foreground mt-2 text-sm'>Loading heroes...</p>
						</div>
					</div>
				)}

				{error && (
					<div className='flex h-full items-center justify-center p-4'>
						<div className='text-center'>
							<Shield className='text-destructive mx-auto h-8 w-8' />
							<p className='text-destructive mt-2 text-sm'>{error}</p>
							<button
								onClick={refreshHeroes}
								className='bg-destructive/10 text-destructive hover:bg-destructive/20 mt-2 rounded px-3 py-1 text-xs transition-colors'
							>
								Try Again
							</button>
						</div>
					</div>
				)}

				{!loading && !error && filteredHeroes.length === 0 && (
					<div className='flex h-full items-center justify-center p-4'>
						<div className='text-center'>
							<User className='text-muted-foreground mx-auto h-8 w-8' />
							<p className='text-muted-foreground mt-2 text-sm'>
								{searchTerm
									? 'No heroes found matching search'
									: 'No heroes found in Assets/01_Fx/1_Hero/'}
							</p>
							{searchTerm && (
								<button
									onClick={() => setSearchTerm('')}
									className='bg-secondary text-secondary-foreground hover:bg-secondary/80 mt-2 rounded px-3 py-1 text-xs transition-colors'
								>
									Clear Search
								</button>
							)}
						</div>
					</div>
				)}

				{!loading && !error && filteredHeroes.length > 0 && (
					<div className='flex-1 overflow-auto'>
						<div>
							{filteredHeroes.map(hero => (
								<div key={hero.id}>
									{/* Main Hero Item */}
									<div
										className={`flex cursor-pointer items-center px-3 py-2 text-sm transition-colors ${
											selectedHero?.id === hero.id
												? 'bg-accent text-accent-foreground'
												: 'hover:bg-accent/50 text-foreground'
										} `}
										onClick={() => selectHero(hero)}
									>
										{/* Expand/Collapse chevron for skins */}
										<button
											onClick={e => {
												e.stopPropagation();
												setExpandedHeroId(expandedHeroId === hero.id ? null : hero.id);
											}}
											className='hover:bg-accent/50 mr-2 flex-shrink-0 rounded p-1'
										>
											{hero.skins && hero.skins.length > 0 ? (
												expandedHeroId === hero.id ? (
													<ChevronDown className='h-4 w-4' />
												) : (
													<ChevronRight className='h-4 w-4' />
												)
											) : (
												<div className='h-4 w-4' />
											)}
										</button>

										{/* Hero icon */}
										<div className='mr-3 flex-shrink-0'>
											{hero.avatar ? (
												<div className='size-10 overflow-hidden rounded border'>
													<img
														src={hero.avatar}
														alt={`${hero.name} avatar`}
														className='h-full w-full object-cover'
													/>
												</div>
											) : (
												<div className='bg-muted flex size-10 items-center justify-center rounded border'>
													<User className='text-muted-foreground size-6' />
												</div>
											)}
										</div>

										{/* Hero name and details */}
										<div className='min-w-0 flex-1'>
											<div className='truncate font-medium'>
												{hero.name.charAt(0).toUpperCase() + hero.name.slice(1)}
											</div>
											<div className='text-muted-foreground truncate text-xs'>
												ID: {hero.id}
												{hero.skins && hero.skins.length > 0 && (
													<span className='ml-2'>
														• {hero.skins.length} skin{hero.skins.length !== 1 ? 's' : ''}
													</span>
												)}
											</div>
										</div>

										{/* Status indicators */}
										<div className='flex flex-shrink-0 items-center gap-2'>
											{hero.selectedSkin && (
												<div
													className='bg-primary h-2 w-2 rounded-full'
													title={`Skin ${hero.selectedSkin}`}
												/>
											)}
										</div>
									</div>

									{/* Expandable Skin List */}
									{hero.skins && hero.skins.length > 0 && expandedHeroId === hero.id && (
										<div className='border-border/50 ml-8 border-l'>
											{/* Skin Options (including default skin) */}
											{hero.skins.map(skin => (
												<div
													key={skin.id}
													onClick={() => {
														if (skin.isDefault) {
															resetToDefaultSkin(hero.id);
														} else {
															loadHeroSkin(hero.id, skin.id, skin.selectedColor);
														}
														selectHero(hero);
													}}
													className={`flex cursor-pointer items-center px-3 py-1.5 text-sm transition-colors ${
														(skin.isDefault && !hero.selectedSkin) ||
														hero.selectedSkin === skin.id
															? 'bg-accent text-accent-foreground'
															: 'hover:bg-accent/50 text-muted-foreground'
													}`}
												>
													<div className='mr-2 h-4 w-4' />
													<Palette className='mr-3 h-4 w-4 flex-shrink-0' />
													<div className='min-w-0 flex-1'>
														<div className='truncate'>
															{skin.isDefault
																? 'Default'
																: skin.name || `Skin ${skin.id}`}
														</div>
														{skin.colors && skin.colors.length > 0 && (
															<div className='text-muted-foreground text-xs'>
																{skin.colors.length} color
																{skin.colors.length !== 1 ? 's' : ''}
															</div>
														)}
													</div>
													<div className='ml-auto flex flex-shrink-0 items-center gap-2'>
														{((skin.isDefault && !hero.selectedSkin) ||
															hero.selectedSkin === skin.id) && (
															<div className='bg-primary h-2 w-2 rounded-full' />
														)}
													</div>
												</div>
											))}

											{/* Show standalone Default button only if no default skin (skin 99) exists */}
											{!hero.skins.some(skin => skin.isDefault) && (
												<div
													onClick={() => {
														resetToDefaultSkin(hero.id);
														selectHero(hero);
													}}
													className={`flex cursor-pointer items-center px-3 py-1.5 text-sm transition-colors ${
														!hero.selectedSkin
															? 'bg-accent text-accent-foreground'
															: 'hover:bg-accent/50 text-muted-foreground'
													}`}
												>
													<div className='mr-2 h-4 w-4' />
													<Palette className='mr-3 h-4 w-4 flex-shrink-0' />
													<span className='truncate'>Default</span>
													{!hero.selectedSkin && (
														<div className='bg-primary ml-auto h-2 w-2 rounded-full' />
													)}
												</div>
											)}
										</div>
									)}
								</div>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Footer info */}
			{!loading && !error && (
				<div className='border-border border-t px-4 py-2'>
					<div className='text-muted-foreground text-xs'>
						{filteredHeroes.length} of {heroes.length} heroes
						{searchTerm && ` (filtered)`}
					</div>
				</div>
			)}
		</div>
	);
}
