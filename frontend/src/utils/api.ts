const getApiBaseUrl = () => {
	if (typeof window !== "undefined") {
		return `http://${window.location.hostname}:3000/api`;
	}
	// Fallback for server-side rendering
	return "http://localhost:3000/api";
};

export interface Medicine {
	id: number;
	name: string;
	description?: string;
	generic_name?: string;
	dosage_form?: string;
	strength?: string;
	manufacturer?: string;
	initial_stock?: number;
	total_stock?: number;
	batch_count?: number;
	created_at: string;
	updated_at: string;
}

export interface Batch {
	id: number;
	medicine_id: number;
	batch_number: string;
	quantity: number;
	cost_price: number;
	selling_price: number;
	manufacturing_date?: string;
	expiry_date?: string;
	supplier_id?: number;
	medicine_name?: string;
	supplier_name?: string;
	created_at: string;
	updated_at: string;
}

export interface Supplier {
	id: number;
	name: string;
	contact_person?: string;
	phone?: string;
	email?: string;
	address?: string;
	purchase_order_count?: number;
	total_purchases?: number;
	created_at: string;
	updated_at: string;
}

export interface PurchaseOrder {
	id: number;
	supplier_id: number;
	order_date: string;
	expected_delivery?: string;
	status: "pending" | "received" | "cancelled";
	total_amount: number;
	supplier_name?: string;
	item_count?: number;
	created_at: string;
	updated_at: string;
}

export interface Sale {
	id: number;
	sale_date: string;
	customer_name?: string;
	customer_phone?: string;
	total_amount: number;
	payment_method: "cash" | "card" | "upi";
	item_count?: number;
	created_at: string;
}

export interface DashboardStats {
	overview: {
		totalMedicines: number;
		totalBatches: number;
		totalStockValue: number;
		totalSuppliers: number;
		lowStockCount: number;
		expiringSoonCount: number;
		expiredCount: number;
		pendingOrdersCount: number;
	};
	sales: {
		today: {
			count: number;
			revenue: number;
		};
		thisMonth: {
			count: number;
			revenue: number;
		};
	};
}

class ApiClient {
	private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
		const url = `${getApiBaseUrl()}${endpoint}`;
		const response = await fetch(url, {
			headers: {
				"Content-Type": "application/json",
				...options.headers,
			},
			...options,
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ error: "Network error" }));
			throw new Error(error.error || `HTTP ${response.status}`);
		}

		return response.json();
	}

	// Medicines
	async getMedicines(search?: string, page = 1, limit = 10) {
		const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
		if (search) params.append("search", search);
		return this.request(`/medicines?${params}`);
	}

	async getMedicine(id: number) {
		return this.request<Medicine & { batches: Batch[] }>(`/medicines/${id}`);
	}

	async createMedicine(medicine: Partial<Medicine>) {
		return this.request<Medicine>("/medicines", {
			method: "POST",
			body: JSON.stringify(medicine),
		});
	}

	async updateMedicine(id: number, medicine: Partial<Medicine>) {
		return this.request<Medicine>(`/medicines/${id}`, {
			method: "PUT",
			body: JSON.stringify(medicine),
		});
	}

	async deleteMedicine(id: number) {
		return this.request(`/medicines/${id}`, { method: "DELETE" });
	}

	// Batches
	async getBatches(filters?: {
		medicine_id?: number;
		low_stock?: boolean;
		expiring?: boolean;
		page?: number;
		limit?: number;
	}) {
		const params = new URLSearchParams();
		if (filters?.medicine_id) params.append("medicine_id", filters.medicine_id.toString());
		if (filters?.low_stock) params.append("low_stock", "true");
		if (filters?.expiring) params.append("expiring", "true");
		if (filters?.page) params.append("page", filters.page.toString());
		if (filters?.limit) params.append("limit", filters.limit.toString());

		return this.request(`/batches?${params}`);
	}

	async getBatch(id: number) {
		return this.request<Batch>(`/batches/${id}`);
	}

	async createBatch(batch: Partial<Batch>) {
		return this.request<Batch>("/batches", {
			method: "POST",
			body: JSON.stringify(batch),
		});
	}

	async updateBatch(id: number, batch: Partial<Batch>) {
		return this.request<Batch>(`/batches/${id}`, {
			method: "PUT",
			body: JSON.stringify(batch),
		});
	}

	async deleteBatch(id: number) {
		return this.request(`/batches/${id}`, { method: "DELETE" });
	}

	async updateBatchQuantity(id: number, quantityChange: number) {
		return this.request<Batch>(`/batches/${id}/quantity`, {
			method: "PATCH",
			body: JSON.stringify({ quantity_change: quantityChange }),
		});
	}

	// Suppliers
	async getSuppliers(search?: string, page = 1, limit = 10) {
		const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
		if (search) params.append("search", search);
		return this.request(`/suppliers?${params}`);
	}

	async getSupplier(id: number) {
		return this.request<Supplier & { purchaseOrders: PurchaseOrder[]; batches: Batch[] }>(`/suppliers/${id}`);
	}

	async createSupplier(supplier: Partial<Supplier>) {
		return this.request<Supplier>("/suppliers", {
			method: "POST",
			body: JSON.stringify(supplier),
		});
	}

	async updateSupplier(id: number, supplier: Partial<Supplier>) {
		return this.request<Supplier>(`/suppliers/${id}`, {
			method: "PUT",
			body: JSON.stringify(supplier),
		});
	}

	async deleteSupplier(id: number) {
		return this.request(`/suppliers/${id}`, { method: "DELETE" });
	}

	// Purchase Orders
	async getPurchaseOrders(filters?: { status?: string; supplier_id?: number; page?: number; limit?: number }) {
		const params = new URLSearchParams();
		if (filters?.status) params.append("status", filters.status);
		if (filters?.supplier_id) params.append("supplier_id", filters.supplier_id.toString());
		if (filters?.page) params.append("page", filters.page.toString());
		if (filters?.limit) params.append("limit", filters.limit.toString());

		return this.request(`/purchase-orders?${params}`);
	}

	async getPurchaseOrder(id: number) {
		return this.request<PurchaseOrder & { items: any[] }>(`/purchase-orders/${id}`);
	}

	async createPurchaseOrder(order: {
		supplier_id: number;
		expected_delivery?: string;
		items: Array<{
			medicine_id: number;
			quantity: number;
			unit_price: number;
		}>;
	}) {
		return this.request<PurchaseOrder & { items: any[] }>("/purchase-orders", {
			method: "POST",
			body: JSON.stringify(order),
		});
	}

	async updatePurchaseOrderStatus(id: number, status: string) {
		return this.request<PurchaseOrder & { items: any[] }>(`/purchase-orders/${id}/status`, {
			method: "PATCH",
			body: JSON.stringify({ status }),
		});
	}

	async deletePurchaseOrder(id: number) {
		return this.request(`/purchase-orders/${id}`, { method: "DELETE" });
	}

	// Sales
	async getSales(filters?: { start_date?: string; end_date?: string; page?: number; limit?: number }) {
		const params = new URLSearchParams();
		if (filters?.start_date) params.append("start_date", filters.start_date);
		if (filters?.end_date) params.append("end_date", filters.end_date);
		if (filters?.page) params.append("page", filters.page.toString());
		if (filters?.limit) params.append("limit", filters.limit.toString());

		return this.request(`/sales?${params}`);
	}

	async getSale(id: number) {
		return this.request<Sale & { items: any[] }>(`/sales/${id}`);
	}

	async createSale(sale: {
		customer_name?: string;
		customer_phone?: string;
		payment_method?: string;
		items: Array<{
			batch_id: number;
			quantity: number;
			unit_price: number;
		}>;
	}) {
		return this.request<Sale & { items: any[] }>("/sales", {
			method: "POST",
			body: JSON.stringify(sale),
		});
	}

	async getSalesStats(filters?: { start_date?: string; end_date?: string }) {
		const params = new URLSearchParams();
		if (filters?.start_date) params.append("start_date", filters.start_date);
		if (filters?.end_date) params.append("end_date", filters.end_date);

		return this.request(`/sales/stats/summary?${params}`);
	}

	async getTopMedicines(days = 30, limit = 10) {
		const params = new URLSearchParams({ days: days.toString(), limit: limit.toString() });
		return this.request(`/sales/stats/top-medicines?${params}`);
	}

	// Dashboard
	async getDashboardStats() {
		return this.request<DashboardStats>("/dashboard");
	}

	async getLowStockAlerts(threshold = 10, limit = 20) {
		const params = new URLSearchParams({ threshold: threshold.toString(), limit: limit.toString() });
		return this.request(`/dashboard/alerts/low-stock?${params}`);
	}

	async getExpiringAlerts(days = 30, limit = 20) {
		const params = new URLSearchParams({ days: days.toString(), limit: limit.toString() });
		return this.request(`/dashboard/alerts/expiring?${params}`);
	}

	async getRecentSales(limit = 10) {
		const params = new URLSearchParams({ limit: limit.toString() });
		return this.request(`/dashboard/recent-sales?${params}`);
	}

	async getRecentPurchases(limit = 10) {
		const params = new URLSearchParams({ limit: limit.toString() });
		return this.request(`/dashboard/recent-purchases?${params}`);
	}

	async getSalesChartData(days = 30, groupBy = "day") {
		const params = new URLSearchParams({ days: days.toString(), group_by: groupBy });
		return this.request(`/dashboard/charts/sales?${params}`);
	}

	async getInventoryChartData() {
		return this.request("/dashboard/charts/inventory");
	}

	async getTopMedicinesChart(days = 30, limit = 10) {
		const params = new URLSearchParams({ days: days.toString(), limit: limit.toString() });
		return this.request(`/dashboard/top-medicines?${params}`);
	}

	// File Upload
	async uploadCSV(file: File) {
		const formData = new FormData();
		formData.append("file", file);

		return this.request("/upload/csv", {
			method: "POST",
			body: formData,
			headers: {}, // Remove Content-Type to let browser set it for FormData
		});
	}

	async uploadJSON(file: File) {
		const formData = new FormData();
		formData.append("file", file);

		return this.request("/upload/json", {
			method: "POST",
			body: formData,
			headers: {}, // Remove Content-Type to let browser set it for FormData
		});
	}

	async getUploadHistory(page = 1, limit = 10) {
		const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
		return this.request(`/upload/history?${params}`);
	}

	// Hash endpoints
	async computeHashC(filePath: string) {
		return this.request("/hash/c", {
			method: "POST",
			body: JSON.stringify({ filePath }),
		});
	}

	async computeHashCpp(filePath: string) {
		return this.request("/hash/cpp", {
			method: "POST",
			body: JSON.stringify({ filePath }),
		});
	}

	async compareHashes(filePath: string) {
		return this.request("/hash/compare", {
			method: "POST",
			body: JSON.stringify({ filePath }),
		});
	}

	async checkHashHealth() {
		return this.request("/hash/health");
	}
}

export const api = new ApiClient();
