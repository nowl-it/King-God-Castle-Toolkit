'use client';

import { useFileExplorerStore } from '@/store/fileExplorer/store';
import { useProjectStore } from '@/store/project/store';
import type { FileNode } from '@/types/tauri';
import { log } from '@/utils/logger';
import { invoke } from '@tauri-apps/api/core';
import { ChevronDown, ChevronRight, File, Folder, FolderOpen, FolderPlus, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FileTreeItemProps {
	node: FileNode;
	depth: number;
	// onSelect: (path: string) => void;
	expandedFolders: Set<string>;
	onToggleExpand: (path: string) => void;
}

function FileTreeItem({ node, depth, expandedFolders, onToggleExpand }: Omit<FileTreeItemProps, 'onSelect'>) {
	const isExpanded = expandedFolders.has(node.path);
	const hasChildren = node.children && node.children.length > 0;

	const handleClick = () => {
		if (node.is_directory) {
			onToggleExpand(node.path);
		}
	};

	return (
		<div className='select-none'>
			<div
				className='hover:bg-muted/50 flex cursor-pointer items-center gap-1 px-2 py-1 text-sm'
				style={{ paddingLeft: `${depth * 12 + 8}px` }}
				onClick={handleClick}
			>
				{node.is_directory && hasChildren && (
					<div className='flex h-4 w-4 items-center justify-center'>
						{isExpanded ? <ChevronDown className='h-3 w-3' /> : <ChevronRight className='h-3 w-3' />}
					</div>
				)}
				{node.is_directory && !hasChildren && <div className='h-4 w-4' />}
				{!node.is_directory && <div className='h-4 w-4' />}

				<div className='flex h-4 w-4 items-center justify-center'>
					{node.is_directory ? (
						isExpanded ? (
							<FolderOpen className='h-3 w-3 text-blue-500' />
						) : (
							<Folder className='h-3 w-3 text-blue-500' />
						)
					) : (
						<File className='h-3 w-3 text-gray-500' />
					)}
				</div>

				<span className='truncate'>{node.name}</span>
			</div>

			{node.is_directory && isExpanded && node.children && (
				<div>
					{node.children.map((child, index) => (
						<FileTreeItem
							key={`${child.path}-${index}`}
							node={child}
							depth={depth + 1}
							expandedFolders={expandedFolders}
							onToggleExpand={onToggleExpand}
						/>
					))}
				</div>
			)}
		</div>
	);
}

export default function LeftPanelExplorer() {
	const { path: projectPath } = useProjectStore();
	const { fileTree, loading, error, stats, loadDirectory, refreshDirectory, clearError } = useFileExplorerStore();
	const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

	// Load directory when project changes
	useEffect(() => {
		if (projectPath) {
			loadDirectory(projectPath);
		}
	}, [projectPath, loadDirectory]);

	// Handle creating folder
	const handleCreateFolder = async () => {
		if (!projectPath) return;

		const folderName = prompt('Enter folder name:');
		if (!folderName) return;

		try {
			const newPath = `${projectPath}/${folderName}`;
			await invoke('create_folder', { path: newPath });
			refreshDirectory(); // Refresh after creating folder
		} catch (error) {
			log.error('Failed to create folder', 'Explorer', { folderName, projectPath, error });
		}
	};

	// Handle toggle expand
	const handleToggleExpand = (path: string) => {
		setExpandedNodes(prev => {
			const newSet = new Set(prev);
			if (newSet.has(path)) {
				newSet.delete(path);
			} else {
				newSet.add(path);
			}
			return newSet;
		});
	};

	// Handle refresh
	const handleRefresh = () => {
		if (error) clearError();
		refreshDirectory();
	};

	// No project selected
	if (!projectPath) {
		return (
			<div className='flex h-full items-center justify-center p-4'>
				<div className='text-center'>
					<Folder className='mx-auto h-12 w-12 text-gray-400' />
					<p className='mt-2 text-sm text-gray-500'>No project selected</p>
				</div>
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div className='flex h-full flex-col items-center justify-center p-4'>
				<div className='text-center'>
					<p className='text-sm text-red-500'>Error loading project</p>
					<p className='mt-1 text-xs text-gray-500'>{error}</p>
					<button
						onClick={handleRefresh}
						className='mt-2 flex items-center gap-1 rounded px-2 py-1 text-xs text-blue-500 hover:bg-blue-50'
					>
						<RefreshCw className='h-3 w-3' />
						Retry
					</button>
				</div>
			</div>
		);
	}

	// Loading state
	if (loading) {
		return (
			<div className='flex h-full items-center justify-center p-4'>
				<div className='text-center'>
					<RefreshCw className='mx-auto h-6 w-6 animate-spin text-gray-400' />
					<p className='mt-2 text-sm text-gray-500'>Loading project...</p>
				</div>
			</div>
		);
	}

	return (
		<div className='flex h-full flex-col'>
			{/* Header */}
			<div className='border-border/40 flex items-center justify-between border-b px-3 py-2'>
				<h2 className='text-sm font-medium'>Project Explorer</h2>
				<div className='flex items-center gap-1'>
					<button
						onClick={handleCreateFolder}
						className='hover:bg-muted/50 rounded p-1'
						title='Create Folder'
					>
						<FolderPlus className='h-4 w-4' />
					</button>
					<button onClick={handleRefresh} className='hover:bg-muted/50 rounded p-1' title='Refresh'>
						<RefreshCw className='h-4 w-4' />
					</button>
				</div>
			</div>

			{/* File Tree */}
			<div className='flex-1 overflow-y-auto'>
				{fileTree && fileTree.children && fileTree.children.length > 0 ? (
					<div className='py-2'>
						{fileTree.children.map((child, index) => (
							<FileTreeItem
								key={`${child.path}-${index}`}
								node={child}
								depth={0}
								expandedFolders={expandedNodes}
								onToggleExpand={handleToggleExpand}
							/>
						))}
					</div>
				) : (
					<div className='flex h-full items-center justify-center p-4'>
						<div className='text-center'>
							<Folder className='mx-auto h-8 w-8 text-gray-400' />
							<p className='mt-2 text-sm text-gray-500'>Empty project</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
