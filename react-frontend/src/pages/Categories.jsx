import { useState, useEffect } from 'react';
import usePageTitle from '../hooks/usePageTitle';
import { Search, Plus, Edit, Trash2, Eye, Tag, TrendingUp, Package, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import ViewModal from '../components/ViewModal';
import AddModal from '../components/AddModal';
import EditModal from '../components/EditModal';
import DeleteModal from '../components/DeleteModal';
import Pagination from '../components/Pagination';
import PageLoadingSpinner from '../components/PageLoadingSpinner';
import { categoriesAPI } from '../services/api';

const Categories = () => {
  usePageTitle('Categories');
 const [searchTerm, setSearchTerm] = useState('');
 const [currentPage, setCurrentPage] = useState(1);
 const [itemsPerPage, setItemsPerPage] = useState(10);
 const [loading, setLoading] = useState(false);
 
 // Modal states
 const [viewModal, setViewModal] = useState({ isOpen: false, data: null });
 const [addModal, setAddModal] = useState(false);
 const [editModal, setEditModal] = useState({ isOpen: false, data: null });
 const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });

 // Categories data from API
 const [categories, setCategories] = useState([]);

 // Fetch categories from API
 useEffect(() => {
 fetchCategories(true); // Show loading only on first load
 
 // Real-time polling every 1 second (no loading spinner)
 const interval = setInterval(() => fetchCategories(false), 1000);
 
 return () => clearInterval(interval);
 }, []);

 const fetchCategories = async (showLoading = false) => {
 try {
 if (showLoading) setLoading(true);
 const response = await categoriesAPI.getAll();
 setCategories(response.data);
 } catch (error) {
 if (showLoading) toast.error('Failed to fetch categories');
 console.error('Error fetching categories:', error);
 } finally {
 if (showLoading) setLoading(false);
 }
 };

 const stats = [
 { label: 'Total Categories', value: categories.length, icon: Layers, color: 'bg-emerald-50 text-emerald-600' },
 { label: 'Active Categories', value: categories.filter(c => c.status === 'active').length, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
 { label: 'Total Products', value: categories.reduce((sum, c) => sum + (c.products_count || 0), 0), icon: Package, color: 'bg-amber-50 text-amber-600' },
 { label: 'Inactive', value: categories.filter(c => c.status === 'inactive').length, icon: Tag, color: 'bg-gray-100 text-gray-600' },
 ];

 // Modal field configurations
 const addCategoryFields = [
 { key: 'category_name', label: 'Category Name', type: 'text', required: true, placeholder: 'Enter category name' },
 { key: 'description', label: 'Description', type: 'textarea', required: false, fullWidth: true, rows: 3, placeholder: 'Category description (optional)' },
 { key: 'status', label: 'Status', type: 'hidden', required: false, defaultValue: 'active' }
 ];

 const editCategoryFields = [
 { key: 'category_name', label: 'Category Name', type: 'text', required: true, placeholder: 'Enter category name' },
 { key: 'description', label: 'Description', type: 'textarea', required: false, fullWidth: true, rows: 3, placeholder: 'Category description (optional)' },
 { key: 'status', label: 'Status', type: 'select', required: true,
 options: [
 { value: 'active', label: 'Active' },
 { value: 'inactive', label: 'Inactive' }
 ]
 }
 ];

 const viewFields = [
 { key: 'category_name', label: 'Category Name' },
 { key: 'description', label: 'Description' },
 { key: 'products_count', label: 'Number of Products' },
 { key: 'status', label: 'Status', render: (v) => v.toUpperCase() }
 ];

 // Modal handlers
 const handleView = (category) => {
 setViewModal({ isOpen: true, data: category });
 };

 const handleAdd = async (formData) => {
 try {
 const response = await categoriesAPI.create(formData);
 
 // Add new category to local state immediately
 setCategories(prevCategories => [response.data, ...prevCategories]);
 
 // Also fetch from server to ensure consistency
 fetchCategories(false);
 
 toast.success('Category added successfully!');
 } catch (error) {
 toast.error(error.response?.data?.message || 'Failed to add category');
 console.error('Error adding category:', error);
 }
 };

 const handleEdit = async (formData) => {
 try {
 const response = await categoriesAPI.update(formData.category_id, formData);
 
 // Update local state immediately for instant UI feedback
 setCategories(prevCategories => 
 prevCategories.map(cat => 
 cat.category_id === formData.category_id ? response.data : cat
 )
 );
 
 // Also fetch from server to ensure consistency
 fetchCategories(false);
 
 toast.success('Category updated successfully!');
 } catch (error) {
 toast.error(error.response?.data?.message || 'Failed to update category');
 console.error('Error updating category:', error);
 }
 };

 const handleDelete = async () => {
 try {
 await categoriesAPI.delete(deleteModal.id);
 
 // Remove from local state immediately
 setCategories(prevCategories => 
 prevCategories.filter(cat => cat.category_id !== deleteModal.id)
 );
 
 // Also fetch from server to ensure consistency
 fetchCategories(false);
 
 toast.success('Category deleted successfully!');
 } catch (error) {
 // Better error messages
 if (error.response?.status === 404) {
 toast.error('Category already deleted or not found');
 // Remove from local state anyway
 setCategories(prevCategories => 
 prevCategories.filter(cat => cat.category_id !== deleteModal.id)
 );
 } else if (error.response?.status === 422) {
 toast.error(error.response?.data?.message || 'Cannot delete category');
 } else {
 toast.error('Failed to delete category');
 }
 console.error('Error deleting category:', error);
 }
 };

 const openEditModal = (category) => {
 setEditModal({ 
 isOpen: true, 
 data: {
 ...category,
 name: category.category_name
 }
 });
 };

 const openDeleteModal = (category) => {
 setDeleteModal({ 
 isOpen: true, 
 id: category.category_id, 
 name: category.category_name 
 });
 };

 const getStatusColor = (status) => {
 return status === 'active' 
 ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
 : 'bg-gray-100 text-gray-700 border-gray-300';
 };

 // Filter and pagination
 const filteredCategories = categories.filter(category =>
 category.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
 (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
 );

 const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
 const startIndex = (currentPage - 1) * itemsPerPage;
 const paginatedCategories = filteredCategories.slice(startIndex, startIndex + itemsPerPage);

 return (
 <div className="p-5 lg:p-6 min-h-full">
 {/* Header */}
 <div className="mb-7">
 <div className="flex items-end justify-between">
 <div>
 <h1 className="text-xl font-bold text-gray-900 tracking-tight">Categories Management</h1>
 <p className="text-[11px] text-gray-400 mt-1">Organize and manage product categories</p>
 </div>
 <button 
 onClick={() => setAddModal(true)}
 className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 active:scale-[0.97] transition-all text-[11px] font-semibold flex items-center gap-2"
 >
 <Plus className="w-4 h-4" />
 Add Category
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

 {/* Search */}
 <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-gray-100 p-5 mb-5">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
 <input
 type="text"
 placeholder="Search categories by name or description..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-[13px] focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 />
 </div>
 </div>

 {/* Categories Table */}
 <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
 {/* Mobile Card View */}
 <div className="block md:hidden p-4 space-y-4">
 {loading ? (
 <PageLoadingSpinner message="Loading categories..." />
 ) : paginatedCategories.length === 0 ? (
 <div className="text-center text-gray-500 py-12">No categories found</div>
 ) : (
 paginatedCategories.map((category) => (
 <div key={category.category_id} className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
 <div className="flex items-start gap-3">
 <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
 <Tag className="w-6 h-6 text-emerald-600" />
 </div>
 <div className="flex-1">
 <h3 className="font-semibold text-gray-900">{category.category_name}</h3>
 <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{category.description}</p>
 </div>
 </div>
 
 <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-[11px]">
 <span className="text-gray-600">Products:</span>
 <span className="font-semibold text-gray-900">{category.products_count || 0} items</span>
 </div>
 
 <div className="flex items-center gap-2">
 <span className={`px-3 py-1 rounded-full text-[10px] font-bold border flex-1 text-center ${getStatusColor(category.status)}`}>
 {category.status.toUpperCase()}
 </span>
 </div>
 
 <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
 <button 
 onClick={() => handleView(category)}
 className="flex-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors text-[11px] font-semibold flex items-center justify-center gap-1"
 >
 <Eye className="w-4 h-4" />
 View
 </button>
 <button 
 onClick={() => openEditModal(category)}
 className="flex-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors text-[11px] font-semibold flex items-center justify-center gap-1"
 >
 <Edit className="w-4 h-4" />
 Edit
 </button>
 <button 
 onClick={() => openDeleteModal(category)}
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
 Category
 </th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">
 Description
 </th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">
 Products
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
 {loading ? (
 <PageLoadingSpinner variant="table" colSpan={5} message="Loading categories..." />
 ) : paginatedCategories.length === 0 ? (
 <tr>
 <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
 No categories found
 </td>
 </tr>
 ) : (
 paginatedCategories.map((category) => (
 <tr key={category.category_id} className="hover:bg-gray-50 transition-colors group">
 <td className="px-5 py-3.5">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
 <Tag className="w-5 h-5 text-emerald-600" />
 </div>
 <span className="font-medium text-gray-900">{category.category_name}</span>
 </div>
 </td>
 <td className="px-5 py-3.5 text-gray-600 max-w-xs truncate">
 {category.description}
 </td>
 <td className="px-5 py-3.5 font-semibold text-gray-900">
 {category.products_count || 0} items
 </td>
 <td className="px-5 py-3.5">
 <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(category.status)}`}>
 {category.status.toUpperCase()}
 </span>
 </td>
 <td className="px-5 py-3.5">
 <div className="flex items-center justify-end gap-2">
 <button 
 onClick={() => handleView(category)}
 className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors" 
 title="View"
 >
 <Eye className="w-4 h-4" />
 </button>
 <button 
 onClick={() => openEditModal(category)}
 className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors" 
 title="Edit"
 >
 <Edit className="w-4 h-4" />
 </button>
 <button 
 onClick={() => openDeleteModal(category)}
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
 totalItems={filteredCategories.length}
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
 title="Category Details"
 data={viewModal.data}
 fields={viewFields}
 />

 <AddModal
 isOpen={addModal}
 onClose={() => setAddModal(false)}
 title="Add New Category"
 fields={addCategoryFields}
 onSubmit={handleAdd}
 />

 <EditModal
 isOpen={editModal.isOpen}
 onClose={() => setEditModal({ isOpen: false, data: null })}
 title="Edit Category"
 fields={editCategoryFields}
 data={editModal.data}
 onSubmit={handleEdit}
 />

 <DeleteModal
 isOpen={deleteModal.isOpen}
 onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
 title="Delete Category"
 message="Are you sure you want to delete this category?"
 itemName={deleteModal.name}
 onConfirm={handleDelete}
 />
 </div>
 );
};

export default Categories;
