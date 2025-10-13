import { AlertTriangle, CheckCircle, Eye, Plus, ShoppingCart, Trash2, XCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { api, type Medicine, type PurchaseOrder, type Supplier } from "../utils/api";

interface PurchaseOrderFormProps {
	order?: PurchaseOrder;
	onSubmit: (order: any) => void;
	onCancel: () => void;
	isOpen: boolean;
}

const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({ order, onSubmit, onCancel, isOpen }) => {
	const [formData, setFormData] = useState({
		supplier_id: order?.supplier_id || 0,
		expected_delivery: order?.expected_delivery || "",
		items: order?.items || [],
	});
	const [suppliers, setSuppliers] = useState<Supplier[]>([]);
	const [medicines, setMedicines] = useState<Medicine[]>([]);
	const [newItem, setNewItem] = useState({
		medicine_id: 0,
		quantity: 0,
		unit_price: 0,
	});

	useEffect(() => {
		if (isOpen) {
			// Fetch suppliers and medicines for dropdowns
			Promise.all([
				api.getSuppliers("", 1, 100).then((res) => res.suppliers),
				api.getMedicines("", 1, 100).then((res) => res.medicines),
			]).then(([suppliersData, medicinesData]) => {
				setSuppliers(suppliersData);
				setMedicines(medicinesData);
			});
		}

		if (order) {
			setFormData({
				supplier_id: order.supplier_id || 0,
				expected_delivery: order.expected_delivery || "",
				items: order.items || [],
			});
		} else {
			setFormData({
				supplier_id: 0,
				expected_delivery: "",
				items: [],
			});
		}
	}, [order, isOpen]);

	const handleAddItem = () => {
		if (newItem.medicine_id && newItem.quantity > 0 && newItem.unit_price > 0) {
			setFormData({
				...formData,
				items: [...formData.items, { ...newItem }],
			});
			setNewItem({ medicine_id: 0, quantity: 0, unit_price: 0 });
		}
	};

	const handleRemoveItem = (index: number) => {
		setFormData({
			...formData,
			items: formData.items.filter((_, i) => i !== index),
		});
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (formData.items.length === 0) {
			alert("Please add at least one item to the order");
			return;
		}
		onSubmit(formData);
	};

	if (!isOpen) return null;

	const totalAmount = formData.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

	return (
		<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
			<div className="relative top-10 mx-auto p-5 border w-[800px] shadow-lg rounded-md bg-white">
				<div className="mt-3">
					<h3 className="text-lg font-medium text-gray-900 mb-4">
						{order ? "Edit Purchase Order" : "Create Purchase Order"}
					</h3>
					<form
						onSubmit={handleSubmit}
						className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700">Supplier *</label>
								<select
									required
									value={formData.supplier_id}
									onChange={(e) => setFormData({ ...formData, supplier_id: parseInt(e.target.value) })}
									className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500">
									<option value={0}>Select Supplier</option>
									{suppliers.map((supplier) => (
										<option
											key={supplier.id}
											value={supplier.id}>
											{supplier.name}
										</option>
									))}
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">Expected Delivery</label>
								<input
									type="date"
									value={formData.expected_delivery}
									onChange={(e) => setFormData({ ...formData, expected_delivery: e.target.value })}
									className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
								/>
							</div>
						</div>

						{/* Add Item Section */}
						<div className="border rounded-lg p-4 bg-gray-50">
							<h4 className="text-sm font-medium text-gray-900 mb-3">Add Items</h4>
							<div className="grid grid-cols-4 gap-4">
								<div>
									<label className="block text-xs font-medium text-gray-700">Medicine</label>
									<select
										value={newItem.medicine_id}
										onChange={(e) => setNewItem({ ...newItem, medicine_id: parseInt(e.target.value) })}
										className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
										<option value={0}>Select Medicine</option>
										{medicines.map((medicine) => (
											<option
												key={medicine.id}
												value={medicine.id}>
												{medicine.name}
											</option>
										))}
									</select>
								</div>
								<div>
									<label className="block text-xs font-medium text-gray-700">Quantity</label>
									<input
										type="number"
										min="1"
										value={newItem.quantity}
										onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })}
										className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
									/>
								</div>
								<div>
									<label className="block text-xs font-medium text-gray-700">Unit Price</label>
									<input
										type="number"
										min="0"
										step="0.01"
										value={newItem.unit_price}
										onChange={(e) => setNewItem({ ...newItem, unit_price: parseFloat(e.target.value) || 0 })}
										className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
									/>
								</div>
								<div className="flex items-end">
									<button
										type="button"
										onClick={handleAddItem}
										className="w-full px-3 py-2 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700">
										Add Item
									</button>
								</div>
							</div>
						</div>

						{/* Items List */}
						{formData.items.length > 0 && (
							<div>
								<h4 className="text-sm font-medium text-gray-900 mb-3">Order Items</h4>
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
												<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
												<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
												<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
												<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{formData.items.map((item, index) => {
												const medicine = medicines.find((m) => m.id === item.medicine_id);
												return (
													<tr key={index}>
														<td className="px-4 py-2 text-sm text-gray-900">{medicine?.name || "Unknown"}</td>
														<td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
														<td className="px-4 py-2 text-sm text-gray-900">${item.unit_price.toFixed(2)}</td>
														<td className="px-4 py-2 text-sm text-gray-900">
															${(item.quantity * item.unit_price).toFixed(2)}
														</td>
														<td className="px-4 py-2 text-sm">
															<button
																type="button"
																onClick={() => handleRemoveItem(index)}
																className="text-red-600 hover:text-red-900">
																<Trash2 className="h-4 w-4" />
															</button>
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
								<div className="mt-3 text-right">
									<span className="text-lg font-medium">Total: ${totalAmount.toFixed(2)}</span>
								</div>
							</div>
						)}

						<div className="flex justify-end space-x-3 pt-4">
							<button
								type="button"
								onClick={onCancel}
								className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
								Cancel
							</button>
							<button
								type="submit"
								className="px-4 py-2 bg-primary-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-700">
								{order ? "Update" : "Create"} Order
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

const PurchaseOrders: React.FC = () => {
	const [orders, setOrders] = useState<PurchaseOrder[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingOrder, setEditingOrder] = useState<PurchaseOrder | undefined>();
	const [deletingId, setDeletingId] = useState<number | null>(null);
	const [filters, setFilters] = useState({
		status: "",
		supplierId: "",
	});

	const fetchOrders = async (page = 1, filterOptions = filters) => {
		try {
			setLoading(true);
			setError(null);

			const response = await api.getPurchaseOrders({
				page,
				limit: 10,
				status: filterOptions.status || undefined,
				supplier_id: filterOptions.supplierId ? parseInt(filterOptions.supplierId) : undefined,
			});
			setOrders(response.purchaseOrders);
			setTotalPages(response.pagination.totalPages);
			setCurrentPage(response.pagination.page);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch purchase orders");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchOrders(currentPage, filters);
	}, [currentPage, filters]);

	const handleFilterChange = (key: string, value: string) => {
		setFilters({ ...filters, [key]: value });
		setCurrentPage(1);
	};

	const handleAddOrder = async (orderData: any) => {
		try {
			await api.createPurchaseOrder(orderData);
			setIsFormOpen(false);
			setEditingOrder(undefined);
			fetchOrders(currentPage, filters);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create purchase order");
		}
	};

	const handleUpdateStatus = async (id: number, status: string) => {
		try {
			await api.updatePurchaseOrderStatus(id, status);
			fetchOrders(currentPage, filters);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to update order status");
		}
	};

	const handleDeleteOrder = async (id: number) => {
		if (!confirm("Are you sure you want to delete this purchase order?")) return;

		try {
			setDeletingId(id);
			await api.deletePurchaseOrder(id);
			fetchOrders(currentPage, filters);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete purchase order");
		} finally {
			setDeletingId(null);
		}
	};

	const handleEditOrder = (order: PurchaseOrder) => {
		setEditingOrder(order);
		setIsFormOpen(true);
	};

	const handleAddNew = () => {
		setEditingOrder(undefined);
		setIsFormOpen(true);
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "pending":
				return "bg-yellow-100 text-yellow-800";
			case "received":
				return "bg-green-100 text-green-800";
			case "cancelled":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "pending":
				return <AlertTriangle className="h-4 w-4" />;
			case "received":
				return <CheckCircle className="h-4 w-4" />;
			case "cancelled":
				return <XCircle className="h-4 w-4" />;
			default:
				return null;
		}
	};

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
					<p className="mt-1 text-sm text-gray-600">Manage your purchase orders from suppliers</p>
				</div>
				<button
					onClick={handleAddNew}
					className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
					<Plus className="h-4 w-4 mr-2" />
					Create Order
				</button>
			</div>

			{/* Filters */}
			<div className="bg-white shadow rounded-lg p-6">
				<div className="flex gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
						<select
							value={filters.status}
							onChange={(e) => handleFilterChange("status", e.target.value)}
							className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500">
							<option value="">All Statuses</option>
							<option value="pending">Pending</option>
							<option value="received">Received</option>
							<option value="cancelled">Cancelled</option>
						</select>
					</div>
				</div>
			</div>

			{/* Error Message */}
			{error && (
				<div className="bg-red-50 border border-red-200 rounded-md p-4">
					<div className="flex">
						<AlertTriangle className="h-5 w-5 text-red-400" />
						<div className="ml-3">
							<h3 className="text-sm font-medium text-red-800">Error</h3>
							<p className="text-sm text-red-700 mt-1">{error}</p>
						</div>
					</div>
				</div>
			)}

			{/* Orders Table */}
			<div className="bg-white shadow rounded-lg overflow-hidden">
				{loading ? (
					<div className="flex items-center justify-center h-64">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
					</div>
				) : orders.length === 0 ? (
					<div className="text-center py-12">
						<ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
						<h3 className="mt-2 text-sm font-medium text-gray-900">No purchase orders found</h3>
						<p className="mt-1 text-sm text-gray-500">Get started by creating a new purchase order.</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Order ID
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Supplier
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Order Date
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Expected Delivery
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Items
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Total Amount
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Status
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{orders.map((order) => (
									<tr
										key={order.id}
										className="hover:bg-gray-50">
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm font-medium text-gray-900">#{order.id}</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm font-medium text-gray-900">{order.supplier_name}</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{new Date(order.order_date).toLocaleDateString()}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{order.expected_delivery ? new Date(order.expected_delivery).toLocaleDateString() : "-"}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.item_count} items</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											${order.total_amount.toFixed(2)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span
												className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
													order.status,
												)}`}>
												{getStatusIcon(order.status)}
												<span className="ml-1">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
											<button
												onClick={() => window.open(`/purchase-orders/${order.id}`, "_blank")}
												className="text-primary-600 hover:text-primary-900">
												<Eye className="h-4 w-4" />
											</button>
											{order.status === "pending" && (
												<>
													<button
														onClick={() => handleUpdateStatus(order.id, "received")}
														className="text-green-600 hover:text-green-900">
														<CheckCircle className="h-4 w-4" />
													</button>
													<button
														onClick={() => handleUpdateStatus(order.id, "cancelled")}
														className="text-red-600 hover:text-red-900">
														<XCircle className="h-4 w-4" />
													</button>
												</>
											)}
											{order.status === "pending" && (
												<button
													onClick={() => handleDeleteOrder(order.id)}
													disabled={deletingId === order.id}
													className="text-red-600 hover:text-red-900 disabled:opacity-50">
													<Trash2 className="h-4 w-4" />
												</button>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="flex items-center justify-between">
					<div className="text-sm text-gray-700">
						Page {currentPage} of {totalPages}
					</div>
					<div className="flex space-x-2">
						<button
							onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
							disabled={currentPage === 1}
							className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed">
							Previous
						</button>
						<button
							onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
							disabled={currentPage === totalPages}
							className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed">
							Next
						</button>
					</div>
				</div>
			)}

			{/* Purchase Order Form Modal */}
			<PurchaseOrderForm
				order={editingOrder}
				onSubmit={handleAddOrder}
				onCancel={() => {
					setIsFormOpen(false);
					setEditingOrder(undefined);
				}}
				isOpen={isFormOpen}
			/>
		</div>
	);
};

export default PurchaseOrders;
