import { Hono } from "hono";
import { getDatabase } from "../db/database.js";

const app = new Hono();
const db = getDatabase();

// Get all sales
app.get("/", (c) => {
	const startDate = c.req.query("start_date");
	const endDate = c.req.query("end_date");
	const page = parseInt(c.req.query("page") || "1");
	const limit = parseInt(c.req.query("limit") || "10");
	const offset = (page - 1) * limit;

	let query = `
    SELECT s.*, COUNT(si.id) as item_count
    FROM sales s
    LEFT JOIN sale_items si ON s.id = si.sale_id
    WHERE 1=1
  `;

	const params: any[] = [];

	if (startDate) {
		query += ` AND DATE(s.sale_date) >= ?`;
		params.push(startDate);
	}

	if (endDate) {
		query += ` AND DATE(s.sale_date) <= ?`;
		params.push(endDate);
	}

	query += ` GROUP BY s.id ORDER BY s.sale_date DESC LIMIT ? OFFSET ?`;
	params.push(limit, offset);

	const sales = db.prepare(query).all(...params);

	// Get total count
	let countQuery = "SELECT COUNT(*) as total FROM sales s WHERE 1=1";
	const countParams: any[] = [];

	if (startDate) {
		countQuery += ` AND DATE(s.sale_date) >= ?`;
		countParams.push(startDate);
	}

	if (endDate) {
		countQuery += ` AND DATE(s.sale_date) <= ?`;
		countParams.push(endDate);
	}

	const { total } = db.prepare(countQuery).get(...countParams) as { total: number };

	return c.json({
		sales,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	});
});

// Get sales by ID
app.get("/:id", (c) => {
	const id = parseInt(c.req.param("id"));

	const sale = db.prepare("SELECT * FROM sales WHERE id = ?").get(id);
	if (!sale) {
		return c.json({ error: "Sale not found" }, 404);
	}

	// Get sale items with medicine and batch details
	const items = db
		.prepare(
			`
    SELECT si.*,
           b.batch_number, b.expiry_date,
           m.name as medicine_name, m.generic_name
    FROM sale_items si
    JOIN batches b ON si.batch_id = b.id
    JOIN medicines m ON b.medicine_id = m.id
    WHERE si.sale_id = ?
    ORDER BY si.id
  `,
		)
		.all(id);

	return c.json({
		...sale,
		items,
	});
});

// Create new sale
app.post("/", async (c) => {
	const body = await c.req.json();
	const { customer_name, customer_phone, payment_method, items } = body;

	if (!items || !Array.isArray(items) || items.length === 0) {
		return c.json({ error: "items array is required and must not be empty" }, 400);
	}

	// Validate items and check stock
	const batchUpdates: Array<{ id: number; quantity: number }> = [];
	let totalAmount = 0;

	for (const item of items) {
		if (!item.batch_id || !item.quantity || !item.unit_price) {
			return c.json({ error: "Each item must have batch_id, quantity, and unit_price" }, 400);
		}

		const batch = db.prepare("SELECT * FROM batches WHERE id = ?").get(item.batch_id);
		if (!batch) {
			return c.json({ error: `Batch with id ${item.batch_id} not found` }, 404);
		}

		if ((batch as any).quantity < item.quantity) {
			return c.json(
				{
					error: `Insufficient stock for batch ${(batch as any).batch_number}. Available: ${
						(batch as any).quantity
					}, Requested: ${item.quantity}`,
				},
				400,
			);
		}

		batchUpdates.push({ id: item.batch_id, quantity: item.quantity });
		totalAmount += item.quantity * item.unit_price;
	}

	// Start transaction
	const insertSale = db.prepare(`
    INSERT INTO sales (customer_name, customer_phone, total_amount, payment_method)
    VALUES (?, ?, ?, ?)
  `);

	const insertSaleItem = db.prepare(`
    INSERT INTO sale_items (sale_id, batch_id, quantity, unit_price, subtotal)
    VALUES (?, ?, ?, ?, ?)
  `);

	const updateBatchQuantity = db.prepare(`
    UPDATE batches SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `);

	try {
		// Insert sale
		const result = insertSale.run(customer_name, customer_phone, totalAmount, payment_method || "cash");
		const saleId = result.lastInsertRowid;

		// Insert sale items and update batch quantities
		for (const item of items) {
			const subtotal = item.quantity * item.unit_price;
			insertSaleItem.run(saleId, item.batch_id, item.quantity, item.unit_price, subtotal);

			updateBatchQuantity.run(item.quantity, item.batch_id);
		}

		// Get the complete sale record
		const newSale = db.prepare("SELECT * FROM sales WHERE id = ?").get(saleId);
		const saleItems = db
			.prepare(
				`
      SELECT si.*,
             b.batch_number, b.expiry_date,
             m.name as medicine_name, m.generic_name
      FROM sale_items si
      JOIN batches b ON si.batch_id = b.id
      JOIN medicines m ON b.medicine_id = m.id
      WHERE si.sale_id = ?
    `,
			)
			.all(saleId);

		return c.json(
			{
				...newSale,
				items: saleItems,
			},
			201,
		);
	} catch (error) {
		return c.json({ error: "Failed to create sale" }, 500);
	}
});

// Get sales statistics
app.get("/stats/summary", (c) => {
	const startDate = c.req.query("start_date");
	const endDate = c.req.query("end_date");

	let whereClause = "WHERE 1=1";
	const params: any[] = [];

	if (startDate) {
		whereClause += ` AND DATE(sale_date) >= ?`;
		params.push(startDate);
	}

	if (endDate) {
		whereClause += ` AND DATE(sale_date) <= ?`;
		params.push(endDate);
	}

	const stats = db
		.prepare(
			`
    SELECT
      COUNT(*) as total_sales,
      COALESCE(SUM(total_amount), 0) as total_revenue,
      COALESCE(AVG(total_amount), 0) as average_sale_amount,
      COUNT(DISTINCT DATE(sale_date)) as active_days
    FROM sales
    ${whereClause}
  `,
		)
		.get(...params);

	// Payment method breakdown
	const paymentBreakdown = db
		.prepare(
			`
    SELECT
      payment_method,
      COUNT(*) as count,
      COALESCE(SUM(total_amount), 0) as total_amount
    FROM sales
    ${whereClause}
    GROUP BY payment_method
  `,
		)
		.all(...params);

	// Daily sales for the period
	const dailySales = db
		.prepare(
			`
    SELECT
      DATE(sale_date) as date,
      COUNT(*) as sales_count,
      COALESCE(SUM(total_amount), 0) as total_amount
    FROM sales
    ${whereClause}
    GROUP BY DATE(sale_date)
    ORDER BY date DESC
    LIMIT 30
  `,
		)
		.all(...params);

	return c.json({
		summary: stats,
		paymentBreakdown,
		dailySales,
	});
});

// Get top selling medicines
app.get("/stats/top-medicines", (c) => {
	const startDate = c.req.query("start_date");
	const endDate = c.req.query("end_date");
	const limit = parseInt(c.req.query("limit") || "10");

	let whereClause = "WHERE 1=1";
	const params: any[] = [];

	if (startDate) {
		whereClause += ` AND DATE(s.sale_date) >= ?`;
		params.push(startDate);
	}

	if (endDate) {
		whereClause += ` AND DATE(s.sale_date) <= ?`;
		params.push(endDate);
	}

	params.push(limit);

	const topMedicines = db
		.prepare(
			`
    SELECT
      m.id,
      m.name,
      m.generic_name,
      SUM(si.quantity) as total_quantity_sold,
      COUNT(DISTINCT si.sale_id) as sales_count,
      COALESCE(SUM(si.subtotal), 0) as total_revenue
    FROM sale_items si
    JOIN batches b ON si.batch_id = b.id
    JOIN medicines m ON b.medicine_id = m.id
    JOIN sales s ON si.sale_id = s.id
    ${whereClause}
    GROUP BY m.id, m.name, m.generic_name
    ORDER BY total_quantity_sold DESC
    LIMIT ?
  `,
		)
		.all(...params);

	return c.json(topMedicines);
});

export default app;
