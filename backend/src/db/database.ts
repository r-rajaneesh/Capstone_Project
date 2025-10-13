import { Database } from "bun:sqlite";
import path from "path";
import { CREATE_TABLES, INSERT_SAMPLE_DATA } from "./schema.js";

const dbPath = path.join(process.cwd(), "pharmacy.db");
const db = new Database(dbPath);

// Initialize database
const initializeDatabase = () => {
	try {
		// Enable foreign keys
		db.exec("PRAGMA foreign_keys = ON");

		// Create tables
		db.exec(CREATE_TABLES);

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
