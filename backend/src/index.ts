import { Hono } from "hono";
import { cors } from "hono/cors";
import { CONFIG } from "./config.js";
import { initializeDatabase } from "./db/database.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./utils/errorHandler.js";
import { logger } from "./utils/logger.js";

// Import routes
import batchesRoutes from "./routes/batches.js";
import dashboardRoutes from "./routes/dashboard.js";
import hashRoutes from "./routes/hash.js";
import medicinesRoutes from "./routes/medicines.js";
import purchaseOrdersRoutes from "./routes/purchase-orders.js";
import salesRoutes from "./routes/sales.js";
import suppliersRoutes from "./routes/suppliers.js";
import uploadRoutes from "./routes/upload.js";

const app = new Hono();

// Initialize database
initializeDatabase();

// CORS middleware
app.use(
	"*",
	cors({
		origin: CONFIG.CORS.ORIGINS,
		allowHeaders: CONFIG.CORS.ALLOWED_HEADERS,
		allowMethods: CONFIG.CORS.ALLOWED_METHODS,
	}),
);

// Rate limiting middleware
app.use("*", rateLimiter.middleware());

// Error handling middleware
app.onError(errorHandler());

// Health check
app.get("/", (c) => {
	return c.json({ message: "Pharmacy Stock Management API", status: "running" });
});

// API routes
app.route("/api/medicines", medicinesRoutes);
app.route("/api/batches", batchesRoutes);
app.route("/api/suppliers", suppliersRoutes);
app.route("/api/purchase-orders", purchaseOrdersRoutes);
app.route("/api/sales", salesRoutes);
app.route("/api/upload", uploadRoutes);
app.route("/api/dashboard", dashboardRoutes);
app.route("/api/hash", hashRoutes);

const port = CONFIG.SERVER.PORT;

logger.info(`Server starting on http://${CONFIG.SERVER.HOST}:${port}`, {
	environment: CONFIG.SERVER.NODE_ENV,
	port,
});

// Graceful shutdown
process.on("SIGINT", () => {
	logger.info("Received SIGINT, shutting down gracefully");
	rateLimiter.destroy();
	process.exit(0);
});

process.on("SIGTERM", () => {
	logger.info("Received SIGTERM, shutting down gracefully");
	rateLimiter.destroy();
	process.exit(0);
});

export default {
	port,
	fetch: app.fetch,
};
