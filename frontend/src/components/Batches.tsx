import { AlertTriangle, Calendar, Edit, Package, Plus, Search, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { api, type Batch, type Medicine, type Supplier } from "../utils/api";

interface BatchFormProps {
	batch?: Batch;
	onSubmit: (batch: Partial<Batch>) => void;
	onCancel: () => void;
	isOpen: boolean;
}

const BatchForm: React.FC<BatchFormProps> = ({ batch, onSubmit, onCancel, isOpen }) => {
	const [formData, setFormData] = useState({
		medicine_id: batch?.medicine_id || 0,
		batch_number: batch?.batch_number || "",
		quantity: batch?.quantity || 0,
		cost_price: batch?.cost_price || 0,
		selling_price: batch?.selling_price || 0,
		manufacturing_date: batch?.manufacturing_date || "",
		expiry_date: batch?.expiry_date || "",
		supplier_id: batch?.supplier_id || 0,
	});
	const [medicines, setMedicines] = useState<Medicine[]>([]);
	const [suppliers, setSuppliers] = useState<Supplier[]>([]);

	useEffect(() => {
		if (isOpen) {
			// Fetch medicines and suppliers for dropdowns
			Promise.all([
				api.getMedicines("", 1, 100).then((res) => res.medicines),
				api.getSuppliers("", 1, 100).then((res) => res.suppliers),
			]).then(([medicinesData, suppliersData]) => {
				setMedicines(medicinesData);
				setSuppliers(suppliersData);
			});
		}

		if (batch) {
			setFormData({
				medicine_id: batch.medicine_id || 0,
				batch_number: batch.batch_number || "",
				quantity: batch.quantity || 0,
				cost_price: batch.cost_price || 0,
				selling_price: batch.selling_price || 0,
				manufacturing_date: batch.manufacturing_date || "",
				expiry_date: batch.expiry_date || "",
				supplier_id: batch.supplier_id || 0,
			});
		} else {
			setFormData({
				medicine_id: 0,
				batch_number: "",
				quantity: 0,
				cost_price: 0,
				selling_price: 0,
				manufacturing_date: "",
				expiry_date: "",
				supplier_id: 0,
			});
		}
	}, [batch, isOpen]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit(formData);
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
			<div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
				<div className="mt-3">
					<h3 className="text-lg font-medium text-gray-900 mb-4">{batch ? "Edit Batch" : "Add New Batch"}</h3>
					<form
						onSubmit={handleSubmit}
						className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700">Medicine *</label>
								<select
									required
									value={formData.medicine_id}
									onChange={(e) => setFormData({ ...formData, medicine_id: parseInt(e.target.value) })}
									className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500">
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
								<label className="block text-sm font-medium text-gray-700">Batch Number *</label>
								<input
									type="text"
									required
									value={formData.batch_number}
									onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
									className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
								/>
							</div>
						</div>

						<div className="grid grid-cols-3 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700">Quantity *</label>
								<input
									type="number"
									min="0"
									required
									value={formData.quantity}
									onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
									className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">Cost Price *</label>
								<input
									type="number"
									min="0"
									step="0.01"
									required
									value={formData.cost_price}
									onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
									className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">Selling Price *</label>
								<input
									type="number"
									min="0"
									step="0.01"
									required
									value={formData.selling_price}
									onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
									className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700">Manufacturing Date</label>
								<input
									type="date"
									value={formData.manufacturing_date}
									onChange={(e) => setFormData({ ...formData, manufacturing_date: e.target.value })}
									className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">Expiry Date</label>
								<input
									type="date"
									value={formData.expiry_date}
									onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
									className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Supplier</label>
							<select
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
								{batch ? "Update" : "Add"} Batch
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

const Batches: React.FC = () => {
	const [batches, setBatches] = useState<Batch[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingBatch, setEditingBatch] = useState<Batch | undefined>();
	const [deletingId, setDeletingId] = useState<number | null>(null);
	const [filters, setFilters] = useState({
		lowStock: false,
		expiring: false,
		medicineId: "",
	});

	const fetchBatches = async (page = 1, searchTerm = "", filterOptions = filters) => {
		try {
			setLoading(true);
			setError(null);

			const response = await api.getBatches({
				page,
				limit: 10,
				low_stock: filterOptions.lowStock,
				expiring: filterOptions.expiring,
				medicine_id: filterOptions.medicineId ? parseInt(filterOptions.medicineId) : undefined,
			});
			setBatches(response.batches);
			setTotalPages(response.pagination.totalPages);
			setCurrentPage(response.pagination.page);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch batches");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchBatches(currentPage, search, filters);
	}, [currentPage, search, filters]);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		setCurrentPage(1);
		fetchBatches(1, search, filters);
	};

	const handleFilterChange = (key: string, value: any) => {
		setFilters({ ...filters, [key]: value });
		setCurrentPage(1);
	};

	const handleAddBatch = async (batchData: Partial<Batch>) => {
		try {
			if (editingBatch) {
				await api.updateBatch(editingBatch.id, batchData);
			} else {
				await api.createBatch(batchData);
			}
			setIsFormOpen(false);
			setEditingBatch(undefined);
			fetchBatches(currentPage, search, filters);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save batch");
		}
	};

	const handleDeleteBatch = async (id: number) => {
		if (!confirm("Are you sure you want to delete this batch?")) return;

		try {
			setDeletingId(id);
			await api.deleteBatch(id);
			fetchBatches(currentPage, search, filters);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete batch");
		} finally {
			setDeletingId(null);
		}
	};

	const handleEditBatch = (batch: Batch) => {
		setEditingBatch(batch);
		setIsFormOpen(true);
	};

	const handleAddNew = () => {
		setEditingBatch(undefined);
		setIsFormOpen(true);
	};

	const getStatusColor = (batch: Batch) => {
		const today = new Date();
		const expiryDate = new Date(batch.expiry_date || "");
		const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

		if (daysUntilExpiry < 0) return "bg-red-100 text-red-800";
		if (daysUntilExpiry <= 30) return "bg-yellow-100 text-yellow-800";
		if (batch.quantity <= 10) return "bg-orange-100 text-orange-800";
		return "bg-green-100 text-green-800";
	};

	const getStatusText = (batch: Batch) => {
		const today = new Date();
		const expiryDate = new Date(batch.expiry_date || "");
		const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

		if (daysUntilExpiry < 0) return "Expired";
		if (daysUntilExpiry <= 30) return "Expiring Soon";
		if (batch.quantity <= 10) return "Low Stock";
		return "Good";
	};

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Batches</h1>
					<p className="mt-1 text-sm text-gray-600">Manage medicine batches and inventory</p>
				</div>
				<button
					onClick={handleAddNew}
					className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
					<Plus className="h-4 w-4 mr-2" />
					Add Batch
				</button>
			</div>

			{/* Search and Filters */}
			<div className="bg-white shadow rounded-lg p-6">
				<form
					onSubmit={handleSearch}
					className="space-y-4">
					<div className="flex gap-4">
						<div className="flex-1">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
								<input
									type="text"
									placeholder="Search batches by medicine name, batch number..."
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									className="pl-10 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
								/>
							</div>
						</div>
						<button
							type="submit"
							className="px-4 py-2 bg-primary-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-700">
							Search
						</button>
					</div>

					{/* Filters */}
					<div className="flex gap-4">
						<label className="flex items-center">
							<input
								type="checkbox"
								checked={filters.lowStock}
								onChange={(e) => handleFilterChange("lowStock", e.target.checked)}
								className="mr-2"
							/>
							Low Stock (≤10)
						</label>
						<label className="flex items-center">
							<input
								type="checkbox"
								checked={filters.expiring}
								onChange={(e) => handleFilterChange("expiring", e.target.checked)}
								className="mr-2"
							/>
							Expiring Soon (≤90 days)
						</label>
					</div>
				</form>
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

			{/* Batches Table */}
			<div className="bg-white shadow rounded-lg overflow-hidden">
				{loading ? (
					<div className="flex items-center justify-center h-64">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
					</div>
				) : batches.length === 0 ? (
					<div className="text-center py-12">
						<Package className="mx-auto h-12 w-12 text-gray-400" />
						<h3 className="mt-2 text-sm font-medium text-gray-900">No batches found</h3>
						<p className="mt-1 text-sm text-gray-500">
							{search ? "Try adjusting your search criteria." : "Get started by adding a new batch."}
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Batch
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Medicine
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Quantity
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Prices
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Expiry Date
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
								{batches.map((batch) => (
									<tr
										key={batch.id}
										className="hover:bg-gray-50">
										<td className="px-6 py-4 whitespace-nowrap">
											<div>
												<div className="text-sm font-medium text-gray-900">{batch.batch_number}</div>
												<div className="text-sm text-gray-500">
													{batch.manufacturing_date && (
														<span>MFG: {new Date(batch.manufacturing_date).toLocaleDateString()}</span>
													)}
												</div>
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div>
												<div className="text-sm font-medium text-gray-900">{batch.medicine_name}</div>
												<div className="text-sm text-gray-500">{batch.supplier_name}</div>
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="flex items-center">
												<span className="text-sm text-gray-900">{batch.quantity}</span>
												{batch.quantity <= 10 && <AlertTriangle className="ml-2 h-4 w-4 text-yellow-500" />}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											<div>
												<div>Cost: ${batch.cost_price.toFixed(2)}</div>
												<div>Sell: ${batch.selling_price.toFixed(2)}</div>
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{batch.expiry_date ? (
												<div className="flex items-center">
													<Calendar className="h-4 w-4 mr-1" />
													{new Date(batch.expiry_date).toLocaleDateString()}
												</div>
											) : (
												"-"
											)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span
												className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(batch)}`}>
												{getStatusText(batch)}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
											<button
												onClick={() => handleEditBatch(batch)}
												className="text-primary-600 hover:text-primary-900">
												<Edit className="h-4 w-4" />
											</button>
											<button
												onClick={() => handleDeleteBatch(batch.id)}
												disabled={deletingId === batch.id}
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

			{/* Batch Form Modal */}
			<BatchForm
				batch={editingBatch}
				onSubmit={handleAddBatch}
				onCancel={() => {
					setIsFormOpen(false);
					setEditingBatch(undefined);
				}}
				isOpen={isFormOpen}
			/>
		</div>
	);
};

export default Batches;
