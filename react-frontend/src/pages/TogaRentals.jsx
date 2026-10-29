/**
 * TOGA RENTAL MANAGEMENT SYSTEM
 * 
 * Purpose: Manage graduation toga rentals for different departments
 * 
 * System Architecture:
 * ==================
 * 
 * 3 Main Views:
 * 
 * 1. DEPARTMENTS - Manage all departments (Add, Edit, Delete)
 * 2. STUDENTS - Manage student rentals per department (Add, Edit, View, Delete)
 * 3. PAYMENTS - Track rental payments per department
 * 
 * Key Features:
 * =============
 * ✅ Department management (Add/Edit/Delete departments)
 * ✅ Student rental tracking per department
 * ✅ Payment tracking and status
 * ✅ Real-time statistics
 */

import { useState, useEffect } from 'react';
import usePageTitle from '../hooks/usePageTitle';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
 GraduationCap,
 Plus,
 Search,
 Filter,
 Calendar,
 User,
 DollarSign,
 CheckCircle,
 Clock,
 AlertTriangle,
 XCircle,
 Eye,
 Edit,
 Trash2,
 Package,
 Phone,
 Briefcase,
 Laptop,
 BookOpen,
 Building,
 Building2,
 Users,
 CreditCard,
 ArrowLeft,
 ChevronLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import * as togaRentalService from '../services/togaRentalService';
import { useAuth } from '../contexts/AuthContext';

const TogaRentals = () => {
  usePageTitle('Toga Rentals');
 const queryClient = useQueryClient();
 const navigate = useNavigate();
 const { user } = useAuth();
 
 // State Management
 const [mainView, setMainView] = useState('departments'); // 'departments', 'students', 'payments'
 const [selectedDepartment, setSelectedDepartment] = useState(null);
 const [activeStudentTab, setActiveStudentTab] = useState('students'); // 'students', 'payments'
 const [searchTerm, setSearchTerm] = useState('');
 const [filterStatus, setFilterStatus] = useState('All');
 const [currentPage, setCurrentPage] = useState(1);
 const [itemsPerPage, setItemsPerPage] = useState(10);
 const [selectedSystem, setSelectedSystem] = useState('Toga Rental');

 // Modal states
 const [showAddDeptModal, setShowAddDeptModal] = useState(false);
 const [showEditDeptModal, setShowEditDeptModal] = useState(false);
 const [showDeleteDeptModal, setShowDeleteDeptModal] = useState(false);
 const [showAddStudentModal, setShowAddStudentModal] = useState(false);
 const [showEditStudentModal, setShowEditStudentModal] = useState(false);
 const [showViewStudentModal, setShowViewStudentModal] = useState(false);
 const [showDeleteStudentModal, setShowDeleteStudentModal] = useState(false);
 const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
 const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
 const [showMarkReturnedModal, setShowMarkReturnedModal] = useState(false);
 const [selectedItem, setSelectedItem] = useState(null);

 // Fetch departments with React Query - REAL-TIME!
 const { data: departments = [], isLoading: loadingDepartments } = useQuery({
 queryKey: ['toga-departments'],
 queryFn: togaRentalService.getDepartments,
 // Uses global config: refetchInterval: 1000 (every second for real-time updates!)
 });

 // Fetch rentals for selected department - REAL-TIME!
 const { data: rentalsData = [], isLoading: loadingRentals } = useQuery({
 queryKey: ['toga-rentals', selectedDepartment?.id],
 queryFn: () => togaRentalService.getRentals(selectedDepartment.id),
 enabled: !!selectedDepartment && mainView === 'students',
 staleTime: 0,
 refetchInterval: 1000,
 });

 // Fetch payments for selected department - REAL-TIME!
 const { data: paymentsData = [], isLoading: loadingPayments } = useQuery({
 queryKey: ['toga-payments', selectedDepartment?.id],
 queryFn: () => togaRentalService.getPayments(selectedDepartment.id),
 enabled: !!selectedDepartment && mainView === 'students',
 staleTime: 0,
 refetchInterval: 1000,
 });

 // Fetch statistics - REAL-TIME!
 const { data: statsData } = useQuery({
 queryKey: ['toga-stats'],
 queryFn: togaRentalService.getStats,
 // Uses global config: refetchInterval: 1000 (every second for real-time updates!)
 });

 // Mutations for Departments
 const createDepartmentMutation = useMutation({
 mutationFn: togaRentalService.createDepartment,
 onSuccess: () => {
 queryClient.invalidateQueries(['toga-departments']);
 queryClient.invalidateQueries(['toga-stats']);
 toast.success('Department added successfully!');
 setShowAddDeptModal(false);
 },
 onError: (error) => {
 toast.error(error.response?.data?.message || 'Failed to add department');
 },
 });

 const updateDepartmentMutation = useMutation({
 mutationFn: ({ id, data }) => togaRentalService.updateDepartment(id, data),
 onSuccess: () => {
 queryClient.invalidateQueries(['toga-departments']);
 queryClient.invalidateQueries(['toga-stats']);
 toast.success('Department updated successfully!');
 setShowEditDeptModal(false);
 setSelectedItem(null);
 },
 onError: (error) => {
 toast.error(error.response?.data?.message || 'Failed to update department');
 },
 });

 const deleteDepartmentMutation = useMutation({
 mutationFn: togaRentalService.deleteDepartment,
 onSuccess: () => {
 queryClient.invalidateQueries(['toga-departments']);
 queryClient.invalidateQueries(['toga-stats']);
 toast.success('Department deleted successfully!');
 setShowDeleteDeptModal(false);
 setSelectedItem(null);
 },
 onError: (error) => {
 toast.error(error.response?.data?.message || 'Failed to delete department');
 },
 });

 // Mutations for Rentals
 const createRentalMutation = useMutation({
 mutationFn: togaRentalService.createRental,
 onMutate: async (newRental) => {
 // INSTANT: Cancel outgoing queries
 await queryClient.cancelQueries(['toga-rentals', selectedDepartment?.id]);
 
 // INSTANT: Add to UI immediately
 const previousRentals = queryClient.getQueryData(['toga-rentals', selectedDepartment?.id]);
 const tempId = 'temp-' + Date.now();
 
 queryClient.setQueryData(['toga-rentals', selectedDepartment?.id], (old = []) => {
 return [{ ...newRental, id: tempId, created_at: new Date().toISOString() }, ...old];
 });
 
 // INSTANT: Show success immediately
 toast.success('Student rental added!');
 setShowAddStudentModal(false);
 
 return { previousRentals };
 },
 onSuccess: (response) => {
 // Update with real data from server
 queryClient.setQueryData(['toga-rentals', selectedDepartment?.id], (old = []) => {
 return old.map(item => item.id?.toString().startsWith('temp-') ? response.data : item);
 });
 queryClient.invalidateQueries(['toga-departments']);
 queryClient.invalidateQueries(['toga-stats']);
 },
 onError: (error, variables, context) => {
 // Rollback on error
 queryClient.setQueryData(['toga-rentals', selectedDepartment?.id], context.previousRentals);
 toast.error(error.response?.data?.message || 'Failed to add student rental - rolled back');
 },
 });

 const updateRentalMutation = useMutation({
 mutationFn: ({ id, data }) => togaRentalService.updateRental(id, data),
 onMutate: async ({ id, data }) => {
 // INSTANT: Cancel outgoing queries
 await queryClient.cancelQueries(['toga-rentals', selectedDepartment?.id]);
 
 const previousRentals = queryClient.getQueryData(['toga-rentals', selectedDepartment?.id]);
 
 // INSTANT: Update UI immediately
 queryClient.setQueryData(['toga-rentals', selectedDepartment?.id], (old = []) => {
 return old.map(item => item.id === id ? { ...item, ...data } : item);
 });
 
 // INSTANT: Show success immediately
 toast.success('Student rental updated!');
 setShowEditStudentModal(false);
 setSelectedItem(null);
 
 return { previousRentals };
 },
 onSuccess: () => {
 queryClient.invalidateQueries(['toga-departments']);
 queryClient.invalidateQueries(['toga-stats']);
 queryClient.invalidateQueries(['toga-rentals', selectedDepartment?.id]);
 },
 onError: (error, variables, context) => {
 // Rollback on error
 queryClient.setQueryData(['toga-rentals', selectedDepartment?.id], context.previousRentals);
 toast.error(error.response?.data?.message || 'Failed to update - rolled back');
 },
 });

 const deleteRentalMutation = useMutation({
 mutationFn: togaRentalService.deleteRental,
 onMutate: async (id) => {
 // INSTANT: Cancel outgoing queries
 await queryClient.cancelQueries(['toga-rentals', selectedDepartment?.id]);
 
 const previousRentals = queryClient.getQueryData(['toga-rentals', selectedDepartment?.id]);
 
 // INSTANT: Remove from UI immediately
 queryClient.setQueryData(['toga-rentals', selectedDepartment?.id], (old = []) => {
 return old.filter(item => item.id !== id);
 });
 
 // INSTANT: Show success immediately
 toast.success('Student rental deleted!');
 setShowDeleteStudentModal(false);
 setSelectedItem(null);
 
 return { previousRentals };
 },
 onSuccess: () => {
 queryClient.invalidateQueries(['toga-departments']);
 queryClient.invalidateQueries(['toga-stats']);
 },
 onError: (error, variables, context) => {
 // Rollback on error
 queryClient.setQueryData(['toga-rentals', selectedDepartment?.id], context.previousRentals);
 toast.error(error.response?.data?.message || 'Failed to delete - rolled back');
 },
 });

 // Mutations for Payments
 const createPaymentMutation = useMutation({
 mutationFn: togaRentalService.createPayment,
 onSuccess: () => {
 queryClient.invalidateQueries(['toga-payments', selectedDepartment?.id]);
 queryClient.invalidateQueries(['toga-stats']);
 toast.success('Payment added successfully!');
 setShowAddPaymentModal(false);
 },
 onError: (error) => {
 toast.error(error.response?.data?.message || 'Failed to add payment');
 },
 });

 const updatePaymentMutation = useMutation({
 mutationFn: ({ id, data }) => togaRentalService.updatePayment(id, data),
 onSuccess: () => {
 queryClient.invalidateQueries(['toga-payments', selectedDepartment?.id]);
 queryClient.invalidateQueries(['toga-stats']);
 toast.success('Payment updated successfully!');
 setSelectedItem(null);
 },
 onError: (error) => {
 toast.error(error.response?.data?.message || 'Failed to update payment');
 },
 });

 const deletePaymentMutation = useMutation({
 mutationFn: togaRentalService.deletePayment,
 onSuccess: () => {
 queryClient.invalidateQueries(['toga-payments', selectedDepartment?.id]);
 queryClient.invalidateQueries(['toga-stats']);
 toast.success('Payment deleted successfully!');
 setSelectedItem(null);
 },
 onError: (error) => {
 toast.error(error.response?.data?.message || 'Failed to delete payment');
 },
 });

 // Get current students and payments from API
 // Helper function to check rental status based on dates
 const getRentalStatus = (rental) => {
 if (!rental || !rental.return_date) {
 return { status: rental?.status || 'Unknown', note: null };
 }

 // If already returned, show as returned
 if (rental.status === 'Returned') {
 return { status: 'Returned', note: 'Returned' };
 }

 const today = new Date();
 today.setHours(0, 0, 0, 0);
 const returnDate = new Date(rental.return_date);
 returnDate.setHours(0, 0, 0, 0);

 if (returnDate < today) {
 return { status: 'Overdue', note: 'Overdue - Return date has passed' };
 } else if (returnDate.getTime() === today.getTime()) {
 return { status: rental.status || 'Active', note: 'Due today - Should be returned' };
 } else {
 return { status: rental.status || 'Active', note: null };
 }
 };

 // Show all rentals (no deduplication)
 const allRentals = (rentalsData || []).filter(rental => rental && rental.student_number);

 const currentStudents = allRentals.sort((a, b) =>
 new Date(b.created_at) - new Date(a.created_at)
 );
 
 const currentPayments = paymentsData || [];

 // Calculate statistics
 const stats = selectedDepartment ? {
 totalRentals: currentStudents.length,
 activeRentals: currentStudents.filter(s => getRentalStatus(s).status === 'Active').length,
 returned: currentStudents.filter(s => getRentalStatus(s).status === 'Returned').length,
 overdue: currentStudents.filter(s => getRentalStatus(s).status === 'Overdue').length,
 revenue: currentStudents.reduce((sum, s) => sum + (parseFloat(s.rental_fee) || 0), 0),
 totalPayments: currentPayments.length,
 paidPayments: currentPayments.filter(p => p.status === 'Paid').length,
 pendingPayments: currentPayments.filter(p => p.status === 'Pending').length,
 } : statsData ? {
 totalDepartments: statsData.total_departments,
 totalStudents: statsData.total_students,
 activeRentals: statsData.active_rentals,
 totalRevenue: parseFloat(statsData.total_revenue || 0)
 } : {
 totalDepartments: departments.length,
 totalStudents: 0,
 activeRentals: 0,
 totalRevenue: 0
 };

 // Filter data based on view
 const filteredStudents = currentStudents.filter(student => {
 const matchesSearch =
 (student.student_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
 (student.student_number?.toLowerCase() || '').includes(searchTerm.toLowerCase());
 const matchesFilter = filterStatus === 'All' || getRentalStatus(student).status === filterStatus;
 return matchesSearch && matchesFilter;
 });

 const filteredPayments = currentPayments.filter(payment => {
 const matchesSearch = 
 (payment.student_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
 (payment.student_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
 (payment.payment_number?.toLowerCase() || '').includes(searchTerm.toLowerCase());
 const matchesFilter = filterStatus === 'All' || payment.status === filterStatus;
 return matchesSearch && matchesFilter;
 });

 const filteredDepartments = departments.filter(dept => {
 return dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
 dept.code.toLowerCase().includes(searchTerm.toLowerCase());
 });

 // Pagination
 const indexOfLastItem = currentPage * itemsPerPage;
 const indexOfFirstItem = indexOfLastItem - itemsPerPage;
 
 const currentItems = mainView === 'departments' 
 ? filteredDepartments.slice(indexOfFirstItem, indexOfLastItem)
 : activeStudentTab === 'students'
 ? filteredStudents.slice(indexOfFirstItem, indexOfLastItem)
 : filteredPayments.slice(indexOfFirstItem, indexOfLastItem);

 const totalItems = mainView === 'departments'
 ? filteredDepartments.length
 : activeStudentTab === 'students'
 ? filteredStudents.length
 : filteredPayments.length;

 // Reset pagination when changing views
 useEffect(() => {
 setCurrentPage(1);
 }, [mainView, activeStudentTab, searchTerm, filterStatus, selectedDepartment]);

 const getStatusBadge = (status) => {
 switch (status) {
 case 'Active':
 return 'bg-emerald-100 text-emerald-700 border-emerald-200';
 case 'Returned':
 case 'Paid':
 return 'bg-emerald-100 text-emerald-700 border-emerald-200';
 case 'Overdue':
 case 'Pending':
 return 'bg-amber-100 text-amber-700 border-amber-200';
 default:
 return 'bg-gray-100 text-gray-700 border-gray-200';
 }
 };

 const getStatusIcon = (status) => {
 switch (status) {
 case 'Active':
 return Clock;
 case 'Returned':
 case 'Paid':
 return CheckCircle;
 case 'Overdue':
 return AlertTriangle;
 case 'Pending':
 return Clock;
 default:
 return XCircle;
 }
 };

 const getDepartmentColor = (color) => {
 const colors = {
 blue: { gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-600' },
 purple: { gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-600' },
 cyan: { gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-600' },
 teal: { gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-600' },
 };
 return colors[color] || colors.blue;
 };

 return (
 <div className="p-5 lg:p-6 min-h-full">
 {/* Header */}
 <div className="mb-7">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-4">
 <div>
 <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">System</label>
 <select
 value={selectedSystem}
 onChange={(e) => {
 const value = e.target.value;
 setSelectedSystem(value);
 if (value === 'POS') {
 navigate('/pos');
 } else if (value === 'Rental') {
 navigate('/rentals');
 }
 }}
 className="px-3.5 py-2 border border-gray-200 rounded-xl text-[13px] focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white font-medium transition-all"
 >
 <option value="POS">POS (Products)</option>
 <option value="Rental">Rental</option>
 <option value="Toga Rental">Toga Rental</option>
 </select>
 </div>
 </div>
 </div>
 <div className="flex items-center gap-3">
 {selectedDepartment && mainView !== 'departments' && (
 <button
 onClick={() => {
 setSelectedDepartment(null);
 setMainView('departments');
 }}
 className="p-2 hover:bg-gray-100 rounded-xl transition-all"
 title="Back to Departments"
 >
 <ChevronLeft className="w-5 h-5 text-gray-600" />
 </button>
 )}
 <div>
 <h1 className="text-xl font-bold text-gray-900 tracking-tight">
 {selectedDepartment ? `${selectedDepartment.name} - Toga Rentals` : 'Toga Rental Management'}
 </h1>
 <p className="text-[11px] text-gray-400 mt-1">
 {selectedDepartment 
 ? `Manage toga rentals for ${selectedDepartment.name} students`
 : 'Manage graduation toga rentals across all departments'
 }
 </p>
 </div>
 </div>
 </div>

 {/* Statistics Cards */}
 {mainView === 'departments' ? (
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
 {[
 { label: 'Total Departments', value: stats.totalDepartments, icon: Building2, color: 'emerald', gradient: 'from-emerald-500/10 to-emerald-500/5' },
 { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'purple', gradient: 'from-purple-500/10 to-purple-500/5' },
 { label: 'Active Rentals', value: stats.activeRentals, icon: Package, color: 'sky', gradient: 'from-sky-500/10 to-sky-500/5' },
 { label: 'Total Revenue', value: `₱${stats.totalRevenue?.toLocaleString() || '0'}`, icon: DollarSign, color: 'amber', gradient: 'from-amber-500/10 to-amber-500/5' },
 ].map((stat, index) => (
 <div key={index} className="group relative bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
 <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${stat.gradient} rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500`}></div>
 <div className="relative">
 <div className="flex items-center gap-3 mb-3">
 <div className={`p-2.5 rounded-xl bg-${stat.color}-50 ring-4 ring-white`}>
 <stat.icon className={`w-4 h-4 text-${stat.color}-600`} />
 </div>
 </div>
 <p className="text-[22px] font-bold text-gray-900">{stat.value}</p>
 <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-1">{stat.label}</p>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-7">
 {[
 { label: 'Total Rentals', value: stats.totalRentals, icon: Package, color: 'emerald', gradient: 'from-emerald-500/10 to-emerald-500/5' },
 { label: 'Active', value: stats.activeRentals, icon: Clock, color: 'sky', gradient: 'from-sky-500/10 to-sky-500/5' },
 { label: 'Returned', value: stats.returned, icon: CheckCircle, color: 'emerald', gradient: 'from-emerald-500/10 to-emerald-500/5' },
 { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, color: 'rose', gradient: 'from-rose-500/10 to-rose-500/5' },
 { label: 'Revenue', value: `₱${stats.revenue?.toLocaleString() || '0'}`, icon: DollarSign, color: 'amber', gradient: 'from-amber-500/10 to-amber-500/5' },
 ].map((stat, index) => (
 <div key={index} className="group relative bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
 <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${stat.gradient} rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500`}></div>
 <div className="relative">
 <div className="flex items-center gap-3 mb-3">
 <div className={`p-2.5 rounded-xl bg-${stat.color}-50 ring-4 ring-white`}>
 <stat.icon className={`w-4 h-4 text-${stat.color}-600`} />
 </div>
 </div>
 <p className="text-[22px] font-bold text-gray-900">{stat.value}</p>
 <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-1">{stat.label}</p>
 </div>
 </div>
 ))}
 </div>
 )}

 {/* Tabs - Only show when viewing a department */}
 {selectedDepartment && (
 <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] mb-6 p-1.5 border border-gray-100 overflow-x-auto">
 <div className="flex gap-1.5 min-w-max">
 <button
 onClick={() => setActiveStudentTab('students')}
 className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-semibold transition-all duration-200 ${
 activeStudentTab === 'students'
 ? 'bg-emerald-600 text-white shadow-sm'
 : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
 }`}
 >
 <Users className="w-3.5 h-3.5" />
 <span>Students</span>
 </button>
 <button
 onClick={() => setActiveStudentTab('payments')}
 className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-semibold transition-all duration-200 ${
 activeStudentTab === 'payments'
 ? 'bg-emerald-600 text-white shadow-sm'
 : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
 }`}
 >
 <DollarSign className="w-3.5 h-3.5" />
 <span>Payments</span>
 </button>
 </div>
 </div>
 )}

 {/* Controls */}
 <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 mb-6 border border-gray-100">
 <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
 <div className="flex-1 w-full md:w-auto">
 <div className="relative">
 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
 <input
 type="text"
 placeholder={
 mainView === 'departments' 
 ? "Search departments..." 
 : activeStudentTab === 'students'
 ? "Search by student name or number..."
 : "Search payments..."
 }
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-[13px] focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 />
 </div>
 </div>

 <div className="flex gap-3 w-full md:w-auto">
 {mainView !== 'departments' && (
 <select
 value={filterStatus}
 onChange={(e) => setFilterStatus(e.target.value)}
 className="px-3.5 py-2.5 border border-gray-200 rounded-xl text-[13px] focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 >
 <option value="All">All Status</option>
 {activeStudentTab === 'students' ? (
 <>
 <option value="Active">Active</option>
 <option value="Returned">Returned</option>
 <option value="Overdue">Overdue</option>
 </>
 ) : (
 <>
 <option value="Paid">Paid</option>
 <option value="Pending">Pending</option>
 </>
 )}
 </select>
 )}

 {mainView === 'departments' ? (
 <button
 onClick={() => setShowAddDeptModal(true)}
 className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-semibold text-[13px]"
 >
 <Plus className="w-5 h-5" />
 Add Department
 </button>
 ) : activeStudentTab === 'students' ? (
 <button
 onClick={() => setShowAddStudentModal(true)}
 className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-semibold text-[13px]"
 >
 <Plus className="w-5 h-5" />
 Add Student
 </button>
 ) : (
 <button
 onClick={() => setShowAddPaymentModal(true)}
 className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-500/30 font-semibold text-[13px]"
 >
 <Plus className="w-5 h-5" />
 Add Payment
 </button>
 )}
 </div>
 </div>
 </div>

 {/* Table */}
 <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
 <div className="overflow-x-auto">
 <table className="min-w-full divide-y divide-gray-200">
 <thead className="bg-gray-50">
 <tr>
 {mainView === 'departments' ? (
 <>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Department</th>
 <th className="px-5 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Code</th>
 <th className="px-5 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Students</th>
 <th className="px-5 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Rentals</th>
 <th className="px-5 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Revenue</th>
 <th className="px-5 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
 </>
 ) : activeStudentTab === 'students' ? (
 <>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Student</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Student #</th>
 <th className="px-5 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Size</th>
 <th className="px-5 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rental Date</th>
 <th className="px-5 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Return Date</th>
 <th className="px-5 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fee</th>
 <th className="px-5 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Deposit</th>
 <th className="px-5 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
 </>
 ) : (
 <>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment #</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Student</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Student #</th>
 <th className="px-5 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Amount</th>
 <th className="px-5 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment Date</th>
 <th className="px-5 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Method</th>
 <th className="px-5 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Type</th>
 <th className="px-5 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
 <th className="px-5 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
 </>
 )}
 </tr>
 </thead>
 <tbody className="bg-white divide-y divide-gray-200">
 {mainView === 'departments' ? (
 currentItems.map((dept) => {
 const deptColors = getDepartmentColor(dept.color);
 return (
 <tr 
 key={dept.id} 
 className="hover:bg-gray-50 transition-colors cursor-pointer"
 onClick={() => {
 setSelectedDepartment(dept);
 setMainView('students');
 setActiveStudentTab('students');
 }}
 >
 <td className="px-5 py-3.5 whitespace-nowrap">
 <div className="flex items-center gap-3">
 <div className={`p-3 ${deptColors.bg} ${deptColors.text} rounded-xl shadow-md`}>
 <Building2 className="w-5 h-5 text-white" />
 </div>
 <div>
 <div className="text-[11px] font-semibold text-gray-900">{dept.name}</div>
 <div className="text-xs text-gray-500">{dept.code}</div>
 </div>
 </div>
 </td>
 <td className="px-5 py-3.5 whitespace-nowrap text-center">
 <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${deptColors.bg} ${deptColors.text}`}>
 {dept.code}
 </span>
 </td>
 <td className="px-5 py-3.5 whitespace-nowrap text-center text-[11px] font-semibold text-gray-900">
 {dept.totalStudents}
 </td>
 <td className="px-5 py-3.5 whitespace-nowrap text-center text-[11px] font-semibold text-gray-900">
 {dept.activeRentals}
 </td>
 <td className="px-5 py-3.5 whitespace-nowrap text-center text-[11px] font-bold text-emerald-600">
 ₱{dept.revenue?.toLocaleString() || '0'}
 </td>
 <td className="px-5 py-3.5 whitespace-nowrap text-center">
 <div className="flex items-center justify-center gap-2">
 {user?.role?.toLowerCase() === 'admin' && (
 <>
 <button
 onClick={(e) => {
 e.stopPropagation();
 setSelectedItem(dept);
 setShowEditDeptModal(true);
 }}
 className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
 title="Edit Department"
 >
 <Edit className="w-4 h-4" />
 </button>
 <button
 onClick={(e) => {
 e.stopPropagation();
 setSelectedItem(dept);
 setShowDeleteDeptModal(true);
 }}
 className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
 title="Delete Department"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </>
 )}
 </div>
 </td>
 </tr>
 );
 })
 ) : activeStudentTab === 'students' ? (
 currentItems.map((rental) => {
 const rentalStatus = getRentalStatus(rental);
 const StatusIcon = getStatusIcon(rentalStatus.status);
 return (
 <tr key={rental.id} className="hover:bg-gray-50 transition-colors">
 <td className="px-5 py-3.5 whitespace-nowrap">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
 {String(rental.student_name)?.charAt(0) || 'S'}
 </div>
 <div>
 <div className="flex items-center gap-2">
 <div className="text-[11px] font-semibold text-gray-900">{String(rental.student_name || 'N/A')}</div>
 {rental.payment_status === 'Paid' && (
 <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
 <CheckCircle className="w-3 h-3" />
 PAID
 </span>
 )}
 </div>
 <div className="text-xs text-gray-500">{String(rental.contact_number || 'N/A')}</div>
 </div>
 </div>
 </td>
 <td className="px-5 py-3.5 whitespace-nowrap text-[11px] font-semibold text-gray-900">
 {String(rental.student_number || 'N/A')}
 </td>
 <td className="px-5 py-3.5 whitespace-nowrap text-center">
 <span className="inline-flex px-3 py-1 text-[10px] font-bold rounded-full bg-gray-100 text-gray-700">
 {String(rental.size || 'N/A')}
 </span>
 </td>
 <td className="px-5 py-3.5 whitespace-nowrap text-center text-[11px] text-gray-500">
 {new Date(rental.rental_date).toLocaleDateString()}
 </td>
 <td className="px-5 py-3.5 whitespace-nowrap text-center text-[11px] text-gray-500">
 {new Date(rental.return_date).toLocaleDateString()}
 </td>
 <td className="px-5 py-3.5 whitespace-nowrap text-center text-[11px] font-bold text-gray-900">
 ₱{Number(rental.rental_fee || 0).toLocaleString()}
 </td>
 <td className="px-5 py-3.5 whitespace-nowrap text-center text-xs font-medium text-gray-500">
 ₱{Number(rental.deposit || 0).toLocaleString()}
 </td>
 <td className="px-5 py-3.5 whitespace-nowrap text-center">
 <div className="flex items-center justify-center gap-2">
 <button
 onClick={() => {
 setSelectedItem(rental);
 setShowMarkPaidModal(true);
 }}
 className={`p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all ${rental.payment_status === 'Paid' ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
 title="Mark as Paid"
 disabled={rental.payment_status === 'Paid'}
 >
 <DollarSign className="w-4 h-4" />
 </button>
 <button
 onClick={() => {
 setSelectedItem(rental);
 setShowMarkReturnedModal(true);
 }}
 className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
 title="Mark as Returned"
 disabled={rental.status === 'Returned'}
 style={{ opacity: rental.status === 'Returned' ? 0.5 : 1, pointerEvents: rental.status === 'Returned' ? 'none' : 'auto' }}
 >
 <CheckCircle className="w-4 h-4" />
 </button>
 {user?.role?.toLowerCase() === 'admin' && (
 <>
 <button
 onClick={() => {
 setSelectedItem(rental);
 setShowEditStudentModal(true);
 }}
 className={`p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all ${rental.payment_status === 'Paid' ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
 title="Edit"
 disabled={rental.payment_status === 'Paid'}
 >
 <Edit className="w-4 h-4" />
 </button>
 <button
 onClick={() => {
 setSelectedItem(rental);
 setShowDeleteStudentModal(true);
 }}
 className={`p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all ${rental.payment_status === 'Paid' ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
 title="Delete"
 disabled={rental.payment_status === 'Paid'}
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </>
 )}
 </div>
 </td>
 </tr>
 );
 })
 ) : (
 currentItems.map((payment) => {
 const StatusIcon = getStatusIcon(payment.status);
 return (
 <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
 <td className="px-5 py-3.5 whitespace-nowrap text-[11px] font-semibold text-gray-900">
 {payment.payment_number}
 </td>
 <td className="px-5 py-3.5 whitespace-nowrap">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
 {payment.student_name?.charAt(0) || 'P'}
 </div>
 <div className="text-[11px] font-semibold text-gray-900">{payment.student_name || 'N/A'}</div>
 </div>
 </td>
 <td className="px-5 py-3.5 whitespace-nowrap text-[11px] font-semibold text-gray-900">
 {payment.student_number || 'N/A'}
 </td>
 <td className="px-5 py-3.5 whitespace-nowrap text-center text-[11px] font-bold text-emerald-600">
 ₱{payment.amount?.toLocaleString() || '0'}
 </td>
 <td className="px-5 py-3.5 whitespace-nowrap text-center text-[11px] text-gray-500">
 {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '-'}
 </td>
 <td className="px-5 py-3.5 whitespace-nowrap text-center">
 <span className="inline-flex px-3 py-1 text-[10px] font-bold rounded-full bg-gray-100 text-gray-700">
 {payment.payment_method || '-'}
 </span>
 </td>
 <td className="px-5 py-3.5 whitespace-nowrap text-center text-xs text-gray-600">
 {payment.type}
 </td>
 <td className="px-5 py-3.5 whitespace-nowrap text-center">
 <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border ${getStatusBadge(payment.status)}`}>
 <StatusIcon className="w-3.5 h-3.5" />
 {payment.status}
 </span>
 </td>
 <td className="px-5 py-3.5 whitespace-nowrap text-center">
 <div className="flex items-center justify-center gap-2">
 {user?.role?.toLowerCase() === 'admin' && (
 <>
 {payment.status === 'Paid' && (
 <button
 onClick={() => {
 // Mark as unpaid by deleting payment
 if (window.confirm('Mark this payment as unpaid? This will remove the payment record.')) {
 deletePaymentMutation.mutate(payment.id);
 }
 }}
 className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
 title="Mark as Unpaid"
 >
 <XCircle className="w-4 h-4" />
 </button>
 )}
 <button
 onClick={() => {
 if (window.confirm('Delete this payment record?')) {
 deletePaymentMutation.mutate(payment.id);
 }
 }}
 className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
 title="Delete Payment"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </>
 )}
 </div>
 </td>
 </tr>
 );
 })
 )}
 </tbody>
 </table>
 </div>

 {totalItems === 0 && (
 <div className="text-center py-12">
 {mainView === 'departments' ? (
 <>
 <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
 <p className="text-gray-500 font-semibold text-[13px]">No departments found</p>
 <p className="text-gray-400 text-[11px] mt-1">Add a department to get started</p>
 </>
 ) : activeStudentTab === 'students' ? (
 <>
 <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
 <p className="text-gray-500 font-semibold text-[13px]">No students found</p>
 <p className="text-gray-400 text-[11px] mt-1">Add a student rental to get started</p>
 </>
 ) : (
 <>
 <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
 <p className="text-gray-500 font-semibold text-[13px]">No payments found</p>
 <p className="text-gray-400 text-[11px] mt-1">Add a payment record to get started</p>
 </>
 )}
 </div>
 )}
 </div>

 {/* Pagination */}
 {totalItems > 0 && (
 <Pagination
 currentPage={currentPage}
 totalPages={Math.ceil(totalItems / itemsPerPage)}
 totalItems={totalItems}
 itemsPerPage={itemsPerPage}
 onPageChange={setCurrentPage}
 onItemsPerPageChange={(value) => {
 setItemsPerPage(value);
 setCurrentPage(1);
 }}
 />
 )}

 {/* Add Department Modal */}
 <Modal
 isOpen={showAddDeptModal}
 onClose={() => setShowAddDeptModal(false)}
 title="Add New Department"
 >
 <form onSubmit={(e) => {
 e.preventDefault();
 const formData = new FormData(e.target);
 createDepartmentMutation.mutate({
 name: formData.get('name'),
 code: formData.get('code'),
 color: formData.get('color'),
 icon: 'Building2',
 });
 }}>
 <div className="space-y-4">
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Department Name
 </label>
 <input
 type="text"
 name="name"
 required
 placeholder="e.g., Information Technology"
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Department Code
 </label>
 <input
 type="text"
 name="code"
 required
 placeholder="e.g., IT"
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Theme Color
 </label>
 <select
 name="color"
 required
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 >
 <option value="blue">Blue</option>
 <option value="purple">Purple</option>
 <option value="cyan">Cyan</option>
 <option value="teal">Teal</option>
 </select>
 </div>
 </div>

 <div className="flex gap-3 mt-6">
 <button
 type="button"
 onClick={() => setShowAddDeptModal(false)}
 className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold text-[13px]"
 >
 Cancel
 </button>
 <button
 type="submit"
 className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-semibold text-[13px] "
 >
 Add Department
 </button>
 </div>
 </form>
 </Modal>

 {/* Edit Department Modal */}
 <Modal
 isOpen={showEditDeptModal}
 onClose={() => {
 setShowEditDeptModal(false);
 setSelectedItem(null);
 }}
 title="Edit Department"
 >
 {selectedItem && (
 <form onSubmit={(e) => {
 e.preventDefault();
 const formData = new FormData(e.target);
 updateDepartmentMutation.mutate({
 id: selectedItem.id,
 data: {
 name: formData.get('name'),
 code: formData.get('code'),
 color: formData.get('color'),
 }
 });
 }}>
 <div className="space-y-4">
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Department Name
 </label>
 <input
 type="text"
 name="name"
 required
 defaultValue={selectedItem.name}
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Department Code
 </label>
 <input
 type="text"
 name="code"
 required
 defaultValue={selectedItem.code}
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Theme Color
 </label>
 <select
 name="color"
 required
 defaultValue={selectedItem.color}
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 >
 <option value="blue">Blue</option>
 <option value="purple">Purple</option>
 <option value="cyan">Cyan</option>
 <option value="teal">Teal</option>
 </select>
 </div>
 </div>

 <div className="flex gap-3 mt-6">
 <button
 type="button"
 onClick={() => {
 setShowEditDeptModal(false);
 setSelectedItem(null);
 }}
 className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold text-[13px]"
 >
 Cancel
 </button>
 <button
 type="submit"
 className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all font-semibold text-[13px] shadow-sm shadow-amber-500/30"
 >
 Update Department
 </button>
 </div>
 </form>
 )}
 </Modal>

 {/* Delete Department Modal */}
 <ConfirmModal
 isOpen={showDeleteDeptModal}
 onClose={() => {
 setShowDeleteDeptModal(false);
 setSelectedItem(null);
 }}
 onConfirm={() => {
 deleteDepartmentMutation.mutate(selectedItem.id);
 }}
 title="Delete Department"
 message={`Are you sure you want to delete ${selectedItem?.name}? This action cannot be undone.`}
 confirmText="Delete"
 type="danger"
 />

 {/* Add Student Modal */}
 <Modal
 isOpen={showAddStudentModal}
 onClose={() => setShowAddStudentModal(false)}
 title="Add Student Rental"
 >
 <form onSubmit={(e) => {
 e.preventDefault();
 const formData = new FormData(e.target);
 createRentalMutation.mutate({
 department_id: selectedDepartment.id,
 student_name: formData.get('student_name'),
 student_number: formData.get('student_number'),
 contact_number: formData.get('contact_number'),
 size: formData.get('size'),
 rental_date: formData.get('rental_date'),
 return_date: formData.get('return_date'),
 rental_fee: parseFloat(formData.get('rental_fee')),
 deposit: parseFloat(formData.get('deposit')),
 status: 'Active',
 payment_status: 'Pending',
 });
 }}>
 <div className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Student Name
 </label>
 <input
 type="text"
 name="student_name"
 required
 placeholder="Juan Dela Cruz"
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Student Number
 </label>
 <input
 type="text"
 name="student_number"
 required
 placeholder="2021-12345"
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 />
 </div>
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Contact Number
 </label>
 <input
 type="tel"
 name="contact_number"
 required
 placeholder="0912-345-6789"
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Size
 </label>
 <select
 name="size"
 required
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 >
 <option value="">Select Size</option>
 <option value="XS">Extra Small (XS)</option>
 <option value="S">Small (S)</option>
 <option value="M">Medium (M)</option>
 <option value="L">Large (L)</option>
 <option value="XL">Extra Large (XL)</option>
 <option value="XXL">2X Large (XXL)</option>
 </select>
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Status
 </label>
 <select
 name="status"
 required
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 >
 <option value="Active">Active</option>
 <option value="Returned">Returned</option>
 <option value="Overdue">Overdue</option>
 </select>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Rental Date
 </label>
 <input
 type="date"
 name="rental_date"
 required
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Return Date
 </label>
 <input
 type="date"
 name="return_date"
 required
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Rental Fee
 </label>
 <input
 type="number"
 name="rental_fee"
 required
 placeholder="500"
 min="0"
 step="0.01"
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Deposit
 </label>
 <input
 type="number"
 name="deposit"
 required
 placeholder="1000"
 min="0"
 step="0.01"
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 />
 </div>
 </div>
 </div>

 <div className="flex gap-3 mt-6">
 <button
 type="button"
 onClick={() => setShowAddStudentModal(false)}
 className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold text-[13px]"
 >
 Cancel
 </button>
 <button
 type="submit"
 className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-semibold text-[13px] "
 >
 Add Student Rental
 </button>
 </div>
 </form>
 </Modal>

 {/* Edit Student Modal */}
 <Modal
 isOpen={showEditStudentModal}
 onClose={() => {
 setShowEditStudentModal(false);
 setSelectedItem(null);
 }}
 title="Edit Student Rental"
 >
 {selectedItem && (
 <form onSubmit={(e) => {
 e.preventDefault();
 const formData = new FormData(e.target);
 updateRentalMutation.mutate({
 id: selectedItem.id,
 data: {
 student_name: formData.get('student_name'),
 student_number: formData.get('student_number'),
 contact_number: formData.get('contact_number'),
 size: formData.get('size'),
 rental_date: formData.get('rental_date'),
 return_date: formData.get('return_date'),
 rental_fee: parseFloat(formData.get('rental_fee')),
 deposit: parseFloat(formData.get('deposit')),
 status: formData.get('status'),
 payment_status: selectedItem.payment_status,
 }
 });
 }}>
 <div className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Student Name
 </label>
 <input
 type="text"
 name="student_name"
 required
 defaultValue={selectedItem.student_name}
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Student Number
 </label>
 <input
 type="text"
 name="student_number"
 required
 defaultValue={selectedItem.student_number}
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 />
 </div>
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Contact Number
 </label>
 <input
 type="tel"
 name="contact_number"
 required
 defaultValue={selectedItem.contact_number}
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Size
 </label>
 <select
 name="size"
 required
 defaultValue={selectedItem.size}
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 >
 <option value="XS">Extra Small (XS)</option>
 <option value="S">Small (S)</option>
 <option value="M">Medium (M)</option>
 <option value="L">Large (L)</option>
 <option value="XL">Extra Large (XL)</option>
 <option value="XXL">2X Large (XXL)</option>
 </select>
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Status
 </label>
 <select
 name="status"
 required
 defaultValue={selectedItem.status}
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 >
 <option value="Active">Active</option>
 <option value="Returned">Returned</option>
 <option value="Overdue">Overdue</option>
 </select>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Rental Date
 </label>
 <input
 type="date"
 name="rental_date"
 required
 defaultValue={selectedItem.rental_date}
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Return Date
 </label>
 <input
 type="date"
 name="return_date"
 required
 defaultValue={selectedItem.return_date}
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Rental Fee
 </label>
 <input
 type="number"
 name="rental_fee"
 required
 defaultValue={selectedItem.rental_fee}
 min="0"
 step="0.01"
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Deposit
 </label>
 <input
 type="number"
 name="deposit"
 required
 defaultValue={selectedItem.deposit}
 min="0"
 step="0.01"
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 />
 </div>
 </div>
 </div>

 <div className="flex gap-3 mt-6">
 <button
 type="button"
 onClick={() => {
 setShowEditStudentModal(false);
 setSelectedItem(null);
 }}
 className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold text-[13px]"
 >
 Cancel
 </button>
 <button
 type="submit"
 className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all font-semibold text-[13px] shadow-sm shadow-amber-500/30"
 >
 Update Rental
 </button>
 </div>
 </form>
 )}
 </Modal>

 {/* View Student Modal */}
 <Modal
 isOpen={showViewStudentModal}
 onClose={() => {
 setShowViewStudentModal(false);
 setSelectedItem(null);
 }}
 title="Student Rental Details"
 >
 {selectedItem && (
 <div className="space-y-6">
 {/* Student Info */}
 <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100">
 <div className="flex items-center gap-4 mb-4">
 <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
 {selectedItem.student_name?.charAt(0) || 'S'}
 </div>
 <div>
 <h3 className="text-[11px] font-semibold text-gray-900">{selectedItem.student_name || 'N/A'}</h3>
 <p className="text-gray-600">{selectedItem.student_number || 'N/A'}</p>
 </div>
 </div>
 <div className="flex items-center gap-2 text-gray-600">
 <Phone className="w-4 h-4" />
 <span>{selectedItem.contact_number || 'N/A'}</span>
 </div>
 </div>

 {/* Rental Details */}
 <div className="grid grid-cols-2 gap-4">
 <div className="bg-gray-50 rounded-xl p-4">
 <p className="text-[11px] text-gray-500 mb-1">Size</p>
 <p className="text-[11px] font-semibold text-gray-900">{selectedItem.size}</p>
 </div>
 <div className="bg-gray-50 rounded-xl p-4">
 <p className="text-[11px] text-gray-500 mb-1">Status</p>
 <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border ${getStatusBadge(selectedItem.status)}`}>
 {selectedItem.status}
 </span>
 </div>
 <div className="bg-gray-50 rounded-xl p-4">
 <p className="text-[11px] text-gray-500 mb-1">Rental Date</p>
 <p className="text-[11px] font-semibold text-gray-900">
 {new Date(selectedItem.rental_date).toLocaleDateString()}
 </p>
 </div>
 <div className="bg-gray-50 rounded-xl p-4">
 <p className="text-[11px] text-gray-500 mb-1">Return Date</p>
 <p className="text-[11px] font-semibold text-gray-900">
 {new Date(selectedItem.return_date).toLocaleDateString()}
 </p>
 </div>
 <div className="bg-emerald-50 rounded-xl p-4">
 <p className="text-[11px] text-emerald-600 mb-1">Rental Fee</p>
 <p className="text-[11px] font-semibold text-emerald-900">₱{selectedItem.rental_fee?.toLocaleString() || '0'}</p>
 </div>
 <div className="bg-amber-50 rounded-xl p-4">
 <p className="text-[11px] text-amber-600 mb-1">Deposit</p>
 <p className="text-[11px] font-semibold text-amber-900">₱{selectedItem.deposit?.toLocaleString() || '0'}</p>
 </div>
 </div>

 <button
 onClick={() => {
 setShowViewStudentModal(false);
 setSelectedItem(null);
 }}
 className="w-full px-4 py-2.5 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all font-semibold text-[13px]"
 >
 Close
 </button>
 </div>
 )}
 </Modal>

 {/* Delete Student Modal */}
 <ConfirmModal
 isOpen={showDeleteStudentModal}
 onClose={() => {
 setShowDeleteStudentModal(false);
 setSelectedItem(null);
 }}
 onConfirm={() => {
 deleteRentalMutation.mutate(selectedItem.id);
 }}
 title="Delete Student Rental"
 message={`Are you sure you want to delete the rental record for ${selectedItem?.student_name}? This action cannot be undone.`}
 confirmText="Delete"
 type="danger"
 />

 {/* Add Payment Modal */}
 <Modal
 isOpen={showAddPaymentModal}
 onClose={() => setShowAddPaymentModal(false)}
 title="Add Payment"
 >
 <form onSubmit={(e) => {
 e.preventDefault();
 const formData = new FormData(e.target);
 createPaymentMutation.mutate({
 department_id: selectedDepartment.id,
 student_name: formData.get('student_name'),
 student_number: formData.get('student_number'),
 amount: parseFloat(formData.get('amount')),
 payment_date: formData.get('payment_date'),
 payment_method: formData.get('payment_method'),
 type: formData.get('type'),
 status: formData.get('status'),
 });
 }}>
 <div className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Student Name
 </label>
 <input
 type="text"
 name="student_name"
 required
 placeholder="Juan Dela Cruz"
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Student Number
 </label>
 <input
 type="text"
 name="student_number"
 required
 placeholder="2021-12345"
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 />
 </div>
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Amount
 </label>
 <input
 type="number"
 name="amount"
 required
 placeholder="1500"
 min="0"
 step="0.01"
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Payment Method
 </label>
 <select
 name="payment_method"
 required
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 >
 <option value="">Select Method</option>
 <option value="Cash">Cash</option>
 <option value="GCash">GCash</option>
 <option value="Bank Transfer">Bank Transfer</option>
 <option value="Card">Card</option>
 </select>
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Payment Type
 </label>
 <select
 name="type"
 required
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 >
 <option value="Rental Fee">Rental Fee</option>
 <option value="Deposit">Deposit</option>
 <option value="Rental Fee + Deposit">Rental Fee + Deposit</option>
 </select>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Payment Date
 </label>
 <input
 type="date"
 name="payment_date"
 required
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Status
 </label>
 <select
 name="status"
 required
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 >
 <option value="Paid">Paid</option>
 <option value="Pending">Pending</option>
 </select>
 </div>
 </div>
 </div>

 <div className="flex gap-3 mt-6">
 <button
 type="button"
 onClick={() => setShowAddPaymentModal(false)}
 className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold text-[13px]"
 >
 Cancel
 </button>
 <button
 type="submit"
 className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-semibold text-[13px] shadow-sm shadow-emerald-500/30"
 >
 Add Payment
 </button>
 </div>
 </form>
 </Modal>

 {/* Mark as Paid Modal */}
 <Modal
 isOpen={showMarkPaidModal}
 onClose={() => {
 setShowMarkPaidModal(false);
 setSelectedItem(null);
 }}
 title="Mark as Paid"
 >
 <div className="space-y-4">
 <div className="bg-gray-50 p-4 rounded-xl">
 <h4 className="font-semibold text-gray-900 mb-2">Student Details</h4>
 <div className="space-y-1 text-[11px]">
 <p><span className="text-gray-600">Name:</span> <span className="font-semibold text-[13px]">{selectedItem?.student_name}</span></p>
 <p><span className="text-gray-600">Student #:</span> <span className="font-semibold text-[13px]">{selectedItem?.student_number}</span></p>
 <p><span className="text-gray-600">Rental Fee:</span> <span className="font-medium text-emerald-600">₱{selectedItem?.rental_fee?.toLocaleString()}</span></p>
 <p><span className="text-gray-600">Deposit:</span> <span className="font-medium text-amber-600">₱{selectedItem?.deposit?.toLocaleString()}</span></p>
 </div>
 </div>

 <form onSubmit={(e) => {
 e.preventDefault();
 const formData = new FormData(e.target);
 const amount = parseFloat(formData.get('amount'));
 const paymentType = formData.get('type');
 
 // Create payment record
 createPaymentMutation.mutate({
 department_id: selectedDepartment.id,
 rental_id: selectedItem.id,
 student_name: selectedItem.student_name,
 student_number: selectedItem.student_number,
 amount: amount,
 payment_date: formData.get('payment_date'),
 payment_method: formData.get('payment_method'),
 type: paymentType,
 status: 'Paid',
 });

 // Update rental payment_status
 updateRentalMutation.mutate({
 id: selectedItem.id,
 data: {
 student_name: selectedItem.student_name,
 student_number: selectedItem.student_number,
 contact_number: selectedItem.contact_number,
 size: selectedItem.size,
 rental_date: selectedItem.rental_date,
 return_date: selectedItem.return_date,
 rental_fee: selectedItem.rental_fee,
 deposit: selectedItem.deposit,
 status: selectedItem.status,
 payment_status: 'Paid',
 }
 });

 setShowMarkPaidModal(false);
 setSelectedItem(null);
 }}>
 <div className="space-y-4">
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Payment Type
 </label>
 <select
 name="type"
 required
 defaultValue="Rental Fee + Deposit"
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 onChange={(e) => {
 const amountInput = document.querySelector('input[name="amount"]');
 if (e.target.value === 'Rental Fee') {
 amountInput.value = selectedItem?.rental_fee || 0;
 } else if (e.target.value === 'Deposit') {
 amountInput.value = selectedItem?.deposit || 0;
 } else if (e.target.value === 'Rental Fee + Deposit') {
 amountInput.value = (parseFloat(selectedItem?.rental_fee) || 0) + (parseFloat(selectedItem?.deposit) || 0);
 }
 }}
 >
 <option value="Rental Fee">Rental Fee Only (₱{parseFloat(selectedItem?.rental_fee || 0).toFixed(2)})</option>
 <option value="Deposit">Deposit Only (₱{parseFloat(selectedItem?.deposit || 0).toFixed(2)})</option>
 <option value="Rental Fee + Deposit">Full Payment (₱{(parseFloat(selectedItem?.rental_fee || 0) + parseFloat(selectedItem?.deposit || 0)).toFixed(2)})</option>
 </select>
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Amount
 </label>
 <input
 type="number"
 name="amount"
 required
 defaultValue={(selectedItem?.rental_fee || 0) + (selectedItem?.deposit || 0)}
 min="0"
 step="0.01"
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Payment Method
 </label>
 <select
 name="payment_method"
 required
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 >
 <option value="Cash">Cash</option>
 <option value="GCash">GCash</option>
 <option value="Bank Transfer">Bank Transfer</option>
 <option value="Card">Card</option>
 </select>
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Payment Date
 </label>
 <input
 type="date"
 name="payment_date"
 required
 defaultValue={new Date().toISOString().split('T')[0]}
 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 />
 </div>
 </div>

 <div className="flex gap-3 mt-6">
 <button
 type="button"
 onClick={() => {
 setShowMarkPaidModal(false);
 setSelectedItem(null);
 }}
 className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold text-[13px]"
 >
 Cancel
 </button>
 <button
 type="submit"
 className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-semibold text-[13px] shadow-sm shadow-emerald-500/30"
 >
 Mark as Paid
 </button>
 </div>
 </form>
 </div>
 </Modal>

 {/* Mark as Returned Modal */}
 <ConfirmModal
 isOpen={showMarkReturnedModal}
 onClose={() => {
 setShowMarkReturnedModal(false);
 setSelectedItem(null);
 }}
 onConfirm={() => {
 updateRentalMutation.mutate({
 id: selectedItem.id,
 data: {
 student_name: selectedItem.student_name,
 student_number: selectedItem.student_number,
 contact_number: selectedItem.contact_number,
 size: selectedItem.size,
 rental_date: selectedItem.rental_date,
 return_date: selectedItem.return_date,
 rental_fee: selectedItem.rental_fee,
 deposit: selectedItem.deposit,
 status: 'Returned',
 payment_status: selectedItem.payment_status,
 }
 });
 setShowMarkReturnedModal(false);
 setSelectedItem(null);
 }}
 title="Mark as Returned"
 message={`Are you sure you want to mark this rental as returned? This will update the status to "Returned".`}
 confirmText="Mark as Returned"
 type="success"
 />

 </div>
 );
};

export default TogaRentals;
