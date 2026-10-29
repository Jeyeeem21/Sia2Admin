import { useState } from 'react';
import usePageTitle from '../hooks/usePageTitle';
import { Search, Download, Eye, Send, FileText, DollarSign, Clock, CheckCircle, XCircle, Plus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ViewModal from '../components/ViewModal';
import AddModal from '../components/AddModal';
import EditModal from '../components/EditModal';
import DeleteModal from '../components/DeleteModal';
import Pagination from '../components/Pagination';

const Invoices = () => {
  usePageTitle('Invoices');
 const [searchTerm, setSearchTerm] = useState('');
 const [filterStatus, setFilterStatus] = useState('all');
 const [currentPage, setCurrentPage] = useState(1);
 const [itemsPerPage, setItemsPerPage] = useState(10);
 
 // Modal states
 const [viewModal, setViewModal] = useState({ isOpen: false, data: null });
 const [addModal, setAddModal] = useState(false);
 const [editModal, setEditModal] = useState({ isOpen: false, data: null });
 const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });

 // Sample invoices data (will be replaced with API)
 const [invoices, setInvoices] = useState([
 { id: 'INV-2025-001', customer: 'Juan Dela Cruz', studentId: '2021-12345', date: '2025-10-28', dueDate: '2025-11-04', amount: 350, status: 'paid', items: 3 },
 { id: 'INV-2025-002', customer: 'Maria Santos', studentId: '2022-23456', date: '2025-10-29', dueDate: '2025-11-05', amount: 120, status: 'pending', items: 1 },
 { id: 'INV-2025-003', customer: 'Pedro Garcia', studentId: 'FAC-001', date: '2025-10-27', dueDate: '2025-11-03', amount: 890, status: 'paid', items: 5 },
 { id: 'INV-2025-004', customer: 'Anna Reyes', studentId: '2023-34567', date: '2025-10-30', dueDate: '2025-11-06', amount: 250, status: 'pending', items: 2 },
 { id: 'INV-2025-005', customer: 'Carlos Lopez', studentId: 'STAFF-045', date: '2025-10-26', dueDate: '2025-11-02', amount: 450, status: 'overdue', items: 4 },
 { id: 'INV-2025-006', customer: 'Sofia Ramos', studentId: '2021-45678', date: '2025-10-29', dueDate: '2025-11-05', amount: 670, status: 'paid', items: 6 },
 { id: 'INV-2025-007', customer: 'Miguel Torres', studentId: '2022-56789', date: '2025-10-28', dueDate: '2025-11-04', amount: 180, status: 'pending', items: 2 },
 { id: 'INV-2025-008', customer: 'Elena Cruz', studentId: 'FAC-012', date: '2025-10-25', dueDate: '2025-11-01', amount: 550, status: 'overdue', items: 3 },
 ]);

 // Modal configurations
 const invoiceFields = [
 { key: 'customer', label: 'Customer Name', type: 'text', required: true },
 { key: 'studentId', label: 'Student/Employee ID', type: 'text', required: true },
 { key: 'date', label: 'Invoice Date', type: 'date', required: true },
 { key: 'dueDate', label: 'Due Date', type: 'date', required: true },
 { key: 'amount', label: 'Total Amount (₱)', type: 'number', required: true },
 { key: 'items', label: 'Number of Items', type: 'number', required: true }
 ];

 const viewFields = [
 { key: 'id', label: 'Invoice Number' },
 { key: 'customer', label: 'Customer Name' },
 { key: 'studentId', label: 'Student/Employee ID' },
 { key: 'date', label: 'Invoice Date' },
 { key: 'dueDate', label: 'Due Date' },
 { key: 'amount', label: 'Total Amount', render: (v) => `₱${parseFloat(v).toLocaleString()}` },
 { key: 'items', label: 'Number of Items' },
 { key: 'status', label: 'Payment Status', render: (v) => v.toUpperCase() }
 ];

 // Modal handlers
 const handleView = (invoice) => {
 setViewModal({ isOpen: true, data: invoice });
 };

 const handleAdd = (formData) => {
 const newInvoice = {
 id: `INV-2025-${String(invoices.length + 1).padStart(3, '0')}`,
 ...formData,
 status: 'pending'
 };
 setInvoices([...invoices, newInvoice]);
 toast.success('Invoice created successfully!');
 };

 const handleEdit = (formData) => {
 setInvoices(invoices.map(inv => inv.id === formData.id ? formData : inv));
 toast.success('Invoice updated successfully!');
 };

 const handleDelete = () => {
 setInvoices(invoices.filter(inv => inv.id !== deleteModal.id));
 toast.success('Invoice deleted successfully!');
 };

 const handleDownload = (invoiceId) => {
 toast.success(`Downloading invoice ${invoiceId}...`);
 };

 const handleSend = (invoiceId) => {
 toast.success(`Invoice ${invoiceId} sent via email!`);
 };

 const stats = [
 { label: 'Total Invoices', value: '156', icon: FileText, color: 'bg-emerald-50 text-emerald-600' },
 { label: 'Paid', value: '89', icon: CheckCircle, color: 'bg-amber-50 text-amber-600' },
 { label: 'Pending', value: '52', icon: Clock, color: 'bg-amber-50 text-amber-600' },
 { label: 'Overdue', value: '15', icon: XCircle, color: 'bg-red-50 text-red-600' },
 ];

 const statusOptions = ['all', 'paid', 'pending', 'overdue'];

 const getStatusColor = (status) => {
 switch (status) {
 case 'paid': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
 case 'pending': return 'bg-amber-100 text-amber-700 border-amber-300';
 case 'overdue': return 'bg-rose-100 text-rose-700 border-rose-300';
 default: return 'bg-gray-100 text-gray-700 border-gray-300';
 }
 };

 const getStatusIcon = (status) => {
 switch (status) {
 case 'paid': return <CheckCircle className="w-4 h-4" />;
 case 'pending': return <Clock className="w-4 h-4" />;
 case 'overdue': return <XCircle className="w-4 h-4" />;
 default: return null;
 }
 };

 const filteredInvoices = invoices.filter(invoice => {
 const matchesSearch = invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
 invoice.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
 invoice.studentId.toLowerCase().includes(searchTerm.toLowerCase());
 const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
 return matchesSearch && matchesStatus;
 });

 // Pagination
 const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
 const startIndex = (currentPage - 1) * itemsPerPage;
 const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + itemsPerPage);

 const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);

 return (
 <div className="p-5 lg:p-6 min-h-full">
 {/* Header */}
 <div className="flex justify-between items-start mb-7">
 <div>
 <h1 className="text-xl font-bold text-gray-900 tracking-tight">
 Invoice Management
 </h1>
 <p className="text-[11px] text-gray-400 mt-1">Track and manage all invoices and payments</p>
 </div>
 <button 
 onClick={() => setAddModal(true)}
 className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 active:scale-[0.97] transition-all text-[13px] font-semibold flex items-center gap-2"
 >
 <Plus className="w-5 h-5" />
 Create Invoice
 </button>
 </div>

 {/* Stats Cards */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
 {stats.map((stat, index) => (
 <div
 key={index}
 className="group relative bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
 >
 <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/10 to-emerald-500/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
 <div className="relative">
 <div className="flex items-center gap-3 mb-3">
 <div className={`${stat.color} p-2.5 rounded-xl ring-4 ring-white`}>
 <stat.icon className="w-4 h-4 text-white" />
 </div>
 </div>
 <p className="text-[22px] font-bold text-gray-900">{stat.value}</p>
 <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-1">{stat.label}</p>
 </div>
 </div>
 ))}
 </div>

 {/* Search and Filter */}
 <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-gray-100 p-5">
 <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
 <div className="flex-1 relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
 <input
 type="text"
 placeholder="Search invoices by ID, customer, or student ID..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-[13px] focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 />
 </div>
 <select
 value={filterStatus}
 onChange={(e) => setFilterStatus(e.target.value)}
 className="px-3.5 py-2.5 border border-gray-200 rounded-xl text-[13px] focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all cursor-pointer"
 >
 {statusOptions.map(status => (
 <option key={status} value={status}>
 {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
 </option>
 ))}
 </select>
 <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
 <p className="text-[11px] text-gray-500">Total Amount</p>
 <p className="text-xl font-bold bg-emerald-600 bg-clip-text text-transparent">
 ₱{totalAmount.toLocaleString()}
 </p>
 </div>
 </div>
 </div>

 {/* Invoices Table */}
 <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
 {/* Mobile Card View */}
 <div className="block md:hidden p-4 space-y-4">
 {paginatedInvoices.length === 0 ? (
 <div className="text-center text-gray-500 py-12">No invoices found</div>
 ) : (
 paginatedInvoices.map((invoice) => (
 <div key={invoice.id} className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
 <div className="flex items-start justify-between">
 <div className="flex items-center gap-2">
 <FileText className="w-5 h-5 text-emerald-600" />
 <div>
 <h3 className="font-mono text-[11px] font-semibold text-gray-900">{invoice.id}</h3>
 <p className="text-[11px] text-gray-500">{invoice.customer}</p>
 </div>
 </div>
 <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(invoice.status)}`}>
 {getStatusIcon(invoice.status)}
 {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
 </span>
 </div>

 <div className="bg-white rounded-lg p-3 space-y-2">
 <div className="flex justify-between text-[11px]">
 <span className="text-gray-600">Student/Staff ID:</span>
 <span className="font-mono text-gray-900">{invoice.studentId}</span>
 </div>
 <div className="flex justify-between text-[11px]">
 <span className="text-gray-600">Date:</span>
 <span className="text-gray-900">{invoice.date}</span>
 </div>
 <div className="flex justify-between text-[11px]">
 <span className="text-gray-600">Due Date:</span>
 <span className="text-gray-900">{invoice.dueDate}</span>
 </div>
 <div className="flex justify-between text-[11px]">
 <span className="text-gray-600">Items:</span>
 <span className="text-gray-900">{invoice.items} items</span>
 </div>
 <div className="flex justify-between text-[11px] pt-2 border-t border-gray-200">
 <span className="text-gray-600">Amount:</span>
 <span className="font-bold text-[13px] text-gray-900">₱{invoice.amount.toLocaleString()}</span>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
 <button 
 onClick={() => handleView(invoice)}
 className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors text-[11px] font-semibold flex items-center justify-center gap-1"
 >
 <Eye className="w-4 h-4" />
 View
 </button>
 <button 
 onClick={() => setEditModal({ isOpen: true, data: invoice })}
 className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors text-[11px] font-semibold flex items-center justify-center gap-1"
 >
 <Edit className="w-4 h-4" />
 Edit
 </button>
 <button 
 onClick={() => handleDownload(invoice.id)}
 className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors text-[11px] font-semibold flex items-center justify-center gap-1"
 >
 <Download className="w-4 h-4" />
 Download
 </button>
 <button 
 onClick={() => handleSend(invoice.id)}
 className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors text-[11px] font-semibold flex items-center justify-center gap-1"
 >
 <Send className="w-4 h-4" />
 Send
 </button>
 <button 
 onClick={() => setDeleteModal({ isOpen: true, id: invoice.id, name: invoice.id })}
 className="col-span-2 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors text-[11px] font-semibold flex items-center justify-center gap-1"
 >
 <Trash2 className="w-4 h-4" />
 Delete
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
 Invoice ID
 </th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">
 Customer
 </th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">
 Student/Staff ID
 </th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">
 Date
 </th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">
 Due Date
 </th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">
 Items
 </th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">
 Amount
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
 {paginatedInvoices.map((invoice) => (
 <tr key={invoice.id} className="hover:bg-gray-50 transition-colors group">
 <td className="px-5 py-3.5">
 <div className="flex items-center gap-2">
 <FileText className="w-4 h-4 text-emerald-600" />
 <span className="font-mono text-[11px] font-semibold text-gray-900">{invoice.id}</span>
 </div>
 </td>
 <td className="px-5 py-3.5">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-white text-xs font-semibold shadow-md">
 {invoice.customer.split(' ').map(n => n[0]).join('')}
 </div>
 <span className="font-medium text-gray-900">{invoice.customer}</span>
 </div>
 </td>
 <td className="px-5 py-3.5 text-gray-600 font-mono text-[11px]">{invoice.studentId}</td>
 <td className="px-5 py-3.5 text-gray-600 text-[11px]">{invoice.date}</td>
 <td className="px-5 py-3.5 text-gray-600 text-[11px]">{invoice.dueDate}</td>
 <td className="px-5 py-3.5 text-gray-600">{invoice.items} items</td>
 <td className="px-5 py-3.5 font-bold text-gray-900">₱{invoice.amount.toLocaleString()}</td>
 <td className="px-5 py-3.5">
 <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(invoice.status)}`}>
 {getStatusIcon(invoice.status)}
 {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
 </span>
 </td>
 <td className="px-5 py-3.5">
 <div className="flex items-center justify-end gap-2">
 <button 
 onClick={() => handleView(invoice)}
 className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors" 
 title="View"
 >
 <Eye className="w-4 h-4" />
 </button>
 <button 
 onClick={() => setEditModal({ isOpen: true, data: invoice })}
 className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors" 
 title="Edit"
 >
 <Edit className="w-4 h-4" />
 </button>
 <button 
 onClick={() => handleDownload(invoice.id)}
 className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors" 
 title="Download"
 >
 <Download className="w-4 h-4" />
 </button>
 <button 
 onClick={() => handleSend(invoice.id)}
 className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors" 
 title="Send"
 >
 <Send className="w-4 h-4" />
 </button>
 <button 
 onClick={() => setDeleteModal({ isOpen: true, id: invoice.id, name: invoice.id })}
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
 totalItems={filteredInvoices.length}
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
 title="Invoice Details"
 data={viewModal.data}
 fields={viewFields}
 />

 <AddModal
 isOpen={addModal}
 onClose={() => setAddModal(false)}
 title="Create New Invoice"
 fields={invoiceFields}
 onSubmit={handleAdd}
 />

 <EditModal
 isOpen={editModal.isOpen}
 onClose={() => setEditModal({ isOpen: false, data: null })}
 title="Edit Invoice"
 fields={invoiceFields}
 data={editModal.data}
 onSubmit={handleEdit}
 />

 <DeleteModal
 isOpen={deleteModal.isOpen}
 onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
 title="Delete Invoice"
 message="Are you sure you want to delete this invoice?"
 itemName={deleteModal.name}
 onConfirm={handleDelete}
 />
 </div>
 );
};

export default Invoices;
