export interface FileNode {
	name: string;
	path: string;
	is_directory: boolean;
	children?: FileNode[];
	size?: number;
	modified?: string;
}

export interface FileSystemEvent {
	event_type: string;
	path: string;
	tree: FileNode;
}

export interface FileInfo {
	name: string;
	path: string;
	size: number;
	is_file: boolean;
	modified?: number;
}

export interface WatchingStatus {
	is_watching: boolean;
	current_path?: string;
}

// Tauri command functions
export interface TauriCommands {
	check_path_exists: (path: string) => Promise<boolean>;
	get_file_tree: (path: string) => Promise<FileNode>;
	start_watching: (path: string) => Promise<void>;
	stop_watching: () => Promise<void>;
	get_file_info: (path: string) => Promise<FileInfo>;
	read_file_content: (path: string) => Promise<string>;
	open_in_system: (path: string) => Promise<void>;
	select_project_folder: () => Promise<string | null>;
}
