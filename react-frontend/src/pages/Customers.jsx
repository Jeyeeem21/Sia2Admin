import { useState } from 'react';
import usePageTitle from '../hooks/usePageTitle';
import { Search, Plus, Mail, Phone, MapPin, Edit, Trash2, UserCircle, Users, TrendingUp, DollarSign, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import ViewModal from '../components/ViewModal';
import AddModal from '../components/AddModal';
import EditModal from '../components/EditModal';
import DeleteModal from '../components/DeleteModal';
import Pagination from '../components/Pagination';

const Customers = () => {
  usePageTitle('Customers');
 const [searchTerm, setSearchTerm] = useState('');
 const [filterType, setFilterType] = useState('all');
 const [currentPage, setCurrentPage] = useState(1);
 const [itemsPerPage, setItemsPerPage] = useState(10);
 
 // Modal states
 const [viewModal, setViewModal] = useState({ isOpen: false, data: null });
 const [addModal, setAddModal] = useState(false);
 const [editModal, setEditModal] = useState({ isOpen: false, data: null });
 const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });

 // Sample customers data (will be replaced with API)
 const [customers, setCustomers] = useState([
 { id: 1, name: 'Juan Dela Cruz', email: 'juan.delacruz@student.minsu.edu.ph', phone: '0912-345-6789', type: 'Student', studentId: '2021-12345', totalOrders: 15, totalSpent: 3250, lastOrder: '2025-10-28' },
 { id: 2, name: 'Maria Santos', email: 'maria.santos@student.minsu.edu.ph', phone: '0923-456-7890', type: 'Student', studentId: '2022-23456', totalOrders: 8, totalSpent: 1890, lastOrder: '2025-10-29' },
 { id: 3, name: 'Pedro Garcia', email: 'pedro.garcia@minsu.edu.ph', phone: '0934-567-8901', type: 'Faculty', studentId: 'FAC-001', totalOrders: 22, totalSpent: 5670, lastOrder: '2025-10-30' },
 { id: 4, name: 'Anna Reyes', email: 'anna.reyes@student.minsu.edu.ph', phone: '0945-678-9012', type: 'Student', studentId: '2023-34567', totalOrders: 12, totalSpent: 2340, lastOrder: '2025-10-27' },
 { id: 5, name: 'Carlos Lopez', email: 'carlos.lopez@minsu.edu.ph', phone: '0956-789-0123', type: 'Staff', studentId: 'STAFF-045', totalOrders: 18, totalSpent: 4120, lastOrder: '2025-10-29' },
 { id: 6, name: 'Sofia Ramos', email: 'sofia.ramos@student.minsu.edu.ph', phone: '0967-890-1234', type: 'Student', studentId: '2021-45678', totalOrders: 25, totalSpent: 6780, lastOrder: '2025-10-30' },
 { id: 7, name: 'Miguel Torres', email: 'miguel.torres@student.minsu.edu.ph', phone: '0978-901-2345', type: 'Student', studentId: '2022-56789', totalOrders: 6, totalSpent: 1250, lastOrder: '2025-10-26' },
 { id: 8, name: 'Elena Cruz', email: 'elena.cruz@minsu.edu.ph', phone: '0989-012-3456', type: 'Faculty', studentId: 'FAC-012', totalOrders: 14, totalSpent: 3890, lastOrder: '2025-10-28' },
 ]);

 const stats = [
 { label: 'Total Customers', value: '342', icon: Users, color: 'bg-emerald-50 text-emerald-600' },
 { label: 'Active This Month', value: '156', icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
 { label: 'Total Revenue', value: '₱187,450', icon: DollarSign, color: 'bg-amber-50 text-amber-600' },
 { label: 'New This Week', value: '12', icon: UserCircle, color: 'bg-gray-100 text-gray-600' },
 ];

 const customerTypes = ['all', 'Student', 'Faculty', 'Staff'];

 // Modal field configurations
 const customerFields = [
 { key: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Enter full name' },
 { key: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'email@minsu.edu.ph' },
 { key: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: '0912-345-6789' },
 { key: 'type', label: 'User Type', type: 'select', required: true,
 options: [
 { value: 'Student', label: 'Student' },
 { value: 'Faculty', label: 'Faculty' },
 { value: 'Staff', label: 'Staff' }
 ]
 },
 { key: 'studentId', label: 'Student/Employee ID', type: 'text', required: true, placeholder: '2021-12345 or STAFF-XXX' }
 ];

 const viewFields = [
 { key: 'name', label: 'Full Name' },
 { key: 'email', label: 'Email Address' },
 { key: 'phone', label: 'Phone Number' },
 { key: 'type', label: 'User Type' },
 { key: 'studentId', label: 'Student/Employee ID' },
 { key: 'totalOrders', label: 'Total Orders' },
 { key: 'totalSpent', label: 'Total Spent', render: (value) => `₱${parseFloat(value).toLocaleString()}` },
 { key: 'lastOrder', label: 'Last Order Date' }
 ];

 // Modal handlers
 const handleView = (customer) => {
 setViewModal({ isOpen: true, data: customer });
 };

 const handleAdd = (formData) => {
 const newCustomer = {
 id: customers.length + 1,
 ...formData,
 totalOrders: 0,
 totalSpent: 0,
 lastOrder: new Date().toISOString().split('T')[0]
 };
 setCustomers([...customers, newCustomer]);
 toast.success('Customer added successfully!');
 };

 const handleEdit = (formData) => {
 setCustomers(customers.map(c => c.id === formData.id ? formData : c));
 toast.success('Customer updated successfully!');
 };

 const handleDelete = () => {
 setCustomers(customers.filter(c => c.id !== deleteModal.id));
 toast.success('Customer deleted successfully!');
 };

 const openEditModal = (customer) => {
 setEditModal({ isOpen: true, data: customer });
 };

 const openDeleteModal = (customer) => {
 setDeleteModal({ isOpen: true, id: customer.id, name: customer.name });
 };

 const getTypeColor = (type) => {
 switch (type) {
 case 'Student': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
 case 'Faculty': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
 case 'Staff': return 'bg-amber-100 text-amber-700 border-amber-300';
 default: return 'bg-gray-100 text-gray-700 border-gray-300';
 }
 };

 const filteredCustomers = customers.filter(customer => {
 const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
 customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
 customer.studentId.toLowerCase().includes(searchTerm.toLowerCase());
 const matchesType = filterType === 'all' || customer.type === filterType;
 return matchesSearch && matchesType;
 });

 // Pagination
 const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
 const startIndex = (currentPage - 1) * itemsPerPage;
 const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + itemsPerPage);

 return (
 <div className="p-5 lg:p-6 min-h-full">
 {/* Header */}
 <div className="mb-7">
 <div className="flex items-end justify-between">
 <div>
 <h1 className="text-xl font-bold text-gray-900 tracking-tight">Customer Management</h1>
 <p className="text-[11px] text-gray-400 mt-1">Manage your customer database and relationships</p>
 </div>
 <button 
 onClick={() => setAddModal(true)}
 className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 active:scale-[0.97] transition-all text-[11px] font-semibold flex items-center gap-2"
 >
 <Plus className="w-4 h-4" />
 Add Customer
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
 placeholder="Search customers by name, email, or ID..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-[13px] focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 />
 </div>
 <select
 value={filterType}
 onChange={(e) => setFilterType(e.target.value)}
 className="px-4 py-2.5 border border-gray-200 rounded-xl text-[13px] focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all cursor-pointer"
 >
 {customerTypes.map(type => (
 <option key={type} value={type}>
 {type === 'all' ? 'All Types' : type}
 </option>
 ))}
 </select>
 </div>
 </div>

 {/* Customers Table */}
 <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
 {/* Mobile Card View */}
 <div className="block md:hidden p-4 space-y-4">
 {paginatedCustomers.length === 0 ? (
 <div className="text-center text-gray-500 py-12">No customers found</div>
 ) : (
 paginatedCustomers.map((customer) => (
 <div key={customer.id} className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
 <div className="flex items-start gap-3">
 <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-semibold flex-shrink-0">
 {customer.name.split(' ').map(n => n[0]).join('')}
 </div>
 <div className="flex-1">
 <h3 className="font-semibold text-gray-900">{customer.name}</h3>
 <span className={`inline-block mt-1 px-2 py-1 rounded-full text-[10px] font-bold border ${getTypeColor(customer.type)}`}>
 {customer.type}
 </span>
 </div>
 </div>

 <div className="bg-white rounded-lg p-3 space-y-2">
 <div className="flex items-center gap-2 text-[11px] text-gray-500">
 <Mail className="w-4 h-4 text-gray-400" />
 <span className="truncate">{customer.email}</span>
 </div>
 <div className="flex items-center gap-2 text-[11px] text-gray-500">
 <Phone className="w-4 h-4 text-gray-400" />
 <span>{customer.phone}</span>
 </div>
 <div className="text-[11px] text-gray-500">
 <span className="font-mono">{customer.studentId}</span>
 </div>
 </div>

 <div className="grid grid-cols-3 gap-2 text-center">
 <div className="bg-white rounded-lg p-2">
 <div className="text-xs text-gray-600">Orders</div>
 <div className="text-[11px] font-semibold text-gray-900">{customer.totalOrders}</div>
 </div>
 <div className="bg-white rounded-lg p-2">
 <div className="text-xs text-gray-600">Spent</div>
 <div className="text-[11px] font-bold text-emerald-600">₱{customer.totalSpent.toLocaleString()}</div>
 </div>
 <div className="bg-white rounded-lg p-2">
 <div className="text-xs text-gray-600">Last Order</div>
 <div className="text-xs font-medium text-gray-900">{customer.lastOrder}</div>
 </div>
 </div>

 <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
 <button 
 onClick={() => handleView(customer)}
 className="flex-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors text-[11px] font-semibold flex items-center justify-center gap-1"
 >
 <Eye className="w-4 h-4" />
 View
 </button>
 <button 
 onClick={() => openEditModal(customer)}
 className="flex-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors text-[11px] font-semibold flex items-center justify-center gap-1"
 >
 <Edit className="w-4 h-4" />
 Edit
 </button>
 <button 
 onClick={() => openDeleteModal(customer)}
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
 Customer
 </th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">
 Contact
 </th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">
 Type
 </th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">
 ID Number
 </th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">
 Orders
 </th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">
 Total Spent
 </th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">
 Last Order
 </th>
 <th className="px-5 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">
 Actions
 </th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-200">
 {paginatedCustomers.map((customer) => (
 <tr key={customer.id} className="hover:bg-gray-50 transition-colors group">
 <td className="px-5 py-3.5">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-semibold">
 {customer.name.split(' ').map(n => n[0]).join('')}
 </div>
 <span className="font-medium text-gray-900">{customer.name}</span>
 </div>
 </td>
 <td className="px-5 py-3.5">
 <div className="space-y-1">
 <div className="flex items-center gap-2 text-[11px] text-gray-500">
 <Mail className="w-4 h-4 text-gray-400" />
 {customer.email}
 </div>
 <div className="flex items-center gap-2 text-[11px] text-gray-500">
 <Phone className="w-4 h-4 text-gray-400" />
 {customer.phone}
 </div>
 </div>
 </td>
 <td className="px-5 py-3.5">
 <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getTypeColor(customer.type)}`}>
 {customer.type}
 </span>
 </td>
 <td className="px-5 py-3.5 text-gray-600 font-mono text-[11px]">{customer.studentId}</td>
 <td className="px-5 py-3.5 font-semibold text-gray-900">{customer.totalOrders}</td>
 <td className="px-5 py-3.5 font-semibold text-emerald-600">₱{customer.totalSpent.toLocaleString()}</td>
 <td className="px-5 py-3.5 text-gray-600 text-[11px]">{customer.lastOrder}</td>
 <td className="px-5 py-3.5">
 <div className="flex items-center justify-end gap-2">
 <button 
 onClick={() => handleView(customer)}
 className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors" 
 title="View"
 >
 <Eye className="w-4 h-4" />
 </button>
 <button 
 onClick={() => openEditModal(customer)}
 className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors" 
 title="Edit"
 >
 <Edit className="w-4 h-4" />
 </button>
 <button 
 onClick={() => openDeleteModal(customer)}
 className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors" 
 title="Delete"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 {/* Pagination */}
 <Pagination
 currentPage={currentPage}
 totalPages={totalPages}
 totalItems={filteredCustomers.length}
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
 title="Customer Details"
 data={viewModal.data}
 fields={viewFields}
 />

 <AddModal
 isOpen={addModal}
 onClose={() => setAddModal(false)}
 title="Add New Customer"
 fields={customerFields}
 onSubmit={handleAdd}
 />

 <EditModal
 isOpen={editModal.isOpen}
 onClose={() => setEditModal({ isOpen: false, data: null })}
 title="Edit Customer"
 fields={customerFields}
 data={editModal.data}
 onSubmit={handleEdit}
 />

 <DeleteModal
 isOpen={deleteModal.isOpen}
 onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
 title="Delete Customer"
 message="Are you sure you want to delete this customer?"
 itemName={deleteModal.name}
 onConfirm={handleDelete}
 />
 </div>
 );
};

export default Customers;
