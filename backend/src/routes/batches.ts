import { Hono } from "hono";
import { getDatabase } from "../db/database.js";

const app = new Hono();
const db = getDatabase();

// Get all batches with optional filters
app.get("/", (c) => {
	const medicineId = c.req.query("medicine_id");
	const lowStock = c.req.query("low_stock");
	const expiring = c.req.query("expiring");
	const page = parseInt(c.req.query("page") || "1");
	const limit = parseInt(c.req.query("limit") || "10");
	const offset = (page - 1) * limit;

	let query = `
    SELECT b.*, m.name as medicine_name, m.generic_name, s.name as supplier_name,
           CASE
             WHEN b.expiry_date <= date('now', '+30 days') THEN 'expiring_soon'
             WHEN b.expiry_date <= date('now', '+60 days') THEN 'expiring_soon'
             WHEN b.quantity <= 10 THEN 'low_stock'
             ELSE 'normal'
           END as status
    FROM batches b
    JOIN medicines m ON b.medicine_id = m.id
    LEFT JOIN suppliers s ON b.supplier_id = s.id
    WHERE 1=1
  `;

	const params: any[] = [];

	if (medicineId) {
		query += ` AND b.medicine_id = ?`;
		params.push(parseInt(medicineId));
	}

	if (lowStock === "true") {
		query += ` AND b.quantity <= 10`;
	}

	if (expiring === "true") {
		query += ` AND b.expiry_date <= date('now', '+90 days')`;
	}

	query += ` ORDER BY b.expiry_date ASC LIMIT ? OFFSET ?`;
	params.push(limit, offset);

	const batches = db.prepare(query).all(...params);

	// Get total count
	let countQuery = `
    SELECT COUNT(*) as total
    FROM batches b
    JOIN medicines m ON b.medicine_id = m.id
    WHERE 1=1
  `;

	const countParams: any[] = [];
	if (medicineId) {
		countQuery += ` AND b.medicine_id = ?`;
		countParams.push(parseInt(medicineId));
	}
	if (lowStock === "true") {
		countQuery += ` AND b.quantity <= 10`;
	}
	if (expiring === "true") {
		countQuery += ` AND b.expiry_date <= date('now', '+90 days')`;
	}

	const { total } = db.prepare(countQuery).get(...countParams) as { total: number };

	return c.json({
		batches,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	});
});

// Get batch by ID
app.get("/:id", (c) => {
	const id = parseInt(c.req.param("id"));

	const batch = db
		.prepare(
			`
    SELECT b.*, m.name as medicine_name, m.generic_name, s.name as supplier_name
    FROM batches b
    JOIN medicines m ON b.medicine_id = m.id
    LEFT JOIN suppliers s ON b.supplier_id = s.id
    WHERE b.id = ?
  `,
		)
		.get(id);

	if (!batch) {
		return c.json({ error: "Batch not found" }, 404);
	}

	return c.json(batch);
});

// Create new batch
app.post("/", async (c) => {
	const body = await c.req.json();
	const {
		medicine_id,
		batch_number,
		quantity,
		cost_price,
		selling_price,
		manufacturing_date,
		expiry_date,
		supplier_id,
	} = body;

	if (!medicine_id || !batch_number || !quantity || !cost_price || !selling_price) {
		return c.json({ error: "Required fields: medicine_id, batch_number, quantity, cost_price, selling_price" }, 400);
	}

	// Check if medicine exists
	const medicine = db.prepare("SELECT * FROM medicines WHERE id = ?").get(medicine_id);
	if (!medicine) {
		return c.json({ error: "Medicine not found" }, 404);
	}

	// Check if batch number already exists for this medicine
	const existingBatch = db
		.prepare("SELECT * FROM batches WHERE medicine_id = ? AND batch_number = ?")
		.get(medicine_id, batch_number);
	if (existingBatch) {
		return c.json({ error: "Batch number already exists for this medicine" }, 400);
	}

	const result = db
		.prepare(
			`
    INSERT INTO batches (medicine_id, batch_number, quantity, cost_price, selling_price, manufacturing_date, expiry_date, supplier_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
		)
		.run(medicine_id, batch_number, quantity, cost_price, selling_price, manufacturing_date, expiry_date, supplier_id);

	const newBatch = db
		.prepare(
			`
    SELECT b.*, m.name as medicine_name, s.name as supplier_name
    FROM batches b
    JOIN medicines m ON b.medicine_id = m.id
    LEFT JOIN suppliers s ON b.supplier_id = s.id
    WHERE b.id = ?
  `,
		)
		.get(result.lastInsertRowid);

	return c.json(newBatch, 201);
});

// Update batch
app.put("/:id", async (c) => {
	const id = parseInt(c.req.param("id"));
	const body = await c.req.json();
	const { batch_number, quantity, cost_price, selling_price, manufacturing_date, expiry_date, supplier_id } = body;

	const existing = db.prepare("SELECT * FROM batches WHERE id = ?").get(id);
	if (!existing) {
		return c.json({ error: "Batch not found" }, 404);
	}

	db.prepare(
		`
    UPDATE batches
    SET batch_number = ?, quantity = ?, cost_price = ?, selling_price = ?,
        manufacturing_date = ?, expiry_date = ?, supplier_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,
	).run(batch_number, quantity, cost_price, selling_price, manufacturing_date, expiry_date, supplier_id, id);

	const updatedBatch = db
		.prepare(
			`
    SELECT b.*, m.name as medicine_name, s.name as supplier_name
    FROM batches b
    JOIN medicines m ON b.medicine_id = m.id
    LEFT JOIN suppliers s ON b.supplier_id = s.id
    WHERE b.id = ?
  `,
		)
		.get(id);

	return c.json(updatedBatch);
});

// Delete batch
app.delete("/:id", (c) => {
	const id = parseInt(c.req.param("id"));

	const existing = db.prepare("SELECT * FROM batches WHERE id = ?").get(id);
	if (!existing) {
		return c.json({ error: "Batch not found" }, 404);
	}

	db.prepare("DELETE FROM batches WHERE id = ?").run(id);

	return c.json({ message: "Batch deleted successfully" });
});

// Update batch quantity (for sales)
app.patch("/:id/quantity", async (c) => {
	const id = parseInt(c.req.param("id"));
	const body = await c.req.json();
	const { quantity_change } = body;

	if (typeof quantity_change !== "number") {
		return c.json({ error: "quantity_change must be a number" }, 400);
	}

	const batch = db.prepare("SELECT * FROM batches WHERE id = ?").get(id);
	if (!batch) {
		return c.json({ error: "Batch not found" }, 404);
	}

	const newQuantity = (batch as any).quantity + quantity_change;
	if (newQuantity < 0) {
		return c.json({ error: "Insufficient stock" }, 400);
	}

	db.prepare("UPDATE batches SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(newQuantity, id);

	const updatedBatch = db
		.prepare(
			`
    SELECT b.*, m.name as medicine_name
    FROM batches b
    JOIN medicines m ON b.medicine_id = m.id
    WHERE b.id = ?
  `,
		)
		.get(id);

	return c.json(updatedBatch);
});

export default app;
