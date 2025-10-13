import { spawn } from "child_process";
import crypto from "crypto";
import fs from "fs";
import { Hono } from "hono";
import path from "path";
import { CONFIG } from "../config.js";
import { getDatabase } from "../db/database.js";
import { handleValidationError } from "../utils/errorHandler.js";
import { logger } from "../utils/logger.js";
import { Validator } from "../utils/validation.js";

const app = new Hono();
const db = getDatabase();

// Helper function to execute hash program
const executeHashProgram = (programPath: string, filePath: string): Promise<string> => {
	return new Promise((resolve, reject) => {
		// Check if program exists
		if (!fs.existsSync(programPath)) {
			reject(new Error(`Hash program not found at ${programPath}`));
			return;
		}

		// Check if file exists
		if (!fs.existsSync(filePath)) {
			reject(new Error(`File not found at ${filePath}`));
			return;
		}

		const process = spawn(programPath, [filePath]);

		let output = "";
		let error = "";

		process.stdout.on("data", (data) => {
			output += data.toString();
		});

		process.stderr.on("data", (data) => {
			error += data.toString();
		});

		process.on("close", (code) => {
			if (code === 0) {
				const hash = output.trim();
				if (!hash || hash.length !== 32) {
					reject(new Error(`Invalid hash output: ${hash}`));
				} else {
					resolve(hash);
				}
			} else {
				reject(new Error(`Hash program failed with code ${code}: ${error}`));
			}
		});

		process.on("error", (err) => {
			reject(new Error(`Failed to start hash program: ${err.message}`));
		});

		// Set timeout to prevent hanging
		setTimeout(() => {
			process.kill();
			reject(new Error("Hash program timeout"));
		}, CONFIG.UPLOAD.HASH_TIMEOUT);
	});
};

// Helper function to parse CSV
const parseCSV = (content: string): any[] => {
	const lines = content.trim().split("\n");
	if (lines.length === 0 || !lines[0]) {
		return [];
	}
	const headers = lines[0].split(",").map((h) => h.trim());

	return lines.slice(1).map((line) => {
		const values = line.split(",").map((v) => v.trim());
		const row: any = {};
		headers.forEach((header, index) => {
			row[header] = values[index] || "";
		});
		return row;
	});
};

// Helper function to parse JSON
const parseJSON = (content: string): any[] => {
	const data = JSON.parse(content);
	return Array.isArray(data) ? data : [data];
};

// Helper function to validate inventory item
const validateInventoryItem = (item: any): string[] => {
	const errors: string[] = [];

	if (!item.medicine_name) errors.push("medicine_name is required");
	if (!item.batch_number) errors.push("batch_number is required");
	if (!item.quantity || isNaN(parseInt(item.quantity))) errors.push("quantity must be a valid number");
	if (!item.cost_price || isNaN(parseFloat(item.cost_price))) errors.push("cost_price must be a valid number");
	if (!item.selling_price || isNaN(parseFloat(item.selling_price))) errors.push("selling_price must be a valid number");
	if (!item.expiry_date) errors.push("expiry_date is required");
	if (!item.supplier_name) errors.push("supplier_name is required");

	return errors;
};

// Helper function to compare hashes with database records
const compareHashesWithDatabase = (
	cHash: string,
	cppHash: string,
): {
	cHashValid: boolean;
	cppHashValid: boolean;
	cDatabaseComparison: {
		existingRecords: any[];
		duplicateFound: boolean;
		similarHashes: any[];
	};
	cppDatabaseComparison: {
		existingRecords: any[];
		duplicateFound: boolean;
		similarHashes: any[];
	};
} => {
	// Check for exact hash matches for C hash
	const cExistingRecords = db.prepare("SELECT * FROM inventory_uploads WHERE file_hash = ?").all(cHash);
	const cSimilarHashes = db
		.prepare(
			`
		SELECT * FROM inventory_uploads
		WHERE file_hash LIKE ?
		AND file_hash != ?
		ORDER BY upload_date DESC
	`,
		)
		.all(`${cHash.substring(0, 8)}%`, cHash);

	// Check for exact hash matches for C++ hash
	const cppExistingRecords = db.prepare("SELECT * FROM inventory_uploads WHERE file_hash = ?").all(cppHash);
	const cppSimilarHashes = db
		.prepare(
			`
		SELECT * FROM inventory_uploads
		WHERE file_hash LIKE ?
		AND file_hash != ?
		ORDER BY upload_date DESC
	`,
		)
		.all(`${cppHash.substring(0, 8)}%`, cppHash);

	return {
		cHashValid: cExistingRecords.length === 0, // C hash is valid if no duplicates found
		cppHashValid: cppExistingRecords.length === 0, // C++ hash is valid if no duplicates found
		cDatabaseComparison: {
			existingRecords: cExistingRecords,
			duplicateFound: cExistingRecords.length > 0,
			similarHashes: cSimilarHashes,
		},
		cppDatabaseComparison: {
			existingRecords: cppExistingRecords,
			duplicateFound: cppExistingRecords.length > 0,
			similarHashes: cppSimilarHashes,
		},
	};
};

// Helper function to process inventory items
const processInventoryItems = async (items: any[]): Promise<{ processed: number; errors: string[] }> => {
	let processed = 0;
	const errors: string[] = [];

	// Process items in a database transaction
	const transaction = db.transaction(() => {
		for (const item of items) {
			try {
				// Validate item
				const validationErrors = validateInventoryItem(item);
				if (validationErrors.length > 0) {
					errors.push(`Row ${processed + 1}: ${validationErrors.join(", ")}`);
					continue;
				}

				// Find or create supplier
				let supplier = db.prepare("SELECT * FROM suppliers WHERE name = ?").get(item.supplier_name);
				if (!supplier) {
					const supplierResult = db
						.prepare(
							`
          INSERT INTO suppliers (name, contact_person, phone, email, address)
          VALUES (?, ?, ?, ?, ?)
        `,
						)
						.run(item.supplier_name, "", "", "", "");
					supplier = db.prepare("SELECT * FROM suppliers WHERE id = ?").get(supplierResult.lastInsertRowid);
				}

				// Find or create medicine
				let medicine = db.prepare("SELECT * FROM medicines WHERE name = ?").get(item.medicine_name);
				if (!medicine) {
					const medicineResult = db
						.prepare(
							`
          INSERT INTO medicines (name, description, generic_name, dosage_form, strength, manufacturer)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
						)
						.run(
							item.medicine_name,
							item.description || "",
							item.generic_name || "",
							item.dosage_form || "",
							item.strength || "",
							item.manufacturer || item.supplier_name,
						);
					medicine = db.prepare("SELECT * FROM medicines WHERE id = ?").get(medicineResult.lastInsertRowid);
				}

				// Check if batch already exists
				const existingBatch = db
					.prepare(
						`
        SELECT * FROM batches WHERE medicine_id = ? AND batch_number = ?
      `,
					)
					.get((medicine as any).id, item.batch_number);

				if (existingBatch) {
					// Update existing batch
					db.prepare(
						`
          UPDATE batches
          SET quantity = ?, cost_price = ?, selling_price = ?, expiry_date = ?, supplier_id = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
					).run(
						item.quantity,
						item.cost_price,
						item.selling_price,
						item.expiry_date,
						(supplier as any).id,
						(existingBatch as any).id,
					);
				} else {
					// Create new batch
					db.prepare(
						`
          INSERT INTO batches (medicine_id, batch_number, quantity, cost_price, selling_price, manufacturing_date, expiry_date, supplier_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
					).run(
						(medicine as any).id,
						item.batch_number,
						item.quantity,
						item.cost_price,
						item.selling_price,
						item.manufacturing_date || new Date().toISOString().split("T")[0],
						item.expiry_date,
						(supplier as any).id,
					);
				}

				processed++;
			} catch (error) {
				errors.push(`Row ${processed + 1}: ${error instanceof Error ? error.message : "Unknown error"}`);
			}
		}
	});

	// Execute transaction
	try {
		transaction();
	} catch (error) {
		errors.push(`Transaction failed: ${error instanceof Error ? error.message : "Unknown error"}`);
	}

	return { processed, errors };
};

// Upload CSV file
app.post("/csv", async (c) => {
	const startTime = Date.now();

	try {
		const formData = await c.req.formData();
		const file = formData.get("file") as File;

		if (!file) {
			throw handleValidationError(["No file uploaded"]);
		}

		if (!file.name.toLowerCase().endsWith(".csv")) {
			throw handleValidationError(["File must be a CSV file"]);
		}

		// Validate file
		const validation = Validator.validateFile(file);
		if (!validation.isValid) {
			throw handleValidationError(validation.errors);
		}

		// Save file to uploads directory
		const uploadsDir = path.join(process.cwd(), CONFIG.UPLOAD.UPLOAD_DIR);
		if (!fs.existsSync(uploadsDir)) {
			fs.mkdirSync(uploadsDir, { recursive: true });
		}

		// Generate unique filename using crypto.randomUUID() to prevent race conditions
		const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").replace(/\.{2,}/g, ".");
		const uniqueId = crypto.randomUUID();
		const fileName = `${uniqueId}-${sanitizedFileName}`;
		const filePath = path.join(uploadsDir, fileName);
		const fileBuffer = await file.arrayBuffer();
		fs.writeFileSync(filePath, Buffer.from(fileBuffer));

		logger.info(`File uploaded: ${fileName}`, {
			originalName: file.name,
			size: file.size,
			type: file.type,
		});

		// Compute hashes using C and C++ programs
		const cProgramPath = path.join(process.cwd(), "bin", "hash-c");
		const cppProgramPath = path.join(process.cwd(), "bin", "hash-cpp");

		const [cHash, cppHash] = await Promise.all([
			executeHashProgram(cProgramPath, filePath),
			executeHashProgram(cppProgramPath, filePath),
		]);

		// Compare hashes with database records
		const hashComparison = compareHashesWithDatabase(cHash, cppHash);

		// Log hash comparison results
		logger.info("Hash comparison results", {
			fileName,
			cHash,
			cppHash,
			cHashValid: hashComparison.cHashValid,
			cppHashValid: hashComparison.cppHashValid,
			cDuplicateFound: hashComparison.cDatabaseComparison.duplicateFound,
			cppDuplicateFound: hashComparison.cppDatabaseComparison.duplicateFound,
			cExistingRecordsCount: hashComparison.cDatabaseComparison.existingRecords.length,
			cppExistingRecordsCount: hashComparison.cppDatabaseComparison.existingRecords.length,
		});

		// Check if either hash indicates a duplicate file
		if (!hashComparison.cHashValid || !hashComparison.cppHashValid) {
			fs.unlinkSync(filePath); // Clean up file

			// Determine which hash found the duplicate
			const duplicateHash = !hashComparison.cHashValid ? cHash : cppHash;
			const duplicateComparison = !hashComparison.cHashValid
				? hashComparison.cDatabaseComparison
				: hashComparison.cppDatabaseComparison;
			const existingUpload = duplicateComparison.existingRecords[0];

			return c.json(
				{
					error: "Duplicate file detected",
					message: "This file has already been uploaded",
					existingFile: (existingUpload as any).filename,
					uploadDate: (existingUpload as any).upload_date,
					duplicateHash,
					hashComparison,
				},
				409,
			);
		}

		// Parse CSV content
		const fileContent = fs.readFileSync(filePath, "utf-8");
		const items = parseCSV(fileContent);

		// Process inventory items
		const result = await processInventoryItems(items);

		// Save upload record
		db.prepare(
			`
      INSERT INTO inventory_uploads (filename, file_hash, file_path, format, processed_by)
      VALUES (?, ?, ?, ?, ?)
    `,
		).run(fileName, cHash, filePath, "csv", "system");

		return c.json({
			message: "File uploaded and processed successfully",
			filename: fileName,
			hash: cHash,
			format: "csv",
			itemsProcessed: result.processed,
			totalItems: items.length,
			errors: result.errors,
			cHashValid: hashComparison.cHashValid,
			cppHashValid: hashComparison.cppHashValid,
			hashComparison,
		});
	} catch (error) {
		return c.json(
			{
				error: "Failed to upload and process CSV file",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
});

// Upload JSON file
app.post("/json", async (c) => {
	try {
		const formData = await c.req.formData();
		const file = formData.get("file") as File;

		if (!file) {
			return c.json({ error: "No file uploaded" }, 400);
		}

		if (!file.name.toLowerCase().endsWith(".json")) {
			return c.json({ error: "File must be a JSON file" }, 400);
		}

		// Validate file size (max 10MB)
		const maxSize = 10 * 1024 * 1024; // 10MB
		if (file.size > maxSize) {
			return c.json({ error: "File size too large. Maximum size is 10MB" }, 400);
		}

		// Save file to uploads directory
		const uploadsDir = path.join(process.cwd(), "uploads");
		if (!fs.existsSync(uploadsDir)) {
			fs.mkdirSync(uploadsDir, { recursive: true });
		}

		// Sanitize filename to prevent path traversal attacks
		const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").replace(/\.{2,}/g, ".");
		const fileName = `${Date.now()}-${sanitizedFileName}`;
		const filePath = path.join(uploadsDir, fileName);
		const fileBuffer = await file.arrayBuffer();
		fs.writeFileSync(filePath, Buffer.from(fileBuffer));

		// Compute hashes using C and C++ programs
		const cProgramPath = path.join(process.cwd(), "bin", "hash-c");
		const cppProgramPath = path.join(process.cwd(), "bin", "hash-cpp");

		const [cHash, cppHash] = await Promise.all([
			executeHashProgram(cProgramPath, filePath),
			executeHashProgram(cppProgramPath, filePath),
		]);

		// Compare hashes with database records
		const hashComparison = compareHashesWithDatabase(cHash, cppHash);

		// Log hash comparison results
		logger.info("Hash comparison results", {
			fileName,
			cHash,
			cppHash,
			cHashValid: hashComparison.cHashValid,
			cppHashValid: hashComparison.cppHashValid,
			cDuplicateFound: hashComparison.cDatabaseComparison.duplicateFound,
			cppDuplicateFound: hashComparison.cppDatabaseComparison.duplicateFound,
			cExistingRecordsCount: hashComparison.cDatabaseComparison.existingRecords.length,
			cppExistingRecordsCount: hashComparison.cppDatabaseComparison.existingRecords.length,
		});

		// Check if either hash indicates a duplicate file
		if (!hashComparison.cHashValid || !hashComparison.cppHashValid) {
			fs.unlinkSync(filePath); // Clean up file

			// Determine which hash found the duplicate
			const duplicateHash = !hashComparison.cHashValid ? cHash : cppHash;
			const duplicateComparison = !hashComparison.cHashValid
				? hashComparison.cDatabaseComparison
				: hashComparison.cppDatabaseComparison;
			const existingUpload = duplicateComparison.existingRecords[0];

			return c.json(
				{
					error: "Duplicate file detected",
					message: "This file has already been uploaded",
					existingFile: (existingUpload as any).filename,
					uploadDate: (existingUpload as any).upload_date,
					duplicateHash,
					hashComparison,
				},
				409,
			);
		}

		// Parse JSON content
		const fileContent = fs.readFileSync(filePath, "utf-8");
		const items = parseJSON(fileContent);

		// Process inventory items
		const result = await processInventoryItems(items);

		// Save upload record
		db.prepare(
			`
      INSERT INTO inventory_uploads (filename, file_hash, file_path, format, processed_by)
      VALUES (?, ?, ?, ?, ?)
    `,
		).run(fileName, cHash, filePath, "json", "system");

		return c.json({
			message: "File uploaded and processed successfully",
			filename: fileName,
			hash: cHash,
			format: "json",
			itemsProcessed: result.processed,
			totalItems: items.length,
			errors: result.errors,
			cHashValid: hashComparison.cHashValid,
			cppHashValid: hashComparison.cppHashValid,
			hashComparison,
		});
	} catch (error) {
		return c.json(
			{
				error: "Failed to upload and process JSON file",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
});

// Get upload history
app.get("/history", (c) => {
	const page = parseInt(c.req.query("page") || "1");
	const limit = parseInt(c.req.query("limit") || "10");
	const offset = (page - 1) * limit;

	const uploads = db
		.prepare(
			`
    SELECT * FROM inventory_uploads
    ORDER BY upload_date DESC
    LIMIT ? OFFSET ?
  `,
		)
		.all(limit, offset);

	const { total } = db.prepare("SELECT COUNT(*) as total FROM inventory_uploads").get() as { total: number };

	return c.json({
		uploads,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	});
});

export default app;
