import type { FileNode, FileSystemEvent } from '@/types/tauri';
import { log } from '@/utils/logger';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface FileExplorerStats {
	totalFiles: number;
	totalDirectories: number;
	totalSize: number;
}

interface FileExplorerState {
	// State
	rootPath: string;
	fileTree: FileNode | null;
	isWatching: boolean;
	selectedPath: string;
	loading: boolean;
	error: string;
	lastUpdate: Date;
	stats: FileExplorerStats;

	// Actions
	setRootPath: (path: string) => void;
	setSelectedPath: (path: string) => void;
	loadDirectory: (path: string) => Promise<void>;
	startWatching: () => Promise<void>;
	stopWatching: () => Promise<void>;
	clearError: () => void;
	refreshDirectory: () => Promise<void>;

	// Internal helpers
	calculateStats: (node: FileNode) => { files: number; dirs: number; size: number };
	updateStats: (tree: FileNode) => void;
}

export const useFileExplorerStore = create<FileExplorerState>()(
	devtools(
		(set, get) => ({
			// Initial state
			rootPath: '',
			fileTree: null,
			isWatching: false,
			selectedPath: '',
			loading: false,
			error: '',
			lastUpdate: new Date(),
			stats: {
				totalFiles: 0,
				totalDirectories: 0,
				totalSize: 0,
			},

			// Actions
			setRootPath: (path: string) => {
				set({ rootPath: path }, false, 'setRootPath');
			},

			setSelectedPath: (path: string) => {
				set({ selectedPath: path }, false, 'setSelectedPath');
			},

			clearError: () => {
				set({ error: '' }, false, 'clearError');
			},

			// Calculate stats from file tree
			calculateStats: (node: FileNode): { files: number; dirs: number; size: number } => {
				let files = node.is_directory ? 0 : 1;
				let dirs = node.is_directory ? 1 : 0;
				let size = node.size || 0;

				if (node.children) {
					for (const child of node.children) {
						const childStats = get().calculateStats(child);
						files += childStats.files;
						dirs += childStats.dirs;
						size += childStats.size;
					}
				}

				return { files, dirs, size };
			},

			// Update stats when file tree changes
			updateStats: (tree: FileNode) => {
				const treeStats = get().calculateStats(tree);
				set(
					{
						stats: {
							totalFiles: treeStats.files,
							totalDirectories: treeStats.dirs - 1, // Subtract root directory
							totalSize: treeStats.size,
						},
					},
					false,
					'updateStats'
				);
			},

			// Load directory structure
			loadDirectory: async (path: string) => {
				if (!path.trim()) return;

				set({ loading: true, error: '' }, false, 'loadDirectory:start');

				try {
					// Check if path exists first
					const pathExists = await invoke<boolean>('check_path_exists', { path });
					if (!pathExists) {
						throw new Error('Path does not exist');
					}

					const tree = await invoke<FileNode>('get_file_tree', { path });

					set(
						{
							fileTree: tree,
							rootPath: path,
							lastUpdate: new Date(),
						},
						false,
						'loadDirectory:success'
					);

					// Update stats
					get().updateStats(tree);
				} catch (err) {
					const errorMessage = err instanceof Error ? err.message : String(err);
					set({ error: `Failed to read directory: ${errorMessage}` }, false, 'loadDirectory:error');
					log.error('Error loading directory in store', 'FileExplorerStore', { path, error: err });
				} finally {
					set({ loading: false }, false, 'loadDirectory:end');
				}
			},

			// Refresh current directory
			refreshDirectory: async () => {
				const { rootPath } = get();
				if (rootPath) {
					await get().loadDirectory(rootPath);
				}
			},

			// Start watching directory
			startWatching: async () => {
				const { rootPath } = get();
				if (!rootPath.trim()) return;

				try {
					await invoke('start_watching', { path: rootPath });
					set({ isWatching: true }, false, 'startWatching:success');

					// Listen for file system events
					const unlisten = await listen<FileSystemEvent>('file-changed', event => {
						// Refresh directory on file changes
						get().refreshDirectory();
					});

					// Store unlisten function if needed
					// You might want to store this in the state for cleanup
				} catch (err) {
					log.error('Error starting file watching in store', 'FileExplorerStore', { error: err });
					set({ error: `Failed to start watching: ${err}` }, false, 'startWatching:error');
				}
			},

			// Stop watching directory
			stopWatching: async () => {
				try {
					await invoke('stop_watching');
					set({ isWatching: false }, false, 'stopWatching:success');
				} catch (err) {
					log.error('Error stopping file watching in store', 'FileExplorerStore', { error: err });
					set({ error: `Failed to stop watching: ${err}` }, false, 'stopWatching:error');
				}
			},
		}),
		{
			name: 'file-explorer-store',
		}
	)
);
