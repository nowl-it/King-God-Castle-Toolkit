import { invoke } from "@tauri-apps/api/core";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
	level: LogLevel;
	message: string;
	timestamp: string;
	context?: string;
	data?: unknown;
}

class Logger {
	private logToFile: boolean = process.env.NODE_ENV === "production";

	constructor() {
		// Initialize logger
		if (typeof window !== "undefined" && this.logToFile) {
			void this.ensureLogDirectory();
		}
	}

	private async ensureLogDirectory() {
		try {
			await invoke("ensure_log_directory");
		} catch (error) {
			console.error("Failed to ensure log directory:", error);
		}
	}

	private async writeToFile(entry: LogEntry) {
		if (!this.logToFile) {
			console.log(
				`[${entry.level.toUpperCase()}] ${entry.context ? `[${entry.context}] ` : ""}${entry.message}`,
				entry.data ?? "",
			);

			return;
		}

		try {
			await invoke("write_log_entry", {
				entry: {
					level: entry.level,
					message: entry.message,
					timestamp: entry.timestamp,
					context: entry.context ?? "",
					data: entry.data ? JSON.stringify(entry.data) : "",
				},
			});
		} catch (error) {
			// Fallback to console if file writing fails
			console.error("Failed to write to log file:", error);
			console.log(
				`[${entry.level.toUpperCase()}] ${entry.context ? `[${entry.context}] ` : ""}${entry.message}`,
				entry.data ?? "",
			);
		}
	}

	private createLogEntry(
		level: LogLevel,
		message: string,
		context?: string,
		data?: unknown,
	): LogEntry {
		return {
			level,
			message,
			timestamp: new Date().toISOString(),
			context,
			data,
		};
	}

	debug(message: string, context?: string, data?: unknown) {
		const entry = this.createLogEntry("debug", message, context, data);
		void this.writeToFile(entry);
	}

	info(message: string, context?: string, data?: unknown) {
		const entry = this.createLogEntry("info", message, context, data);
		void this.writeToFile(entry);
	}

	warn(message: string, context?: string, data?: unknown) {
		const entry = this.createLogEntry("warn", message, context, data);
		void this.writeToFile(entry);
	}

	error(message: string, context?: string, data?: unknown) {
		const entry = this.createLogEntry("error", message, context, data);
		void this.writeToFile(entry);
	}

	// Hero-specific logging methods
	heroLoading(heroId: string, message: string, data?: unknown) {
		this.info(message, `Heroes/${heroId}`, data);
	}

	heroError(heroId: string, message: string, error?: unknown) {
		this.error(message, `Heroes/${heroId}`, error);
	}

	heroCache(heroId: string, message: string, data?: unknown) {
		this.debug(message, `Heroes/Cache/${heroId}`, data);
	}

	heroSkin(heroId: string, skinId: string, message: string, data?: unknown) {
		this.info(message, `Heroes/${heroId}/Skin/${skinId}`, data);
	}

	heroAsset(heroId: string, message: string, data?: unknown) {
		this.debug(message, `Heroes/${heroId}/Asset`, data);
	}

	// Disable file logging (for testing or development)
	disableFileLogging() {
		this.logToFile = false;
	}

	// Enable file logging
	enableFileLogging() {
		this.logToFile = true;
		void this.ensureLogDirectory();
	}
}

// Create a singleton logger instance
export const logger = new Logger();

// Export convenience functions
export const log = {
	debug: (message: string, context?: string, data?: unknown) => {
		logger.debug(message, context, data);
	},
	info: (message: string, context?: string, data?: unknown) => {
		logger.info(message, context, data);
	},
	warn: (message: string, context?: string, data?: unknown) => {
		logger.warn(message, context, data);
	},
	error: (message: string, context?: string, data?: unknown) => {
		logger.error(message, context, data);
	},

	// Hero-specific shortcuts
	hero: {
		loading: (heroId: string, message: string, data?: unknown) => {
			logger.heroLoading(heroId, message, data);
		},
		error: (heroId: string, message: string, error?: unknown) => {
			logger.heroError(heroId, message, error);
		},
		cache: (heroId: string, message: string, data?: unknown) => {
			logger.heroCache(heroId, message, data);
		},
		skin: (heroId: string, skinId: string, message: string, data?: unknown) => {
			logger.heroSkin(heroId, skinId, message, data);
		},
		asset: (heroId: string, message: string, data?: unknown) => {
			logger.heroAsset(heroId, message, data);
		},
	},
};
