import { Activity, AlertTriangle, Calendar, DollarSign, Package, ShoppingCart, TrendingUp, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import { api, type Batch, type DashboardStats, type PurchaseOrder, type Sale } from "../utils/api";

interface StatCardProps {
	title: string;
	value: string | number;
	icon: React.ReactNode;
	color: string;
	change?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, change }) => (
	<div className="bg-white overflow-hidden shadow rounded-lg">
		<div className="p-5">
			<div className="flex items-center">
				<div className="flex-shrink-0">
					<div className={`w-8 h-8 rounded-md flex items-center justify-center ${color}`}>{icon}</div>
				</div>
				<div className="ml-5 w-0 flex-1">
					<dl>
						<dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
						<dd className="flex items-baseline">
							<div className="text-2xl font-semibold text-gray-900">{value}</div>
							{change && <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">{change}</div>}
						</dd>
					</dl>
				</div>
			</div>
		</div>
	</div>
);

interface AlertItemProps {
	item: Batch & { urgency?: string };
}

const AlertItem: React.FC<AlertItemProps> = ({ item }) => {
	const getUrgencyColor = (urgency?: string) => {
		switch (urgency) {
			case "expired":
				return "text-red-600 bg-red-100";
			case "expires_very_soon":
				return "text-red-600 bg-red-100";
			case "expires_soon":
				return "text-yellow-600 bg-yellow-100";
			default:
				return "text-gray-600 bg-gray-100";
		}
	};

	return (
		<div className="flex items-center justify-between p-3 bg-white rounded-lg border">
			<div className="flex-1">
				<p className="text-sm font-medium text-gray-900">{item.medicine_name}</p>
				<p className="text-xs text-gray-500">Batch: {item.batch_number}</p>
				<p className="text-xs text-gray-500">Expiry: {item.expiry_date}</p>
			</div>
			<div className="flex items-center space-x-2">
				<span className="text-sm font-medium text-gray-900">Qty: {item.quantity}</span>
				<span className={`px-2 py-1 text-xs font-medium rounded-full ${getUrgencyColor(item.urgency)}`}>
					{item.urgency?.replace("_", " ") || "normal"}
				</span>
			</div>
		</div>
	);
};

const Dashboard: React.FC = () => {
	const [stats, setStats] = useState<DashboardStats | null>(null);
	const [lowStockItems, setLowStockItems] = useState<Batch[]>([]);
	const [expiringItems, setExpiringItems] = useState<Batch[]>([]);
	const [recentSales, setRecentSales] = useState<Sale[]>([]);
	const [recentPurchases, setRecentPurchases] = useState<PurchaseOrder[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchDashboardData = async () => {
			try {
				setLoading(true);
				setError(null);

				const [statsData, lowStockData, expiringData, salesData, purchasesData] = await Promise.all([
					api.getDashboardStats(),
					api.getLowStockAlerts(),
					api.getExpiringAlerts(),
					api.getRecentSales(),
					api.getRecentPurchases(),
				]);

				setStats(statsData);
				setLowStockItems(lowStockData.items || []);
				setExpiringItems(expiringData.items || []);
				setRecentSales(salesData || []);
				setRecentPurchases(purchasesData || []);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to load dashboard data");
			} finally {
				setLoading(false);
			}
		};

		fetchDashboardData();
	}, []);

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
					<AlertTriangle className="h-5 w-5 text-red-400" />
					<div className="ml-3">
						<h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
						<p className="text-sm text-red-700 mt-1">{error}</p>
					</div>
				</div>
			</div>
		);
	}

	if (!stats) {
		return null;
	}

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div>
				<h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
				<p className="mt-1 text-sm text-gray-600">Overview of your pharmacy inventory and operations</p>
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard
					title="Total Medicines"
					value={stats.overview.totalMedicines}
					icon={<Package className="h-5 w-5 text-white" />}
					color="bg-primary-600"
				/>
				<StatCard
					title="Total Batches"
					value={stats.overview.totalBatches}
					icon={<Activity className="h-5 w-5 text-white" />}
					color="bg-success-600"
				/>
				<StatCard
					title="Stock Value"
					value={`$${stats.overview.totalStockValue.toLocaleString()}`}
					icon={<DollarSign className="h-5 w-5 text-white" />}
					color="bg-warning-600"
				/>
				<StatCard
					title="Total Suppliers"
					value={stats.overview.totalSuppliers}
					icon={<Users className="h-5 w-5 text-white" />}
					color="bg-primary-600"
				/>
			</div>

			{/* Alert Stats */}
			<div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
				<StatCard
					title="Low Stock Items"
					value={stats.overview.lowStockCount}
					icon={<AlertTriangle className="h-5 w-5 text-white" />}
					color={stats.overview.lowStockCount > 0 ? "bg-danger-600" : "bg-success-600"}
				/>
				<StatCard
					title="Expiring Soon"
					value={stats.overview.expiringSoonCount}
					icon={<Calendar className="h-5 w-5 text-white" />}
					color={stats.overview.expiringSoonCount > 0 ? "bg-warning-600" : "bg-success-600"}
				/>
				<StatCard
					title="Pending Orders"
					value={stats.overview.pendingOrdersCount}
					icon={<ShoppingCart className="h-5 w-5 text-white" />}
					color="bg-primary-600"
				/>
			</div>

			{/* Sales Stats */}
			<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
				<StatCard
					title="Today's Sales"
					value={stats.sales.today.count}
					icon={<TrendingUp className="h-5 w-5 text-white" />}
					color="bg-success-600"
					change={`$${stats.sales.today.revenue.toLocaleString()}`}
				/>
				<StatCard
					title="This Month's Sales"
					value={stats.sales.thisMonth.count}
					icon={<TrendingUp className="h-5 w-5 text-white" />}
					color="bg-success-600"
					change={`$${stats.sales.thisMonth.revenue.toLocaleString()}`}
				/>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				{/* Low Stock Alerts */}
				<div className="bg-white shadow rounded-lg">
					<div className="px-4 py-5 sm:p-6">
						<h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Low Stock Alerts</h3>
						<div className="space-y-3">
							{lowStockItems.length === 0 ? (
								<p className="text-sm text-gray-500">No low stock items</p>
							) : (
								lowStockItems.slice(0, 5).map((item) => (
									<AlertItem
										key={item.id}
										item={item}
									/>
								))
							)}
						</div>
						{lowStockItems.length > 5 && (
							<div className="mt-4">
								<a
									href="/batches?low_stock=true"
									className="text-sm text-primary-600 hover:text-primary-500">
									View all {lowStockItems.length} items →
								</a>
							</div>
						)}
					</div>
				</div>

				{/* Expiring Items */}
				<div className="bg-white shadow rounded-lg">
					<div className="px-4 py-5 sm:p-6">
						<h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Expiring Items</h3>
						<div className="space-y-3">
							{expiringItems.length === 0 ? (
								<p className="text-sm text-gray-500">No expiring items</p>
							) : (
								expiringItems.slice(0, 5).map((item) => (
									<AlertItem
										key={item.id}
										item={item}
									/>
								))
							)}
						</div>
						{expiringItems.length > 5 && (
							<div className="mt-4">
								<a
									href="/batches?expiring=true"
									className="text-sm text-primary-600 hover:text-primary-500">
									View all {expiringItems.length} items →
								</a>
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				{/* Recent Sales */}
				<div className="bg-white shadow rounded-lg">
					<div className="px-4 py-5 sm:p-6">
						<h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Sales</h3>
						<div className="space-y-3">
							{recentSales.length === 0 ? (
								<p className="text-sm text-gray-500">No recent sales</p>
							) : (
								recentSales.slice(0, 5).map((sale) => (
									<div
										key={sale.id}
										className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
										<div>
											<p className="text-sm font-medium text-gray-900">{sale.customer_name || "Walk-in Customer"}</p>
											<p className="text-xs text-gray-500">
												{new Date(sale.sale_date).toLocaleDateString()} • {sale.item_count} items
											</p>
										</div>
										<div className="text-right">
											<p className="text-sm font-medium text-gray-900">${sale.total_amount}</p>
											<p className="text-xs text-gray-500 capitalize">{sale.payment_method}</p>
										</div>
									</div>
								))
							)}
						</div>
						{recentSales.length > 5 && (
							<div className="mt-4">
								<a
									href="/sales"
									className="text-sm text-primary-600 hover:text-primary-500">
									View all sales →
								</a>
							</div>
						)}
					</div>
				</div>

				{/* Recent Purchases */}
				<div className="bg-white shadow rounded-lg">
					<div className="px-4 py-5 sm:p-6">
						<h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Purchase Orders</h3>
						<div className="space-y-3">
							{recentPurchases.length === 0 ? (
								<p className="text-sm text-gray-500">No recent purchases</p>
							) : (
								recentPurchases.slice(0, 5).map((order) => (
									<div
										key={order.id}
										className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
										<div>
											<p className="text-sm font-medium text-gray-900">{order.supplier_name}</p>
											<p className="text-xs text-gray-500">
												{new Date(order.order_date).toLocaleDateString()} • {order.item_count} items
											</p>
										</div>
										<div className="text-right">
											<p className="text-sm font-medium text-gray-900">${order.total_amount}</p>
											<span
												className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
													order.status === "received"
														? "bg-green-100 text-green-800"
														: order.status === "pending"
														? "bg-yellow-100 text-yellow-800"
														: "bg-red-100 text-red-800"
												}`}>
												{order.status}
											</span>
										</div>
									</div>
								))
							)}
						</div>
						{recentPurchases.length > 5 && (
							<div className="mt-4">
								<a
									href="/purchase-orders"
									className="text-sm text-primary-600 hover:text-primary-500">
									View all orders →
								</a>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Dashboard;
