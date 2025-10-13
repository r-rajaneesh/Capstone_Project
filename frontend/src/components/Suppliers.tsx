import { AlertTriangle, Building, Edit, Eye, Mail, Phone, Plus, Search, Trash2, User } from "lucide-react";
import React, { useEffect, useState } from "react";
import { api, type Supplier } from "../utils/api";

interface SupplierFormProps {
	supplier?: Supplier;
	onSubmit: (supplier: Partial<Supplier>) => void;
	onCancel: () => void;
	isOpen: boolean;
}

const SupplierForm: React.FC<SupplierFormProps> = ({ supplier, onSubmit, onCancel, isOpen }) => {
	const [formData, setFormData] = useState({
		name: supplier?.name || "",
		contact_person: supplier?.contact_person || "",
		phone: supplier?.phone || "",
		email: supplier?.email || "",
		address: supplier?.address || "",
	});

	useEffect(() => {
		if (supplier) {
			setFormData({
				name: supplier.name || "",
				contact_person: supplier.contact_person || "",
				phone: supplier.phone || "",
				email: supplier.email || "",
				address: supplier.address || "",
			});
		} else {
			setFormData({
				name: "",
				contact_person: "",
				phone: "",
				email: "",
				address: "",
			});
		}
	}, [supplier]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit(formData);
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
			<div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
				<div className="mt-3">
					<h3 className="text-lg font-medium text-gray-900 mb-4">{supplier ? "Edit Supplier" : "Add New Supplier"}</h3>
					<form
						onSubmit={handleSubmit}
						className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700">Company Name *</label>
							<input
								type="text"
								required
								value={formData.name}
								onChange={(e) => setFormData({ ...formData, name: e.target.value })}
								className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Contact Person</label>
							<input
								type="text"
								value={formData.contact_person}
								onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
								className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Phone</label>
							<input
								type="tel"
								value={formData.phone}
								onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
								className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Email</label>
							<input
								type="email"
								value={formData.email}
								onChange={(e) => setFormData({ ...formData, email: e.target.value })}
								className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Address</label>
							<textarea
								value={formData.address}
								onChange={(e) => setFormData({ ...formData, address: e.target.value })}
								rows={3}
								className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
							/>
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
								{supplier ? "Update" : "Add"} Supplier
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

const Suppliers: React.FC = () => {
	const [suppliers, setSuppliers] = useState<Supplier[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>();
	const [deletingId, setDeletingId] = useState<number | null>(null);

	const fetchSuppliers = async (page = 1, searchTerm = "") => {
		try {
			setLoading(true);
			setError(null);

			const response = await api.getSuppliers(searchTerm, page, 10);
			setSuppliers(response.suppliers);
			setTotalPages(response.pagination.totalPages);
			setCurrentPage(response.pagination.page);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch suppliers");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchSuppliers(currentPage, search);
	}, [currentPage, search]);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		setCurrentPage(1);
		fetchSuppliers(1, search);
	};

	const handleAddSupplier = async (supplierData: Partial<Supplier>) => {
		try {
			if (editingSupplier) {
				await api.updateSupplier(editingSupplier.id, supplierData);
			} else {
				await api.createSupplier(supplierData);
			}
			setIsFormOpen(false);
			setEditingSupplier(undefined);
			fetchSuppliers(currentPage, search);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save supplier");
		}
	};

	const handleDeleteSupplier = async (id: number) => {
		if (!confirm("Are you sure you want to delete this supplier?")) return;

		try {
			setDeletingId(id);
			await api.deleteSupplier(id);
			fetchSuppliers(currentPage, search);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete supplier");
		} finally {
			setDeletingId(null);
		}
	};

	const handleEditSupplier = (supplier: Supplier) => {
		setEditingSupplier(supplier);
		setIsFormOpen(true);
	};

	const handleAddNew = () => {
		setEditingSupplier(undefined);
		setIsFormOpen(true);
	};

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
					<p className="mt-1 text-sm text-gray-600">Manage your medicine suppliers</p>
				</div>
				<button
					onClick={handleAddNew}
					className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
					<Plus className="h-4 w-4 mr-2" />
					Add Supplier
				</button>
			</div>

			{/* Search and Filters */}
			<div className="bg-white shadow rounded-lg p-6">
				<form
					onSubmit={handleSearch}
					className="flex gap-4">
					<div className="flex-1">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
							<input
								type="text"
								placeholder="Search suppliers by name or contact person..."
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

			{/* Suppliers Table */}
			<div className="bg-white shadow rounded-lg overflow-hidden">
				{loading ? (
					<div className="flex items-center justify-center h-64">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
					</div>
				) : suppliers.length === 0 ? (
					<div className="text-center py-12">
						<Building className="mx-auto h-12 w-12 text-gray-400" />
						<h3 className="mt-2 text-sm font-medium text-gray-900">No suppliers found</h3>
						<p className="mt-1 text-sm text-gray-500">
							{search ? "Try adjusting your search criteria." : "Get started by adding a new supplier."}
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Supplier
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Contact
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Contact Info
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Purchase Orders
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Total Purchases
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{suppliers.map((supplier) => (
									<tr
										key={supplier.id}
										className="hover:bg-gray-50">
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="flex items-center">
												<Building className="h-8 w-8 text-gray-400 mr-3" />
												<div>
													<div className="text-sm font-medium text-gray-900">{supplier.name}</div>
													{supplier.address && <div className="text-sm text-gray-500">{supplier.address}</div>}
												</div>
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											{supplier.contact_person ? (
												<div className="flex items-center">
													<User className="h-4 w-4 text-gray-400 mr-2" />
													<span className="text-sm text-gray-900">{supplier.contact_person}</span>
												</div>
											) : (
												<span className="text-sm text-gray-500">-</span>
											)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="space-y-1">
												{supplier.phone && (
													<div className="flex items-center text-sm text-gray-900">
														<Phone className="h-4 w-4 text-gray-400 mr-2" />
														{supplier.phone}
													</div>
												)}
												{supplier.email && (
													<div className="flex items-center text-sm text-gray-900">
														<Mail className="h-4 w-4 text-gray-400 mr-2" />
														{supplier.email}
													</div>
												)}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{supplier.purchase_order_count || 0} orders
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											${(supplier.total_purchases || 0).toFixed(2)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
											<button
												onClick={() => window.open(`/suppliers/${supplier.id}`, "_blank")}
												className="text-primary-600 hover:text-primary-900">
												<Eye className="h-4 w-4" />
											</button>
											<button
												onClick={() => handleEditSupplier(supplier)}
												className="text-primary-600 hover:text-primary-900">
												<Edit className="h-4 w-4" />
											</button>
											<button
												onClick={() => handleDeleteSupplier(supplier.id)}
												disabled={deletingId === supplier.id}
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

			{/* Supplier Form Modal */}
			<SupplierForm
				supplier={editingSupplier}
				onSubmit={handleAddSupplier}
				onCancel={() => {
					setIsFormOpen(false);
					setEditingSupplier(undefined);
				}}
				isOpen={isFormOpen}
			/>
		</div>
	);
};

export default Suppliers;
