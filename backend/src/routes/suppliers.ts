import { Hono } from "hono";
import { getDatabase } from "../db/database.js";

const app = new Hono();
const db = getDatabase();

// Get all suppliers
app.get("/", (c) => {
	const search = c.req.query("search");
	const page = parseInt(c.req.query("page") || "1");
	const limit = parseInt(c.req.query("limit") || "10");
	const offset = (page - 1) * limit;

	let query = `
    SELECT s.*,
           COUNT(DISTINCT po.id) as purchase_order_count,
           COALESCE(SUM(po.total_amount), 0) as total_purchases
    FROM suppliers s
    LEFT JOIN purchase_orders po ON s.id = po.supplier_id
  `;

	const params: any[] = [];

	if (search) {
		query += ` WHERE s.name LIKE ? OR s.contact_person LIKE ?`;
		const searchTerm = `%${search}%`;
		params.push(searchTerm, searchTerm);
	}

	query += ` GROUP BY s.id ORDER BY s.name LIMIT ? OFFSET ?`;
	params.push(limit, offset);

	const suppliers = db.prepare(query).all(...params);

	// Get total count
	let countQuery = "SELECT COUNT(*) as total FROM suppliers s";
	if (search) {
		countQuery += ` WHERE s.name LIKE ? OR s.contact_person LIKE ?`;
	}

	const { total } = db.prepare(countQuery).get(...(search ? [`%${search}%`, `%${search}%`] : [])) as { total: number };

	return c.json({
		suppliers,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	});
});

// Get supplier by ID
app.get("/:id", (c) => {
	const id = parseInt(c.req.param("id"));

	const supplier = db
		.prepare(
			`
    SELECT s.*,
           COUNT(DISTINCT po.id) as purchase_order_count,
           COALESCE(SUM(po.total_amount), 0) as total_purchases
    FROM suppliers s
    LEFT JOIN purchase_orders po ON s.id = po.supplier_id
    WHERE s.id = ?
    GROUP BY s.id
  `,
		)
		.get(id);

	if (!supplier) {
		return c.json({ error: "Supplier not found" }, 404);
	}

	// Get recent purchase orders
	const purchaseOrders = db
		.prepare(
			`
    SELECT po.*,
           COUNT(poi.id) as item_count
    FROM purchase_orders po
    LEFT JOIN purchase_order_items poi ON po.id = poi.order_id
    WHERE po.supplier_id = ?
    GROUP BY po.id
    ORDER BY po.order_date DESC
    LIMIT 10
  `,
		)
		.all(id);

	// Get supplier's batches
	const batches = db
		.prepare(
			`
    SELECT b.*, m.name as medicine_name
    FROM batches b
    JOIN medicines m ON b.medicine_id = m.id
    WHERE b.supplier_id = ?
    ORDER BY b.created_at DESC
    LIMIT 10
  `,
		)
		.all(id);

	return c.json({
		...supplier,
		purchaseOrders,
		batches,
	});
});

// Create new supplier
app.post("/", async (c) => {
	const body = await c.req.json();
	const { name, contact_person, phone, email, address } = body;

	if (!name) {
		return c.json({ error: "Supplier name is required" }, 400);
	}

	const result = db
		.prepare(
			`
    INSERT INTO suppliers (name, contact_person, phone, email, address)
    VALUES (?, ?, ?, ?, ?)
  `,
		)
		.run(name, contact_person, phone, email, address);

	const newSupplier = db.prepare("SELECT * FROM suppliers WHERE id = ?").get(result.lastInsertRowid);

	return c.json(newSupplier, 201);
});

// Update supplier
app.put("/:id", async (c) => {
	const id = parseInt(c.req.param("id"));
	const body = await c.req.json();
	const { name, contact_person, phone, email, address } = body;

	const existing = db.prepare("SELECT * FROM suppliers WHERE id = ?").get(id);
	if (!existing) {
		return c.json({ error: "Supplier not found" }, 404);
	}

	db.prepare(
		`
    UPDATE suppliers
    SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,
	).run(name, contact_person, phone, email, address, id);

	const updatedSupplier = db.prepare("SELECT * FROM suppliers WHERE id = ?").get(id);

	return c.json(updatedSupplier);
});

// Delete supplier
app.delete("/:id", (c) => {
	const id = parseInt(c.req.param("id"));

	const existing = db.prepare("SELECT * FROM suppliers WHERE id = ?").get(id);
	if (!existing) {
		return c.json({ error: "Supplier not found" }, 404);
	}

	// Check if supplier has associated data
	const hasBatches = db.prepare("SELECT COUNT(*) as count FROM batches WHERE supplier_id = ?").get(id) as {
		count: number;
	};
	const hasPurchaseOrders = db
		.prepare("SELECT COUNT(*) as count FROM purchase_orders WHERE supplier_id = ?")
		.get(id) as { count: number };

	if (hasBatches.count > 0 || hasPurchaseOrders.count > 0) {
		return c.json(
			{
				error: "Cannot delete supplier with associated batches or purchase orders",
				hasBatches: hasBatches.count,
				hasPurchaseOrders: hasPurchaseOrders.count,
			},
			400,
		);
	}

	db.prepare("DELETE FROM suppliers WHERE id = ?").run(id);

	return c.json({ message: "Supplier deleted successfully" });
});

export default app;
