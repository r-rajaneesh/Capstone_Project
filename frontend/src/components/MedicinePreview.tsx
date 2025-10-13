import { AlertTriangle, Calendar, CheckCircle, Package, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { api, type Batch, type Medicine } from "../utils/api";

interface MedicinePreviewProps {
	medicine: Medicine | null;
	isOpen: boolean;
	onClose: () => void;
}

const MedicinePreview: React.FC<MedicinePreviewProps> = ({ medicine, isOpen, onClose }) => {
	const [medicineDetails, setMedicineDetails] = useState<(Medicine & { batches: Batch[] }) | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (isOpen && medicine) {
			fetchMedicineDetails();
		}
	}, [isOpen, medicine]);

	const fetchMedicineDetails = async () => {
		if (!medicine) return;

		try {
			setLoading(true);
			const details = await api.getMedicine(medicine.id);
			setMedicineDetails(details);
		} catch (err) {
			console.error("Failed to fetch medicine details:", err);
		} finally {
			setLoading(false);
		}
	};

	const getBatchStatus = (batch: Batch) => {
		const today = new Date();
		const expiryDate = new Date(batch.expiry_date || "");
		const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

		if (daysUntilExpiry < 0) return { status: "expired", color: "text-red-600", bg: "bg-red-100" };
		if (daysUntilExpiry <= 30) return { status: "expiring", color: "text-yellow-600", bg: "bg-yellow-100" };
		if (batch.quantity <= 10) return { status: "low_stock", color: "text-orange-600", bg: "bg-orange-100" };
		return { status: "good", color: "text-green-600", bg: "bg-green-100" };
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "expired":
				return <AlertTriangle className="h-4 w-4 text-red-600" />;
			case "expiring":
				return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
			case "low_stock":
				return <AlertTriangle className="h-4 w-4 text-orange-600" />;
			case "good":
				return <CheckCircle className="h-4 w-4 text-green-600" />;
			default:
				return null;
		}
	};

	const getStatusText = (status: string) => {
		switch (status) {
			case "expired":
				return "Expired";
			case "expiring":
				return "Expiring Soon";
			case "low_stock":
				return "Low Stock";
			case "good":
				return "Good";
			default:
				return "Unknown";
		}
	};

	if (!isOpen || !medicine) return null;

	return (
		<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
			<div className="relative top-20 mx-auto p-5 border w-[900px] shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
				{/* Header */}
				<div className="flex justify-between items-start mb-6">
					<div>
						<h2 className="text-2xl font-bold text-gray-900">{medicine.name}</h2>
						<p className="text-sm text-gray-600 mt-1">{medicine.generic_name && `Generic: ${medicine.generic_name}`}</p>
					</div>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition-colors">
						<X className="h-6 w-6" />
					</button>
				</div>

				{loading ? (
					<div className="flex items-center justify-center h-32">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
					</div>
				) : (
					<div className="space-y-6">
						{/* Medicine Information */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="bg-gray-50 rounded-lg p-4">
								<h3 className="text-lg font-medium text-gray-900 mb-4">Medicine Details</h3>
								<div className="space-y-3">
									<div className="flex justify-between">
										<span className="text-sm text-gray-600">Dosage Form:</span>
										<span className="text-sm font-medium">{medicine.dosage_form || "N/A"}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-sm text-gray-600">Strength:</span>
										<span className="text-sm font-medium">{medicine.strength || "N/A"}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-sm text-gray-600">Manufacturer:</span>
										<span className="text-sm font-medium">{medicine.manufacturer || "N/A"}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-sm text-gray-600">Initial Stock:</span>
										<span className="text-sm font-medium">{medicine.initial_stock || 0}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-sm text-gray-600">Current Stock:</span>
										<span className="text-sm font-medium">{medicine.total_stock || 0}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-sm text-gray-600">Batch Count:</span>
										<span className="text-sm font-medium">{medicine.batch_count || 0}</span>
									</div>
								</div>
							</div>

							<div className="bg-gray-50 rounded-lg p-4">
								<h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
								<p className="text-sm text-gray-700">{medicine.description || "No description available."}</p>
							</div>
						</div>

						{/* Batches Information */}
						{medicineDetails?.batches && medicineDetails.batches.length > 0 && (
							<div>
								<h3 className="text-lg font-medium text-gray-900 mb-4">Batch Information</h3>
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Batch Number
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Quantity
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Manufacturing Date
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Expiry Date
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Cost Price
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Selling Price
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
													Status
												</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{medicineDetails.batches.map((batch) => {
												const status = getBatchStatus(batch);
												return (
													<tr
														key={batch.id}
														className="hover:bg-gray-50">
														<td className="px-6 py-4 whitespace-nowrap">
															<div className="flex items-center">
																<Package className="h-4 w-4 text-gray-400 mr-2" />
																<span className="text-sm font-medium text-gray-900">{batch.batch_number}</span>
															</div>
														</td>
														<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{batch.quantity}</td>
														<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
															{batch.manufacturing_date ? (
																<div className="flex items-center">
																	<Calendar className="h-4 w-4 text-gray-400 mr-1" />
																	{new Date(batch.manufacturing_date).toLocaleDateString()}
																</div>
															) : (
																"N/A"
															)}
														</td>
														<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
															{batch.expiry_date ? (
																<div className="flex items-center">
																	<Calendar className="h-4 w-4 text-gray-400 mr-1" />
																	{new Date(batch.expiry_date).toLocaleDateString()}
																</div>
															) : (
																"N/A"
															)}
														</td>
														<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
															${batch.cost_price.toFixed(2)}
														</td>
														<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
															${batch.selling_price.toFixed(2)}
														</td>
														<td className="px-6 py-4 whitespace-nowrap">
															<span
																className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.bg}`}>
																{getStatusIcon(status.status)}
																<span className="ml-1">{getStatusText(status.status)}</span>
															</span>
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							</div>
						)}

						{/* Summary Statistics */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="bg-blue-50 rounded-lg p-4">
								<div className="flex items-center">
									<Package className="h-8 w-8 text-blue-600 mr-3" />
									<div>
										<p className="text-sm text-blue-600">Total Stock</p>
										<p className="text-2xl font-bold text-blue-900">{medicine.total_stock || 0}</p>
									</div>
								</div>
							</div>

							<div className="bg-green-50 rounded-lg p-4">
								<div className="flex items-center">
									<CheckCircle className="h-8 w-8 text-green-600 mr-3" />
									<div>
										<p className="text-sm text-green-600">Active Batches</p>
										<p className="text-2xl font-bold text-green-900">
											{medicineDetails?.batches?.filter((b) => {
												const status = getBatchStatus(b);
												return status.status === "good";
											}).length || 0}
										</p>
									</div>
								</div>
							</div>

							<div className="bg-yellow-50 rounded-lg p-4">
								<div className="flex items-center">
									<AlertTriangle className="h-8 w-8 text-yellow-600 mr-3" />
									<div>
										<p className="text-sm text-yellow-600">Alerts</p>
										<p className="text-2xl font-bold text-yellow-900">
											{medicineDetails?.batches?.filter((b) => {
												const status = getBatchStatus(b);
												return status.status !== "good";
											}).length || 0}
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default MedicinePreview;
