import { AlertTriangle, Edit, Eye, Package, Plus, Search, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { api, type Medicine } from "../utils/api";
import MedicinePreview from "./MedicinePreview";

interface MedicineFormProps {
	medicine?: Medicine;
	onSubmit: (medicine: Partial<Medicine>) => void;
	onCancel: () => void;
	isOpen: boolean;
}

const MedicineForm: React.FC<MedicineFormProps> = ({ medicine, onSubmit, onCancel, isOpen }) => {
	const [formData, setFormData] = useState({
		name: medicine?.name || "",
		description: medicine?.description || "",
		generic_name: medicine?.generic_name || "",
		dosage_form: medicine?.dosage_form || "",
		strength: medicine?.strength || "",
		manufacturer: medicine?.manufacturer || "",
		initial_stock: medicine?.initial_stock || 0,
	});

	useEffect(() => {
		if (medicine) {
			setFormData({
				name: medicine.name || "",
				description: medicine.description || "",
				generic_name: medicine.generic_name || "",
				dosage_form: medicine.dosage_form || "",
				strength: medicine.strength || "",
				manufacturer: medicine.manufacturer || "",
				initial_stock: medicine.initial_stock || 0,
			});
		} else {
			setFormData({
				name: "",
				description: "",
				generic_name: "",
				dosage_form: "",
				strength: "",
				manufacturer: "",
				initial_stock: 0,
			});
		}
	}, [medicine]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit(formData);
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
			<div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
				<div className="mt-3">
					<h3 className="text-lg font-medium text-gray-900 mb-4">{medicine ? "Edit Medicine" : "Add New Medicine"}</h3>
					<form
						onSubmit={handleSubmit}
						className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700">Name *</label>
							<input
								type="text"
								required
								value={formData.name}
								onChange={(e) => setFormData({ ...formData, name: e.target.value })}
								className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Generic Name</label>
							<input
								type="text"
								value={formData.generic_name}
								onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
								className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Dosage Form</label>
							<select
								value={formData.dosage_form}
								onChange={(e) => setFormData({ ...formData, dosage_form: e.target.value })}
								className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500">
								<option value="">Select dosage form</option>
								<option value="Tablet">Tablet</option>
								<option value="Capsule">Capsule</option>
								<option value="Syrup">Syrup</option>
								<option value="Injection">Injection</option>
								<option value="Cream">Cream</option>
								<option value="Ointment">Ointment</option>
								<option value="Drops">Drops</option>
								<option value="Inhaler">Inhaler</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Strength</label>
							<input
								type="text"
								value={formData.strength}
								onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
								placeholder="e.g., 500mg, 10ml"
								className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Manufacturer</label>
							<input
								type="text"
								value={formData.manufacturer}
								onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
								className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Initial Stock Quantity</label>
							<input
								type="number"
								min="0"
								value={formData.initial_stock}
								onChange={(e) => setFormData({ ...formData, initial_stock: parseInt(e.target.value) || 0 })}
								placeholder="Enter initial stock quantity"
								className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Description</label>
							<textarea
								value={formData.description}
								onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
								{medicine ? "Update" : "Add"} Medicine
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

const Medicines: React.FC = () => {
	const [medicines, setMedicines] = useState<Medicine[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingMedicine, setEditingMedicine] = useState<Medicine | undefined>();
	const [deletingId, setDeletingId] = useState<number | null>(null);
	const [previewMedicine, setPreviewMedicine] = useState<Medicine | null>(null);
	const [isPreviewOpen, setIsPreviewOpen] = useState(false);

	const fetchMedicines = async (page = 1, searchTerm = "") => {
		try {
			setLoading(true);
			setError(null);

			const response = (await api.getMedicines(searchTerm, page, 10)) as {
				medicines: Medicine[];
				pagination: { totalPages: number; page: number };
			};
			setMedicines(response.medicines);
			setTotalPages(response.pagination.totalPages);
			setCurrentPage(response.pagination.page);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch medicines");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchMedicines(currentPage, search);
	}, [currentPage, search]);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		setCurrentPage(1);
		fetchMedicines(1, search);
	};

	const handleAddMedicine = async (medicineData: Partial<Medicine>) => {
		try {
			if (editingMedicine) {
				await api.updateMedicine(editingMedicine.id, medicineData);
			} else {
				await api.createMedicine(medicineData);
			}
			setIsFormOpen(false);
			setEditingMedicine(undefined);
			fetchMedicines(currentPage, search);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save medicine");
		}
	};

	const handleDeleteMedicine = async (id: number) => {
		if (!confirm("Are you sure you want to delete this medicine?")) return;

		try {
			setDeletingId(id);
			await api.deleteMedicine(id);
			fetchMedicines(currentPage, search);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete medicine");
		} finally {
			setDeletingId(null);
		}
	};

	const handleEditMedicine = (medicine: Medicine) => {
		setEditingMedicine(medicine);
		setIsFormOpen(true);
	};

	const handleAddNew = () => {
		setEditingMedicine(undefined);
		setIsFormOpen(true);
	};

	const handlePreviewMedicine = (medicine: Medicine) => {
		setPreviewMedicine(medicine);
		setIsPreviewOpen(true);
	};

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Medicines</h1>
					<p className="mt-1 text-sm text-gray-600">Manage your medicine inventory</p>
				</div>
				<button
					onClick={handleAddNew}
					className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
					<Plus className="h-4 w-4 mr-2" />
					Add Medicine
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
								placeholder="Search medicines by name, generic name, or manufacturer..."
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

			{/* Medicines Table */}
			<div className="bg-white shadow rounded-lg overflow-hidden">
				{loading ? (
					<div className="flex items-center justify-center h-64">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
					</div>
				) : medicines.length === 0 ? (
					<div className="text-center py-12">
						<Package className="mx-auto h-12 w-12 text-gray-400" />
						<h3 className="mt-2 text-sm font-medium text-gray-900">No medicines found</h3>
						<p className="mt-1 text-sm text-gray-500">
							{search ? "Try adjusting your search criteria." : "Get started by adding a new medicine."}
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Medicine
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Generic Name
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Dosage Form
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Strength
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Manufacturer
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Stock
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{medicines.map((medicine) => (
									<tr
										key={medicine.id}
										className="hover:bg-gray-50">
										<td className="px-6 py-4 whitespace-nowrap">
											<div>
												<div className="text-sm font-medium text-gray-900">{medicine.name}</div>
												{medicine.description && <div className="text-sm text-gray-500">{medicine.description}</div>}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{medicine.generic_name || "-"}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{medicine.dosage_form || "-"}</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{medicine.strength || "-"}</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{medicine.manufacturer || "-"}
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="flex items-center">
												<span className="text-sm text-gray-900">{medicine.total_stock || 0}</span>
												{medicine.total_stock !== undefined && medicine.total_stock <= 10 && (
													<AlertTriangle className="ml-2 h-4 w-4 text-yellow-500" />
												)}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
											<button
												onClick={() => handlePreviewMedicine(medicine)}
												className="text-primary-600 hover:text-primary-900"
												title="Preview Medicine">
												<Eye className="h-4 w-4" />
											</button>
											<button
												onClick={() => handleEditMedicine(medicine)}
												className="text-primary-600 hover:text-primary-900"
												title="Edit Medicine">
												<Edit className="h-4 w-4" />
											</button>
											<button
												onClick={() => handleDeleteMedicine(medicine.id)}
												disabled={deletingId === medicine.id}
												className="text-red-600 hover:text-red-900 disabled:opacity-50"
												title="Delete Medicine">
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

			{/* Medicine Form Modal */}
			<MedicineForm
				medicine={editingMedicine}
				onSubmit={handleAddMedicine}
				onCancel={() => {
					setIsFormOpen(false);
					setEditingMedicine(undefined);
				}}
				isOpen={isFormOpen}
			/>

			{/* Medicine Preview Modal */}
			<MedicinePreview
				medicine={previewMedicine}
				isOpen={isPreviewOpen}
				onClose={() => {
					setIsPreviewOpen(false);
					setPreviewMedicine(null);
				}}
			/>
		</div>
	);
};

export default Medicines;
