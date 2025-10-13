import { AlertTriangle, Calendar, CreditCard, Eye, Package, Plus, ShoppingBag, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { api, type Batch, type Medicine, type Sale } from "../utils/api";

interface SaleFormProps {
	sale?: Sale;
	onSubmit: (sale: any) => void;
	onCancel: () => void;
	isOpen: boolean;
}

const SaleForm: React.FC<SaleFormProps> = ({ sale, onSubmit, onCancel, isOpen }) => {
	const [formData, setFormData] = useState({
		customer_name: sale?.customer_name || "",
		customer_phone: sale?.customer_phone || "",
		payment_method: sale?.payment_method || "cash",
		items: sale?.items || [],
	});
	const [batches, setBatches] = useState<Batch[]>([]);
	const [medicines, setMedicines] = useState<Medicine[]>([]);
	const [newItem, setNewItem] = useState({
		batch_id: 0,
		quantity: 0,
		unit_price: 0,
	});

	useEffect(() => {
		if (isOpen) {
			// Fetch batches and medicines
			Promise.all([
				api.getBatches({ page: 1, limit: 100 }).then((res) => res.batches),
				api.getMedicines("", 1, 100).then((res) => res.medicines),
			]).then(([batchesData, medicinesData]) => {
				setBatches(batchesData.filter((batch: Batch) => batch.quantity > 0));
				setMedicines(medicinesData);
			});
		}

		if (sale) {
			setFormData({
				customer_name: sale.customer_name || "",
				customer_phone: sale.customer_phone || "",
				payment_method: sale.payment_method || "cash",
				items: sale.items || [],
			});
		} else {
			setFormData({
				customer_name: "",
				customer_phone: "",
				payment_method: "cash",
				items: [],
			});
		}
	}, [sale, isOpen]);

	const handleAddItem = () => {
		if (newItem.batch_id && newItem.quantity > 0 && newItem.unit_price > 0) {
			const selectedBatch = batches.find((b) => b.id === newItem.batch_id);
			if (selectedBatch && newItem.quantity <= selectedBatch.quantity) {
				setFormData({
					...formData,
					items: [...formData.items, { ...newItem }],
				});
				setNewItem({ batch_id: 0, quantity: 0, unit_price: 0 });
			} else {
				alert("Insufficient stock or invalid quantity");
			}
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
			alert("Please add at least one item to the sale");
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
					<h3 className="text-lg font-medium text-gray-900 mb-4">{sale ? "Edit Sale" : "Create Sale"}</h3>
					<form
						onSubmit={handleSubmit}
						className="space-y-4">
						{/* Customer Information */}
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700">Customer Name</label>
								<input
									type="text"
									value={formData.customer_name}
									onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
									className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">Customer Phone</label>
								<input
									type="tel"
									value={formData.customer_phone}
									onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
									className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Payment Method</label>
							<select
								value={formData.payment_method}
								onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
								className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500">
								<option value="cash">Cash</option>
								<option value="card">Card</option>
								<option value="upi">UPI</option>
							</select>
						</div>

						{/* Add Item Section */}
						<div className="border rounded-lg p-4 bg-gray-50">
							<h4 className="text-sm font-medium text-gray-900 mb-3">Add Items</h4>
							<div className="grid grid-cols-4 gap-4">
								<div>
									<label className="block text-xs font-medium text-gray-700">Batch</label>
									<select
										value={newItem.batch_id}
										onChange={(e) => {
											const batchId = parseInt(e.target.value);
											const selectedBatch = batches.find((b) => b.id === batchId);
											setNewItem({
												...newItem,
												batch_id: batchId,
												unit_price: selectedBatch?.selling_price || 0,
											});
										}}
										className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
										<option value={0}>Select Batch</option>
										{batches.map((batch) => {
											const medicine = medicines.find((m) => m.id === batch.medicine_id);
											return (
												<option
													key={batch.id}
													value={batch.id}>
													{medicine?.name} - {batch.batch_number} (Qty: {batch.quantity})
												</option>
											);
										})}
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
								<h4 className="text-sm font-medium text-gray-900 mb-3">Sale Items</h4>
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
												<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
												<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
												<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
												<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
												<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{formData.items.map((item, index) => {
												const batch = batches.find((b) => b.id === item.batch_id);
												const medicine = medicines.find((m) => m.id === batch?.medicine_id);
												return (
													<tr key={index}>
														<td className="px-4 py-2 text-sm text-gray-900">{medicine?.name || "Unknown"}</td>
														<td className="px-4 py-2 text-sm text-gray-900">{batch?.batch_number || "Unknown"}</td>
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
								{sale ? "Update" : "Create"} Sale
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

const Sales: React.FC = () => {
	const [sales, setSales] = useState<Sale[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingSale, setEditingSale] = useState<Sale | undefined>();
	const [deletingId, setDeletingId] = useState<number | null>(null);
	const [filters, setFilters] = useState({
		startDate: "",
		endDate: "",
	});

	const fetchSales = async (page = 1, filterOptions = filters) => {
		try {
			setLoading(true);
			setError(null);

			const response = await api.getSales({
				page,
				limit: 10,
				start_date: filterOptions.startDate || undefined,
				end_date: filterOptions.endDate || undefined,
			});
			setSales(response.sales);
			setTotalPages(response.pagination.totalPages);
			setCurrentPage(response.pagination.page);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch sales");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchSales(currentPage, filters);
	}, [currentPage, filters]);

	const handleFilterChange = (key: string, value: string) => {
		setFilters({ ...filters, [key]: value });
		setCurrentPage(1);
	};

	const handleAddSale = async (saleData: any) => {
		try {
			await api.createSale(saleData);
			setIsFormOpen(false);
			setEditingSale(undefined);
			fetchSales(currentPage, filters);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create sale");
		}
	};

	const handleDeleteSale = async (id: number) => {
		if (!confirm("Are you sure you want to delete this sale?")) return;

		try {
			setDeletingId(id);
			// Note: You might want to add a delete sale API endpoint
			// await api.deleteSale(id);
			alert("Sale deletion not implemented yet");
			fetchSales(currentPage, filters);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete sale");
		} finally {
			setDeletingId(null);
		}
	};

	const handleEditSale = (sale: Sale) => {
		setEditingSale(sale);
		setIsFormOpen(true);
	};

	const handleAddNew = () => {
		setEditingSale(undefined);
		setIsFormOpen(true);
	};

	const getPaymentMethodIcon = (method: string) => {
		switch (method) {
			case "cash":
				return <Package className="h-4 w-4" />;
			case "card":
				return <CreditCard className="h-4 w-4" />;
			case "upi":
				return <CreditCard className="h-4 w-4" />;
			default:
				return <Package className="h-4 w-4" />;
		}
	};

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Sales</h1>
					<p className="mt-1 text-sm text-gray-600">Manage your medicine sales and transactions</p>
				</div>
				<button
					onClick={handleAddNew}
					className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
					<Plus className="h-4 w-4 mr-2" />
					Create Sale
				</button>
			</div>

			{/* Filters */}
			<div className="bg-white shadow rounded-lg p-6">
				<div className="flex gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
						<input
							type="date"
							value={filters.startDate}
							onChange={(e) => handleFilterChange("startDate", e.target.value)}
							className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
						<input
							type="date"
							value={filters.endDate}
							onChange={(e) => handleFilterChange("endDate", e.target.value)}
							className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
						/>
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

			{/* Sales Table */}
			<div className="bg-white shadow rounded-lg overflow-hidden">
				{loading ? (
					<div className="flex items-center justify-center h-64">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
					</div>
				) : sales.length === 0 ? (
					<div className="text-center py-12">
						<ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
						<h3 className="mt-2 text-sm font-medium text-gray-900">No sales found</h3>
						<p className="mt-1 text-sm text-gray-500">Get started by creating a new sale.</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Sale ID
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Customer
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Sale Date
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Items
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Total Amount
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Payment Method
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{sales.map((sale) => (
									<tr
										key={sale.id}
										className="hover:bg-gray-50">
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm font-medium text-gray-900">#{sale.id}</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div>
												<div className="text-sm font-medium text-gray-900">
													{sale.customer_name || "Walk-in Customer"}
												</div>
												{sale.customer_phone && <div className="text-sm text-gray-500">{sale.customer_phone}</div>}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											<div className="flex items-center">
												<Calendar className="h-4 w-4 mr-1" />
												{new Date(sale.sale_date).toLocaleDateString()}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.item_count} items</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											${sale.total_amount.toFixed(2)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
												{getPaymentMethodIcon(sale.payment_method)}
												<span className="ml-1">
													{sale.payment_method.charAt(0).toUpperCase() + sale.payment_method.slice(1)}
												</span>
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
											<button
												onClick={() => window.open(`/sales/${sale.id}`, "_blank")}
												className="text-primary-600 hover:text-primary-900">
												<Eye className="h-4 w-4" />
											</button>
											<button
												onClick={() => handleEditSale(sale)}
												className="text-primary-600 hover:text-primary-900">
												<Edit className="h-4 w-4" />
											</button>
											<button
												onClick={() => handleDeleteSale(sale.id)}
												disabled={deletingId === sale.id}
												className="text-red-600 hover:text-red-900 disabled:opacity-50">
												<Trash2 className="h-4 w-4" />
											</button>
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

			{/* Sale Form Modal */}
			<SaleForm
				sale={editingSale}
				onSubmit={handleAddSale}
				onCancel={() => {
					setIsFormOpen(false);
					setEditingSale(undefined);
				}}
				isOpen={isFormOpen}
			/>
		</div>
	);
};

export default Sales;
