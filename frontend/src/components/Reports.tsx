import { Calendar, DollarSign, Package, TrendingDown, TrendingUp } from "lucide-react";
import React, { useEffect, useState } from "react";
import { api, type DashboardStats } from "../utils/api";

interface ReportData {
	salesStats: any;
	topMedicines: any[];
	dailySales: any[];
	paymentBreakdown: any[];
	lowStockAlerts: any[];
	expiringAlerts: any[];
}

const Reports: React.FC = () => {
	const [reportData, setReportData] = useState<ReportData>({
		salesStats: null,
		topMedicines: [],
		dailySales: [],
		paymentBreakdown: [],
		lowStockAlerts: [],
		expiringAlerts: [],
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [dateRange, setDateRange] = useState({
		startDate: "",
		endDate: "",
	});
	const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

	const fetchReportData = async () => {
		try {
			setLoading(true);
			setError(null);

			const [salesStats, topMedicines, dashboardStatsData] = await Promise.all([
				api.getSalesStats({
					start_date: dateRange.startDate || undefined,
					end_date: dateRange.endDate || undefined,
				}),
				api.getTopMedicines(30, 10),
				api.getDashboardStats(),
			]);

			setReportData({
				salesStats,
				topMedicines,
				dailySales: salesStats.dailySales || [],
				paymentBreakdown: salesStats.paymentBreakdown || [],
				lowStockAlerts: [],
				expiringAlerts: [],
			});
			setDashboardStats(dashboardStatsData);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch report data");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchReportData();
	}, [dateRange]);

	const handleDateRangeChange = (key: string, value: string) => {
		setDateRange({ ...dateRange, [key]: value });
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
		}).format(amount);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString();
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-red-50 border border-red-200 rounded-md p-4">
				<div className="flex">
					<div className="ml-3">
						<h3 className="text-sm font-medium text-red-800">Error</h3>
						<p className="text-sm text-red-700 mt-1">{error}</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
					<p className="mt-1 text-sm text-gray-600">Comprehensive insights into your pharmacy operations</p>
				</div>
				<div className="flex gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
						<input
							type="date"
							value={dateRange.startDate}
							onChange={(e) => handleDateRangeChange("startDate", e.target.value)}
							className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
						<input
							type="date"
							value={dateRange.endDate}
							onChange={(e) => handleDateRangeChange("endDate", e.target.value)}
							className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
						/>
					</div>
				</div>
			</div>

			{/* Dashboard Overview Cards */}
			{dashboardStats && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					<div className="bg-white overflow-hidden shadow rounded-lg">
						<div className="p-5">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<Package className="h-6 w-6 text-gray-400" />
								</div>
								<div className="ml-5 w-0 flex-1">
									<dl>
										<dt className="text-sm font-medium text-gray-500 truncate">Total Medicines</dt>
										<dd className="text-lg font-medium text-gray-900">{dashboardStats.overview.totalMedicines}</dd>
									</dl>
								</div>
							</div>
						</div>
					</div>

					<div className="bg-white overflow-hidden shadow rounded-lg">
						<div className="p-5">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<DollarSign className="h-6 w-6 text-gray-400" />
								</div>
								<div className="ml-5 w-0 flex-1">
									<dl>
										<dt className="text-sm font-medium text-gray-500 truncate">Stock Value</dt>
										<dd className="text-lg font-medium text-gray-900">
											{formatCurrency(dashboardStats.overview.totalStockValue)}
										</dd>
									</dl>
								</div>
							</div>
						</div>
					</div>

					<div className="bg-white overflow-hidden shadow rounded-lg">
						<div className="p-5">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<TrendingUp className="h-6 w-6 text-gray-400" />
								</div>
								<div className="ml-5 w-0 flex-1">
									<dl>
										<dt className="text-sm font-medium text-gray-500 truncate">This Month Revenue</dt>
										<dd className="text-lg font-medium text-gray-900">
											{formatCurrency(dashboardStats.sales.thisMonth.revenue)}
										</dd>
									</dl>
								</div>
							</div>
						</div>
					</div>

					<div className="bg-white overflow-hidden shadow rounded-lg">
						<div className="p-5">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<TrendingDown className="h-6 w-6 text-red-400" />
								</div>
								<div className="ml-5 w-0 flex-1">
									<dl>
										<dt className="text-sm font-medium text-gray-500 truncate">Low Stock Items</dt>
										<dd className="text-lg font-medium text-red-600">{dashboardStats.overview.lowStockCount}</dd>
									</dl>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Sales Statistics */}
			{reportData.salesStats && (
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Sales Summary */}
					<div className="bg-white shadow rounded-lg p-6">
						<h3 className="text-lg font-medium text-gray-900 mb-4">Sales Summary</h3>
						<div className="space-y-4">
							<div className="flex justify-between">
								<span className="text-sm text-gray-600">Total Sales</span>
								<span className="text-sm font-medium">{reportData.salesStats.summary.total_sales}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-sm text-gray-600">Total Revenue</span>
								<span className="text-sm font-medium">
									{formatCurrency(reportData.salesStats.summary.total_revenue)}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-sm text-gray-600">Average Sale Amount</span>
								<span className="text-sm font-medium">
									{formatCurrency(reportData.salesStats.summary.average_sale_amount)}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-sm text-gray-600">Active Days</span>
								<span className="text-sm font-medium">{reportData.salesStats.summary.active_days}</span>
							</div>
						</div>
					</div>

					{/* Payment Method Breakdown */}
					<div className="bg-white shadow rounded-lg p-6">
						<h3 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h3>
						<div className="space-y-3">
							{reportData.paymentBreakdown.map((payment, index) => (
								<div
									key={index}
									className="flex justify-between items-center">
									<span className="text-sm text-gray-600 capitalize">{payment.payment_method}</span>
									<div className="flex items-center space-x-2">
										<span className="text-sm font-medium">{payment.count} sales</span>
										<span className="text-sm text-gray-500">({formatCurrency(payment.total_amount)})</span>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			)}

			{/* Top Selling Medicines */}
			<div className="bg-white shadow rounded-lg p-6">
				<h3 className="text-lg font-medium text-gray-900 mb-4">Top Selling Medicines</h3>
				{reportData.topMedicines.length > 0 ? (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Rank
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Medicine
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Quantity Sold
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Sales Count
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Total Revenue
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{reportData.topMedicines.map((medicine, index) => (
									<tr key={medicine.id}>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{index + 1}</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div>
												<div className="text-sm font-medium text-gray-900">{medicine.name}</div>
												<div className="text-sm text-gray-500">{medicine.generic_name}</div>
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{medicine.total_quantity_sold}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{medicine.sales_count}</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{formatCurrency(medicine.total_revenue)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<p className="text-sm text-gray-500">No sales data available for the selected period.</p>
				)}
			</div>

			{/* Daily Sales Chart */}
			{reportData.dailySales.length > 0 && (
				<div className="bg-white shadow rounded-lg p-6">
					<h3 className="text-lg font-medium text-gray-900 mb-4">Daily Sales Trend</h3>
					<div className="overflow-x-auto">
						<div className="flex items-end space-x-2 h-64">
							{reportData.dailySales.slice(0, 30).map((day, index) => {
								const maxAmount = Math.max(...reportData.dailySales.map((d) => d.total_amount));
								const height = (day.total_amount / maxAmount) * 200;
								return (
									<div
										key={index}
										className="flex flex-col items-center space-y-1">
										<div
											className="bg-primary-600 rounded-t"
											style={{ height: `${height}px`, width: "20px" }}
											title={`${formatDate(day.date)}: ${formatCurrency(day.total_amount)}`}
										/>
										<span className="text-xs text-gray-500 transform -rotate-45 origin-left">
											{new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
										</span>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			)}

			{/* Alerts Section */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Low Stock Alerts */}
				<div className="bg-white shadow rounded-lg p-6">
					<div className="flex items-center mb-4">
						<TrendingDown className="h-5 w-5 text-red-400 mr-2" />
						<h3 className="text-lg font-medium text-gray-900">Low Stock Alerts</h3>
					</div>
					{dashboardStats?.overview.lowStockCount > 0 ? (
						<div className="space-y-2">
							<p className="text-sm text-gray-600">
								{dashboardStats.overview.lowStockCount} items are running low on stock (≤10 units)
							</p>
							<button className="text-sm text-primary-600 hover:text-primary-700">View Low Stock Items →</button>
						</div>
					) : (
						<p className="text-sm text-gray-500">All items have sufficient stock.</p>
					)}
				</div>

				{/* Expiring Soon Alerts */}
				<div className="bg-white shadow rounded-lg p-6">
					<div className="flex items-center mb-4">
						<Calendar className="h-5 w-5 text-yellow-400 mr-2" />
						<h3 className="text-lg font-medium text-gray-900">Expiring Soon</h3>
					</div>
					{dashboardStats?.overview.expiringSoonCount > 0 ? (
						<div className="space-y-2">
							<p className="text-sm text-gray-600">
								{dashboardStats.overview.expiringSoonCount} batches are expiring within 90 days
							</p>
							<button className="text-sm text-primary-600 hover:text-primary-700">View Expiring Items →</button>
						</div>
					) : (
						<p className="text-sm text-gray-500">No batches expiring soon.</p>
					)}
				</div>
			</div>
		</div>
	);
};

export default Reports;
