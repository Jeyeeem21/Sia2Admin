import { useState } from 'react';
import usePageTitle from '../hooks/usePageTitle';
import { Search, Plus, Edit, Trash2, Package, DollarSign, Tag, TrendingUp, Eye, Scan } from 'lucide-react';
import toast from 'react-hot-toast';
import useBarcodeScanner from '../hooks/useBarcodeScanner';
import ViewModal from '../components/ViewModal';
import AddModal from '../components/AddModal';
import EditModal from '../components/EditModal';
import DeleteModal from '../components/DeleteModal';
import Pagination from '../components/Pagination';
import { TableSkeleton, LoadingBar } from '../components/LoadingStates';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';

const Products = () => {
  usePageTitle('Products');
 const [searchTerm, setSearchTerm] = useState('');
 const [filterCategory, setFilterCategory] = useState('all');
 const [currentPage, setCurrentPage] = useState(1);
 const [itemsPerPage, setItemsPerPage] = useState(10);
 const [scannedBarcode, setScannedBarcode] = useState('');
 
 // Modal states
 const [viewModal, setViewModal] = useState({ isOpen: false, data: null });
 const [addModal, setAddModal] = useState(false);
 const [editModal, setEditModal] = useState({ isOpen: false, data: null });
 const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });

 // React Query hooks - REALTIME, no repeated loading
 const { data: products = [], isLoading } = useProducts();
 const { data: categories = [] } = useCategories();
 const createMutation = useCreateProduct();
 const updateMutation = useUpdateProduct();
 const deleteMutation = useDeleteProduct();

 // Barcode Scanner Handler - Must be defined before hook
 const handleBarcodeScan = async (barcode) => {
 if (!barcode || barcode.trim() === '') return;
 
 try {
 // Search for product by barcode
 const foundProduct = products.find(p => 
 p.barcode === barcode
 );

 if (foundProduct) {
 // Product found - open view modal
 setViewModal({ isOpen: true, data: foundProduct });
 toast.success(`Product found: ${foundProduct.product_name}`);
 } else {
 // Product not found - save barcode and open add modal
 setScannedBarcode(barcode);
 setAddModal(true);
 toast(`No product found with barcode: ${barcode}`, {
 icon: 'ℹ️',
 });
 }
 } catch (error) {
 toast.error('Error processing barcode');
 console.error('Barcode scan error:', error);
 }
 };

 // Barcode Scanner Hook - Always active
 useBarcodeScanner(handleBarcodeScan, true, 3);



 const stats = [
 { label: 'Total Products', value: products.length, icon: Package, color: 'bg-emerald-50 text-emerald-600' },
 { label: 'Active Products', value: products.filter(p => p.status === 'active').length, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
 { label: 'Total Value', value: `₱${products.reduce((sum, p) => sum + (parseFloat(p.price) * (p.inventory?.quantity || 0)), 0).toLocaleString()}`, icon: DollarSign, color: 'bg-amber-50 text-amber-600' },
 { label: 'Categories', value: categories.length, icon: Tag, color: 'bg-gray-100 text-gray-600' },
 ];

 // Build category options dynamically from fetched categories (only active)
 const categoryOptions = categories
 .filter(cat => cat.status === 'active')
 .map(cat => ({
 value: cat.category_id,
 label: cat.category_name
 }));

 // Modal field configurations
 const addProductFields = [
 { key: 'product_name', label: 'Product Name', type: 'text', required: true, placeholder: 'Enter unique product name' },
 { key: 'barcode', label: 'Barcode', type: 'text', required: false, placeholder: 'Optional barcode number', defaultValue: scannedBarcode },
 { key: 'category_id', label: 'Category', type: 'select', required: true, 
 options: categoryOptions
 },
 { key: 'unit', label: 'Unit', type: 'select', required: true,
 options: [
 { value: 'piece', label: 'Piece' },
 { value: 'ream', label: 'Ream' },
 { value: 'yard', label: 'Yard' },
 { value: 'set', label: 'Set' },
 { value: 'pack', label: 'Pack' }
 ]
 },
 { key: 'price', label: 'Selling Price (₱)', type: 'number', required: true, placeholder: '0.00', step: '0.01' },
 { key: 'cost', label: 'Cost Price (₱)', type: 'number', required: false, placeholder: '0.00', step: '0.01' },
 { key: 'expiration_date', label: 'Expiration Date', type: 'date', required: false, placeholder: 'Select expiration date' },
 { key: 'status', label: 'Status', type: 'hidden', required: false, defaultValue: 'active' },
 { key: 'product_image', label: 'Product Image', type: 'file', required: false, accept: 'image/*', placeholder: 'Upload product image', fullWidth: true },
 { key: 'description', label: 'Description', type: 'textarea', fullWidth: true, rows: 3, placeholder: 'Product description...' }
 ];

 const editProductFields = [
 { key: 'product_name', label: 'Product Name', type: 'text', required: true, placeholder: 'Enter unique product name' },
 { key: 'barcode', label: 'Barcode', type: 'text', required: false, placeholder: 'Optional barcode number' },
 { key: 'category_id', label: 'Category', type: 'select', required: true, 
 options: categoryOptions
 },
 { key: 'unit', label: 'Unit', type: 'select', required: true,
 options: [
 { value: 'piece', label: 'Piece' },
 { value: 'ream', label: 'Ream' },
 { value: 'yard', label: 'Yard' },
 { value: 'set', label: 'Set' },
 { value: 'pack', label: 'Pack' }
 ]
 },
 { key: 'price', label: 'Selling Price (₱)', type: 'number', required: true, placeholder: '0.00', step: '0.01' },
 { key: 'cost', label: 'Cost Price (₱)', type: 'number', required: false, placeholder: '0.00', step: '0.01' },
 { key: 'expiration_date', label: 'Expiration Date', type: 'date', required: false, placeholder: 'Select expiration date' },
 { key: 'status', label: 'Status', type: 'select', required: true,
 options: [
 { value: 'active', label: 'Active' },
 { value: 'inactive', label: 'Inactive' }
 ]
 },
 { key: 'product_image', label: 'Product Image', type: 'file', required: false, accept: 'image/*', placeholder: 'Upload product image', fullWidth: true },
 { key: 'description', label: 'Description', type: 'textarea', fullWidth: true, rows: 3, placeholder: 'Product description...' }
 ];

 const viewFields = [
 { key: 'product_image', label: 'Product Image', type: 'file' },
 { key: 'product_name', label: 'Product Name' },
 { key: 'barcode', label: 'Barcode', render: (value) => value || 'N/A' },
 { key: 'category', label: 'Category', render: (value) => value?.category_name || 'N/A' },
 { key: 'price', label: 'Selling Price', render: (value) => `₱${parseFloat(value).toLocaleString()}` },
 { key: 'cost', label: 'Cost Price', render: (value) => value ? `₱${parseFloat(value).toLocaleString()}` : 'N/A' },
 { key: 'unit', label: 'Unit' },
 { key: 'inventory', label: 'Current Stock', render: (value) => `${value?.quantity || 0} units` },
 { key: 'expiration_date', label: 'Expiration Date', render: (value) => value ? new Date(value).toLocaleDateString() : 'No expiration' },
 { key: 'status', label: 'Status', render: (value) => value.toUpperCase() },
 { key: 'is_active', label: 'Active', render: (value) => value ? 'Yes' : 'No' },
 { key: 'description', label: 'Description' }
 ];

 // Modal handlers
 const handleView = (product) => {
 setViewModal({ isOpen: true, data: product });
 };

 const handleAdd = async (formData) => {
 // INSTANT: Close modal immediately
 setAddModal(false);
 setScannedBarcode('');
 
 // Ensure category_id is an integer
 const productData = {
 ...formData,
 category_id: parseInt(formData.category_id),
 price: parseFloat(formData.price),
 cost: formData.cost ? parseFloat(formData.cost) : null
 };
 
 // Mutation will show instant success toast
 createMutation.mutate(productData);
 };

 const handleEdit = async (formData) => {
 // INSTANT: Close modal immediately
 setEditModal({ isOpen: false, data: null });
 
 // Ensure category_id is an integer
 const productData = {
 ...formData,
 category_id: parseInt(formData.category_id),
 price: parseFloat(formData.price),
 cost: formData.cost ? parseFloat(formData.cost) : null
 };
 
 // Mutation will show instant success toast
 updateMutation.mutate({ id: formData.product_id, data: productData });
 };

 const handleDelete = async () => {
 const productId = deleteModal.id;
 setDeleteModal({ isOpen: false, id: null, name: '' }); // Close modal immediately
 deleteMutation.mutate(productId);
 };

 const openEditModal = (product) => {
 // Prepare data for edit modal - ensure category_id is at root level
 const editData = {
 ...product,
 category_id: product.category_id || product.category?.category_id
 };
 setEditModal({ isOpen: true, data: editData });
 };

 const openDeleteModal = (product) => {
 setDeleteModal({ isOpen: true, id: product.product_id, name: product.product_name });
 };

 const getStatusColor = (status) => {
 switch (status) {
 case 'available': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
 case 'low': return 'bg-amber-100 text-amber-700 border-amber-300';
 case 'out': return 'bg-rose-100 text-rose-700 border-rose-300';
 default: return 'bg-gray-100 text-gray-700 border-gray-300';
 }
 };

 const getStatusText = (status) => {
 switch (status) {
 case 'available': return 'In Stock';
 case 'low': return 'Low Stock';
 case 'out': return 'Out of Stock';
 default: return 'Unknown';
 }
 };

 const filteredProducts = products.filter(product => {
 const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
 (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
 const matchesCategory = filterCategory === 'all' || product.category_id === parseInt(filterCategory);
 return matchesSearch && matchesCategory;
 });

 // Pagination
 const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
 const startIndex = (currentPage - 1) * itemsPerPage;
 const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

 return (
 <div className="p-5 lg:p-6 min-h-full">
 {/* Header */}
 <div className="mb-7">
 <div className="flex items-end justify-between">
 <div>
 <h1 className="text-xl font-bold text-gray-900 tracking-tight">Products Management</h1>
 <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-2">
 <Scan className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
 Barcode Scanner Always Active
 </p>
 </div>
 <button 
 onClick={() => {
 setScannedBarcode('');
 setAddModal(true);
 }}
 className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 active:scale-[0.97] transition-all text-[11px] font-semibold flex items-center gap-2"
 >
 <Plus className="w-4 h-4" />
 Add Product
 </button>
 </div>
 </div>

 {/* Stats Cards */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
 {stats.map((stat, index) => (
 <div
 key={index}
 className="group relative bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
 >
 <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gray-50 to-transparent rounded-bl-full opacity-60" />
 <div className="relative">
 <div className={`${stat.color} p-2.5 rounded-xl ring-4 ring-white w-fit`}>
 <stat.icon className="w-[18px] h-[18px]" />
 </div>
 <div className="mt-4">
 <p className="text-[22px] font-bold text-gray-900 tracking-tight leading-none">{stat.value}</p>
 <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-1.5">{stat.label}</p>
 </div>
 </div>
 </div>
 ))}
 </div>

 {/* Search and Filter */}
 <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-gray-100 p-5 mb-5">
 <div className="flex flex-col md:flex-row gap-3">
 <div className="flex-1 relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
 <input
 type="text"
 placeholder="Search products by name or barcode..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-[13px] focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 />
 </div>
 <select
 value={filterCategory}
 onChange={(e) => setFilterCategory(e.target.value)}
 className="px-4 py-2.5 border border-gray-200 rounded-xl text-[13px] focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all cursor-pointer"
 >
 <option value="all">All Categories</option>
 {categories.map(category => (
 <option key={category.category_id} value={category.category_id}>
 {category.category_name}
 </option>
 ))}
 </select>
 </div>
 </div>

 {/* Products Table */}
 <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
 {/* NO LOADING BAR - Instant updates with optimistic UI */}
 
 {/* Mobile Card View - NO LOADING STATE, instant from cache */}
 <div className="block md:hidden p-4 space-y-4">
 {paginatedProducts.length === 0 ? (
 <div className="text-center text-gray-500 py-12">No products found</div>
 ) : (
 paginatedProducts.map((product) => (
 <div key={product.product_id} className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
 <div className="flex items-start gap-3">
 <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
 <Package className="w-6 h-6 text-emerald-600" />
 </div>
 <div className="flex-1">
 <h3 className="font-semibold text-gray-900">{product.product_name}</h3>
 <p className="text-xs text-gray-500 font-mono mt-1">{product.barcode || 'N/A'}</p>
 </div>
 <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${product.is_active ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
 {product.is_active ? 'Active' : 'Inactive'}
 </span>
 </div>

 <div className="bg-white rounded-lg p-3 space-y-2">
 <div className="flex justify-between text-[11px]">
 <span className="text-gray-600">Category:</span>
 <span className="font-medium text-gray-900">{product.category?.category_name || 'N/A'}</span>
 </div>
 <div className="flex justify-between text-[11px]">
 <span className="text-gray-600">Price:</span>
 <span className="font-bold text-gray-900">₱{parseFloat(product.price).toLocaleString()}</span>
 </div>
 <div className="flex justify-between text-[11px]">
 <span className="text-gray-600">Stock:</span>
 <span className={`font-semibold ${(product.inventory?.quantity || 0) < 10 ? 'text-rose-600' : 'text-gray-900'}`}>
 {product.inventory?.quantity || 0} units
 </span>
 </div>
 </div>

 <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
 <button 
 onClick={() => handleView(product)}
 className="flex-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors text-[11px] font-semibold flex items-center justify-center gap-1"
 >
 <Eye className="w-4 h-4" />
 View
 </button>
 <button 
 onClick={() => openEditModal(product)}
 className="flex-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors text-[11px] font-semibold flex items-center justify-center gap-1"
 >
 <Edit className="w-4 h-4" />
 Edit
 </button>
 <button 
 onClick={() => openDeleteModal(product)}
 className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 ))
 )}
 </div>

 {/* Desktop Table View */}
 <div className="hidden md:block overflow-x-auto">
 <table className="w-full">
 <thead className="bg-gray-50 border-b border-gray-200">
 <tr>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">
 Product
 </th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">
 Barcode
 </th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">
 Category
 </th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">
 Price
 </th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">
 Stock
 </th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">
 Expiration
 </th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">
 Status
 </th>
 <th className="px-5 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">
 Actions
 </th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-200">
 {isLoading ? (
 <TableSkeleton rows={5} columns={8} />
 ) : paginatedProducts.length === 0 ? (
 <tr>
 <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
 No products found
 </td>
 </tr>
 ) : (
 paginatedProducts.map((product) => (
 <tr key={product.product_id} className="hover:bg-gray-50 transition-colors group">
 <td className="px-5 py-3.5">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
 <Package className="w-5 h-5 text-emerald-600" />
 </div>
 <span className="font-medium text-gray-900">{product.product_name}</span>
 </div>
 </td>
 <td className="px-5 py-3.5 text-gray-600 font-mono text-[11px]">{product.barcode || 'N/A'}</td>
 <td className="px-5 py-3.5">
 <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
 {product.category?.category_name || 'N/A'}
 </span>
 </td>
 <td className="px-5 py-3.5 font-semibold text-gray-900">₱{parseFloat(product.price).toLocaleString()}</td>
 <td className="px-5 py-3.5">
 <span className={`font-semibold ${(product.inventory?.quantity || 0) < 10 ? 'text-rose-600' : 'text-gray-900'}`}>
 {product.inventory?.quantity || 0} units
 </span>
 </td>
 <td className="px-5 py-3.5">
 {product.expiration_date ? (
 <span className={`text-[11px] ${new Date(product.expiration_date) < new Date() ? 'text-rose-600 font-semibold' : 'text-gray-600'}`}>
 {new Date(product.expiration_date).toLocaleDateString()}
 </span>
 ) : (
 <span className="text-gray-400 text-[11px]">No expiry</span>
 )}
 </td>
 <td className="px-5 py-3.5">
 <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${product.is_active ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
 {product.is_active ? 'Active' : 'Inactive'}
 </span>
 </td>
 <td className="px-5 py-3.5">
 <div className="flex items-center justify-end gap-2">
 <button 
 onClick={() => handleView(product)}
 className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors" 
 title="View"
 >
 <Eye className="w-4 h-4" />
 </button>
 <button 
 onClick={() => openEditModal(product)}
 className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors" 
 title="Edit"
 >
 <Edit className="w-4 h-4" />
 </button>
 <button 
 onClick={() => openDeleteModal(product)}
 className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors" 
 title="Delete"
 >
 <Trash2 className="w-4 h-4" />
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
 totalItems={filteredProducts.length}
 itemsPerPage={itemsPerPage}
 onPageChange={setCurrentPage}
 onItemsPerPageChange={(value) => {
 setItemsPerPage(value);
 setCurrentPage(1);
 }}
 />
 </div>

 {/* Modals */}
 <ViewModal
 isOpen={viewModal.isOpen}
 onClose={() => setViewModal({ isOpen: false, data: null })}
 title="Product Details"
 data={viewModal.data}
 fields={viewFields}
 />

 <AddModal
 isOpen={addModal}
 onClose={() => {
 setAddModal(false);
 setScannedBarcode(''); // Clear scanned barcode when modal closes
 }}
 title="Add New Product"
 fields={addProductFields}
 onSubmit={handleAdd}
 />

 <EditModal
 isOpen={editModal.isOpen}
 onClose={() => setEditModal({ isOpen: false, data: null })}
 title="Edit Product"
 fields={editProductFields}
 data={editModal.data}
 onSubmit={handleEdit}
 />

 <DeleteModal
 isOpen={deleteModal.isOpen}
 onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
 title="Delete Product"
 message="Are you sure you want to delete this product?"
 itemName={deleteModal.name}
 onConfirm={handleDelete}
 />
 </div>
 );
};

export default Products;
