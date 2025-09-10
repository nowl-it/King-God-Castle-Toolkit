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
		<div className='bg-background flex h-full w-full flex-col border-r'>
			{/* Header */}
			<div className='border-border/40 flex items-center justify-between border-b px-4 py-3'>
				<h3 className='font-semibold'>Heroes</h3>
				<button
					onClick={refreshHeroes}
					className='hover:bg-muted/50 rounded p-1'
					title='Refresh Heroes'
					disabled={loading}
				>
					<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
				</button>
			</div>

			{/* Search */}
			<div className='border-border/40 border-b p-3'>
				<div className='relative'>
					<Search className='absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-gray-400' />
					<input
						type='text'
						placeholder='Search heroes... (| for OR, + for AND: mara|knight or sword+10450)'
						value={searchTerm}
						onChange={e => setSearchTerm(e.target.value)}
						className='w-full rounded border px-8 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none'
					/>
					<button
						onClick={() => setShowSearchHelp(!showSearchHelp)}
						className='absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 hover:bg-gray-100'
						title='Search help'
					>
						<HelpCircle className='h-3 w-3 text-gray-400' />
					</button>
				</div>
				{showSearchHelp && (
					<div className='mt-2 rounded border bg-blue-50 p-2 text-xs text-blue-800'>
						<div className='mb-1 font-medium'>Search Tips:</div>
						<div>
							• Single term: <code className='rounded bg-white px-1'>mara</code>
						</div>
						<div>
							• OR search: <code className='rounded bg-white px-1'>mara|knight</code> (matches either)
						</div>
						<div>
							• AND search: <code className='rounded bg-white px-1'>sword+10450</code> (matches both)
						</div>
						<div className='mt-1 text-blue-600'>Searches name, ID, and folder name</div>
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
					<div className='p-2'>
						<div className='space-y-1'>
							{filteredHeroes.map(hero => (
								<div key={hero.id} className='rounded border border-transparent'>
									{/* Main Hero Item */}
									<div
										className={`cursor-pointer rounded px-3 py-3 text-sm transition-colors ${
											selectedHero?.id === hero.id
												? 'bg-accent border-primary border'
												: 'hover:bg-muted/50 text-muted-foreground border border-transparent'
										} `}
									>
										<div className='flex items-center gap-2' onClick={() => selectHero(hero)}>
											{hero.avatar ? (
												<div className='w-12 flex-shrink-0 rounded border p-2'>
													<img
														src={hero.avatar}
														alt={`${hero.name} avatar`}
														className='w-full object-cover object-center'
													/>
												</div>
											) : (
												<div className='bg-muted flex aspect-[9/16] w-10 items-center justify-center rounded border'>
													<User className='text-muted-foreground w-full object-cover' />
												</div>
											)}
											<div className='min-w-0 flex-1'>
												<div className='truncate font-medium'>
													{hero.name.charAt(0).toUpperCase() + hero.name.slice(1)}
												</div>
												<div className='text-muted-foreground flex items-center gap-1 text-xs'>
													<span>{hero.id}</span>
													{hero.selectedSkin && (
														<span className='rounded bg-purple-100 px-1 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300'>
															Skin {hero.selectedSkin}
														</span>
													)}
													{hero.skins && hero.skins.length > 0 && (
														<span className='rounded bg-blue-100 px-1 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300'>
															{hero.skins.length} skin{hero.skins.length !== 1 ? 's' : ''}
														</span>
													)}
												</div>
											</div>
											{/* Expand/Collapse Button */}
											{hero.skins && hero.skins.length > 0 && (
												<button
													onClick={e => {
														e.stopPropagation();
														setExpandedHeroId(expandedHeroId === hero.id ? null : hero.id);
													}}
													className='hover:bg-muted rounded p-1 transition-colors'
													title={
														expandedHeroId === hero.id ? 'Collapse skins' : 'Expand skins'
													}
												>
													{expandedHeroId === hero.id ? (
														<ChevronDown className='h-4 w-4' />
													) : (
														<ChevronRight className='h-4 w-4' />
													)}
												</button>
											)}
										</div>
									</div>

									{/* Expandable Skin List */}
									{hero.skins && hero.skins.length > 0 && expandedHeroId === hero.id && (
										<div className='border-border mt-1 ml-4 space-y-1 border-l-2 pl-3'>
											{/* Skin Options (including default skin) */}
											{hero.skins.map(skin => (
												<button
													key={skin.id}
													onClick={() => {
														if (skin.isDefault) {
															resetToDefaultSkin(hero.id);
														} else {
															loadHeroSkin(hero.id, skin.id, skin.selectedColor);
														}
														selectHero(hero);
													}}
													className={`w-full rounded px-2 py-1.5 text-left text-xs transition-colors ${
														(skin.isDefault && !hero.selectedSkin) ||
														hero.selectedSkin === skin.id
															? 'border border-purple-500 bg-purple-500/10 text-purple-500 dark:border-purple-400 dark:text-purple-400'
															: 'text-muted-foreground hover:bg-muted'
													}`}
												>
													<div className='flex items-center gap-2'>
														<Palette className='h-3 w-3' />
														<span>
															{skin.isDefault
																? 'Default'
																: skin.name || `Skin ${skin.id}`}
														</span>
														<div className='ml-auto flex items-center gap-1'>
															{((skin.isDefault && !hero.selectedSkin) ||
																hero.selectedSkin === skin.id) && (
																<span className='rounded bg-purple-500/20 px-1 text-xs text-purple-500 dark:text-purple-400'>
																	Active
																</span>
															)}
															{skin.colors && skin.colors.length > 0 && (
																<span className='rounded bg-orange-500/20 px-1 text-xs text-orange-500'>
																	{skin.colors.length} colors
																</span>
															)}
														</div>
													</div>
												</button>
											))}

											{/* Show standalone Default button only if no default skin (skin 99) exists */}
											{!hero.skins.some(skin => skin.isDefault) && (
												<button
													onClick={() => {
														resetToDefaultSkin(hero.id);
														selectHero(hero);
													}}
													className={`w-full rounded px-2 py-1.5 text-left text-xs transition-colors ${
														!hero.selectedSkin
															? 'border-primary bg-primary/10 text-primary border'
															: 'text-muted-foreground hover:bg-muted'
													}`}
												>
													<div className='flex items-center gap-2'>
														<Palette className='h-3 w-3' />
														<span>Default</span>
														{!hero.selectedSkin && (
															<span className='bg-primary/20 text-primary ml-auto rounded px-1 text-xs'>
																Active
															</span>
														)}
													</div>
												</button>
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
