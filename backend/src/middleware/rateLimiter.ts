import { Context, Next } from "hono";
import { CONFIG, ERROR_MESSAGES } from "../config.js";
import { logger } from "../utils/logger.js";

interface RateLimitEntry {
	count: number;
	resetTime: number;
}

class RateLimiter {
	private requests: Map<string, RateLimitEntry> = new Map();
	private cleanupInterval: NodeJS.Timeout;

	constructor() {
		// Clean up expired entries every minute
		this.cleanupInterval = setInterval(() => {
			this.cleanup();
		}, 60000);
	}

	private getClientId(c: Context): string {
		// Try to get IP from various headers
		const forwarded = c.req.header("x-forwarded-for");
		const realIp = c.req.header("x-real-ip");
		const cfConnectingIp = c.req.header("cf-connecting-ip");

		// Use the first available IP
		const ip = forwarded?.split(",")[0] || realIp || cfConnectingIp || "unknown";
		return ip.trim();
	}

	private cleanup(): void {
		const now = Date.now();
		for (const [key, entry] of this.requests.entries()) {
			if (now > entry.resetTime) {
				this.requests.delete(key);
			}
		}
	}

	private isAllowed(clientId: string): { allowed: boolean; remaining: number; resetTime: number } {
		const now = Date.now();
		const windowMs = CONFIG.API.RATE_LIMIT.WINDOW_MS;
		const maxRequests = CONFIG.API.RATE_LIMIT.MAX_REQUESTS;

		let entry = this.requests.get(clientId);

		// If no entry exists or window has expired, create new entry
		if (!entry || now > entry.resetTime) {
			entry = {
				count: 1,
				resetTime: now + windowMs,
			};
			this.requests.set(clientId, entry);
			return {
				allowed: true,
				remaining: maxRequests - 1,
				resetTime: entry.resetTime,
			};
		}

		// Check if limit exceeded
		if (entry.count >= maxRequests) {
			return {
				allowed: false,
				remaining: 0,
				resetTime: entry.resetTime,
			};
		}

		// Increment count
		entry.count++;
		this.requests.set(clientId, entry);

		return {
			allowed: true,
			remaining: maxRequests - entry.count,
			resetTime: entry.resetTime,
		};
	}

	public middleware() {
		return async (c: Context, next: Next) => {
			const clientId = this.getClientId(c);
			const result = this.isAllowed(clientId);

			// Add rate limit headers
			c.header("X-RateLimit-Limit", CONFIG.API.RATE_LIMIT.MAX_REQUESTS.toString());
			c.header("X-RateLimit-Remaining", result.remaining.toString());
			c.header("X-RateLimit-Reset", new Date(result.resetTime).toISOString());

			if (!result.allowed) {
				logger.warn("Rate limit exceeded", {
					clientId,
					path: c.req.path,
					method: c.req.method,
				});

				return c.json(
					{
						error: ERROR_MESSAGES.API.RATE_LIMIT_EXCEEDED,
						retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
					},
					429,
				);
			}

			await next();
		};
	}

	public destroy(): void {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
		}
		this.requests.clear();
	}
}

// Create singleton instance
export const rateLimiter = new RateLimiter();
