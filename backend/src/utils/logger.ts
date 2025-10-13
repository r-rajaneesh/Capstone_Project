import fs from "fs";
import path from "path";
import { CONFIG } from "../config.js";

export enum LogLevel {
	ERROR = 0,
	WARN = 1,
	INFO = 2,
	DEBUG = 3,
}

interface LogEntry {
	timestamp: string;
	level: string;
	message: string;
	context?: any;
	error?: any;
}

class Logger {
	private logLevel: LogLevel;
	private logFile: string;

	constructor() {
		this.logLevel = this.getLogLevel(CONFIG.LOGGING.LEVEL);
		this.logFile = CONFIG.LOGGING.FILE;
		this.ensureLogDirectory();
	}

	private getLogLevel(level: string): LogLevel {
		switch (level.toLowerCase()) {
			case "error":
				return LogLevel.ERROR;
			case "warn":
				return LogLevel.WARN;
			case "info":
				return LogLevel.INFO;
			case "debug":
				return LogLevel.DEBUG;
			default:
				return LogLevel.INFO;
		}
	}

	private ensureLogDirectory(): void {
		const logDir = path.dirname(this.logFile);
		if (!fs.existsSync(logDir)) {
			fs.mkdirSync(logDir, { recursive: true });
		}
	}

	private formatMessage(level: string, message: string, context?: any, error?: any): string {
		const entry: LogEntry = {
			timestamp: new Date().toISOString(),
			level,
			message,
			context,
			error: error
				? {
						name: error.name,
						message: error.message,
						stack: error.stack,
				  }
				: undefined,
		};

		if (CONFIG.LOGGING.FORMAT === "json") {
			return JSON.stringify(entry);
		}

		// Simple format
		let formatted = `[${entry.timestamp}] ${level.toUpperCase()}: ${message}`;
		if (context) {
			formatted += ` | Context: ${JSON.stringify(context)}`;
		}
		if (error) {
			formatted += ` | Error: ${error.message}`;
		}
		return formatted;
	}

	private writeLog(level: string, message: string, context?: any, error?: any): void {
		if (this.getLogLevel(level) > this.logLevel) {
			return;
		}

		const formattedMessage = this.formatMessage(level, message, context, error);

		// Console output
		console.log(formattedMessage);

		// File output
		try {
			fs.appendFileSync(this.logFile, formattedMessage + "\n");
		} catch (err) {
			console.error("Failed to write to log file:", err);
		}
	}

	error(message: string, context?: any, error?: any): void {
		this.writeLog("error", message, context, error);
	}

	warn(message: string, context?: any): void {
		this.writeLog("warn", message, context);
	}

	info(message: string, context?: any): void {
		this.writeLog("info", message, context);
	}

	debug(message: string, context?: any): void {
		this.writeLog("debug", message, context);
	}

	// Specialized logging methods
	apiRequest(method: string, path: string, statusCode: number, duration: number, userAgent?: string): void {
		this.info("API Request", {
			method,
			path,
			statusCode,
			duration: `${duration}ms`,
			userAgent,
		});
	}

	fileUpload(filename: string, size: number, hash: string, success: boolean): void {
		this.info("File Upload", {
			filename,
			size: `${size} bytes`,
			hash,
			success,
		});
	}

	databaseQuery(query: string, duration: number, success: boolean): void {
		this.debug("Database Query", {
			query: query.substring(0, 100) + (query.length > 100 ? "..." : ""),
			duration: `${duration}ms`,
			success,
		});
	}

	hashComputation(program: string, filename: string, duration: number, success: boolean): void {
		this.info("Hash Computation", {
			program,
			filename,
			duration: `${duration}ms`,
			success,
		});
	}
}

// Create singleton instance
export const logger = new Logger();
