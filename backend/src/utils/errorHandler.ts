import { Context } from "hono";
import { ERROR_MESSAGES } from "../config.js";
import { logger } from "./logger.js";

export interface ApiError {
	error: string;
	message?: string;
	details?: any;
	code?: string;
	timestamp: string;
	path?: string;
}

export class AppError extends Error {
	public statusCode: number;
	public code?: string;
	public details?: any;

	constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
		super(message);
		this.name = "AppError";
		this.statusCode = statusCode;
		this.code = code;
		this.details = details;

		// Capture stack trace
		Error.captureStackTrace(this, this.constructor);
	}
}

export class ValidationError extends AppError {
	constructor(message: string, details?: any) {
		super(message, 400, "VALIDATION_ERROR", details);
		this.name = "ValidationError";
	}
}

export class NotFoundError extends AppError {
	constructor(resource: string = "Resource") {
		super(`${resource} not found`, 404, "NOT_FOUND");
		this.name = "NotFoundError";
	}
}

export class UnauthorizedError extends AppError {
	constructor(message: string = "Unauthorized access") {
		super(message, 401, "UNAUTHORIZED");
		this.name = "UnauthorizedError";
	}
}

export class ForbiddenError extends AppError {
	constructor(message: string = "Access forbidden") {
		super(message, 403, "FORBIDDEN");
		this.name = "ForbiddenError";
	}
}

export class ConflictError extends AppError {
	constructor(message: string, details?: any) {
		super(message, 409, "CONFLICT", details);
		this.name = "ConflictError";
	}
}

export class InternalServerError extends AppError {
	constructor(message: string = "Internal server error", details?: any) {
		super(message, 500, "INTERNAL_ERROR", details);
		this.name = "InternalServerError";
	}
}

export function createErrorResponse(error: any, path?: string): ApiError {
	const timestamp = new Date().toISOString();

	// Handle known application errors
	if (error instanceof AppError) {
		return {
			error: error.message,
			code: error.code,
			details: error.details,
			timestamp,
			path,
		};
	}

	// Handle validation errors
	if (error.name === "ValidationError") {
		return {
			error: "Validation failed",
			message: error.message,
			details: error.details,
			timestamp,
			path,
		};
	}

	// Handle database errors
	if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
		return {
			error: "Duplicate entry",
			message: "A record with this information already exists",
			code: "DUPLICATE_ENTRY",
			timestamp,
			path,
		};
	}

	if (error.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
		return {
			error: "Foreign key constraint failed",
			message: "Referenced record does not exist",
			code: "FOREIGN_KEY_ERROR",
			timestamp,
			path,
		};
	}

	// Handle file system errors
	if (error.code === "ENOENT") {
		return {
			error: "File not found",
			message: "The requested file could not be found",
			code: "FILE_NOT_FOUND",
			timestamp,
			path,
		};
	}

	if (error.code === "EACCES") {
		return {
			error: "Permission denied",
			message: "Insufficient permissions to access the resource",
			code: "PERMISSION_DENIED",
			timestamp,
			path,
		};
	}

	// Handle timeout errors
	if (error.code === "ETIMEDOUT" || error.message?.includes("timeout")) {
		return {
			error: "Request timeout",
			message: "The request took too long to process",
			code: "TIMEOUT",
			timestamp,
			path,
		};
	}

	// Default error response
	return {
		error: ERROR_MESSAGES.API.INTERNAL_ERROR,
		message: process.env.NODE_ENV === "development" ? error.message : undefined,
		details: process.env.NODE_ENV === "development" ? error.stack : undefined,
		timestamp,
		path,
	};
}

export function getStatusCode(error: any): number {
	if (error instanceof AppError) {
		return error.statusCode;
	}

	if (error.name === "ValidationError") {
		return 400;
	}

	if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
		return 409;
	}

	if (error.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
		return 400;
	}

	if (error.code === "ENOENT") {
		return 404;
	}

	if (error.code === "EACCES") {
		return 403;
	}

	if (error.code === "ETIMEDOUT" || error.message?.includes("timeout")) {
		return 408;
	}

	return 500;
}

export function errorHandler() {
	return async (error: any, c: Context) => {
		const path = c.req.path;
		const method = c.req.method;
		const statusCode = getStatusCode(error);

		// Log the error
		logger.error(`Error in ${method} ${path}`, {
			method,
			path,
			statusCode,
			error: error.message,
			stack: error.stack,
		});

		// Create error response
		const errorResponse = createErrorResponse(error, path);

		// Return error response
		return c.json(errorResponse, statusCode);
	};
}

// Utility functions for common error scenarios
export function handleValidationError(errors: string[]): ValidationError {
	return new ValidationError("Validation failed", { errors });
}

export function handleNotFoundError(resource: string = "Resource"): NotFoundError {
	return new NotFoundError(resource);
}

export function handleUnauthorizedError(message?: string): UnauthorizedError {
	return new UnauthorizedError(message);
}

export function handleForbiddenError(message?: string): ForbiddenError {
	return new ForbiddenError(message);
}

export function handleConflictError(message: string, details?: any): ConflictError {
	return new ConflictError(message, details);
}

export function handleInternalError(message?: string, details?: any): InternalServerError {
	return new InternalServerError(message, details);
}
