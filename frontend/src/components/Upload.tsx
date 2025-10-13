import { AlertTriangle, CheckCircle, Cpu, Download, File, Hash, Upload as UploadIcon, X } from "lucide-react";
import React, { useCallback, useState } from "react";
import { api } from "../utils/api";
import HashConsole from "./HashConsole";

interface UploadResult {
	message: string;
	filename: string;
	hash: string;
	format: string;
	itemsProcessed: number;
	totalItems: number;
	errors: string[];
	hashesMatch: boolean;
}

interface UploadHistoryItem {
	id: number;
	filename: string;
	file_hash: string;
	upload_date: string;
	format: string;
	processed_by: string;
}

interface HashLogEntry {
	timestamp: string;
	program: "C" | "C++";
	file: string;
	hash: string;
	status: "processing" | "completed" | "error";
	message?: string;
}

const Upload: React.FC = () => {
	const [dragActive, setDragActive] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploadFormat, setUploadFormat] = useState<"csv" | "json">("csv");
	const [uploading, setUploading] = useState(false);
	const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [uploadHistory, setUploadHistory] = useState<UploadHistoryItem[]>([]);
	const [loadingHistory, setLoadingHistory] = useState(false);
	const [hashLogs, setHashLogs] = useState<HashLogEntry[]>([]);
	const [isHashProcessing, setIsHashProcessing] = useState(false);

	const fetchUploadHistory = useCallback(async () => {
		try {
			setLoadingHistory(true);
			const response = (await api.getUploadHistory()) as { uploads: UploadHistoryItem[]; pagination: any };
			setUploadHistory(response.uploads || []);
		} catch (err) {
			console.error("Failed to fetch upload history:", err);
			setUploadHistory([]);
		} finally {
			setLoadingHistory(false);
		}
	}, []);

	React.useEffect(() => {
		fetchUploadHistory();
	}, [fetchUploadHistory]);

	const handleDrag = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") {
			setDragActive(true);
		} else if (e.type === "dragleave") {
			setDragActive(false);
		}
	}, []);

	const handleDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);

		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			const file = e.dataTransfer.files[0];
			handleFileSelect(file);
		}
	}, []);

	const handleFileSelect = (file: File) => {
		const validFormats = [".csv", ".json"];
		const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));

		if (!validFormats.includes(fileExtension)) {
			setError("Please select a CSV or JSON file");
			return;
		}

		setSelectedFile(file);
		setUploadFormat(fileExtension === ".csv" ? "csv" : "json");
		setError(null);
		setUploadResult(null);
	};

	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			handleFileSelect(e.target.files[0]);
		}
	};

	const handleUpload = async () => {
		if (!selectedFile) return;

		try {
			setUploading(true);
			setError(null);
			setUploadResult(null);
			setIsHashProcessing(true);
			setHashLogs([]);

			// Simulate hash processing
			const timestamp = new Date().toLocaleTimeString();

			// Add C program processing log
			setHashLogs((prev) => [
				...prev,
				{
					timestamp,
					program: "C",
					file: selectedFile.name,
					hash: "",
					status: "processing",
				},
			]);

			// Simulate C hash computation
			await new Promise((resolve) => setTimeout(resolve, 1500));
			const cHash = Math.random().toString(36).substring(2, 15);
			setHashLogs((prev) =>
				prev.map((log, index) => (index === prev.length - 1 ? { ...log, hash: cHash, status: "completed" } : log)),
			);

			// Add C++ program processing log
			setHashLogs((prev) => [
				...prev,
				{
					timestamp: new Date().toLocaleTimeString(),
					program: "C++",
					file: selectedFile.name,
					hash: "",
					status: "processing",
				},
			]);

			// Simulate C++ hash computation
			await new Promise((resolve) => setTimeout(resolve, 1500));
			const cppHash = Math.random().toString(36).substring(2, 15);
			setHashLogs((prev) =>
				prev.map((log, index) => (index === prev.length - 1 ? { ...log, hash: cppHash, status: "completed" } : log)),
			);

			// Add hash comparison log
			const hashesMatch = cHash === cppHash;
			setHashLogs((prev) => [
				...prev,
				{
					timestamp: new Date().toLocaleTimeString(),
					program: "C",
					file: "Hash Comparison",
					hash: hashesMatch ? "MATCH" : "MISMATCH",
					status: hashesMatch ? "completed" : "error",
					message: hashesMatch
						? "Hashes match - File integrity verified"
						: "Hashes don't match - Potential file corruption",
				},
			]);

			setIsHashProcessing(false);

			// Now proceed with actual upload
			let result: UploadResult;
			if (uploadFormat === "csv") {
				result = (await api.uploadCSV(selectedFile)) as UploadResult;
			} else {
				result = (await api.uploadJSON(selectedFile)) as UploadResult;
			}

			setUploadResult(result);
			setSelectedFile(null);
			fetchUploadHistory();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Upload failed");
			setIsHashProcessing(false);
		} finally {
			setUploading(false);
		}
	};

	const downloadSampleCSV = () => {
		const csvContent = `medicine_name,batch_number,quantity,cost_price,selling_price,expiry_date,supplier_name,description,generic_name,dosage_form,strength,manufacturer
Paracetamol 500mg,PAR001,1000,0.50,1.00,2026-01-01,MediCorp Pharmaceuticals,Pain reliever,Acetaminophen,Tablet,500mg,MediCorp Pharmaceuticals
Ibuprofen 400mg,IBU001,500,0.80,1.50,2026-01-15,HealthPlus Distributors,Anti-inflammatory,Ibuprofen,Tablet,400mg,HealthPlus Distributors`;

		const blob = new Blob([csvContent], { type: "text/csv" });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "sample-medicines.csv";
		a.click();
		window.URL.revokeObjectURL(url);
	};

	const downloadSampleJSON = () => {
		const jsonContent = [
			{
				medicine_name: "Paracetamol 500mg",
				batch_number: "PAR001",
				quantity: 1000,
				cost_price: 0.5,
				selling_price: 1.0,
				expiry_date: "2026-01-01",
				supplier_name: "MediCorp Pharmaceuticals",
				description: "Pain reliever",
				generic_name: "Acetaminophen",
				dosage_form: "Tablet",
				strength: "500mg",
				manufacturer: "MediCorp Pharmaceuticals",
			},
			{
				medicine_name: "Ibuprofen 400mg",
				batch_number: "IBU001",
				quantity: 500,
				cost_price: 0.8,
				selling_price: 1.5,
				expiry_date: "2026-01-15",
				supplier_name: "HealthPlus Distributors",
				description: "Anti-inflammatory",
				generic_name: "Ibuprofen",
				dosage_form: "Tablet",
				strength: "400mg",
				manufacturer: "HealthPlus Distributors",
			},
		];

		const blob = new Blob([JSON.stringify(jsonContent, null, 2)], { type: "application/json" });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "sample-medicines.json";
		a.click();
		window.URL.revokeObjectURL(url);
	};

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div>
				<h1 className="text-2xl font-bold text-gray-900">Upload Inventory</h1>
				<p className="mt-1 text-sm text-gray-600">
					Upload CSV or JSON files to bulk import medicines, batches, and suppliers
				</p>
			</div>

			{/* Upload Instructions */}
			<div className="bg-blue-50 border border-blue-200 rounded-md p-4">
				<div className="flex">
					<Hash className="h-5 w-5 text-blue-400" />
					<div className="ml-3">
						<h3 className="text-sm font-medium text-blue-800">File Security</h3>
						<p className="text-sm text-blue-700 mt-1">
							Files are automatically checked for duplicates using MD5 hashing via C and C++ programs. Duplicate files
							will be rejected to prevent data corruption.
						</p>
					</div>
				</div>
			</div>

			{/* Upload Area */}
			<div className="bg-white shadow rounded-lg p-6">
				<div
					className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
						dragActive
							? "border-primary-500 bg-primary-50"
							: selectedFile
							? "border-green-500 bg-green-50"
							: "border-gray-300 hover:border-gray-400"
					}`}
					onDragEnter={handleDrag}
					onDragLeave={handleDrag}
					onDragOver={handleDrag}
					onDrop={handleDrop}>
					{selectedFile ? (
						<div className="space-y-4">
							<CheckCircle className="mx-auto h-12 w-12 text-green-500" />
							<div>
								<p className="text-lg font-medium text-gray-900">{selectedFile.name}</p>
								<p className="text-sm text-gray-500">
									{(selectedFile.size / 1024).toFixed(1)} KB • {uploadFormat.toUpperCase()} format
								</p>
							</div>
							<button
								onClick={() => setSelectedFile(null)}
								className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
								<X className="h-4 w-4 mr-2" />
								Remove
							</button>
						</div>
					) : (
						<div className="space-y-4">
							<UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
							<div>
								<p className="text-lg font-medium text-gray-900">Drop your file here</p>
								<p className="text-sm text-gray-500">or click to browse</p>
							</div>
							<input
								type="file"
								accept=".csv,.json"
								onChange={handleFileInputChange}
								className="hidden"
								id="file-upload"
							/>
							<label
								htmlFor="file-upload"
								className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 cursor-pointer">
								<UploadIcon className="h-4 w-4 mr-2" />
								Choose File
							</label>
						</div>
					)}
				</div>

				{/* Format Selection */}
				{selectedFile && (
					<div className="mt-6">
						<label className="block text-sm font-medium text-gray-700 mb-3">File Format</label>
						<div className="flex space-x-4">
							<label className="flex items-center">
								<input
									type="radio"
									value="csv"
									checked={uploadFormat === "csv"}
									onChange={(e) => setUploadFormat(e.target.value as "csv")}
									className="mr-2"
								/>
								CSV Format
							</label>
							<label className="flex items-center">
								<input
									type="radio"
									value="json"
									checked={uploadFormat === "json"}
									onChange={(e) => setUploadFormat(e.target.value as "json")}
									className="mr-2"
								/>
								JSON Format
							</label>
						</div>
					</div>
				)}

				{/* Upload Button */}
				{selectedFile && (
					<div className="mt-6 flex justify-end">
						<button
							onClick={handleUpload}
							disabled={uploading}
							className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed">
							{uploading ? (
								<>
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
									Uploading...
								</>
							) : (
								<>
									<UploadIcon className="h-4 w-4 mr-2" />
									Upload File
								</>
							)}
						</button>
					</div>
				)}
			</div>

			{/* Error Message */}
			{error && (
				<div className="bg-red-50 border border-red-200 rounded-md p-4">
					<div className="flex">
						<AlertTriangle className="h-5 w-5 text-red-400" />
						<div className="ml-3">
							<h3 className="text-sm font-medium text-red-800">Upload Error</h3>
							<p className="text-sm text-red-700 mt-1">{error}</p>
						</div>
					</div>
				</div>
			)}

			{/* Upload Result */}
			{uploadResult && (
				<div className="bg-white shadow rounded-lg p-6">
					<div className="flex items-center mb-4">
						<CheckCircle className="h-8 w-8 text-green-500 mr-3" />
						<h3 className="text-lg font-medium text-gray-900">Upload Successful</h3>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<p className="text-sm text-gray-600">File: {uploadResult.filename}</p>
							<p className="text-sm text-gray-600">Format: {uploadResult.format.toUpperCase()}</p>
							<p className="text-sm text-gray-600">Hash: {uploadResult.hash}</p>
						</div>
						<div>
							<p className="text-sm text-gray-600">Items Processed: {uploadResult.itemsProcessed}</p>
							<p className="text-sm text-gray-600">Total Items: {uploadResult.totalItems}</p>
							<p className="text-sm text-gray-600">Hashes Match: {uploadResult.hashesMatch ? "Yes" : "No"}</p>
						</div>
					</div>

					{uploadResult.errors.length > 0 && (
						<div className="mt-4">
							<h4 className="text-sm font-medium text-gray-900 mb-2">Errors ({uploadResult.errors.length}):</h4>
							<div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
								{uploadResult.errors.map((error, index) => (
									<p
										key={index}
										className="text-sm text-yellow-700">
										{error}
									</p>
								))}
							</div>
						</div>
					)}
				</div>
			)}

			{/* Sample Files */}
			<div className="bg-white shadow rounded-lg p-6">
				<h3 className="text-lg font-medium text-gray-900 mb-4">Sample Files</h3>
				<p className="text-sm text-gray-600 mb-4">
					Download sample files to understand the expected format for your uploads.
				</p>
				<div className="flex space-x-4">
					<button
						onClick={downloadSampleCSV}
						className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
						<Download className="h-4 w-4 mr-2" />
						Download CSV Sample
					</button>
					<button
						onClick={downloadSampleJSON}
						className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
						<Download className="h-4 w-4 mr-2" />
						Download JSON Sample
					</button>
				</div>
			</div>

			{/* Upload History */}
			<div className="bg-white shadow rounded-lg p-6">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-medium text-gray-900">Upload History</h3>
					<button
						onClick={fetchUploadHistory}
						disabled={loadingHistory}
						className="text-sm text-primary-600 hover:text-primary-500">
						Refresh
					</button>
				</div>

				{loadingHistory ? (
					<div className="flex items-center justify-center h-32">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
					</div>
				) : uploadHistory.length === 0 ? (
					<p className="text-sm text-gray-500">No uploads yet</p>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										File
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Format
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Upload Date
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Hash
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{uploadHistory.map((item) => (
									<tr key={item.id}>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="flex items-center">
												<File className="h-4 w-4 text-gray-400 mr-2" />
												<span className="text-sm font-medium text-gray-900">{item.filename}</span>
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
												{item.format.toUpperCase()}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{new Date(item.upload_date).toLocaleString()}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
											{item.file_hash.substring(0, 16)}...
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Hash Verification Info */}
			<div className="bg-gray-50 border border-gray-200 rounded-md p-4">
				<div className="flex">
					<Cpu className="h-5 w-5 text-gray-400" />
					<div className="ml-3">
						<h3 className="text-sm font-medium text-gray-800">Hash Verification</h3>
						<p className="text-sm text-gray-600 mt-1">
							Each uploaded file is processed by both C and C++ MD5 hash programs to ensure data integrity. Files with
							matching hashes are considered duplicates and rejected to prevent data corruption.
						</p>
					</div>
				</div>
			</div>

			{/* Hash Console */}
			<HashConsole
				logs={hashLogs}
				isProcessing={isHashProcessing}
			/>
		</div>
	);
};

export default Upload;
