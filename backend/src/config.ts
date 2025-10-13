// Configuration constants for the Pharmacy Stock Management System
export const CONFIG = {
	// Server configuration
	SERVER: {
		PORT: process.env.PORT || 3000,
		HOST: process.env.HOST || "localhost",
		NODE_ENV: process.env.NODE_ENV || "development",
	},

	// File upload configuration
	UPLOAD: {
		MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
		ALLOWED_EXTENSIONS: [".csv", ".json"],
		UPLOAD_DIR: "uploads",
		HASH_TIMEOUT: 30000, // 30 seconds
	},

	// Database configuration
	DATABASE: {
		PATH: process.env.DATABASE_PATH || "pharmacy.db",
		BACKUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
	},

	// API configuration
	API: {
		RATE_LIMIT: {
			WINDOW_MS: 15 * 60 * 1000, // 15 minutes
			MAX_REQUESTS: 100, // requests per window
		},
		PAGINATION: {
			DEFAULT_LIMIT: 10,
			MAX_LIMIT: 100,
		},
	},

	// Hash programs configuration
	HASH_PROGRAMS: {
		C_PROGRAM: "bin/hash-c",
		CPP_PROGRAM: "bin/hash-cpp",
	},

	// CORS configuration
	CORS: {
		ORIGINS: ["http://localhost:4321", "http://127.0.0.1:4321", "http://rajaneeshr.theworkpc.com:4321"] as string[],
		ALLOWED_HEADERS: ["Content-Type", "Authorization"] as string[],
		ALLOWED_METHODS: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] as string[],
	},

	// Logging configuration
	LOGGING: {
		LEVEL: process.env.LOG_LEVEL || "info",
		FORMAT: process.env.LOG_FORMAT || "json",
		FILE: process.env.LOG_FILE || "logs/app.log",
	},

	// Security configuration
	SECURITY: {
		SESSION_SECRET: process.env.SESSION_SECRET || "default-secret-change-in-production",
		JWT_SECRET: process.env.JWT_SECRET || "default-jwt-secret-change-in-production",
		BCRYPT_ROUNDS: 12,
	},
} as const;

// Validation schemas
export const VALIDATION = {
	MEDICINE: {
		NAME_MAX_LENGTH: 255,
		DESCRIPTION_MAX_LENGTH: 1000,
		STRENGTH_MAX_LENGTH: 50,
		MANUFACTURER_MAX_LENGTH: 255,
	},
	SUPPLIER: {
		NAME_MAX_LENGTH: 255,
		CONTACT_PERSON_MAX_LENGTH: 255,
		PHONE_MAX_LENGTH: 20,
		EMAIL_MAX_LENGTH: 255,
		ADDRESS_MAX_LENGTH: 500,
	},
	BATCH: {
		BATCH_NUMBER_MAX_LENGTH: 50,
		MIN_QUANTITY: 0,
		MAX_QUANTITY: 1000000,
		MIN_PRICE: 0,
		MAX_PRICE: 10000,
	},
	FILE: {
		MAX_FILENAME_LENGTH: 255,
		ALLOWED_MIME_TYPES: ["text/csv", "application/json"],
	},
} as const;

// Error messages
export const ERROR_MESSAGES = {
	VALIDATION: {
		REQUIRED_FIELD: (field: string) => `${field} is required`,
		INVALID_FORMAT: (field: string) => `Invalid ${field} format`,
		TOO_LONG: (field: string, maxLength: number) => `${field} must be less than ${maxLength} characters`,
		TOO_SHORT: (field: string, minLength: number) => `${field} must be at least ${minLength} characters`,
		INVALID_RANGE: (field: string, min: number, max: number) => `${field} must be between ${min} and ${max}`,
	},
	FILE: {
		TOO_LARGE: `File size exceeds maximum limit of ${CONFIG.UPLOAD.MAX_FILE_SIZE / (1024 * 1024)}MB`,
		INVALID_TYPE: "Invalid file type. Only CSV and JSON files are allowed",
		UPLOAD_FAILED: "File upload failed",
		PROCESSING_FAILED: "File processing failed",
		DUPLICATE_FILE: "This file has already been uploaded",
		HASH_MISMATCH: "Hash verification failed - file integrity compromised",
	},
	DATABASE: {
		CONNECTION_FAILED: "Database connection failed",
		QUERY_FAILED: "Database query failed",
		TRANSACTION_FAILED: "Database transaction failed",
	},
	API: {
		RATE_LIMIT_EXCEEDED: "Rate limit exceeded. Please try again later",
		UNAUTHORIZED: "Unauthorized access",
		FORBIDDEN: "Access forbidden",
		NOT_FOUND: "Resource not found",
		INTERNAL_ERROR: "Internal server error",
	},
} as const;
