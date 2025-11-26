import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useCallback, useEffect, useState } from "react";
import type { FileNode, FileSystemEvent } from "@/types/tauri";
import { log } from "@/utils/logger";

interface FileExplorerStats {
	totalFiles: number;
	totalDirectories: number;
	totalSize: number;
}

interface UseFileExplorerReturn {
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
}

export const useFileExplorer = (): UseFileExplorerReturn => {
	const [rootPath, setRootPath] = useState<string>("");
	const [fileTree, setFileTree] = useState<FileNode | null>(null);
	const [isWatching, setIsWatching] = useState(false);
	const [selectedPath, setSelectedPath] = useState<string>("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string>("");
	const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
	const [stats, setStats] = useState<FileExplorerStats>({
		totalFiles: 0,
		totalDirectories: 0,
		totalSize: 0,
	});

	// Calculate stats from file tree
	const calculateStats = useCallback(
		(node: FileNode): { files: number; dirs: number; size: number } => {
			let files = node.is_directory ? 0 : 1;
			let dirs = node.is_directory ? 1 : 0;
			let size = node.size || 0;

			if (node.children) {
				for (const child of node.children) {
					const childStats = calculateStats(child);
					files += childStats.files;
					dirs += childStats.dirs;
					size += childStats.size;
				}
			}

			return { files, dirs, size };
		},
		[],
	);

	// Update stats when file tree changes
	const updateStats = useCallback(
		(tree: FileNode) => {
			const treeStats = calculateStats(tree);
			setStats({
				totalFiles: treeStats.files,
				totalDirectories: treeStats.dirs - 1, // Subtract root directory
				totalSize: treeStats.size,
			});
		},
		[calculateStats],
	);

	// Load directory structure
	const loadDirectory = useCallback(
		async (path: string) => {
			if (!path.trim()) return;

			setLoading(true);
			setError("");

			try {
				// Check if path exists first
				const pathExists = await invoke<boolean>("check_path_exists", {
					path,
				});
				if (!pathExists) {
					throw new Error("Path does not exist");
				}

				const tree = await invoke<FileNode>("get_file_tree", { path });
				setFileTree(tree);
				setLastUpdate(new Date());
				updateStats(tree);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : String(err);
				setError(`Failed to read directory: ${errorMessage}`);
				log.error("Error loading directory", "FileExplorer", {
					path,
					error: err,
				});
			} finally {
				setLoading(false);
			}
		},
		[updateStats],
	);

	// Refresh current directory
	const refreshDirectory = useCallback(async () => {
		if (rootPath) {
			await loadDirectory(rootPath);
		}
	}, [rootPath, loadDirectory]);

	// Start watching directory
	const startWatching = useCallback(async () => {
		if (!rootPath.trim()) return;

		try {
			await invoke("start_watching", { path: rootPath });
			setIsWatching(true);
			setError("");
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : String(err);
			setError(`Failed to start watching: ${errorMessage}`);
			log.error("Error starting file watcher", "FileExplorer", {
				rootPath,
				error: err,
			});
		}
	}, [rootPath]);

	// Stop watching directory
	const stopWatching = useCallback(async () => {
		try {
			await invoke("stop_watching");
			setIsWatching(false);
		} catch (err) {
			log.error("Error stopping file watcher", "FileExplorer", {
				error: err,
			});
		}
	}, []);

	// Clear error
	const clearError = useCallback(() => {
		setError("");
	}, []);

	// Listen for file system events
	useEffect(() => {
		let unlisten: (() => void) | undefined;

		const setupListener = async () => {
			try {
				unlisten = await listen<FileSystemEvent>("fs-changed", (event) => {
					setFileTree(event.payload.tree);
					setLastUpdate(new Date());
					updateStats(event.payload.tree);
				});
			} catch (err) {
				log.error("Error setting up file system listener", "FileExplorer", {
					error: err,
				});
			}
		};

		setupListener();

		return () => {
			if (unlisten) {
				unlisten();
			}
		};
	}, [updateStats]);

	// Initialize watching status on mount
	useEffect(() => {
		// Reset watching status on mount since we're managing it locally
		setIsWatching(false);
	}, []);

	return {
		// State
		rootPath,
		fileTree,
		isWatching,
		selectedPath,
		loading,
		error,
		lastUpdate,
		stats,

		// Actions
		setRootPath,
		setSelectedPath,
		loadDirectory,
		startWatching,
		stopWatching,
		clearError,
		refreshDirectory,
	};
};
