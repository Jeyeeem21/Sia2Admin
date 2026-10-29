import { useState } from 'react';
import usePageTitle from '../hooks/usePageTitle';
import { useQuery } from '@tanstack/react-query';
import {
 Package,
 Search,
 Edit,
 AlertTriangle,
 CheckCircle,
 XCircle,
 FileText,
 TrendingDown,
 TrendingUp,
 RefreshCw,
 Eye,
 ArrowUpRight,
 ArrowDownRight,
 Calendar,
 CalendarDays,
 CalendarRange,
 ArrowRightLeft
} from 'lucide-react';
import ViewModal from '../components/ViewModal';
import EditModal from '../components/EditModal';
import Pagination from '../components/Pagination';
import { TableSkeleton, LoadingBar } from '../components/LoadingStates';
import { useInventory, useUpdateInventory, useRestockInventory, useDeleteInventory } from '../hooks/useInventory';
import { productTransactionsAPI, ordersAPI } from '../services/api';
import { queryKeys } from '../lib/queryClient';

const Inventory = () => {
  usePageTitle('Inventory');
 const [searchTerm, setSearchTerm] = useState('');
 const [currentPage, setCurrentPage] = useState(1);
 const [itemsPerPage, setItemsPerPage] = useState(10);
 
 // Modal states
 const [viewModal, setViewModal] = useState({ isOpen: false, data: null });
 const [editModal, setEditModal] = useState({ isOpen: false, data: null });
 const [restockModal, setRestockModal] = useState({ isOpen: false, data: null });
 
 // Product Transactions & Growth Rates
 const [selectedPeriod, setSelectedPeriod] = useState('daily');
 
 // Pagination for growth rates table
 const [growthPage, setGrowthPage] = useState(1);
 const [growthItemsPerPage, setGrowthItemsPerPage] = useState(10);
 
 // Pagination for sales history table
 const [salesPage, setSalesPage] = useState(1);
 const [salesItemsPerPage, setSalesItemsPerPage] = useState(10);

 // React Query hooks
 const { data: inventory = [], isLoading } = useInventory();
 const updateMutation = useUpdateInventory();
 const restockMutation = useRestockInventory();
 const deleteMutation = useDeleteInventory();

 // Fetch sales history with React Query - REALTIME updates
 const { data: salesHistory = [], isLoading: salesLoading, isFetching: salesFetching } = useQuery({
 queryKey: ['salesHistory', selectedPeriod],
 queryFn: async () => {
 const response = await ordersAPI.getSalesHistory({ period: selectedPeriod });
 return response.data;
 },
 staleTime: 0,
 cacheTime: 0,
 refetchOnWindowFocus: false,
 enabled: true,
 });

 // Fetch growth rates with React Query - INSTANT updates!
 const { data: growthData, isLoading: growthLoading, isFetching: growthFetching } = useQuery({
 queryKey: ['growthRates', selectedPeriod],
 queryFn: async () => {
 const response = await productTransactionsAPI.getGrowthRates(selectedPeriod);
 return response.data;
 },
 staleTime: 0,
 cacheTime: 0,
 refetchOnWindowFocus: false,
 enabled: true,
 });

 // Edit fields (no quantity - use Restock for that!)
 const inventoryEditFields = [
 { key: 'product_name', label: 'Product', type: 'text', disabled: true, render: (item) => item.product?.product_name },
 { key: 'current_quantity', label: 'Current Stock', type: 'number', disabled: true, render: (item) => item.quantity },
 { key: 'reorder_level', label: 'Reorder Level', type: 'number', required: true, placeholder: '10' },
 { key: 'reorder_quantity', label: 'Reorder Quantity', type: 'number', required: true, placeholder: '50' },
 ];

 const restockFields = [
 { key: 'product_name', label: 'Product', type: 'text', disabled: true },
 { key: 'current_quantity', label: 'Current Stock', type: 'number', disabled: true },
 { key: 'restockQty', label: 'Restock Quantity', type: 'number', required: true, placeholder: 'Enter quantity to add' },
 ];

 const viewFields = [
 { key: 'inventory_id', label: 'Inventory ID' },
 { key: 'product', label: 'Product Name', render: (v) => v?.product_name || 'N/A' },
 { key: 'product', label: 'Category', render: (v) => v?.category?.category_name || 'N/A' },
 { key: 'quantity', label: 'Current Stock', render: (v) => `${v} units` },
 { key: 'reorder_level', label: 'Reorder Level', render: (v) => `${v} units` },
 { key: 'reorder_quantity', label: 'Reorder Quantity', render: (v) => `${v} units` },
 { key: 'status', label: 'Status', render: (v) => v.toUpperCase() },
 { key: 'last_restock_date', label: 'Last Restock Date' },
 { key: 'last_restock_quantity', label: 'Last Restock Qty', render: (v) => v ? `${v} units` : 'N/A' }
 ];

 // Modal handlers
 const handleView = (item) => {
 setViewModal({ isOpen: true, data: item });
 };

 const handleEdit = async (formData) => {
 const updateData = {
 quantity: editModal.data.quantity,
 reorder_level: formData.reorder_level,
 reorder_quantity: formData.reorder_quantity,
 };
 updateMutation.mutate({ id: formData.inventory_id, data: updateData });
 };

 const handleRestock = async (formData) => {
 restockMutation.mutate({
 id: restockModal.data.inventory_id,
 quantity: parseInt(formData.restockQty)
 });
 };

 const openRestockModal = (item) => {
 setRestockModal({ 
 isOpen: true, 
 data: { 
 ...item, 
 product_name: item.product?.product_name,
 current_quantity: item.quantity,
 restockQty: 0 
 } 
 });
 };

 const getStatusBadge = (status) => {
 const statusMap = {
 'available': { label: 'Available', style: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle },
 'low': { label: 'Low Stock', style: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertTriangle },
 'out': { label: 'Out of Stock', style: 'bg-rose-100 text-rose-700 border-rose-200', icon: XCircle }
 };
 
 const statusInfo = statusMap[status] || statusMap['available'];
 const Icon = statusInfo.icon;
 
 return (
 <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border ${statusInfo.style}`}>
 <Icon className="w-3.5 h-3.5" />
 {statusInfo.label}
 </span>
 );
 };

 const filteredInventory = inventory.filter(item =>
 item.product?.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
 item.product?.category?.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
 item.product?.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
 `INV-${item.inventory_id}`.toLowerCase().includes(searchTerm.toLowerCase())
 );

 // Pagination
 const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
 const startIndex = (currentPage - 1) * itemsPerPage;
 const paginatedInventory = filteredInventory.slice(startIndex, startIndex + itemsPerPage);

 const stats = {
 total: inventory.length,
 available: inventory.filter(i => i.status === 'available').length,
 lowStock: inventory.filter(i => i.status === 'low').length,
 outOfStock: inventory.filter(i => i.status === 'out').length
 };

 return (
 <div className="p-5 lg:p-6 min-h-full">
 {/* Header */}
 <div className="mb-7">
 <div className="flex items-end justify-between">
 <div>
 <h1 className="text-xl font-bold text-gray-900 tracking-tight">Inventory Management</h1>
 <p className="text-[11px] text-gray-400 mt-1">Monitor stock levels and manage supplies efficiently</p>
 </div>
 </div>
 </div>

 {/* Stats Cards */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
 <div className="group relative bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
 <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gray-50 to-transparent rounded-bl-full opacity-60" />
 <div className="relative">
 <div className="bg-emerald-50 p-2.5 rounded-xl ring-4 ring-white w-fit">
 <Package className="w-[18px] h-[18px] text-emerald-600" />
 </div>
 <div className="mt-4">
 <p className="text-[22px] font-bold text-gray-900 tracking-tight leading-none">{stats.total}</p>
 <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-1.5">Total Items</p>
 </div>
 </div>
 </div>
 <div className="group relative bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
 <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gray-50 to-transparent rounded-bl-full opacity-60" />
 <div className="relative">
 <div className="bg-emerald-50 p-2.5 rounded-xl ring-4 ring-white w-fit">
 <CheckCircle className="w-[18px] h-[18px] text-emerald-600" />
 </div>
 <div className="mt-4">
 <p className="text-[22px] font-bold text-gray-900 tracking-tight leading-none">{stats.available}</p>
 <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-1.5">Available</p>
 </div>
 </div>
 </div>
 <div className="group relative bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
 <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gray-50 to-transparent rounded-bl-full opacity-60" />
 <div className="relative">
 <div className="bg-amber-50 p-2.5 rounded-xl ring-4 ring-white w-fit">
 <AlertTriangle className="w-[18px] h-[18px] text-amber-600" />
 </div>
 <div className="mt-4">
 <p className="text-[22px] font-bold text-gray-900 tracking-tight leading-none">{stats.lowStock}</p>
 <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-1.5">Low Stock</p>
 </div>
 </div>
 </div>
 <div className="group relative bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
 <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gray-50 to-transparent rounded-bl-full opacity-60" />
 <div className="relative">
 <div className="bg-red-50 p-2.5 rounded-xl ring-4 ring-white w-fit">
 <XCircle className="w-[18px] h-[18px] text-red-500" />
 </div>
 <div className="mt-4">
 <p className="text-[22px] font-bold text-gray-900 tracking-tight leading-none">{stats.outOfStock}</p>
 <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-1.5">Out of Stock</p>
 </div>
 </div>
 </div>
 </div>

 {/* Main Content */}
 <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-gray-100">
 {/* Toolbar */}
 <div className="p-5 border-b border-gray-100">
 <div className="flex items-center justify-between gap-3">
 <div className="relative flex-1 max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
 <input
 type="text"
 placeholder="Search by name, category, or ID..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-[13px] focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 />
 </div>
 <button className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[11px] font-semibold hover:bg-emerald-700 active:scale-[0.97] transition-all flex items-center gap-2">
 <FileText className="w-4 h-4" />
 Generate Report
 </button>
 </div>
 </div>

 {/* NO LoadingBar - instant updates from cache */}
 
 {/* Table */}
 {/* Mobile Card View - NO LOADING STATE, instant from cache */}
 <div className="block md:hidden p-4 space-y-4">
 {paginatedInventory.length === 0 ? (
 <div className="text-center text-gray-500 py-12">No inventory items found</div>
 ) : (
 paginatedInventory.map((item) => (
 <div key={item.inventory_id} className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
 <div className="flex items-start justify-between">
 <div>
 <h3 className="font-bold text-gray-900">{item.product?.product_name || 'N/A'}</h3>
 <p className="text-xs text-gray-500 font-mono mt-1">INV-{item.inventory_id}</p>
 </div>
 {getStatusBadge(item.status)}
 </div>

 <div className="bg-white rounded-lg p-3 space-y-2">
 <div className="flex justify-between text-[11px]">
 <span className="text-gray-600">Category:</span>
 <span className="font-medium text-gray-900">{item.product?.category?.category_name || 'N/A'}</span>
 </div>
 <div className="flex justify-between text-[11px]">
 <span className="text-gray-600">Quantity:</span>
 <span className={`font-bold ${item.quantity === 0 ? 'text-rose-600' : item.quantity <= item.reorder_level ? 'text-amber-600' : 'text-emerald-600'}`}>
 {item.quantity} units
 </span>
 </div>
 <div className="flex justify-between text-[11px]">
 <span className="text-gray-600">Unit Price:</span>
 <span className="font-semibold text-gray-900">Ã¢â€šÂ±{parseFloat(item.product?.price || 0).toLocaleString()}</span>
 </div>
 </div>

 <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
 <button 
 onClick={() => handleView(item)}
 className="flex-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors text-[11px] font-semibold flex items-center justify-center gap-1"
 >
 <Eye className="w-4 h-4" />
 View
 </button>
 <button 
 onClick={() => setEditModal({ isOpen: true, data: item })}
 className="flex-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors text-[11px] font-semibold flex items-center justify-center gap-1"
 >
 <Edit className="w-4 h-4" />
 Edit
 </button>
 <button 
 onClick={() => openRestockModal(item)}
 className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors"
 >
 <RefreshCw className="w-4 h-4" />
 </button>
 </div>
 </div>
 ))
 )}
 </div>

 {/* Desktop Table View */}
 <div className="hidden md:block overflow-x-auto">
 <table className="w-full">
 <thead className="bg-gray-50">
 <tr>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Product ID</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Product Name</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Category</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quantity</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Unit Price</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {paginatedInventory.length === 0 ? (
 <tr>
 <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
 No inventory items found
 </td>
 </tr>
 ) : (
 paginatedInventory.map((item) => (
 <tr key={item.inventory_id} className="hover:bg-emerald-50 transition-colors group">
 <td className="px-5 py-3.5 whitespace-nowrap text-[11px] font-bold text-gray-900">INV-{item.inventory_id}</td>
 <td className="px-5 py-3.5 whitespace-nowrap text-[11px] font-semibold text-gray-900">{item.product?.product_name || 'N/A'}</td>
 <td className="px-5 py-3.5 whitespace-nowrap">
 <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
 {item.product?.category?.category_name || 'N/A'}
 </span>
 </td>
 <td className="px-5 py-3.5 whitespace-nowrap">
 <span className={`text-[11px] font-bold ${item.quantity === 0 ? 'text-rose-600' : item.quantity <= item.reorder_level ? 'text-amber-600' : 'text-emerald-600'}`}>
 {item.quantity} units
 </span>
 </td>
 <td className="px-5 py-3.5 whitespace-nowrap text-[11px] font-semibold text-gray-900">Ã¢â€šÂ±{parseFloat(item.product?.price || 0).toLocaleString()}</td>
 <td className="px-5 py-3.5 whitespace-nowrap">{getStatusBadge(item.status)}</td>
 <td className="px-5 py-3.5 whitespace-nowrap">
 <div className="flex gap-2 justify-end">
 <button 
 onClick={() => handleView(item)}
 className="p-2 hover:bg-emerald-100 rounded-lg transition-colors" 
 title="View"
 >
 <Eye className="w-4 h-4 text-emerald-600" />
 </button>
 <button 
 onClick={() => setEditModal({ isOpen: true, data: item })}
 className="p-2 hover:bg-emerald-100 rounded-lg transition-colors" 
 title="Edit"
 >
 <Edit className="w-4 h-4 text-emerald-600" />
 </button>
 <button 
 onClick={() => openRestockModal(item)}
 className="p-2 hover:bg-emerald-100 rounded-lg transition-colors" 
 title="Restock"
 >
 <RefreshCw className="w-4 h-4 text-emerald-600" />
 </button>
 </div>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>

 {/* Pagination */}
 <Pagination
 currentPage={currentPage}
 totalPages={totalPages}
 totalItems={filteredInventory.length}
 itemsPerPage={itemsPerPage}
 onPageChange={setCurrentPage}
 onItemsPerPageChange={(value) => {
 setItemsPerPage(value);
 setCurrentPage(1);
 }}
 />
 </div>

 {/* Product Transactions & Growth Rates Section */}
 <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
 <div className="flex items-center justify-between mb-6">
 <div>
 <h2 className="text-[15px] font-bold text-gray-900 flex items-center gap-3">
 <ArrowRightLeft className="w-7 h-7 text-emerald-600" />
 Product Transactions & Growth Analysis
 </h2>
 <p className="text-[11px] text-gray-500 mt-1">Track inventory in/out movements with growth rate analysis per product</p>
 </div>

 {/* Period Filter Buttons */}
 <div className="flex gap-2">
 <button
 onClick={() => setSelectedPeriod('daily')}
 className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-[11px] transition-all ${
 selectedPeriod === 'daily'
 ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
 : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
 }`}
 >
 <Calendar className="w-4 h-4" />
 Daily
 </button>
 <button
 onClick={() => setSelectedPeriod('monthly')}
 className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-[11px] transition-all ${
 selectedPeriod === 'monthly'
 ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
 : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
 }`}
 >
 <CalendarDays className="w-4 h-4" />
 Monthly
 </button>
 <button
 onClick={() => setSelectedPeriod('yearly')}
 className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-[11px] transition-all ${
 selectedPeriod === 'yearly'
 ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
 : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
 }`}
 >
 <CalendarRange className="w-4 h-4" />
 Yearly
 </button>
 </div>
 </div>

 {/* Period Info */}
 {growthData && (
 <div key={selectedPeriod} className="bg-emerald-50 rounded-lg p-4 mb-6 border border-emerald-100">
 <div className="flex items-center justify-between flex-wrap gap-4 text-[11px]">
 <div className="flex items-center gap-2">
 <span className="font-semibold text-gray-700">
 {selectedPeriod === 'daily' ? 'Today:' : selectedPeriod === 'monthly' ? 'Current Month:' : 'Current Year:'}
 </span>
 <span className="ml-2 text-emerald-700 font-bold">
 {new Date(growthData.current_period.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(growthData.current_period.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
 </span>
 </div>
 <div>
 <span className="font-semibold text-gray-700">
 {selectedPeriod === 'daily' ? 'Yesterday:' : selectedPeriod === 'monthly' ? 'Last Month:' : 'Last Year:'}
 </span>
 <span className="ml-2 text-gray-600 font-bold">
 {new Date(growthData.previous_period.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(growthData.previous_period.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
 </span>
 </div>
 </div>
 </div>
 )}

 {/* Growth Rates Table */}
 <div className="overflow-x-auto rounded-lg border border-gray-200">
 <table className="min-w-full divide-y divide-gray-200">
 <thead className="bg-gray-800">
 <tr>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider">Product</th>
 <th className="px-5 py-3 text-center text-[10px] font-bold text-white uppercase tracking-wider">Current Stock</th>
 <th className="px-5 py-3 text-center text-[10px] font-bold text-white uppercase tracking-wider">Current IN</th>
 <th className="px-5 py-3 text-center text-[10px] font-bold text-white uppercase tracking-wider">Current OUT</th>
 <th className="px-5 py-3 text-center text-[10px] font-bold text-white uppercase tracking-wider">Growth Rate</th>
 </tr>
 </thead>
 <tbody className="bg-white divide-y divide-gray-200">
 {growthLoading ? (
 <tr>
 <td colSpan="5" className="px-6 py-12 text-center">
 <div className="flex justify-center items-center gap-2">
 <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
 <span className="text-gray-600">Loading growth data...</span>
 </div>
 </td>
 </tr>
 ) : !growthData || !growthData.products || growthData.products.length === 0 ? (
 <tr>
 <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
 No transaction data available
 </td>
 </tr>
 ) : (
 (() => {
 const startIndex = (growthPage - 1) * growthItemsPerPage;
 const paginatedGrowthData = growthData.products.slice(startIndex, startIndex + growthItemsPerPage);
 return paginatedGrowthData.map((product) => (
 <tr key={product.product_id} className="hover:bg-emerald-50 transition-colors">
 <td className="px-5 py-3.5 whitespace-nowrap">
 <div className="text-[11px] font-semibold text-gray-900">{product.product_name}</div>
 <div className="text-xs text-gray-500">ID: {product.product_id}</div>
 </td>
 <td className="px-5 py-3.5 whitespace-nowrap text-center">
 <span className="text-[11px] font-bold text-gray-900">{product.current_stock}</span>
 </td>
 <td className="px-5 py-3.5 whitespace-nowrap text-center">
 <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-lg">
 +{product.current_in}
 </span>
 </td>
 <td className="px-5 py-3.5 whitespace-nowrap text-center">
 <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-700 text-[11px] font-bold rounded-lg">
 -{product.current_out}
 </span>
 </td>
 <td className="px-5 py-3.5 whitespace-nowrap text-center">
 <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-[11px] ${
 product.trend === 'up'
 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
 : product.trend === 'down'
 ? 'bg-rose-100 text-rose-700 border border-rose-200'
 : 'bg-gray-100 text-gray-600 border border-gray-200'
 }`}>
 {product.trend === 'up' ? (
 <ArrowUpRight className="w-4 h-4" />
 ) : product.trend === 'down' ? (
 <ArrowDownRight className="w-4 h-4" />
 ) : (
 <TrendingUp className="w-4 h-4" />
 )}
 {product.growth_rate > 0 ? '+' : ''}{product.growth_rate}%
 </div>
 </td>
 </tr>
 ));
 })()
 )}
 </tbody>
 </table>
 </div>

 {/* Pagination for Growth Rates */}
 {growthData && growthData.products && growthData.products.length > 0 && (
 <Pagination
 currentPage={growthPage}
 totalPages={Math.ceil(growthData.products.length / growthItemsPerPage)}
 totalItems={growthData.products.length}
 itemsPerPage={growthItemsPerPage}
 onPageChange={setGrowthPage}
 onItemsPerPageChange={(value) => {
 setGrowthItemsPerPage(value);
 setGrowthPage(1);
 }}
 />
 )}

 {/* Sales History - Products Purchased by Customers */}
 <div className="mt-8">
 <h3 className="text-[11px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
 <FileText className="w-5 h-5 text-emerald-600" />
 Sales History ({selectedPeriod === 'daily' ? 'Today' : selectedPeriod === 'monthly' ? 'This Month' : 'This Year'})
 </h3>
 <div className="overflow-x-auto rounded-lg border border-gray-200">
 <table className="min-w-full divide-y divide-gray-200">
 <thead className="bg-gray-100">
 <tr>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date & Time</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Order #</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Product</th>
 <th className="px-5 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Qty Sold</th>
 <th className="px-5 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Unit Price</th>
 <th className="px-5 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Subtotal</th>
 <th className="px-5 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Service</th>
 <th className="px-5 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment</th>
 </tr>
 </thead>
 <tbody className="bg-white divide-y divide-gray-200">
 {salesLoading ? (
 <TableSkeleton columns={8} />
 ) : salesHistory.length === 0 ? (
 <tr>
 <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
 No sales recorded for this period
 </td>
 </tr>
 ) : (
 (() => {
 const startIndex = (salesPage - 1) * salesItemsPerPage;
 const paginatedSales = salesHistory.slice(startIndex, startIndex + salesItemsPerPage);
 return paginatedSales.map((sale) => (
 <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
 <td className="px-5 py-3 whitespace-nowrap text-[11px] text-gray-500">
 {new Date(sale.created_at).toLocaleString()}
 </td>
 <td className="px-5 py-3 whitespace-nowrap text-[11px] font-semibold text-emerald-600">
 {sale.order_number}
 </td>
 <td className="px-5 py-3 whitespace-nowrap text-[11px] font-semibold text-gray-900">
 {sale.product_name}
 </td>
 <td className="px-5 py-3 whitespace-nowrap text-center">
 <span className="inline-flex items-center px-3 py-1 bg-rose-100 text-rose-700 text-[11px] font-bold rounded-lg">
 {sale.quantity}
 </span>
 </td>
 <td className="px-5 py-3 whitespace-nowrap text-center text-[11px] text-gray-500">
 Ã¢â€šÂ±{parseFloat(sale.unit_price || 0).toLocaleString()}
 </td>
 <td className="px-5 py-3 whitespace-nowrap text-center text-[11px] font-bold text-gray-900">
 Ã¢â€šÂ±{parseFloat(sale.subtotal || 0).toLocaleString()}
 </td>
 <td className="px-5 py-3 whitespace-nowrap text-center">
 <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
 {sale.service_type}
 </span>
 </td>
 <td className="px-5 py-3 whitespace-nowrap text-center">
 <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
 {sale.payment_method}
 </span>
 </td>
 </tr>
 ));
 })()
 )}
 </tbody>
 </table>
 </div>
 
 {!salesLoading && salesHistory.length > 0 && (
 <Pagination
 currentPage={salesPage}
 totalPages={Math.ceil(salesHistory.length / salesItemsPerPage)}
 totalItems={salesHistory.length}
 itemsPerPage={salesItemsPerPage}
 onPageChange={setSalesPage}
 onItemsPerPageChange={(value) => {
 setSalesItemsPerPage(value);
 setSalesPage(1);
 }}
 />
 )}
 </div>
 </div>

 {/* Modals */}
 <ViewModal
 isOpen={viewModal.isOpen}
 onClose={() => setViewModal({ isOpen: false, data: null })}
 title="Inventory Details"
 data={viewModal.data}
 fields={viewFields}
 />

 <EditModal
 isOpen={editModal.isOpen}
 onClose={() => setEditModal({ isOpen: false, data: null })}
 title="Edit Reorder Settings"
 fields={inventoryEditFields}
 data={{
 ...editModal.data,
 product_name: editModal.data?.product?.product_name,
 current_quantity: editModal.data?.quantity
 }}
 onSubmit={handleEdit}
 />

 <EditModal
 isOpen={restockModal.isOpen}
 onClose={() => setRestockModal({ isOpen: false, data: null })}
 title="Restock Item"
 fields={restockFields}
 data={restockModal.data}
 onSubmit={handleRestock}
 />
 </div>
 );
};

export default Inventory;
