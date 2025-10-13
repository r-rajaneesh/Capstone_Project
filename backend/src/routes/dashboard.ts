import { Hono } from "hono";
import { getDatabase } from "../db/database.js";

const app = new Hono();
const db = getDatabase();

// Get dashboard overview statistics
app.get("/", (c) => {
	// Total medicines
	const { total_medicines } = db.prepare("SELECT COUNT(*) as total_medicines FROM medicines").get() as {
		total_medicines: number;
	};

	// Total batches
	const { total_batches } = db.prepare("SELECT COUNT(*) as total_batches FROM batches").get() as {
		total_batches: number;
	};

	// Total stock value
	const { total_stock_value } = db
		.prepare(
			`
    SELECT COALESCE(SUM(quantity * cost_price), 0) as total_stock_value
    FROM batches
  `,
		)
		.get() as { total_stock_value: number };

	// Low stock items (quantity <= 10)
	const { low_stock_count } = db
		.prepare(
			`
    SELECT COUNT(*) as low_stock_count
    FROM batches
    WHERE quantity <= 10
  `,
		)
		.get() as { low_stock_count: number };

	// Expiring soon items (within 30 days)
	const { expiring_soon_count } = db
		.prepare(
			`
    SELECT COUNT(*) as expiring_soon_count
    FROM batches
    WHERE expiry_date <= date('now', '+30 days') AND expiry_date >= date('now')
  `,
		)
		.get() as { expiring_soon_count: number };

	// Expired items
	const { expired_count } = db
		.prepare(
			`
    SELECT COUNT(*) as expired_count
    FROM batches
    WHERE expiry_date < date('now')
  `,
		)
		.get() as { expired_count: number };

	// Today's sales
	const { todays_sales_count, todays_revenue } = db
		.prepare(
			`
    SELECT
      COUNT(*) as todays_sales_count,
      COALESCE(SUM(total_amount), 0) as todays_revenue
    FROM sales
    WHERE DATE(sale_date) = DATE('now')
  `,
		)
		.get() as { todays_sales_count: number; todays_revenue: number };

	// This month's sales
	const { monthly_sales_count, monthly_revenue } = db
		.prepare(
			`
    SELECT
      COUNT(*) as monthly_sales_count,
      COALESCE(SUM(total_amount), 0) as monthly_revenue
    FROM sales
    WHERE strftime('%Y-%m', sale_date) = strftime('%Y-%m', 'now')
  `,
		)
		.get() as { monthly_sales_count: number; monthly_revenue: number };

	// Total suppliers
	const { total_suppliers } = db.prepare("SELECT COUNT(*) as total_suppliers FROM suppliers").get() as {
		total_suppliers: number;
	};

	// Pending purchase orders
	const { pending_orders_count } = db
		.prepare(
			`
    SELECT COUNT(*) as pending_orders_count
    FROM purchase_orders
    WHERE status = 'pending'
  `,
		)
		.get() as { pending_orders_count: number };

	return c.json({
		overview: {
			totalMedicines: total_medicines,
			totalBatches: total_batches,
			totalStockValue: total_stock_value,
			totalSuppliers: total_suppliers,
			lowStockCount: low_stock_count,
			expiringSoonCount: expiring_soon_count,
			expiredCount: expired_count,
			pendingOrdersCount: pending_orders_count,
		},
		sales: {
			today: {
				count: todays_sales_count,
				revenue: todays_revenue,
			},
			thisMonth: {
				count: monthly_sales_count,
				revenue: monthly_revenue,
			},
		},
	});
});

// Get low stock alerts
app.get("/alerts/low-stock", (c) => {
	const threshold = parseInt(c.req.query("threshold") || "10");
	const limit = parseInt(c.req.query("limit") || "20");

	const lowStockItems = db
		.prepare(
			`
    SELECT
      b.id,
      b.batch_number,
      b.quantity,
      b.cost_price,
      b.selling_price,
      b.expiry_date,
      m.name as medicine_name,
      m.generic_name,
      s.name as supplier_name
    FROM batches b
    JOIN medicines m ON b.medicine_id = m.id
    LEFT JOIN suppliers s ON b.supplier_id = s.id
    WHERE b.quantity <= ?
    ORDER BY b.quantity ASC, b.expiry_date ASC
    LIMIT ?
  `,
		)
		.all(threshold, limit);

	return c.json({
		items: lowStockItems,
		threshold,
		count: lowStockItems.length,
	});
});

// Get expiring items alerts
app.get("/alerts/expiring", (c) => {
	const days = parseInt(c.req.query("days") || "30");
	const limit = parseInt(c.req.query("limit") || "20");

	const expiringItems = db
		.prepare(
			`
    SELECT
      b.id,
      b.batch_number,
      b.quantity,
      b.cost_price,
      b.selling_price,
      b.expiry_date,
      m.name as medicine_name,
      m.generic_name,
      s.name as supplier_name,
      CASE
        WHEN b.expiry_date <= date('now') THEN 'expired'
        WHEN b.expiry_date <= date('now', '+7 days') THEN 'expires_very_soon'
        WHEN b.expiry_date <= date('now', '+30 days') THEN 'expires_soon'
        ELSE 'expires_later'
      END as urgency
    FROM batches b
    JOIN medicines m ON b.medicine_id = m.id
    LEFT JOIN suppliers s ON b.supplier_id = s.id
    WHERE b.expiry_date <= date('now', '+' || ? || ' days')
    ORDER BY b.expiry_date ASC
    LIMIT ?
  `,
		)
		.all(days, limit);

	return c.json({
		items: expiringItems,
		days,
		count: expiringItems.length,
	});
});

// Get recent sales
app.get("/recent-sales", (c) => {
	const limit = parseInt(c.req.query("limit") || "10");

	const recentSales = db
		.prepare(
			`
    SELECT
      s.id,
      s.sale_date,
      s.customer_name,
      s.customer_phone,
      s.total_amount,
      s.payment_method,
      COUNT(si.id) as item_count
    FROM sales s
    LEFT JOIN sale_items si ON s.id = si.sale_id
    GROUP BY s.id
    ORDER BY s.sale_date DESC
    LIMIT ?
  `,
		)
		.all(limit);

	return c.json(recentSales);
});

// Get recent purchases
app.get("/recent-purchases", (c) => {
	const limit = parseInt(c.req.query("limit") || "10");

	const recentPurchases = db
		.prepare(
			`
    SELECT
      po.id,
      po.order_date,
      po.expected_delivery,
      po.status,
      po.total_amount,
      s.name as supplier_name,
      COUNT(poi.id) as item_count
    FROM purchase_orders po
    JOIN suppliers s ON po.supplier_id = s.id
    LEFT JOIN purchase_order_items poi ON po.id = poi.order_id
    GROUP BY po.id
    ORDER BY po.order_date DESC
    LIMIT ?
  `,
		)
		.all(limit);

	return c.json(recentPurchases);
});

// Get sales chart data
app.get("/charts/sales", (c) => {
	const days = parseInt(c.req.query("days") || "30");
	const groupBy = c.req.query("group_by") || "day"; // day, week, month

	let dateFormat = "%Y-%m-%d";
	let interval = `${days} days`;

	if (groupBy === "week") {
		dateFormat = "%Y-%W";
		interval = `${Math.ceil(days / 7)} weeks`;
	} else if (groupBy === "month") {
		dateFormat = "%Y-%m";
		interval = `${Math.ceil(days / 30)} months`;
	}

	const salesData = db
		.prepare(
			`
    SELECT
      strftime(?, sale_date) as period,
      COUNT(*) as sales_count,
      COALESCE(SUM(total_amount), 0) as total_revenue,
      COALESCE(AVG(total_amount), 0) as average_sale
    FROM sales
    WHERE sale_date >= date('now', '-? days')
    GROUP BY period
    ORDER BY period ASC
  `,
		)
		.all(dateFormat, days);

	return c.json({
		data: salesData,
		groupBy,
		days,
		dateFormat,
	});
});

// Get inventory chart data
app.get("/charts/inventory", (c) => {
	const inventoryByCategory = db
		.prepare(
			`
    SELECT
      m.dosage_form as category,
      COUNT(DISTINCT m.id) as medicine_count,
      COUNT(b.id) as batch_count,
      COALESCE(SUM(b.quantity), 0) as total_quantity,
      COALESCE(SUM(b.quantity * b.cost_price), 0) as total_value
    FROM medicines m
    LEFT JOIN batches b ON m.id = b.medicine_id
    GROUP BY m.dosage_form
    ORDER BY total_value DESC
  `,
		)
		.all();

	const inventoryBySupplier = db
		.prepare(
			`
    SELECT
      COALESCE(s.name, 'No Supplier') as supplier_name,
      COUNT(DISTINCT b.id) as batch_count,
      COALESCE(SUM(b.quantity), 0) as total_quantity,
      COALESCE(SUM(b.quantity * b.cost_price), 0) as total_value
    FROM batches b
    LEFT JOIN suppliers s ON b.supplier_id = s.id
    GROUP BY s.id, s.name
    ORDER BY total_value DESC
    LIMIT 10
  `,
		)
		.all();

	return c.json({
		byCategory: inventoryByCategory,
		bySupplier: inventoryBySupplier,
	});
});

// Get top selling medicines
app.get("/top-medicines", (c) => {
	const days = parseInt(c.req.query("days") || "30");
	const limit = parseInt(c.req.query("limit") || "10");

	const topMedicines = db
		.prepare(
			`
    SELECT
      m.id,
      m.name,
      m.generic_name,
      COUNT(DISTINCT si.sale_id) as sales_count,
      SUM(si.quantity) as total_quantity_sold,
      COALESCE(SUM(si.subtotal), 0) as total_revenue,
      COALESCE(AVG(si.unit_price), 0) as average_price
    FROM medicines m
    JOIN batches b ON m.id = b.medicine_id
    JOIN sale_items si ON b.id = si.batch_id
    JOIN sales s ON si.sale_id = s.id
    WHERE s.sale_date >= date('now', '-? days')
    GROUP BY m.id, m.name, m.generic_name
    ORDER BY total_quantity_sold DESC
    LIMIT ?
  `,
		)
		.all(days, limit);

	return c.json({
		medicines: topMedicines,
		period: `${days} days`,
	});
});

export default app;
