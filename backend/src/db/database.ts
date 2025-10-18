import { Database } from "bun:sqlite";
import path from "path";
import { CREATE_TABLES, INSERT_SAMPLE_DATA } from "./schema.js";

const dbPath = path.join(process.cwd(), "pharmacy.db");
const db = new Database(dbPath);

// Ensure incremental schema upgrades for existing databases
const applyMigrationsIfNeeded = () => {
	try {
		// Check if 'initial_stock' column exists on 'medicines'; add if missing
		const columns = db.prepare("PRAGMA table_info(medicines)").all() as { name: string }[];

		const hasInitialStock = columns.some((c) => c.name === "initial_stock");
		if (!hasInitialStock) {
			db.exec("ALTER TABLE medicines ADD COLUMN initial_stock INTEGER DEFAULT 0");
		}
	} catch (error) {
		console.error("Schema migration check failed:", error);
		throw error;
	}
};

// Initialize database
const initializeDatabase = () => {
	try {
		// Enable foreign keys
		db.exec("PRAGMA foreign_keys = ON");

		// Create tables
		db.exec(CREATE_TABLES);

		// Apply any incremental migrations for existing DBs
		applyMigrationsIfNeeded();

		// Insert sample data
		db.exec(INSERT_SAMPLE_DATA);

		console.log("Database initialized successfully");
		return db;
	} catch (error) {
		console.error("Database initialization failed:", error);
		throw error;
	}
};

// Helper function to get database instance
export const getDatabase = () => db;

// Helper function to close database connection
export const closeDatabase = () => {
	db.close();
};

export { initializeDatabase };
export default db;
