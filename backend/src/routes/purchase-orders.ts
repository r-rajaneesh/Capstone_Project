import { Hono } from "hono";
import { getDatabase } from "../db/database.js";

const app = new Hono();
const db = getDatabase();

// Get all purchase orders
app.get("/", (c) => {
	const status = c.req.query("status");
	const supplierId = c.req.query("supplier_id");
	const page = parseInt(c.req.query("page") || "1");
	const limit = parseInt(c.req.query("limit") || "10");
	const offset = (page - 1) * limit;

	let query = `
    SELECT po.*, s.name as supplier_name,
           COUNT(poi.id) as item_count
    FROM purchase_orders po
    JOIN suppliers s ON po.supplier_id = s.id
    LEFT JOIN purchase_order_items poi ON po.id = poi.order_id
    WHERE 1=1
  `;

	const params: any[] = [];

	if (status) {
		query += ` AND po.status = ?`;
		params.push(status);
	}

	if (supplierId) {
		query += ` AND po.supplier_id = ?`;
		params.push(parseInt(supplierId));
	}

	query += ` GROUP BY po.id ORDER BY po.order_date DESC LIMIT ? OFFSET ?`;
	params.push(limit, offset);

	const purchaseOrders = db.prepare(query).all(...params);

	// Get total count
	let countQuery = `
    SELECT COUNT(*) as total
    FROM purchase_orders po
    WHERE 1=1
  `;

	const countParams: any[] = [];
	if (status) {
		countQuery += ` AND po.status = ?`;
		countParams.push(status);
	}
	if (supplierId) {
		countQuery += ` AND po.supplier_id = ?`;
		countParams.push(parseInt(supplierId));
	}

	const { total } = db.prepare(countQuery).get(...countParams) as { total: number };

	return c.json({
		purchaseOrders,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	});
});

// Get purchase order by ID
app.get("/:id", (c) => {
	const id = parseInt(c.req.param("id"));

	const purchaseOrder = db
		.prepare(
			`
    SELECT po.*, s.name as supplier_name, s.contact_person, s.phone, s.email
    FROM purchase_orders po
    JOIN suppliers s ON po.supplier_id = s.id
    WHERE po.id = ?
  `,
		)
		.get(id);

	if (!purchaseOrder) {
		return c.json({ error: "Purchase order not found" }, 404);
	}

	// Get purchase order items
	const items = db
		.prepare(
			`
    SELECT poi.*, m.name as medicine_name, m.generic_name
    FROM purchase_order_items poi
    JOIN medicines m ON poi.medicine_id = m.id
    WHERE poi.order_id = ?
    ORDER BY poi.id
  `,
		)
		.all(id);

	return c.json({
		...purchaseOrder,
		items,
	});
});

// Create new purchase order
app.post("/", async (c) => {
	const body = await c.req.json();
	const { supplier_id, expected_delivery, items } = body;

	if (!supplier_id || !items || !Array.isArray(items) || items.length === 0) {
		return c.json({ error: "supplier_id and items array are required" }, 400);
	}

	// Check if supplier exists
	const supplier = db.prepare("SELECT * FROM suppliers WHERE id = ?").get(supplier_id);
	if (!supplier) {
		return c.json({ error: "Supplier not found" }, 404);
	}

	// Validate items
	for (const item of items) {
		if (!item.medicine_id || !item.quantity || !item.unit_price) {
			return c.json({ error: "Each item must have medicine_id, quantity, and unit_price" }, 400);
		}

		const medicine = db.prepare("SELECT * FROM medicines WHERE id = ?").get(item.medicine_id);
		if (!medicine) {
			return c.json({ error: `Medicine with id ${item.medicine_id} not found` }, 404);
		}
	}

	// Calculate total amount
	const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

	// Start transaction
	const insertOrder = db.prepare(`
    INSERT INTO purchase_orders (supplier_id, expected_delivery, total_amount)
    VALUES (?, ?, ?)
  `);

	const insertItem = db.prepare(`
    INSERT INTO purchase_order_items (order_id, medicine_id, quantity, unit_price)
    VALUES (?, ?, ?, ?)
  `);

	try {
		const result = insertOrder.run(supplier_id, expected_delivery, totalAmount);
		const orderId = result.lastInsertRowid;

		// Insert items
		for (const item of items) {
			insertItem.run(orderId, item.medicine_id, item.quantity, item.unit_price);
		}

		// Get the complete purchase order
		const newPurchaseOrder = db
			.prepare(
				`
      SELECT po.*, s.name as supplier_name
      FROM purchase_orders po
      JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.id = ?
    `,
			)
			.get(orderId);

		const orderItems = db
			.prepare(
				`
      SELECT poi.*, m.name as medicine_name
      FROM purchase_order_items poi
      JOIN medicines m ON poi.medicine_id = m.id
      WHERE poi.order_id = ?
    `,
			)
			.all(orderId);

		return c.json(
			{
				...newPurchaseOrder,
				items: orderItems,
			},
			201,
		);
	} catch (error) {
		return c.json({ error: "Failed to create purchase order" }, 500);
	}
});

// Update purchase order status
app.patch("/:id/status", async (c) => {
	const id = parseInt(c.req.param("id"));
	const body = await c.req.json();
	const { status } = body;

	if (!["pending", "received", "cancelled"].includes(status)) {
		return c.json({ error: "Status must be pending, received, or cancelled" }, 400);
	}

	const existing = db.prepare("SELECT * FROM purchase_orders WHERE id = ?").get(id);
	if (!existing) {
		return c.json({ error: "Purchase order not found" }, 404);
	}

	db.prepare("UPDATE purchase_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(status, id);

	const updatedOrder = db
		.prepare(
			`
    SELECT po.*, s.name as supplier_name
    FROM purchase_orders po
    JOIN suppliers s ON po.supplier_id = s.id
    WHERE po.id = ?
  `,
		)
		.get(id);

	// If status is 'received', create batches for each item
	if (status === "received") {
		const items = db
			.prepare(
				`
      SELECT poi.*, m.name as medicine_name
      FROM purchase_order_items poi
      JOIN medicines m ON poi.medicine_id = m.id
      WHERE poi.order_id = ?
    `,
			)
			.all(id);

		const insertBatch = db.prepare(`
      INSERT INTO batches (medicine_id, batch_number, quantity, cost_price, selling_price, supplier_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

		for (const item of items) {
			// Generate batch number (simple format: PO{orderId}-{itemId})
			const batchNumber = `PO${id}-${item.id}`;

			// Set selling price as 150% of cost price (can be customized)
			const sellingPrice = item.unit_price * 1.5;

			insertBatch.run(
				item.medicine_id,
				batchNumber,
				item.quantity,
				item.unit_price,
				sellingPrice,
				(existing as any).supplier_id,
			);
		}
	}

	const orderItems = db
		.prepare(
			`
    SELECT poi.*, m.name as medicine_name
    FROM purchase_order_items poi
    JOIN medicines m ON poi.medicine_id = m.id
    WHERE poi.order_id = ?
  `,
		)
		.all(id);

	return c.json({
		...updatedOrder,
		items: orderItems,
	});
});

// Delete purchase order
app.delete("/:id", (c) => {
	const id = parseInt(c.req.param("id"));

	const existing = db.prepare("SELECT * FROM purchase_orders WHERE id = ?").get(id);
	if (!existing) {
		return c.json({ error: "Purchase order not found" }, 404);
	}

	// Only allow deletion of pending orders
	if ((existing as any).status !== "pending") {
		return c.json({ error: "Only pending purchase orders can be deleted" }, 400);
	}

	// Delete items first (foreign key constraint)
	db.prepare("DELETE FROM purchase_order_items WHERE order_id = ?").run(id);
	db.prepare("DELETE FROM purchase_orders WHERE id = ?").run(id);

	return c.json({ message: "Purchase order deleted successfully" });
});

export default app;
