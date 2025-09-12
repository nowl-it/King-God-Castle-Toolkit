'use client';
import { useAppHistoryStore } from '@/store/app/history';
import { useProjectStore } from '@/store/project/store';
import { EDITOR_TABS } from '@/utils/consts';
import { log } from '@/utils/logger';
import { invoke } from '@tauri-apps/api/core';
import { check } from '@tauri-apps/plugin-updater';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AppInitState {
	checking: boolean;
	updateAvailable: boolean;
	updateInstalling: boolean;
	projectChecking: boolean;
	error: string | null;
}

export default function Component({ env }: { env: NodeJS.ProcessEnv }) {
	const { project } = useAppHistoryStore();
	const { setPath } = useProjectStore();
	const router = useRouter();

	const [state, setState] = useState<AppInitState>({
		checking: true,
		updateAvailable: false,
		updateInstalling: false,
		projectChecking: false,
		error: null,
	});

	// Check for app updates
	const checkForUpdates = async () => {
		try {
			log.info('Checking for app updates', 'AppInit');
			const update = await check();

			if (update) {
				log.info('Update available', 'AppInit', { version: update.version });
				setState(prev => ({ ...prev, updateAvailable: true }));

				// Auto-install update
				setState(prev => ({ ...prev, updateInstalling: true }));
				await update.downloadAndInstall();

				log.info('Update installed, restarting app', 'AppInit');
				// App will restart automatically
				return true;
			} else {
				log.info('No updates available', 'AppInit');
				return false;
			}
		} catch (error) {
			log.error('Failed to check for updates', 'AppInit', error);
			// Continue without update if check fails
			return false;
		}
	};

	// Check if previous project exists
	const checkPreviousProject = async () => {
		if (!project) {
			log.info('No previous project found', 'AppInit');
			return false;
		}

		try {
			setState(prev => ({ ...prev, projectChecking: true }));
			log.info('Checking previous project', 'AppInit', { project });

			const exists = await invoke<boolean>('check_path_exists', { path: project });

			if (exists) {
				log.info('Previous project exists, setting path', 'AppInit', { project });
				setPath(project);
				return true;
			} else {
				log.info('Previous project no longer exists', 'AppInit', { project });
				return false;
			}
		} catch (error) {
			log.error('Failed to check previous project', 'AppInit', error);
			return false;
		}
	};

	const initializeApp = async () => {
		try {
			setState(prev => ({ ...prev, checking: true, error: null }));

			// Step 1: Check for updates
			const updateInstalled = await checkForUpdates();
			if (updateInstalled) {
				// App will restart, don't continue
				return;
			}

			// Step 2: Check previous project
			const projectExists = await checkPreviousProject();

			setState(prev => ({ ...prev, checking: false, projectChecking: false }));

			// Step 3: Navigate based on project existence
			if (projectExists) {
				log.info('Navigating to editor with previous project', 'AppInit');
				router.push(`/editor/${EDITOR_TABS[0]}`);
			} else {
				log.info('Showing default screen', 'AppInit');
				// Stay on current page (default screen)
			}
		} catch (error) {
			log.error('Failed to initialize app', 'AppInit', error);
			setState(prev => ({
				...prev,
				checking: false,
				projectChecking: false,
				error: 'Failed to initialize app',
			}));
		}
	};

	// Initialize app
	useEffect(() => {
		initializeApp();
	}, [project]);

	// Loading states
	if (state.checking) {
		return (
			<div className='flex h-full flex-col items-center justify-center'>
				<div className='space-y-4 text-center'>
					<div className='text-xl'>Initializing King God Castle Toolkit...</div>
					{state.updateAvailable && (
						<div className='text-blue-500'>
							{state.updateInstalling ? 'Installing update...' : 'Update available'}
						</div>
					)}
					{state.projectChecking && <div className='text-gray-500'>Checking previous project...</div>}
				</div>
			</div>
		);
	}

	// Error state
	if (state.error) {
		return (
			<div className='flex h-full flex-col items-center justify-center'>
				<div className='space-y-4 text-center'>
					<div className='text-xl text-red-500'>Error</div>
					<div className='text-red-400'>{state.error}</div>
					<button
						onClick={() => window.location.reload()}
						className='rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600'
					>
						Retry
					</button>
				</div>
			</div>
		);
	}

	// Default screen - no previous project or project doesn't exist
	return (
		<div className='flex h-full flex-col items-center justify-center'>
			<div className='space-y-4 text-center'>
				<h1 className='text-6xl font-bold'>King God Castle Toolkit</h1>
				<p className='text-muted-foreground text-right text-lg'>v{env.npm_package_version}</p>
			</div>
		</div>
	);
}
