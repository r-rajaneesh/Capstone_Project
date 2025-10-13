import { spawn } from "child_process";
import { Hono } from "hono";
import path from "path";

const app = new Hono();

// Helper function to execute hash program
const executeHashProgram = (programPath: string, filePath: string): Promise<string> => {
	return new Promise((resolve, reject) => {
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
				resolve(output.trim());
			} else {
				reject(new Error(`Process exited with code ${code}: ${error}`));
			}
		});

		process.on("error", (err) => {
			reject(err);
		});
	});
};

// C hash endpoint
app.post("/c", async (c) => {
	try {
		const body = await c.req.json();
		const { filePath } = body;

		if (!filePath) {
			return c.json({ error: "filePath is required" }, 400);
		}

		// Path to the compiled C binary
		const cProgramPath = path.join(process.cwd(), "bin", "hash-c");

		const hash = await executeHashProgram(cProgramPath, filePath);

		return c.json({
			hash,
			algorithm: "MD5",
			program: "C",
			filePath,
		});
	} catch (error) {
		return c.json(
			{
				error: "Failed to compute hash with C program",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
});

// C++ hash endpoint
app.post("/cpp", async (c) => {
	try {
		const body = await c.req.json();
		const { filePath } = body;

		if (!filePath) {
			return c.json({ error: "filePath is required" }, 400);
		}

		// Path to the compiled C++ binary
		const cppProgramPath = path.join(process.cwd(), "bin", "hash-cpp");

		const hash = await executeHashProgram(cppProgramPath, filePath);

		return c.json({
			hash,
			algorithm: "MD5",
			program: "C++",
			filePath,
		});
	} catch (error) {
		return c.json(
			{
				error: "Failed to compute hash with C++ program",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
});

// Combined hash endpoint - runs both C and C++ and compares results
app.post("/compare", async (c) => {
	try {
		const body = await c.req.json();
		const { filePath } = body;

		if (!filePath) {
			return c.json({ error: "filePath is required" }, 400);
		}

		const cProgramPath = path.join(process.cwd(), "bin", "hash-c");
		const cppProgramPath = path.join(process.cwd(), "bin", "hash-cpp");

		// Run both programs in parallel
		const [cHash, cppHash] = await Promise.all([
			executeHashProgram(cProgramPath, filePath),
			executeHashProgram(cppProgramPath, filePath),
		]);

		const hashesMatch = cHash === cppHash;

		return c.json({
			filePath,
			algorithm: "MD5",
			results: {
				c: {
					hash: cHash,
					program: "C",
				},
				cpp: {
					hash: cppHash,
					program: "C++",
				},
			},
			hashesMatch,
			status: hashesMatch ? "success" : "mismatch",
		});
	} catch (error) {
		return c.json(
			{
				error: "Failed to compute hashes",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
});

// Health check for hash programs
app.get("/health", async (c) => {
	try {
		const cProgramPath = path.join(process.cwd(), "bin", "hash-c");
		const cppProgramPath = path.join(process.cwd(), "bin", "hash-cpp");

		// Create a temporary test file
		const testFilePath = path.join(process.cwd(), "test-hash.txt");
		const fs = await import("fs");
		fs.writeFileSync(testFilePath, "test content for hash verification");

		const [cHash, cppHash] = await Promise.all([
			executeHashProgram(cProgramPath, testFilePath),
			executeHashProgram(cppProgramPath, testFilePath),
		]);

		// Clean up test file
		fs.unlinkSync(testFilePath);

		const hashesMatch = cHash === cppHash;

		return c.json({
			status: "healthy",
			programs: {
				c: {
					available: true,
					path: cProgramPath,
					testHash: cHash,
				},
				cpp: {
					available: true,
					path: cppProgramPath,
					testHash: cppHash,
				},
			},
			hashesMatch,
			algorithm: "MD5",
		});
	} catch (error) {
		return c.json(
			{
				status: "unhealthy",
				error: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
});

export default app;
