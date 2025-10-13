import { Hono } from "hono";
import { getDatabase } from "../db/database.js";

const app = new Hono();
const db = getDatabase();

// Get all medicines with optional search
app.get("/", async (c) => {
	const search = c.req.query("search");
	const page = parseInt(c.req.query("page") || "1");
	const limit = parseInt(c.req.query("limit") || "10");
	const offset = (page - 1) * limit;

	let query = `
    SELECT m.*,
           COALESCE(SUM(b.quantity), 0) as total_stock,
           COUNT(DISTINCT b.id) as batch_count
    FROM medicines m
    LEFT JOIN batches b ON m.id = b.medicine_id
  `;

	const params: any[] = [];

	if (search) {
		query += ` WHERE m.name LIKE ? OR m.generic_name LIKE ? OR m.manufacturer LIKE ?`;
		const searchTerm = `%${search}%`;
		params.push(searchTerm, searchTerm, searchTerm);
	}

	query += ` GROUP BY m.id ORDER BY m.name LIMIT ? OFFSET ?`;
	params.push(limit, offset);

	const medicines = db.prepare(query).all(...params);

	// Get total count for pagination
	let countQuery = "SELECT COUNT(*) as total FROM medicines m";
	if (search) {
		countQuery += ` WHERE m.name LIKE ? OR m.generic_name LIKE ? OR m.manufacturer LIKE ?`;
	}

	const totalResult = db.prepare(countQuery).get(...(search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []));
	const total = totalResult?.total || 0;

	return c.json({
		medicines,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	});
});

// Get medicine by ID
app.get("/:id", async (c) => {
	const id = parseInt(c.req.param("id"));

	const medicine = await db
		.prepare(
			`
    SELECT m.*,
           COALESCE(SUM(b.quantity), 0) as total_stock,
           COUNT(DISTINCT b.id) as batch_count
    FROM medicines m
    LEFT JOIN batches b ON m.id = b.medicine_id
    WHERE m.id = ?
    GROUP BY m.id
  `,
		)
		.get(id);

	if (!medicine) {
		return c.json({ error: "Medicine not found" }, 404);
	}

	// Get batches for this medicine
	const batches = await db
		.prepare(
			`
    SELECT b.*, s.name as supplier_name
    FROM batches b
    LEFT JOIN suppliers s ON b.supplier_id = s.id
    WHERE b.medicine_id = ?
    ORDER BY b.expiry_date ASC
  `,
		)
		.all(id);

	return c.json({
		...medicine,
		batches,
	});
});

// Create new medicine
app.post("/", async (c) => {
	const body = await c.req.json();
	const { name, description, generic_name, dosage_form, strength, manufacturer, initial_stock } = body;

	if (!name) {
		return c.json({ error: "Medicine name is required" }, 400);
	}

	const result = await db
		.prepare(
			`
    INSERT INTO medicines (name, description, generic_name, dosage_form, strength, manufacturer, initial_stock)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
		)
		.run(name, description, generic_name, dosage_form, strength, manufacturer, initial_stock || 0);

	const newMedicine = db.prepare("SELECT * FROM medicines WHERE id = ?").get(result.lastInsertRowid);

	return c.json(newMedicine, 201);
});

// Update medicine
app.put("/:id", async (c) => {
	const id = parseInt(c.req.param("id"));
	const body = await c.req.json();
	const { name, description, generic_name, dosage_form, strength, manufacturer, initial_stock } = body;

	const existing = db.prepare("SELECT * FROM medicines WHERE id = ?").get(id);
	if (!existing) {
		return c.json({ error: "Medicine not found" }, 404);
	}

	await db
		.prepare(
			`
    UPDATE medicines
    SET name = ?, description = ?, generic_name = ?, dosage_form = ?, strength = ?, manufacturer = ?, initial_stock = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,
		)
		.run(name, description, generic_name, dosage_form, strength, manufacturer, initial_stock || 0, id);

	const updatedMedicine = db.prepare("SELECT * FROM medicines WHERE id = ?").get(id);

	return c.json(updatedMedicine);
});

// Delete medicine
app.delete("/:id", async (c) => {
	const id = parseInt(c.req.param("id"));

	const existing = db.prepare("SELECT * FROM medicines WHERE id = ?").get(id);
	if (!existing) {
		return c.json({ error: "Medicine not found" }, 404);
	}

	db.prepare("DELETE FROM medicines WHERE id = ?").run(id);

	return c.json({ message: "Medicine deleted successfully" });
});

export default app;
