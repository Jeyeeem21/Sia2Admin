/**
 * RENTAL PROPERTY MANAGEMENT SYSTEM
 * 
 * Purpose: Manage school properties rented to external entities (canteen operators, 
 * boarding house owners, photocopy centers, bookstores, parking spaces, etc.)
 * 
 * System Architecture:
 * ==================
 * 
 * 5 Main Modules (Tabs):
 * 
 * 1. PROPERTIES - Manage all rentable spaces
 * - Track location, size, monthly rate
 * - Status: Occupied, Vacant, Under Maintenance
 * - View which tenant is currently renting
 * - Example: School Canteen (150 sqm, ₱15,000/month)
 * 
 * 2. TENANTS - Manage renters/lessees
 * - Personal & business information
 * - Contact details (phone, email)
 * - Track security deposits paid
 * - View rental history and contract status
 * - Example: Maria Santos (Santos Canteen Services)
 * 
 * 3. CONTRACTS - Manage lease agreements
 * - Contract duration (start/end dates)
 * - Monthly rent amount & security deposit
 * - Payment due dates & terms
 * - Auto-alerts: 60 days before expiration
 * - Status: Active, Expired, Terminated
 * - Example: RNT-2025-001 (1 year contract)
 * 
 * 4. PAYMENTS - Track rental payments
 * - Monthly rent collection
 * - Payment methods (Cash, Bank, GCash)
 * - Status: Paid, Pending, Overdue
 * - Late fee calculation (5% default)
 * - Payment history and receipts
 * - Example: November 2025 rent - ₱15,000 (Paid)
 * 
 * 5. MAINTENANCE - Manage repair requests
 * - Tenants report issues (leaks, broken locks, AC problems)
 * - Priority levels: Low, Medium, High, Critical
 * - Status: Pending, In Progress, Completed
 * - Assign to maintenance staff
 * - Track repair costs
 * - Example: Leaking faucet (Medium priority, In Progress)
 * 
 * Key Features:
 * =============
 * ✅ Tab-based navigation (Properties, Tenants, Contracts, Payments, Maintenance)
 * ✅ Search across all data
 * ✅ Filter by status
 * ✅ Pagination for large datasets
 * ✅ Mobile responsive (cards on mobile, tables on desktop)
 * ✅ Real-time statistics dashboard
 * ✅ Table-only reload (no full page refresh when switching tabs)
 * ✅ Loading indicators during data fetch
 * 
 * Performance Optimization:
 * ========================
 * - Initial load: Fetches all data once (fetchAllData)
 * - Tab switches: Only shows loading on table area (fetchTableData)
 * - Statistics cards remain static during tab changes
 * - No full page refresh when clicking tabs or buttons
 * 
 * Data Flow:
 * ==========
 * 1. Page loads → fetchAllData() runs once → sets all mock data
 * 2. User clicks tab → fetchTableData() shows spinner on table only
 * 3. Data already in state → just re-render with different data
 * 4. Search/Filter → instant client-side filtering (no API call)
 * 
 * Current State: FRONTEND COMPLETE with mock data
 * Next Steps: Connect to Laravel backend API (rentalsAPI)
 */

import { useState, useEffect, useMemo } from 'react';
import usePageTitle from '../hooks/usePageTitle';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
 Building2,
 Users,
 FileText,
 DollarSign,
 Wrench,
 Plus,
 Search,
 Filter,
 Calendar,
 MapPin,
 Phone,
 Mail,
 CheckCircle,
 Clock,
 AlertTriangle,
 XCircle,
 Eye,
 Edit,
 Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { rentalsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import PageLoadingSpinner from '../components/PageLoadingSpinner';

const Rentals = () => {
  usePageTitle('Rentals');
 const queryClient = useQueryClient();
 const { user } = useAuth();
 const navigate = useNavigate();
 
 // State Management
 const [activeTab, setActiveTab] = useState('properties'); // 'properties', 'tenants', 'contracts', 'payments', 'maintenance'
 const [searchTerm, setSearchTerm] = useState('');
 const [filterStatus, setFilterStatus] = useState('All');
 const [currentPage, setCurrentPage] = useState(1);
 const [itemsPerPage, setItemsPerPage] = useState(10);
 const [selectedSystem, setSelectedSystem] = useState('Rental');

 // React Query - Fetch all rental data with 1-second real-time updates
 const { data: properties = [], isLoading: propertiesLoading } = useQuery({
 queryKey: ['rental-properties'],
 queryFn: async () => {
 const response = await rentalsAPI.getProperties();
 return response.data;
 },
 });

 const { data: tenants = [], isLoading: tenantsLoading } = useQuery({
 queryKey: ['rental-tenants'],
 queryFn: async () => {
 const response = await rentalsAPI.getTenants();
 return response.data;
 },
 });

 const { data: contracts = [], isLoading: contractsLoading } = useQuery({
 queryKey: ['rental-contracts'],
 queryFn: async () => {
 const response = await rentalsAPI.getContracts();
 return response.data;
 },
 });

 const { data: payments = [], isLoading: paymentsLoading } = useQuery({
 queryKey: ['rental-payments'],
 queryFn: async () => {
 const response = await rentalsAPI.getPayments();
 return response.data;
 },
 });

 const { data: maintenanceRequests = [], isLoading: maintenanceLoading } = useQuery({
 queryKey: ['rental-maintenance'],
 queryFn: async () => {
 const response = await rentalsAPI.getMaintenanceRequests();
 return response.data;
 },
 });

 // Check if initial data is loading
 const loading = propertiesLoading && tenantsLoading && contractsLoading && paymentsLoading && maintenanceLoading;

 // Memoize stall numbers for instant duplicate checking
 const stallNumbersMap = useMemo(() => {
 const map = new Map();
 properties.forEach(property => {
 if (property.stall_number) {
 map.set(property.stall_number.toLowerCase().trim(), property.id);
 }
 });
 return map;
 }, [properties]);

 // Mutations for instant updates (optimistic)
 const createPropertyMutation = useMutation({
 mutationFn: (data) => rentalsAPI.createProperty(data),
 onMutate: async (data) => {
 // Cancel any outgoing refetches
 await queryClient.cancelQueries(['rental-properties']);
 
 // Snapshot the previous value
 const previousProperties = queryClient.getQueryData(['rental-properties']);
 
 // Optimistically add to the list with temporary ID
 const tempProperty = {
 id: Date.now(),
 ...data,
 monthlyRate: parseFloat(data.monthly_rate),
 tenant: null,
 contractEnd: null,
 };
 
 queryClient.setQueryData(['rental-properties'], (old) => [...old, tempProperty]);
 
 return { previousProperties };
 },
 onError: (err, variables, context) => {
 // Rollback on error
 queryClient.setQueryData(['rental-properties'], context.previousProperties);
 
 // Show specific error messages
 if (err.response?.data?.errors) {
 const errors = err.response.data.errors;
 Object.keys(errors).forEach((field) => {
 errors[field].forEach((message) => {
 toast.error(message);
 });
 });
 } else {
 const errorMessage = err.response?.data?.message || 'Failed to create property';
 toast.error(errorMessage);
 }
 },
 onSuccess: () => {
 toast.success('Property created successfully!');
 },
 onSettled: () => {
 // Refetch to get real ID from database
 queryClient.invalidateQueries(['rental-properties']);
 },
 });

 const updatePropertyMutation = useMutation({
 mutationFn: ({ id, data }) => rentalsAPI.updateProperty(id, data),
 onMutate: async ({ id, data }) => {
 // Cancel any outgoing refetches
 await queryClient.cancelQueries(['rental-properties']);
 
 // Snapshot the previous value
 const previousProperties = queryClient.getQueryData(['rental-properties']);
 
 // Optimistically update to the new value
 queryClient.setQueryData(['rental-properties'], (old) =>
 old.map((property) =>
 property.id === id ? { ...property, ...data, monthlyRate: parseFloat(data.monthly_rate) } : property
 )
 );
 
 return { previousProperties };
 },
 onError: (err, variables, context) => {
 // Rollback on error
 queryClient.setQueryData(['rental-properties'], context.previousProperties);
 
 // Show specific error messages
 if (err.response?.data?.errors) {
 const errors = err.response.data.errors;
 // Show validation errors
 Object.keys(errors).forEach((field) => {
 errors[field].forEach((message) => {
 toast.error(message);
 });
 });
 } else {
 const errorMessage = err.response?.data?.message || 'Failed to update property';
 toast.error(errorMessage);
 }
 },
 onSuccess: () => {
 toast.success('Property updated successfully!');
 },
 onSettled: () => {
 // Refetch to ensure data is in sync
 queryClient.invalidateQueries(['rental-properties']);
 },
 });

 // Modal States
 const [showPropertyModal, setShowPropertyModal] = useState(false);
 const [showTenantModal, setShowTenantModal] = useState(false);
 const [showContractModal, setShowContractModal] = useState(false);
 const [showPaymentModal, setShowPaymentModal] = useState(false);
 const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
 
 // Stall Number Validation States
 const [stallNumberInput, setStallNumberInput] = useState('');
 const [stallNumberError, setStallNumberError] = useState('');
 const [isCheckingStallNumber, setIsCheckingStallNumber] = useState(false);
 
 // View Details Modal
 const [showDetailsModal, setShowDetailsModal] = useState(false);
 const [selectedItem, setSelectedItem] = useState(null);
 const [detailsType, setDetailsType] = useState(''); // 'property', 'tenant', 'contract', 'payment', 'maintenance'
 
 const [editingItem, setEditingItem] = useState(null);

 // Edit Property Modal State
 const [showEditPropertyModal, setShowEditPropertyModal] = useState(false);
 const [editPropertyData, setEditPropertyData] = useState({
 name: '',
 stall_number: '',
 type: '',
 location: '',
 size: '',
 monthly_rate: '',
 status: ''
 });

 // Delete Property Modal State
 const [showDeletePropertyModal, setShowDeletePropertyModal] = useState(false);

 // Edit Tenant Modal State
 const [showEditTenantModal, setShowEditTenantModal] = useState(false);

 // Delete Tenant Modal State
 const [showDeleteTenantModal, setShowDeleteTenantModal] = useState(false);

 // Edit Contract Modal State
 const [showEditContractModal, setShowEditContractModal] = useState(false);

 // Delete Contract Modal State
 const [showDeleteContractModal, setShowDeleteContractModal] = useState(false);

 // Edit Payment Modal State
 const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);

 // Delete Payment Modal State
 const [showDeletePaymentModal, setShowDeletePaymentModal] = useState(false);

 // Edit Maintenance Modal State
 const [showEditMaintenanceModal, setShowEditMaintenanceModal] = useState(false);

 // Delete Maintenance Modal State
 const [showDeleteMaintenanceModal, setShowDeleteMaintenanceModal] = useState(false);

 // Form filtering states
 const [selectedContractProperty, setSelectedContractProperty] = useState('');
 const [selectedContractTenant, setSelectedContractTenant] = useState('');
 const [selectedPaymentTenant, setSelectedPaymentTenant] = useState('');
 const [selectedPaymentProperty, setSelectedPaymentProperty] = useState('');

 // Handle view details
 const handleViewDetails = (item, type) => {
 setSelectedItem(item);
 setDetailsType(type);
 setShowDetailsModal(true);
 };

 // Real-time stall number validation with debouncing
 useEffect(() => {
 if (!stallNumberInput || stallNumberInput.trim() === '') {
 setStallNumberError('');
 return;
 }

 const timeoutId = setTimeout(() => {
 // Use memoized map for INSTANT duplicate checking
 const normalizedInput = stallNumberInput.toLowerCase().trim();
 const existingPropertyId = stallNumbersMap.get(normalizedInput);
 
 // Check if duplicate (skip validation when editing the same property)
 const isDuplicate = existingPropertyId && (!editingItem || existingPropertyId !== editingItem.id);

 if (isDuplicate) {
 setStallNumberError('This stall number is already taken. Please use a different stall number.');
 } else {
 setStallNumberError('');
 }
 }, 100); // 100ms debounce - ULTRA FAST!

 return () => clearTimeout(timeoutId);
 }, [stallNumberInput, stallNumbersMap, editingItem]);

 // Reset stall number validation when modals close
 useEffect(() => {
 if (!showPropertyModal && !showEditPropertyModal) {
 setStallNumberInput('');
 setStallNumberError('');
 }
 }, [showPropertyModal, showEditPropertyModal]);

 useEffect(() => {
 if (!showContractModal) {
 setSelectedContractProperty('');
 setSelectedContractTenant('');
 }
 }, [showContractModal]);

 useEffect(() => {
 if (!showPaymentModal) {
 setSelectedPaymentTenant('');
 setSelectedPaymentProperty('');
 }
 }, [showPaymentModal]);

 // Get status color
 const getStatusColor = (status) => {
 switch (status?.toLowerCase()) {
 case 'occupied':
 case 'active':
 case 'paid':
 case 'completed':
 return 'bg-emerald-100 text-emerald-700 border-emerald-200';
 case 'vacant':
 case 'pending':
 return 'bg-amber-100 text-amber-700 border-amber-200';
 case 'expired':
 case 'overdue':
 return 'bg-rose-100 text-rose-700 border-rose-200';
 case 'in progress':
 return 'bg-emerald-100 text-emerald-700 border-emerald-200';
 default:
 return 'bg-gray-100 text-gray-700 border-gray-200';
 }
 };

 const getPriorityColor = (priority) => {
 switch (priority?.toLowerCase()) {
 case 'high':
 return 'bg-rose-100 text-rose-700 border-rose-200';
 case 'medium':
 return 'bg-amber-100 text-amber-700 border-amber-200';
 case 'low':
 return 'bg-emerald-100 text-emerald-700 border-emerald-200';
 default:
 return 'bg-gray-100 text-gray-700 border-gray-200';
 }
 };

 // Calculate statistics
 const stats = {
 totalProperties: properties.length,
 occupiedProperties: properties.filter(p => p.status === 'Occupied').length,
 vacantProperties: properties.filter(p => p.status === 'Vacant').length,
 totalTenants: tenants.length,
 activeContracts: contracts.filter(c => c.status === 'Active').length,
 monthlyRevenue: properties
 .filter(p => p.status === 'Occupied')
 .reduce((sum, p) => sum + (parseFloat(p.monthlyRate) || 0), 0),
 pendingContracts: contracts.filter(c => c.status === 'Pending').length,
 pendingPayments: payments.filter(p => p.status === 'Pending').length,
 pendingMaintenance: maintenanceRequests.filter(m => m.status === 'Pending').length
 };

 // Get current data based on active tab
 const getCurrentData = () => {
 switch (activeTab) {
 case 'properties':
 return properties;
 case 'tenants':
 return tenants;
 case 'contracts':
 return contracts;
 case 'payments':
 return payments;
 case 'maintenance':
 return maintenanceRequests;
 default:
 return [];
 }
 };

 // Filter and search data
 const getFilteredData = () => {
 let data = getCurrentData();

 // Apply search
 if (searchTerm) {
 data = data.filter(item => 
 Object.values(item).some(val => 
 val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
 )
 );
 }

 // Apply status filter
 if (filterStatus !== 'All') {
 data = data.filter(item => item.status === filterStatus);
 }

 return data;
 };

 // Pagination
 const getPaginatedData = () => {
 const filtered = getFilteredData();
 const startIndex = (currentPage - 1) * itemsPerPage;
 return filtered.slice(startIndex, startIndex + itemsPerPage);
 };

 const totalPages = Math.ceil(getFilteredData().length / itemsPerPage);

 // ==================== CRUD HANDLERS ====================

 // Property CRUD Handlers
 const handleCreateProperty = async (formData) => {
 setShowPropertyModal(false);
 
 // Use mutation for instant optimistic create
 createPropertyMutation.mutate(formData);
 };

 const handleEditProperty = async (formData) => {
 const propertyId = editingItem.id;
 setShowEditPropertyModal(false);
 setEditingItem(null);
 setEditPropertyData({
 name: '',
 stall_number: '',
 type: '',
 location: '',
 size: '',
 monthly_rate: '',
 status: ''
 });
 
 // Use mutation for instant optimistic update
 updatePropertyMutation.mutate({ id: propertyId, data: formData });
 };

 const handleDeleteProperty = async () => {
 const propertyId = editingItem.id;
 
 // INSTANT: Close modal and clear state immediately
 setShowDeletePropertyModal(false);
 setEditingItem(null);
 
 // INSTANT: Remove from UI immediately
 const previousProperties = queryClient.getQueryData(['rental-properties']);
 queryClient.setQueryData(['rental-properties'], (old) => 
 old?.filter(item => item.id !== propertyId)
 );
 
 // INSTANT: Show success immediately
 toast.success('Property deleted!');
 
 try {
 await rentalsAPI.deleteProperty(propertyId);
 queryClient.invalidateQueries(['rental-properties']);
 } catch (error) {
 // Rollback on error
 queryClient.setQueryData(['rental-properties'], previousProperties);
 console.error('Error deleting property:', error);
 
 // Better error messages
 if (error.response?.status === 404) {
 toast.error('Property already deleted or not found');
 queryClient.invalidateQueries(['rental-properties']); // Refresh to sync
 } else if (error.response?.status === 400) {
 toast.error(error.response?.data?.error || 'Cannot delete property');
 } else {
 const errorMessage = error.response?.data?.message || 'Failed to delete property - rolled back';
 toast.error(errorMessage);
 }
 }
 };

 // Tenant CRUD Handlers
 const handleCreateTenant = async (formData) => {
 // INSTANT: Close modal immediately
 setShowTenantModal(false);
 
 // INSTANT: Add to UI immediately
 const previousTenants = queryClient.getQueryData(['rental-tenants']);
 const tempTenant = { ...formData, id: 'temp-' + Date.now() };
 queryClient.setQueryData(['rental-tenants'], (old) => [tempTenant, ...(old || [])]);
 
 // INSTANT: Show success immediately
 toast.success('Tenant created!');
 
 try {
 console.log('Creating tenant with data:', formData);
 await rentalsAPI.createTenant(formData);
 queryClient.invalidateQueries(['rental-tenants']);
 } catch (error) {
 // Rollback on error
 queryClient.setQueryData(['rental-tenants'], previousTenants);
 console.error('Error creating tenant:', error);
 console.error('Error response:', error.response?.data);
 const errorMessage = error.response?.data?.message || 'Failed to create tenant - rolled back';
 const errors = error.response?.data?.errors;
 if (errors) {
 Object.values(errors).forEach(err => toast.error(err[0]));
 } else {
 toast.error(errorMessage);
 }
 }
 };

 const handleEditTenant = async (formData) => {
 const tenantId = editingItem.id;
 
 // INSTANT: Close modal and clear state immediately
 setShowEditTenantModal(false);
 setEditingItem(null);
 
 // INSTANT: Update UI immediately
 const previousTenants = queryClient.getQueryData(['rental-tenants']);
 queryClient.setQueryData(['rental-tenants'], (old) =>
 old?.map(item => item.id === tenantId ? { ...item, ...formData } : item)
 );
 
 // INSTANT: Show success immediately
 toast.success('Tenant updated!');
 
 try {
 await rentalsAPI.updateTenant(tenantId, formData);
 queryClient.invalidateQueries(['rental-tenants']);
 } catch (error) {
 // Rollback on error
 queryClient.setQueryData(['rental-tenants'], previousTenants);
 console.error('Error updating tenant:', error);
 const errorMessage = error.response?.data?.message || 'Failed to update tenant - rolled back';
 toast.error(errorMessage);
 }
 };

 const handleDeleteTenant = async () => {
 const tenantId = editingItem.id;
 
 // INSTANT: Close modal and clear state immediately
 setShowDeleteTenantModal(false);
 setEditingItem(null);
 
 // INSTANT: Remove from UI immediately
 const previousTenants = queryClient.getQueryData(['rental-tenants']);
 queryClient.setQueryData(['rental-tenants'], (old) =>
 old?.filter(item => item.id !== tenantId)
 );
 
 // INSTANT: Show success immediately
 toast.success('Tenant deleted!');
 
 try {
 await rentalsAPI.deleteTenant(tenantId);
 queryClient.invalidateQueries(['rental-tenants']);
 } catch (error) {
 // Rollback on error
 queryClient.setQueryData(['rental-tenants'], previousTenants);
 console.error('Error deleting tenant:', error);
 
 // Better error messages
 if (error.response?.status === 404) {
 toast.error('Tenant already deleted or not found');
 queryClient.invalidateQueries(['rental-tenants']); // Refresh to sync
 } else {
 const errorMessage = error.response?.data?.message || 'Failed to delete tenant - rolled back';
 toast.error(errorMessage);
 }
 }
 };

 // Contract CRUD Handlers
 const handleCreateContract = async (formData) => {
 setShowContractModal(false); // Close modal immediately
 
 try {
 console.log('Sending contract data:', formData);
 await rentalsAPI.createContract(formData);
 toast.success('Contract created successfully!');
 queryClient.invalidateQueries(['rental-properties', 'rental-tenants', 'rental-contracts', 'rental-payments', 'rental-maintenance']);
 } catch (error) {
 console.error('Error creating contract:', error);
 console.error('Error response:', error.response?.data);
 const errorMessage = error.response?.data?.message || 'Failed to create contract';
 toast.error(errorMessage);
 }
 };

 const handleEditContract = async (formData) => {
 const contractId = editingItem.id;
 setShowEditContractModal(false); // Close modal immediately
 setEditingItem(null);
 
 try {
 await rentalsAPI.updateContract(contractId, formData);
 toast.success('Contract updated successfully!');
 queryClient.invalidateQueries(['rental-properties', 'rental-tenants', 'rental-contracts', 'rental-payments', 'rental-maintenance']);
 } catch (error) {
 console.error('Error updating contract:', error);
 const errorMessage = error.response?.data?.message || 'Failed to update contract';
 toast.error(errorMessage);
 }
 };

 const handleDeleteContract = async () => {
 const contractId = editingItem.id;
 setShowDeleteContractModal(false); // Close modal immediately
 setEditingItem(null);
 
 try {
 await rentalsAPI.deleteContract(contractId);
 toast.success('Contract deleted successfully!');
 queryClient.invalidateQueries(['rental-properties', 'rental-tenants', 'rental-contracts', 'rental-payments', 'rental-maintenance']);
 } catch (error) {
 console.error('Error deleting contract:', error);
 const errorMessage = error.response?.data?.message || 'Failed to delete contract';
 toast.error(errorMessage);
 }
 };

 // Payment CRUD Handlers
 const handleCreatePayment = async (formData) => {
 setShowPaymentModal(false); // Close modal immediately
 
 try {
 await rentalsAPI.createPayment(formData);
 toast.success('Payment created successfully!');
 queryClient.invalidateQueries(['rental-properties', 'rental-tenants', 'rental-contracts', 'rental-payments', 'rental-maintenance']);
 } catch (error) {
 console.error('Error creating payment:', error);
 const errorMessage = error.response?.data?.message || 'Failed to create payment';
 toast.error(errorMessage);
 }
 };

 const handleEditPayment = async (formData) => {
 const paymentId = editingItem.id;
 setShowEditPaymentModal(false); // Close modal immediately
 setEditingItem(null);
 
 try {
 await rentalsAPI.updatePayment(paymentId, formData);
 toast.success('Payment updated successfully!');
 queryClient.invalidateQueries(['rental-properties', 'rental-tenants', 'rental-contracts', 'rental-payments', 'rental-maintenance']);
 } catch (error) {
 console.error('Error updating payment:', error);
 const errorMessage = error.response?.data?.message || 'Failed to update payment';
 toast.error(errorMessage);
 }
 };

 const handleDeletePayment = async () => {
 const paymentId = editingItem.id;
 setShowDeletePaymentModal(false); // Close modal immediately
 setEditingItem(null);
 
 try {
 await rentalsAPI.deletePayment(paymentId);
 toast.success('Payment deleted successfully!');
 queryClient.invalidateQueries(['rental-properties', 'rental-tenants', 'rental-contracts', 'rental-payments', 'rental-maintenance']);
 } catch (error) {
 console.error('Error deleting payment:', error);
 const errorMessage = error.response?.data?.message || 'Failed to delete payment';
 toast.error(errorMessage);
 }
 };

 // Maintenance CRUD Handlers
 const handleCreateMaintenance = async (formData) => {
 setShowMaintenanceModal(false); // Close modal immediately
 
 try {
 await rentalsAPI.createMaintenanceRequest(formData);
 toast.success('Maintenance request created successfully!');
 queryClient.invalidateQueries(['rental-properties', 'rental-tenants', 'rental-contracts', 'rental-payments', 'rental-maintenance']);
 } catch (error) {
 console.error('Error creating maintenance request:', error);
 const errorMessage = error.response?.data?.message || 'Failed to create maintenance request';
 toast.error(errorMessage);
 }
 };

 const handleEditMaintenance = async (formData) => {
 const maintenanceId = editingItem.id;
 setShowEditMaintenanceModal(false); // Close modal immediately
 setEditingItem(null);
 
 try {
 await rentalsAPI.updateMaintenanceRequest(maintenanceId, formData);
 toast.success('Maintenance request updated successfully!');
 queryClient.invalidateQueries(['rental-properties', 'rental-tenants', 'rental-contracts', 'rental-payments', 'rental-maintenance']);
 } catch (error) {
 console.error('Error updating maintenance request:', error);
 const errorMessage = error.response?.data?.message || 'Failed to update maintenance request';
 toast.error(errorMessage);
 }
 };

 const handleDeleteMaintenance = async () => {
 const maintenanceId = editingItem.id;
 setShowDeleteMaintenanceModal(false); // Close modal immediately
 setEditingItem(null);
 
 try {
 await rentalsAPI.deleteMaintenanceRequest(maintenanceId);
 toast.success('Maintenance request deleted successfully!');
 queryClient.invalidateQueries(['rental-properties', 'rental-tenants', 'rental-contracts', 'rental-payments', 'rental-maintenance']);
 } catch (error) {
 console.error('Error deleting maintenance request:', error);
 const errorMessage = error.response?.data?.message || 'Failed to delete maintenance request';
 toast.error(errorMessage);
 }
 };

 if (loading) {
 return (
 <div className="p-8 flex items-center justify-center min-h-screen">
 <PageLoadingSpinner message="Loading rental data..." />
 </div>
 );
 }

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
 } else if (value === 'Toga Rental') {
 navigate('/toga-rentals');
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
 <div>
 <h1 className="text-xl font-bold text-gray-900 tracking-tight">Rental Property Management</h1>
 <p className="text-[11px] text-gray-400 mt-1">Manage school properties, tenants, contracts, and rental payments</p>
 </div>
 </div>

 {/* Stats Cards */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
 <div className="group relative bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
 <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gray-50 to-transparent rounded-bl-full opacity-60" />
 <div className="relative">
 <div className="bg-emerald-50 p-2.5 rounded-xl ring-4 ring-white w-fit">
 <Building2 className="w-[18px] h-[18px] text-emerald-600" />
 </div>
 <div className="mt-4">
 <p className="text-[22px] font-bold text-gray-900 tracking-tight leading-none">{stats.totalProperties}</p>
 <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-1.5">Total Properties</p>
 <p className="text-[10px] text-gray-400 mt-1">{stats.occupiedProperties} occupied · {stats.vacantProperties} vacant</p>
 </div>
 </div>
 </div>
 <div className="group relative bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
 <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gray-50 to-transparent rounded-bl-full opacity-60" />
 <div className="relative">
 <div className="bg-emerald-50 p-2.5 rounded-xl ring-4 ring-white w-fit">
 <Users className="w-[18px] h-[18px] text-emerald-600" />
 </div>
 <div className="mt-4">
 <p className="text-[22px] font-bold text-gray-900 tracking-tight leading-none">{stats.totalTenants}</p>
 <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-1.5">Active Tenants</p>
 <p className="text-[10px] text-gray-400 mt-1">{stats.activeContracts} active contracts</p>
 </div>
 </div>
 </div>
 <div className="group relative bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
 <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-50 to-transparent rounded-bl-full opacity-60" />
 <div className="relative">
 <div className="bg-emerald-50 p-2.5 rounded-xl ring-4 ring-white w-fit">
 <DollarSign className="w-[18px] h-[18px] text-emerald-600" />
 </div>
 <div className="mt-4">
 <p className="text-[22px] font-bold text-gray-900 tracking-tight leading-none">₱{stats.monthlyRevenue.toLocaleString()}</p>
 <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-1.5">Monthly Revenue</p>
 <p className="text-[10px] text-gray-400 mt-1">From {stats.occupiedProperties} properties</p>
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
 <p className="text-[22px] font-bold text-gray-900 tracking-tight leading-none">{stats.pendingContracts}</p>
 <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-1.5">Pending Items</p>
 <p className="text-[10px] text-gray-400 mt-1">{stats.pendingContracts} contracts pending</p>
 </div>
 </div>
 </div>
 </div>

 {/* Tab Navigation */}
 <div className="bg-white rounded-xl shadow-sm p-2 mb-6 border border-gray-100">
 <div className="flex flex-wrap gap-2">
 <button
 onClick={() => {
 setActiveTab('properties');
 setCurrentPage(1);
 setFilterStatus('All');
 queryClient.invalidateQueries(['rental-properties', 'rental-tenants', 'rental-contracts', 'rental-payments', 'rental-maintenance']);
 }}
 className={`px-4 py-2.5 rounded-xl text-[11px] font-semibold transition-all flex items-center gap-2 ${
 activeTab === 'properties'
 ? 'bg-emerald-600 text-white shadow-sm'
 : 'text-gray-600 hover:bg-gray-100'
 }`}
 >
 <Building2 className="w-5 h-5" />
 Properties ({properties.length})
 </button>
 
 <button
 onClick={() => {
 setActiveTab('tenants');
 setCurrentPage(1);
 setFilterStatus('All');
 queryClient.invalidateQueries(['rental-properties', 'rental-tenants', 'rental-contracts', 'rental-payments', 'rental-maintenance']);
 }}
 className={`px-4 py-2.5 rounded-xl text-[11px] font-semibold transition-all flex items-center gap-2 ${
 activeTab === 'tenants'
 ? 'bg-emerald-600 text-white shadow-sm'
 : 'text-gray-600 hover:bg-gray-100'
 }`}
 >
 <Users className="w-5 h-5" />
 Tenants ({tenants.length})
 </button>
 
 <button
 onClick={() => {
 setActiveTab('contracts');
 setCurrentPage(1);
 setFilterStatus('All');
 queryClient.invalidateQueries(['rental-properties', 'rental-tenants', 'rental-contracts', 'rental-payments', 'rental-maintenance']);
 }}
 className={`px-4 py-2.5 rounded-xl text-[11px] font-semibold transition-all flex items-center gap-2 ${
 activeTab === 'contracts'
 ? 'bg-emerald-600 text-white shadow-sm'
 : 'text-gray-600 hover:bg-gray-100'
 }`}
 >
 <FileText className="w-5 h-5" />
 Contracts ({contracts.length})
 </button>
 
 <button
 onClick={() => {
 setActiveTab('payments');
 setCurrentPage(1);
 setFilterStatus('All');
 queryClient.invalidateQueries(['rental-properties', 'rental-tenants', 'rental-contracts', 'rental-payments', 'rental-maintenance']);
 }}
 className={`px-4 py-2.5 rounded-xl text-[11px] font-semibold transition-all flex items-center gap-2 ${
 activeTab === 'payments'
 ? 'bg-emerald-600 text-white shadow-sm'
 : 'text-gray-600 hover:bg-gray-100'
 }`}
 >
 <DollarSign className="w-5 h-5" />
 Payments ({payments.length})
 </button>
 
 <button
 onClick={() => {
 setActiveTab('maintenance');
 setCurrentPage(1);
 setFilterStatus('All');
 queryClient.invalidateQueries(['rental-properties', 'rental-tenants', 'rental-contracts', 'rental-payments', 'rental-maintenance']);
 }}
 className={`px-4 py-2.5 rounded-xl text-[11px] font-semibold transition-all flex items-center gap-2 ${
 activeTab === 'maintenance'
 ? 'bg-emerald-600 text-white shadow-sm'
 : 'text-gray-600 hover:bg-gray-100'
 }`}
 >
 <Wrench className="w-5 h-5" />
 Maintenance ({maintenanceRequests.length})
 </button>
 </div>
 </div>

 {/* Action Bar */}
 <div className="bg-white rounded-xl shadow-sm p-5 mb-5 border border-gray-100">
 <div className="flex flex-col md:flex-row gap-4">
 {/* Search */}
 <div className="flex-1 relative">
 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
 <input
 type="text"
 placeholder={`Search ${activeTab}...`}
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
 />
 </div>

 {/* Status Filter */}
 <div className="flex items-center gap-2">
 <Filter className="w-5 h-5 text-gray-400" />
 <select
 value={filterStatus}
 onChange={(e) => setFilterStatus(e.target.value)}
 className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
 >
 <option value="All">All Status</option>
 {activeTab === 'properties' && (
 <>
 <option value="Occupied">Occupied</option>
 <option value="Vacant">Vacant</option>
 </>
 )}
 {activeTab === 'contracts' && (
 <>
 <option value="Active">Active</option>
 <option value="Expired">Expired</option>
 </>
 )}
 {activeTab === 'payments' && (
 <>
 <option value="Paid">Paid</option>
 <option value="Pending">Pending</option>
 <option value="Overdue">Overdue</option>
 </>
 )}
 {activeTab === 'maintenance' && (
 <>
 <option value="Pending">Pending</option>
 <option value="In Progress">In Progress</option>
 <option value="Completed">Completed</option>
 </>
 )}
 </select>
 </div>

 {/* Add Button */}
 <button
 onClick={() => {
 if (activeTab === 'properties') setShowPropertyModal(true);
 else if (activeTab === 'tenants') setShowTenantModal(true);
 else if (activeTab === 'contracts') setShowContractModal(true);
 else if (activeTab === 'payments') setShowPaymentModal(true);
 else if (activeTab === 'maintenance') setShowMaintenanceModal(true);
 }}
 className="px-4 py-2 text-[13px] bg-emerald-600 text-white rounded-lg font-semibold shadow-sm hover:shadow-md transition-all flex items-center gap-2"
 >
 <Plus className="w-5 h-5" />
 Add {activeTab === 'properties' ? 'Property' : activeTab === 'tenants' ? 'Tenant' : activeTab === 'contracts' ? 'Contract' : activeTab === 'payments' ? 'Payment' : 'Maintenance Request'}
 </button>
 </div>
 </div>

 {/* ADD PROPERTY MODAL (UNIFIED DESIGN) */}
 {showPropertyModal && (
 <Modal
 isOpen={showPropertyModal}
 onClose={() => setShowPropertyModal(false)}
 title="Add Property"
 subtitle="Enter property details below"
 icon={<Building2 className="w-6 h-6" />}
 size="md"
 >
 <form className="space-y-6" onSubmit={(e) => {
 e.preventDefault();
 const formData = new FormData(e.target);
 const propertyData = {
 name: formData.get('name'),
 stall_number: formData.get('stall_number'),
 type: formData.get('type'),
 location: formData.get('location'),
 size: formData.get('size'),
 monthly_rate: formData.get('monthly_rate'),
 status: 'Vacant'
 };
 handleCreateProperty(propertyData);
 }}>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Stall/Unit Number</label>
 <input 
 name="stall_number" 
 type="text" 
 value={stallNumberInput}
 onChange={(e) => setStallNumberInput(e.target.value)}
 placeholder="e.g., Stall 1, Unit A" 
 className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 ${
 stallNumberError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
 }`}
 />
 {stallNumberError && (
 <p className="text-red-500 text-xs mt-1">{stallNumberError}</p>
 )}
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Property Name</label>
 <input name="name" type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" required />
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Type</label>
 <select name="type" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" required>
 <option value="Commercial">Commercial</option>
 <option value="Residential">Residential</option>
 </select>
 </div>
 <div className="md:col-span-2">
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Location</label>
 <input name="location" type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" required />
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Size (sqm)</label>
 <input name="size" type="text" placeholder="e.g., 100 sqm or 100" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" required />
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Monthly Rate (₱)</label>
 <input name="monthly_rate" type="number" min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" required />
 </div>
 </div>
 <div className="flex justify-end gap-2 pt-4">
 <button type="button" onClick={() => setShowPropertyModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50">Cancel</button>
 <button 
 type="submit" 
 disabled={stallNumberError}
 className={`px-4 py-2 text-[13px] rounded-lg font-semibold shadow-sm hover:shadow-md transition-all ${
 stallNumberError 
 ? 'bg-gray-400 cursor-not-allowed' 
 : 'bg-emerald-600 text-white'
 }`}
 >
 Add Property
 </button>
 </div>
 </form>
 </Modal>
 )}

 {/* ADD TENANT MODAL (UNIFIED DESIGN) */}
 {showTenantModal && (
 <Modal
 isOpen={showTenantModal}
 onClose={() => setShowTenantModal(false)}
 title="Add Tenant"
 subtitle="Enter tenant details below"
 icon={<Users className="w-6 h-6" />}
 size="md"
 >
 <form className="space-y-6" onSubmit={(e) => {
 e.preventDefault();
 const formData = new FormData(e.target);
 const tenantData = {
 name: formData.get('name'),
 business_name: formData.get('business_name'),
 email: formData.get('email'),
 contact_number: formData.get('contact_number'),
 property_rented_id: formData.get('property_rented_id'),
 contract_status: formData.get('contract_status'),
 deposit_paid: formData.get('deposit_paid')
 };
 handleCreateTenant(tenantData);
 }}>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Full Name</label>
 <input name="name" type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" required />
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Business Name</label>
 <input name="business_name" type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" />
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Email</label>
 <input name="email" type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" required />
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Contact Number</label>
 <input name="contact_number" type="tel" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" required />
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Assign Property (Optional)</label>
 <select name="property_rented_id" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500">
 <option value="">Select Available Property</option>
 {properties
 .filter(property => {
 // Show only properties without active contracts (vacant/available)
 return !contracts.some(c => 
 c.propertyId == property.id && 
 c.status === 'Active'
 );
 })
 .map(property => (
 <option key={property.id} value={property.id}>{property.name} - {property.location}</option>
 ))}
 </select>
 <p className="text-xs text-gray-500 mt-1">Assign this tenant to an available property (optional)</p>
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Security Deposit (₱)</label>
 <input name="deposit_paid" type="number" min="0" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" required />
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Contract Status</label>
 <select name="contract_status" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" required>
 <option value="Active">Active</option>
 <option value="Inactive">Inactive</option>
 <option value="Expired">Expired</option>
 </select>
 </div>
 </div>
 <div className="flex justify-end gap-2 pt-4">
 <button type="button" onClick={() => setShowTenantModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50">Cancel</button>
 <button type="submit" className="px-4 py-2 text-[13px] rounded-lg bg-emerald-600 font-semibold hover:shadow-md transition-all">Add Tenant</button>
 </div>
 </form>
 </Modal>
 )}

 {/* ADD CONTRACT MODAL (UNIFIED DESIGN) */}
 {showContractModal && (
 <Modal
 isOpen={showContractModal}
 onClose={() => {
 setShowContractModal(false);
 console.log('Contract modal closed - Contracts data:', contracts);
 }}
 title="Add Contract"
 subtitle="Enter contract details below"
 icon={<FileText className="w-6 h-6" />}
 size="md"
 >
 <form className="space-y-6" onSubmit={(e) => {
 e.preventDefault();
 const formData = new FormData(e.target);
 const contractData = {
 contract_number: formData.get('contract_number'),
 property_id: formData.get('property_id'),
 tenant_id: formData.get('tenant_id'),
 start_date: formData.get('start_date'),
 end_date: formData.get('end_date'),
 monthly_rent: formData.get('monthly_rent'),
 deposit: formData.get('deposit'),
 status: formData.get('status')
 };
 handleCreateContract(contractData);
 }}>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Contract Number</label>
 <input name="contract_number" type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" required />
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Tenant</label>
 <select 
 name="tenant_id" 
 value={selectedContractTenant}
 onChange={(e) => setSelectedContractTenant(e.target.value)}
 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" 
 required
 >
 <option value="">Select Tenant</option>
 {tenants.map(tenant => (
 <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Property</label>
 <select 
 name="property_id" 
 value={selectedContractProperty}
 onChange={(e) => setSelectedContractProperty(e.target.value)}
 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" 
 required
 >
 <option value="">Select Property</option>
 {properties
 .filter(property => {
 // Show only VACANT properties (no active contracts)
 // A property can only be rented to ONE tenant at a time
 const hasActiveContract = contracts.some(c => 
 c.propertyId == property.id && 
 c.status === 'Active'
 );
 console.log(`Property ${property.name} (ID: ${property.id}) - Has Active Contract: ${hasActiveContract}`);
 return !hasActiveContract;
 })
 .map(property => (
 <option key={property.id} value={property.id}>{property.name} - {property.location}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Start Date</label>
 <input name="start_date" type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" required />
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">End Date</label>
 <input name="end_date" type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" required />
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Monthly Rent (₱)</label>
 <input name="monthly_rent" type="number" min="0" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" required />
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Security Deposit (₱)</label>
 <input name="deposit" type="number" min="0" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" required />
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Status</label>
 <select name="status" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" required>
 <option value="Active">Active</option>
 <option value="Expired">Expired</option>
 <option value="Terminated">Terminated</option>
 </select>
 </div>
 </div>
 <div className="flex justify-end gap-2 pt-4">
 <button type="button" onClick={() => setShowContractModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50">Cancel</button>
 <button type="submit" className="px-4 py-2 text-[13px] rounded-lg bg-emerald-600 font-semibold hover:shadow-md transition-all">Add Contract</button>
 </div>
 </form>
 </Modal>
 )}

 {/* ADD PAYMENT MODAL (UNIFIED DESIGN) */}
 {showPaymentModal && (
 <Modal
 isOpen={showPaymentModal}
 onClose={() => setShowPaymentModal(false)}
 title="Add Payment"
 subtitle="Enter payment details below"
 icon={<DollarSign className="w-6 h-6" />}
 size="md"
 >
 <form className="space-y-6" onSubmit={(e) => {
 e.preventDefault();
 const formData = new FormData(e.target);
 const paymentData = {
 tenant_id: formData.get('tenant_id'),
 property_id: formData.get('property_id'),
 amount: formData.get('amount'),
 month: formData.get('month'),
 method: formData.get('method'),
 payment_date: formData.get('payment_date'),
 status: formData.get('status')
 };
 handleCreatePayment(paymentData);
 }}>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Payment Number (Auto-generated)</label>
 <input name="payment_number" type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed" placeholder="Auto-generated" disabled />
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Tenant</label>
 <select 
 name="tenant_id" 
 value={selectedPaymentTenant}
 onChange={(e) => setSelectedPaymentTenant(e.target.value)}
 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" 
 required
 >
 <option value="">Select Tenant</option>
 {tenants.map(tenant => (
 <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Property</label>
 <select 
 name="property_id" 
 value={selectedPaymentProperty}
 onChange={(e) => setSelectedPaymentProperty(e.target.value)}
 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" 
 required
 >
 <option value="">Select Property</option>
 {properties
 .filter(property => {
 if (!selectedPaymentTenant) return true; // Show all if no tenant selected
 
 // Show properties that the tenant is currently renting (active contracts)
 return contracts.some(c => 
 c.propertyId == property.id && 
 c.tenantId == selectedPaymentTenant && 
 c.status === 'Active'
 );
 })
 .map(property => (
 <option key={property.id} value={property.id}>{property.name} - {property.location}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Amount (₱)</label>
 <input name="amount" type="number" min="0" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" required />
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Month Covered</label>
 <input name="month" type="text" placeholder="e.g., November 2025" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" required />
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Payment Method</label>
 <select name="method" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" required>
 <option value="Cash">Cash</option>
 <option value="Bank Transfer">Bank Transfer</option>
 <option value="GCash">GCash</option>
 <option value="Check">Check</option>
 </select>
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Payment Date</label>
 <input 
 name="payment_date" 
 type="date" 
 defaultValue={new Date().toISOString().split('T')[0]}
 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" 
 required 
 />
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Status</label>
 <select name="status" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" required>
 <option value="Paid">Paid</option>
 <option value="Pending">Pending</option>
 <option value="Overdue">Overdue</option>
 </select>
 </div>
 </div>
 <div className="flex justify-end gap-2 pt-4">
 <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50">Cancel</button>
 <button type="submit" className="px-4 py-2 text-[13px] rounded-lg bg-emerald-600 font-semibold hover:shadow-md transition-all">Add Payment</button>
 </div>
 </form>
 </Modal>
 )}

 {/* ADD MAINTENANCE MODAL (UNIFIED DESIGN) */}
 {showMaintenanceModal && (
 <Modal
 isOpen={showMaintenanceModal}
 onClose={() => setShowMaintenanceModal(false)}
 title="Add Maintenance Request"
 subtitle="Enter maintenance request details below"
 icon={<Wrench className="w-6 h-6" />}
 size="md"
 >
 <form className="space-y-6" onSubmit={(e) => {
 e.preventDefault();
 const formData = new FormData(e.target);
 const maintenanceData = {
 property_id: formData.get('property_id'),
 tenant_id: formData.get('tenant_id'),
 issue: formData.get('issue'),
 priority: formData.get('priority'),
 status: formData.get('status'),
 date_reported: formData.get('date_reported'),
 assigned_to: formData.get('assigned_to')
 };
 handleCreateMaintenance(maintenanceData);
 }}>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Request Number (Auto-generated)</label>
 <input name="request_number" type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed" placeholder="Auto-generated" disabled />
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Property</label>
 <select name="property_id" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" required>
 <option value="">Select Property</option>
 {properties.map(property => (
 <option key={property.id} value={property.id}>{property.name}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Tenant</label>
 <select name="tenant_id" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500">
 <option value="">Select Tenant (if applicable)</option>
 {tenants.map(tenant => (
 <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Priority</label>
 <select name="priority" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" required>
 <option value="Low">Low</option>
 <option value="Medium">Medium</option>
 <option value="High">High</option>
 <option value="Critical">Critical</option>
 </select>
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Status</label>
 <select name="status" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" required>
 <option value="Pending">Pending</option>
 <option value="In Progress">In Progress</option>
 <option value="Completed">Completed</option>
 </select>
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Date Reported</label>
 <input name="date_reported" type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" required />
 </div>
 <div className="md:col-span-2">
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Issue Description</label>
 <textarea name="issue" rows="4" placeholder="Describe the maintenance issue in detail..." className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" required></textarea>
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-1">Assigned To</label>
 <input name="assigned_to" type="text" placeholder="Staff member name" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500" />
 </div>
 </div>
 <div className="flex justify-end gap-2 pt-4">
 <button type="button" onClick={() => setShowMaintenanceModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50">Cancel</button>
 <button type="submit" className="px-4 py-2 text-[13px] rounded-lg bg-emerald-600 font-semibold hover:shadow-md transition-all">Add Request</button>
 </div>
 </form>
 </Modal>
 )}

 {/* Content Area - Properties Tab */}
 {activeTab === 'properties' && (
 <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
 {/* Mobile Cards */}
 <div className="block md:hidden">
 {getPaginatedData().map((property) => (
 <div key={property.id} className="p-4 border-b border-gray-100 last:border-b-0">
 <div className="flex items-start justify-between mb-3">
 <div className="flex-1">
 {property.stall_number && (
 <p className="text-[11px] font-semibold text-emerald-600 mb-1">{property.stall_number}</p>
 )}
 <h3 className="font-bold text-gray-900 text-[13px]">{property.name}</h3>
 <span className={`inline-block px-3 py-1 text-[10px] font-bold rounded-full border mt-2 ${getStatusColor(property.status)}`}>
 {property.status}
 </span>
 </div>
 </div>
 
 <div className="space-y-2 mb-3">
 <div className="flex items-center gap-2 text-[11px]">
 <Building2 className="w-4 h-4 text-gray-400" />
 <span className="text-gray-600">{property.type}</span>
 </div>
 <div className="flex items-center gap-2 text-[11px]">
 <MapPin className="w-4 h-4 text-gray-400" />
 <span className="text-gray-600">{property.location}</span>
 </div>
 <div className="flex items-center gap-2 text-[11px]">
 <span className="text-gray-500">Size:</span>
 <span className="text-gray-700 font-medium">{property.size}</span>
 </div>
 {property.tenant && (
 <div className="flex items-center gap-2 text-[11px]">
 <Users className="w-4 h-4 text-gray-400" />
 <span className="text-gray-600">{property.tenant}</span>
 </div>
 )}
 </div>

 <div className="flex items-center justify-between pt-3 border-t border-gray-100">
 <div className="text-[11px] font-semibold text-emerald-600">₱{property.monthlyRate.toLocaleString()}/mo</div>
 <div className="flex gap-2">
 <button 
 onClick={() => handleViewDetails(property, 'property')}
 className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
 >
 <Eye className="w-4 h-4" />
 </button>
 <button
 className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
 onClick={() => {
 setEditingItem(property);
 setStallNumberInput(property.stall_number || '');
 setEditPropertyData({
 name: property.name || '',
 stall_number: property.stall_number || '',
 type: property.type || '',
 location: property.location || '',
 size: property.size || '',
 monthly_rate: property.monthlyRate || '',
 status: property.status || ''
 });
 setShowEditPropertyModal(true);
 }}
 >
 <Edit className="w-4 h-4" />
 </button>
 {user?.role?.toLowerCase() === 'admin' && (
 <button
 className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
 onClick={() => {
 setEditingItem(property);
 setShowDeletePropertyModal(true);
 }}
 >
 <Trash2 className="w-4 h-4" />
 </button>
 )}
 </div>
 </div>
 </div>
 ))}
 </div>

 {/* Desktop Table */}
 <div className="hidden md:block overflow-x-auto">
 <table className="w-full">
 <thead className="bg-gray-50 border-b border-gray-200">
 <tr>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Stall #</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Property</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Type</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Location</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Size</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Monthly Rate</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tenant</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {getPaginatedData().map((property) => (
 <tr key={property.id} className="hover:bg-gray-50 transition-colors">
 <td className="px-5 py-3.5">
 <div className="font-semibold text-gray-600">{property.stall_number || '-'}</div>
 </td>
 <td className="px-5 py-3.5">
 <div className="font-semibold text-gray-900">{property.name}</div>
 </td>
 <td className="px-5 py-3.5 text-[11px] text-gray-500">{property.type}</td>
 <td className="px-5 py-3.5 text-[11px] text-gray-500">{property.location}</td>
 <td className="px-5 py-3.5 text-[11px] text-gray-500">{property.size}</td>
 <td className="px-5 py-3.5">
 <div className="font-semibold text-emerald-600">₱{property.monthlyRate.toLocaleString()}</div>
 </td>
 <td className="px-5 py-3.5">
 <span className={`px-3 py-1 text-[10px] font-bold rounded-full border ${getStatusColor(property.status)}`}>
 {property.status}
 </span>
 </td>
 <td className="px-5 py-3.5 text-[11px] text-gray-500">{property.tenant || '-'}</td>
 <td className="px-5 py-3.5">
 <div className="flex gap-2">
 <button 
 onClick={() => handleViewDetails(property, 'property')}
 className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
 >
 <Eye className="w-4 h-4" />
 </button>
 <button
 className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
 onClick={() => {
 setEditingItem(property);
 setStallNumberInput(property.stall_number || '');
 setEditPropertyData({
 name: property.name || '',
 stall_number: property.stall_number || '',
 type: property.type || '',
 location: property.location || '',
 size: property.size || '',
 monthly_rate: property.monthlyRate || '',
 status: property.status || ''
 });
 setShowEditPropertyModal(true);
 }}
 >
 <Edit className="w-4 h-4" />
 </button>
 {user?.role?.toLowerCase() === 'admin' && (
 <button
 className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
 onClick={() => {
 setEditingItem(property);
 setShowDeletePropertyModal(true);
 }}
 >
 <Trash2 className="w-4 h-4" />
 </button>
 )}
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 {/* Empty State */}
 {getPaginatedData().length === 0 && (
 <div className="text-center py-12">
 <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
 <p className="text-gray-500 font-medium">No properties found</p>
 <p className="text-[11px] text-gray-400 mt-1">Try adjusting your search or filters</p>
 </div>
 )}
 </div>
 )}

 {/* Tenants Tab - Shows all people/businesses renting properties */}
 {activeTab === 'tenants' && (
 <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
 {/* Mobile Cards */}
 <div className="block md:hidden">
 {getPaginatedData().map((tenant) => (
 <div key={tenant.id} className="p-4 border-b border-gray-100 last:border-b-0">
 <div className="flex items-start justify-between mb-3">
 <div className="flex-1">
 <h3 className="font-bold text-gray-900 text-[13px]">{tenant.name}</h3>
 {tenant.businessName && (
 <p className="text-[11px] text-gray-500">{tenant.businessName}</p>
 )}
 <span className={`inline-block px-3 py-1 text-[10px] font-bold rounded-full border mt-2 ${getStatusColor(tenant.contractStatus)}`}>
 {tenant.contractStatus}
 </span>
 </div>
 </div>
 
 <div className="space-y-2 mb-3">
 <div className="flex items-center gap-2 text-[11px]">
 <Phone className="w-4 h-4 text-gray-400" />
 <span className="text-gray-600">{tenant.contactNumber}</span>
 </div>
 <div className="flex items-center gap-2 text-[11px]">
 <Mail className="w-4 h-4 text-gray-400" />
 <span className="text-gray-600">{tenant.email}</span>
 </div>
 {tenant.propertyRented && (
 <div className="flex items-center gap-2 text-[11px]">
 <Building2 className="w-4 h-4 text-gray-400" />
 <span className="text-gray-600">{tenant.propertyRented}</span>
 </div>
 )}
 </div>

 <div className="flex items-center justify-between pt-3 border-t border-gray-100">
 <div className="text-[11px]">
 <div className="font-semibold text-emerald-600">₱{(tenant.depositPaid || 0).toLocaleString()} deposit</div>
 <div className="text-gray-500">Last: {tenant.lastPayment || 'N/A'}</div>
 </div>
 <div className="flex gap-2">
 <button 
 onClick={() => handleViewDetails(tenant, 'tenant')}
 className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
 >
 <Eye className="w-4 h-4" />
 </button>
 {user?.role?.toLowerCase() === 'admin' && (
 <>
 <button
 className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
 onClick={() => {
 setEditingItem(tenant);
 setShowEditTenantModal(true);
 }}
 >
 <Edit className="w-4 h-4" />
 </button>
 <button
 className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
 onClick={() => {
 setEditingItem(tenant);
 setShowDeleteTenantModal(true);
 }}
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </>
 )}
 </div>
 </div>
 </div>
 ))}
 </div>

 <div className="hidden md:block overflow-x-auto">
 <table className="w-full">
 <thead className="bg-gray-50 border-b border-gray-200">
 <tr>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Name</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Business</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contact</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Property</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Deposit</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Last Payment</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {getPaginatedData().map((tenant) => (
 <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
 <td className="px-5 py-3.5">
 <div className="font-semibold text-gray-900">{tenant.name}</div>
 </td>
 <td className="px-5 py-3.5 text-[11px] text-gray-500">{tenant.businessName}</td>
 <td className="px-5 py-3.5">
 <div className="text-[11px] text-gray-500">{tenant.contactNumber}</div>
 <div className="text-xs text-gray-400">{tenant.email}</div>
 </td>
 <td className="px-5 py-3.5 text-[11px] text-gray-500">{tenant.propertyRented || '-'}</td>
 <td className="px-5 py-3.5">
 <span className={`px-3 py-1 text-[10px] font-bold rounded-full border ${getStatusColor(tenant.contractStatus)}`}>
 {tenant.contractStatus}
 </span>
 </td>
 <td className="px-5 py-3.5 text-[11px] font-semibold text-gray-700">₱{(tenant.depositPaid || 0).toLocaleString()}</td>
 <td className="px-5 py-3.5 text-[11px] text-gray-500">{tenant.lastPayment}</td>
 <td className="px-5 py-3.5">
 <div className="flex gap-2">
 <button 
 onClick={() => handleViewDetails(tenant, 'tenant')}
 className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
 >
 <Eye className="w-4 h-4" />
 </button>
 {user?.role?.toLowerCase() === 'admin' && (
 <>
 <button
 className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
 onClick={() => {
 setEditingItem(tenant);
 setShowEditTenantModal(true);
 }}
 >
 <Edit className="w-4 h-4" />
 </button>
 <button
 className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
 onClick={() => {
 setEditingItem(tenant);
 setShowDeleteTenantModal(true);
 }}
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </>
 )}
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 {getPaginatedData().length === 0 && (
 <div className="text-center py-12">
 <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
 <p className="text-gray-500 font-medium">No tenants found</p>
 </div>
 )}
 </div>
 )}

 {/* Contracts Tab - Shows all rental agreements */}
 {activeTab === 'contracts' && (
 <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
 {/* Mobile Cards */}
 <div className="block md:hidden">
 {getPaginatedData().map((contract) => (
 <div key={contract.id} className="p-4 border-b border-gray-100 last:border-b-0">
 <div className="flex items-start justify-between mb-3">
 <div className="flex-1">
 <h3 className="font-bold text-gray-900 text-[13px]">{contract.contractNumber}</h3>
 <span className={`inline-block px-3 py-1 text-[10px] font-bold rounded-full border mt-2 ${getStatusColor(contract.status)}`}>
 {contract.status}
 </span>
 </div>
 </div>
 
 <div className="space-y-2 mb-3">
 <div className="flex items-center gap-2 text-[11px]">
 <Building2 className="w-4 h-4 text-gray-400" />
 <span className="text-gray-600">{contract.property}</span>
 </div>
 <div className="flex items-center gap-2 text-[11px]">
 <Users className="w-4 h-4 text-gray-400" />
 <span className="text-gray-600">{contract.tenant}</span>
 </div>
 <div className="flex items-center gap-2 text-[11px]">
 <Calendar className="w-4 h-4 text-gray-400" />
 <span className="text-gray-600">{contract.startDate} to {contract.endDate}</span>
 </div>
 </div>

 <div className="flex items-center justify-between pt-3 border-t border-gray-100">
 <div className="text-[11px]">
 <div className="font-semibold text-emerald-600">₱{contract.monthlyRent.toLocaleString()}/mo</div>
 <div className="text-gray-500">Deposit: ₱{contract.deposit.toLocaleString()}</div>
 <div className={`font-semibold ${contract.daysRemaining < 60 ? 'text-amber-600' : 'text-emerald-600'}`}>
 {contract.daysRemaining > 0 ? `${contract.daysRemaining} days left` : 'Expired'}
 </div>
 </div>
 <div className="flex gap-2">
 <button 
 onClick={() => handleViewDetails(contract, 'contract')}
 className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
 >
 <Eye className="w-4 h-4" />
 </button>
 {user?.role?.toLowerCase() === 'admin' && (
 <>
 <button
 className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
 onClick={() => {
 setEditingItem(contract);
 setShowEditContractModal(true);
 }}
 >
 <Edit className="w-4 h-4" />
 </button>
 <button
 className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
 onClick={() => {
 setEditingItem(contract);
 setShowDeleteContractModal(true);
 }}
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </>
 )}
 </div>
 </div>
 </div>
 ))}
 </div>

 <div className="hidden md:block overflow-x-auto">
 <table className="w-full">
 <thead className="bg-gray-50 border-b border-gray-200">
 <tr>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contract #</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Property</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tenant</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Period</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Monthly Rent</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Deposit</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Days Left</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {getPaginatedData().map((contract) => (
 <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
 <td className="px-5 py-3.5">
 <div className="font-semibold text-gray-900">{contract.contractNumber}</div>
 </td>
 <td className="px-5 py-3.5 text-[11px] text-gray-500">{contract.property}</td>
 <td className="px-5 py-3.5 text-[11px] text-gray-500">{contract.tenant}</td>
 <td className="px-5 py-3.5 text-[11px] text-gray-500">
 {contract.startDate} to {contract.endDate}
 </td>
 <td className="px-5 py-3.5 font-semibold text-emerald-600">₱{contract.monthlyRent.toLocaleString()}</td>
 <td className="px-5 py-3.5 text-[11px] text-gray-500">₱{contract.deposit.toLocaleString()}</td>
 <td className="px-5 py-3.5">
 <span className={`px-3 py-1 text-[10px] font-bold rounded-full border ${getStatusColor(contract.status)}`}>
 {contract.status}
 </span>
 </td>
 <td className="px-5 py-3.5">
 <div className={`text-[11px] font-semibold ${contract.daysRemaining < 60 ? 'text-amber-600' : 'text-emerald-600'}`}>
 {contract.daysRemaining > 0 ? `${contract.daysRemaining} days` : 'Expired'}
 </div>
 </td>
 <td className="px-5 py-3.5">
 <div className="flex gap-2">
 <button 
 onClick={() => handleViewDetails(contract, 'contract')}
 className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
 >
 <Eye className="w-4 h-4" />
 </button>
 {user?.role?.toLowerCase() === 'admin' && (
 <>
 <button
 className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
 onClick={() => {
 setEditingItem(contract);
 setShowEditContractModal(true);
 }}
 >
 <Edit className="w-4 h-4" />
 </button>
 <button
 className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
 onClick={() => {
 setEditingItem(contract);
 setShowDeleteContractModal(true);
 }}
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </>
 )}
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 {getPaginatedData().length === 0 && (
 <div className="text-center py-12">
 <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
 <p className="text-gray-500 font-medium">No contracts found</p>
 </div>
 )}
 </div>
 )}

 {/* Payments Tab - Shows all rent payments and billing */}
 {activeTab === 'payments' && (
 <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
 {/* Mobile Cards */}
 <div className="block md:hidden">
 {getPaginatedData().map((payment) => (
 <div key={payment.id} className="p-4 border-b border-gray-100 last:border-b-0">
 <div className="flex items-start justify-between mb-3">
 <div className="flex-1">
 <h3 className="font-bold text-gray-900 text-[13px]">{payment.paymentNumber}</h3>
 <span className={`inline-block px-3 py-1 text-[10px] font-bold rounded-full border mt-2 ${getStatusColor(payment.status)}`}>
 {payment.status}
 </span>
 </div>
 </div>
 
 <div className="space-y-2 mb-3">
 <div className="flex items-center gap-2 text-[11px]">
 <Users className="w-4 h-4 text-gray-400" />
 <span className="text-gray-600">{payment.tenant}</span>
 </div>
 <div className="flex items-center gap-2 text-[11px]">
 <Building2 className="w-4 h-4 text-gray-400" />
 <span className="text-gray-600">{payment.property}</span>
 </div>
 <div className="flex items-center gap-2 text-[11px]">
 <Calendar className="w-4 h-4 text-gray-400" />
 <span className="text-gray-600">{payment.month}</span>
 </div>
 {payment.paymentDate && (
 <div className="flex items-center gap-2 text-[11px]">
 <CheckCircle className="w-4 h-4 text-gray-400" />
 <span className="text-gray-600">Paid: {payment.paymentDate}</span>
 </div>
 )}
 {payment.method && (
 <div className="flex items-center gap-2 text-[11px]">
 <DollarSign className="w-4 h-4 text-gray-400" />
 <span className="text-gray-600">{payment.method}</span>
 </div>
 )}
 </div>

 <div className="flex items-center justify-between pt-3 border-t border-gray-100">
 <div className="text-[11px] font-semibold text-emerald-600">₱{payment.amount.toLocaleString()}</div>
 <div className="flex gap-2">
 <button 
 onClick={() => handleViewDetails(payment, 'payment')}
 className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
 >
 <Eye className="w-4 h-4" />
 </button>
 {user?.role?.toLowerCase() === 'admin' && (
 <>
 <button
 className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
 onClick={() => {
 setEditingItem(payment);
 setShowEditPaymentModal(true);
 }}
 >
 <Edit className="w-4 h-4" />
 </button>
 <button
 className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
 onClick={() => {
 setEditingItem(payment);
 setShowDeletePaymentModal(true);
 }}
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </>
 )}
 {payment.status === 'Pending' && (
 <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
 <CheckCircle className="w-4 h-4" />
 </button>
 )}
 </div>
 </div>
 </div>
 ))}
 </div>

 <div className="hidden md:block overflow-x-auto">
 <table className="w-full">
 <thead className="bg-gray-50 border-b border-gray-200">
 <tr>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment #</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tenant</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Property</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Amount</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Month</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment Date</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Method</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {getPaginatedData().map((payment) => (
 <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
 <td className="px-5 py-3.5">
 <div className="font-semibold text-gray-900">{payment.paymentNumber}</div>
 </td>
 <td className="px-5 py-3.5 text-[11px] text-gray-500">{payment.tenant}</td>
 <td className="px-5 py-3.5 text-[11px] text-gray-500">{payment.property}</td>
 <td className="px-5 py-3.5 font-semibold text-emerald-600">₱{payment.amount.toLocaleString()}</td>
 <td className="px-5 py-3.5 text-[11px] text-gray-500">{payment.month}</td>
 <td className="px-5 py-3.5 text-[11px] text-gray-500">{payment.paymentDate || '-'}</td>
 <td className="px-5 py-3.5 text-[11px] text-gray-500">{payment.method || '-'}</td>
 <td className="px-5 py-3.5">
 <span className={`px-3 py-1 text-[10px] font-bold rounded-full border ${getStatusColor(payment.status)}`}>
 {payment.status}
 </span>
 </td>
 <td className="px-5 py-3.5">
 <div className="flex gap-2">
 <button 
 onClick={() => handleViewDetails(payment, 'payment')}
 className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
 >
 <Eye className="w-4 h-4" />
 </button>
 {user?.role?.toLowerCase() === 'admin' && (
 <>
 <button
 className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
 onClick={() => {
 setEditingItem(payment);
 setShowEditPaymentModal(true);
 }}
 >
 <Edit className="w-4 h-4" />
 </button>
 <button
 className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
 onClick={() => {
 setEditingItem(payment);
 setShowDeletePaymentModal(true);
 }}
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </>
 )}
 {payment.status === 'Pending' && (
 <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
 <CheckCircle className="w-4 h-4" />
 </button>
 )}
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 {getPaginatedData().length === 0 && (
 <div className="text-center py-12">
 <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
 <p className="text-gray-500 font-medium">No payments found</p>
 </div>
 )}
 </div>
 )}

 {/* Maintenance Tab - Shows all maintenance requests and repairs */}
 {activeTab === 'maintenance' && (
 <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
 {/* Mobile Cards */}
 <div className="block md:hidden">
 {getPaginatedData().map((request) => (
 <div key={request.id} className="p-4 border-b border-gray-100 last:border-b-0">
 <div className="flex items-start justify-between mb-3">
 <div className="flex-1">
 <h3 className="font-bold text-gray-900 text-[13px]">{request.requestNumber}</h3>
 <div className="flex gap-2 mt-2">
 <span className={`px-3 py-1 text-[10px] font-bold rounded-full border ${getPriorityColor(request.priority)}`}>
 {request.priority}
 </span>
 <span className={`px-3 py-1 text-[10px] font-bold rounded-full border ${getStatusColor(request.status)}`}>
 {request.status}
 </span>
 </div>
 </div>
 </div>
 
 <div className="space-y-2 mb-3">
 <div className="flex items-center gap-2 text-[11px]">
 <Building2 className="w-4 h-4 text-gray-400" />
 <span className="text-gray-600">{request.property}</span>
 </div>
 <div className="flex items-center gap-2 text-[11px]">
 <Users className="w-4 h-4 text-gray-400" />
 <span className="text-gray-600">{request.tenant}</span>
 </div>
 <div className="text-[11px] text-gray-500 max-w-xs">
 <strong>Issue:</strong> {request.issue}
 </div>
 <div className="flex items-center gap-2 text-[11px]">
 <Calendar className="w-4 h-4 text-gray-400" />
 <span className="text-gray-600">Reported: {request.dateReported}</span>
 </div>
 {request.assignedTo && (
 <div className="flex items-center gap-2 text-[11px]">
 <Wrench className="w-4 h-4 text-gray-400" />
 <span className="text-gray-600">Assigned: {request.assignedTo}</span>
 </div>
 )}
 </div>

 <div className="flex items-center justify-between pt-3 border-t border-gray-100">
 <div className="text-[11px] text-gray-500">
 Maintenance Request
 </div>
 <div className="flex gap-2">
 <button 
 onClick={() => handleViewDetails(request, 'maintenance')}
 className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
 >
 <Eye className="w-4 h-4" />
 </button>
 {user?.role?.toLowerCase() === 'admin' && (
 <>
 <button
 className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
 onClick={() => {
 setEditingItem(request);
 setShowEditMaintenanceModal(true);
 }}
 >
 <Edit className="w-4 h-4" />
 </button>
 <button
 className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
 onClick={() => {
 setEditingItem(request);
 setShowDeleteMaintenanceModal(true);
 }}
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </>
 )}
 </div>
 </div>
 </div>
 ))}
 </div>

 <div className="hidden md:block overflow-x-auto">
 <table className="w-full">
 <thead className="bg-gray-50 border-b border-gray-200">
 <tr>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Request #</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Property</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tenant</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Issue</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Priority</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date Reported</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assigned To</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {getPaginatedData().map((request) => (
 <tr key={request.id} className="hover:bg-gray-50 transition-colors">
 <td className="px-5 py-3.5">
 <div className="font-semibold text-gray-900">{request.requestNumber}</div>
 </td>
 <td className="px-5 py-3.5 text-[11px] text-gray-500">{request.property}</td>
 <td className="px-5 py-3.5 text-[11px] text-gray-500">{request.tenant}</td>
 <td className="px-5 py-3.5 text-[11px] text-gray-500 max-w-xs truncate">{request.issue}</td>
 <td className="px-5 py-3.5">
 <span className={`px-3 py-1 text-[10px] font-bold rounded-full border ${getPriorityColor(request.priority)}`}>
 {request.priority}
 </span>
 </td>
 <td className="px-5 py-3.5">
 <span className={`px-3 py-1 text-[10px] font-bold rounded-full border ${getStatusColor(request.status)}`}>
 {request.status}
 </span>
 </td>
 <td className="px-5 py-3.5 text-[11px] text-gray-500">{request.dateReported}</td>
 <td className="px-5 py-3.5 text-[11px] text-gray-500">{request.assignedTo || 'Unassigned'}</td>
 <td className="px-5 py-3.5">
 <div className="flex gap-2">
 <button 
 onClick={() => handleViewDetails(request, 'maintenance')}
 className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
 >
 <Eye className="w-4 h-4" />
 </button>
 {user?.role?.toLowerCase() === 'admin' && (
 <>
 <button
 className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
 onClick={() => {
 setEditingItem(request);
 setShowEditMaintenanceModal(true);
 }}
 >
 <Edit className="w-4 h-4" />
 </button>
 <button
 className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
 onClick={() => {
 setEditingItem(request);
 setShowDeleteMaintenanceModal(true);
 }}
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </>
 )}
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 {getPaginatedData().length === 0 && (
 <div className="text-center py-12">
 <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
 <p className="text-gray-500 font-medium">No maintenance requests found</p>
 </div>
 )}
 </div>
 )}

 {/* Pagination - Shows for all tabs */}
 {getPaginatedData().length > 0 && (
 <div className="mt-6">
 <Pagination
 currentPage={currentPage}
 totalPages={totalPages}
 totalItems={getFilteredData().length}
 itemsPerPage={itemsPerPage}
 onPageChange={setCurrentPage}
 onItemsPerPageChange={(newValue) => {
 setItemsPerPage(newValue);
 setCurrentPage(1);
 }}
 />
 </div>
 )}

 {/* DETAILS MODAL - Shows complete information for selected item */}
 {showDetailsModal && selectedItem && (
 <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-xl shadow-sm max-w-3xl w-full max-h-[90vh] overflow-y-auto">
 {/* Modal Header */}
 <div className="sticky top-0 bg-emerald-600 text-white p-6 rounded-t-xl">
 <div className="flex items-center justify-between">
 <div>
 <h2 className="text-2xl font-bold">
 {detailsType === 'property' && 'Property Details'}
 {detailsType === 'tenant' && 'Tenant Details'}
 {detailsType === 'contract' && 'Contract Details'}
 {detailsType === 'payment' && 'Payment Details'}
 {detailsType === 'maintenance' && 'Maintenance Request Details'}
 </h2>
 <p className="text-emerald-100 text-[11px] mt-1">
 Complete information and history
 </p>
 </div>
 <button
 onClick={() => {
 setShowDetailsModal(false);
 setSelectedItem(null);
 }}
 className="p-2 hover:bg-white/20 rounded-lg transition-colors"
 >
 <XCircle className="w-6 h-6" />
 </button>
 </div>
 </div>

 {/* Modal Body - Property Details */}
 {detailsType === 'property' && (
 <div className="p-5 space-y-5">
 {/* Basic Information */}
 <div className="bg-gray-50 rounded-xl p-6">
 <h3 className="text-[11px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
 <Building2 className="w-5 h-5 text-emerald-600" />
 Basic Information
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Property Name</label>
 <p className="text-gray-900 font-bold text-[13px]">{selectedItem.name}</p>
 </div>
 {selectedItem.stall_number && (
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Stall Number</label>
 <p className="text-gray-900 font-semibold">{selectedItem.stall_number}</p>
 </div>
 )}
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Type</label>
 <p className="text-gray-900 font-semibold">{selectedItem.type}</p>
 </div>
 <div className="md:col-span-2">
 <label className="text-[11px] text-gray-500 font-medium">Location</label>
 <p className="text-gray-900 flex items-center gap-2">
 <MapPin className="w-4 h-4 text-gray-400" />
 {selectedItem.location}
 </p>
 </div>
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Size</label>
 <p className="text-gray-900 font-semibold">{selectedItem.size}</p>
 </div>
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Status</label>
 <p>
 <span className={`inline-block px-3 py-1 text-[10px] font-bold rounded-full border ${getStatusColor(selectedItem.status)}`}>
 {selectedItem.status}
 </span>
 </p>
 </div>
 </div>
 </div>

 {/* Financial Information */}
 <div className="bg-emerald-50 rounded-xl p-6">
 <h3 className="text-[11px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
 <DollarSign className="w-5 h-5 text-emerald-600" />
 Financial Details
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Monthly Rate</label>
 <p className="text-2xl font-bold text-emerald-600">₱{selectedItem.monthlyRate.toLocaleString()}</p>
 <p className="text-xs text-gray-500">per month</p>
 </div>
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Annual Revenue</label>
 <p className="text-2xl font-bold text-gray-700">₱{(selectedItem.monthlyRate * 12).toLocaleString()}</p>
 <p className="text-xs text-gray-500">projected yearly</p>
 </div>
 </div>
 </div>

 {/* Current Tenant Information */}
 {selectedItem.tenant && (
 <div className="bg-emerald-50 rounded-xl p-6">
 <h3 className="text-[11px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
 <Users className="w-5 h-5 text-emerald-600" />
 Current Tenant
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Tenant Name</label>
 <p className="text-gray-900 font-semibold">{selectedItem.tenant}</p>
 </div>
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Contract End Date</label>
 <p className="text-gray-900 flex items-center gap-2">
 <Calendar className="w-4 h-4 text-gray-400" />
 {selectedItem.contractEnd}
 </p>
 </div>
 </div>
 </div>
 )}

 {/* Action Buttons */}
 <div className="flex gap-3">
 <button className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:shadow-sm transition-all">
 Edit Property
 </button>
 <button className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition-all">
 View History
 </button>
 </div>
 </div>
 )}

 {/* Modal Body - Tenant Details */}
 {detailsType === 'tenant' && (
 <div className="p-5 space-y-5">
 {/* Personal Information */}
 <div className="bg-gray-50 rounded-xl p-6">
 <h3 className="text-[11px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
 <Users className="w-5 h-5 text-emerald-600" />
 Personal Information
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Full Name</label>
 <p className="text-gray-900 font-bold text-[13px]">{selectedItem.name}</p>
 </div>
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Business Name</label>
 <p className="text-gray-900 font-semibold">{selectedItem.businessName}</p>
 </div>
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Contact Number</label>
 <p className="text-gray-900 flex items-center gap-2">
 <Phone className="w-4 h-4 text-gray-400" />
 {selectedItem.contactNumber}
 </p>
 </div>
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Email Address</label>
 <p className="text-gray-900 flex items-center gap-2">
 <Mail className="w-4 h-4 text-gray-400" />
 {selectedItem.email}
 </p>
 </div>
 </div>
 </div>

 {/* Contract Information */}
 <div className="bg-emerald-50 rounded-xl p-6">
 <h3 className="text-[11px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
 <FileText className="w-5 h-5 text-emerald-600" />
 Contract Information
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Current Property</label>
 <p className="text-gray-900 font-semibold">{selectedItem.propertyRented || 'No active rental'}</p>
 </div>
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Contract Status</label>
 <p>
 <span className={`inline-block px-3 py-1 text-[10px] font-bold rounded-full border ${getStatusColor(selectedItem.contractStatus)}`}>
 {selectedItem.contractStatus}
 </span>
 </p>
 </div>
 </div>
 </div>

 {/* Financial Information */}
 <div className="bg-emerald-50 rounded-xl p-6">
 <h3 className="text-[11px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
 <DollarSign className="w-5 h-5 text-emerald-600" />
 Financial Information
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Security Deposit Paid</label>
 <p className="text-2xl font-bold text-emerald-600">₱{(selectedItem.depositPaid || 0).toLocaleString()}</p>
 </div>
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Last Payment</label>
 <p className="text-gray-900 font-semibold">{selectedItem.lastPayment}</p>
 </div>
 </div>
 </div>

 {/* Action Buttons */}
 <div className="flex gap-3">
 <button className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:shadow-sm transition-all">
 Edit Tenant
 </button>
 <button className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition-all">
 Payment History
 </button>
 </div>
 </div>
 )}

 {/* Modal Body - Contract Details */}
 {detailsType === 'contract' && (
 <div className="p-5 space-y-5">
 {/* Contract Information */}
 <div className="bg-gray-50 rounded-xl p-6">
 <h3 className="text-[11px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
 <FileText className="w-5 h-5 text-emerald-600" />
 Contract Information
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="md:col-span-2">
 <label className="text-[11px] text-gray-500 font-medium">Contract Number</label>
 <p className="text-gray-900 font-bold text-xl">{selectedItem.contractNumber}</p>
 </div>
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Property</label>
 <p className="text-gray-900 font-semibold">{selectedItem.property}</p>
 </div>
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Tenant</label>
 <p className="text-gray-900 font-semibold">{selectedItem.tenant}</p>
 </div>
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Start Date</label>
 <p className="text-gray-900">{selectedItem.startDate}</p>
 </div>
 <div>
 <label className="text-[11px] text-gray-500 font-medium">End Date</label>
 <p className="text-gray-900">{selectedItem.endDate}</p>
 </div>
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Status</label>
 <p>
 <span className={`inline-block px-3 py-1 text-[10px] font-bold rounded-full border ${getStatusColor(selectedItem.status)}`}>
 {selectedItem.status}
 </span>
 </p>
 </div>
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Days Remaining</label>
 <p className={`font-bold text-[13px] ${selectedItem.daysRemaining < 60 ? 'text-amber-600' : 'text-emerald-600'}`}>
 {selectedItem.daysRemaining > 0 ? `${selectedItem.daysRemaining} days` : 'Expired'}
 </p>
 </div>
 </div>
 </div>

 {/* Financial Terms */}
 <div className="bg-emerald-50 rounded-xl p-6">
 <h3 className="text-[11px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
 <DollarSign className="w-5 h-5 text-emerald-600" />
 Financial Terms
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Monthly Rent</label>
 <p className="text-2xl font-bold text-emerald-600">₱{selectedItem.monthlyRent.toLocaleString()}</p>
 </div>
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Security Deposit</label>
 <p className="text-2xl font-bold text-emerald-600">₱{selectedItem.deposit.toLocaleString()}</p>
 </div>
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Total Contract Value</label>
 <p className="text-2xl font-bold text-gray-700">
 ₱{(selectedItem.monthlyRent * Math.ceil((new Date(selectedItem.endDate) - new Date(selectedItem.startDate)) / (1000 * 60 * 60 * 24 * 30))).toLocaleString()}
 </p>
 </div>
 </div>
 </div>

 {/* Warning if expiring soon */}
 {selectedItem.daysRemaining > 0 && selectedItem.daysRemaining < 60 && (
 <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
 <div className="flex items-center gap-3">
 <AlertTriangle className="w-6 h-6 text-amber-600" />
 <div>
 <p className="font-semibold text-amber-900">Contract Expiring Soon!</p>
 <p className="text-[11px] text-amber-700">Contact tenant for renewal within {selectedItem.daysRemaining} days</p>
 </div>
 </div>
 </div>
 )}

 {/* Action Buttons */}
 <div className="flex gap-3">
 <button className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:shadow-sm transition-all">
 Renew Contract
 </button>
 <button className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition-all">
 Edit Terms
 </button>
 <button className="px-4 py-3 border-2 border-rose-300 text-rose-700 rounded-lg font-semibold hover:border-rose-400 transition-all">
 Terminate
 </button>
 </div>
 </div>
 )}

 {/* Modal Body - Payment Details */}
 {detailsType === 'payment' && (
 <div className="p-5 space-y-5">
 {/* Payment Information */}
 <div className="bg-gray-50 rounded-xl p-6">
 <h3 className="text-[11px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
 <DollarSign className="w-5 h-5 text-emerald-600" />
 Payment Information
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="md:col-span-2">
 <label className="text-[11px] text-gray-500 font-medium">Payment Number</label>
 <p className="text-gray-900 font-bold text-xl">{selectedItem.paymentNumber}</p>
 </div>
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Tenant</label>
 <p className="text-gray-900 font-semibold">{selectedItem.tenant}</p>
 </div>
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Property</label>
 <p className="text-gray-900 font-semibold">{selectedItem.property}</p>
 </div>
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Month Covered</label>
 <p className="text-gray-900 font-semibold">{selectedItem.month}</p>
 </div>
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Status</label>
 <p>
 <span className={`inline-block px-3 py-1 text-[10px] font-bold rounded-full border ${getStatusColor(selectedItem.status)}`}>
 {selectedItem.status}
 </span>
 </p>
 </div>
 </div>
 </div>

 {/* Amount Details */}
 <div className="bg-emerald-50 rounded-xl p-6">
 <h3 className="text-[11px] font-semibold text-gray-900 mb-4">Amount Details</h3>
 <div className="space-y-3">
 <div className="flex justify-between items-center pb-3 border-b border-emerald-200">
 <span className="text-gray-600">Rental Amount</span>
 <span className="text-[11px] font-semibold text-gray-900">₱{selectedItem.amount.toLocaleString()}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-gray-600 font-medium">Total Amount</span>
 <span className="text-3xl font-bold text-emerald-600">₱{selectedItem.amount.toLocaleString()}</span>
 </div>
 </div>
 </div>

 {/* Payment Method & Date */}
 <div className="bg-emerald-50 rounded-xl p-6">
 <h3 className="text-[11px] font-semibold text-gray-900 mb-4">Payment Details</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Payment Method</label>
 <p className="text-gray-900 font-semibold">{selectedItem.method || 'Not specified'}</p>
 </div>
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Payment Date</label>
 <p className="text-gray-900 font-semibold">{selectedItem.paymentDate || 'Not paid yet'}</p>
 </div>
 </div>
 </div>

 {/* Action Buttons */}
 <div className="flex gap-3">
 {selectedItem.status === 'Pending' && (
 <button className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:shadow-sm transition-all">
 Mark as Paid
 </button>
 )}
 <button className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:shadow-sm transition-all">
 Download Receipt
 </button>
 <button className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition-all">
 Send Reminder
 </button>
 </div>
 </div>
 )}

 {/* Modal Body - Maintenance Details */}
 {detailsType === 'maintenance' && (
 <div className="p-5 space-y-5">
 {/* Request Information */}
 <div className="bg-gray-50 rounded-xl p-6">
 <h3 className="text-[11px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
 <Wrench className="w-5 h-5 text-emerald-600" />
 Request Information
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="md:col-span-2">
 <label className="text-[11px] text-gray-500 font-medium">Request Number</label>
 <p className="text-gray-900 font-bold text-xl">{selectedItem.requestNumber}</p>
 </div>
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Property</label>
 <p className="text-gray-900 font-semibold">{selectedItem.property}</p>
 </div>
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Tenant</label>
 <p className="text-gray-900 font-semibold">{selectedItem.tenant}</p>
 </div>
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Date Reported</label>
 <p className="text-gray-900">{selectedItem.dateReported}</p>
 </div>
 <div>
 <label className="text-[11px] text-gray-500 font-medium">Assigned To</label>
 <p className="text-gray-900">{selectedItem.assignedTo || 'Unassigned'}</p>
 </div>
 </div>
 </div>

 {/* Issue Details */}
 <div className="bg-amber-50 rounded-xl p-6">
 <h3 className="text-[11px] font-semibold text-gray-900 mb-4">Issue Description</h3>
 <p className="text-gray-700 leading-relaxed">{selectedItem.issue}</p>
 </div>

 {/* Priority & Status */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="bg-rose-50 rounded-xl p-6">
 <label className="text-[11px] text-gray-500 font-medium">Priority Level</label>
 <p className="mt-2">
 <span className={`inline-block px-4 py-2 text-[11px] font-bold rounded-full border-2 ${getPriorityColor(selectedItem.priority)}`}>
 {selectedItem.priority} Priority
 </span>
 </p>
 </div>
 <div className="bg-emerald-50 rounded-xl p-6">
 <label className="text-[11px] text-gray-500 font-medium">Current Status</label>
 <p className="mt-2">
 <span className={`inline-block px-4 py-2 text-[11px] font-bold rounded-full border-2 ${getStatusColor(selectedItem.status)}`}>
 {selectedItem.status}
 </span>
 </p>
 </div>
 </div>

 {/* Action Buttons */}
 <div className="flex gap-3">
 {selectedItem.status === 'Pending' && (
 <button className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:shadow-sm transition-all">
 Assign Staff
 </button>
 )}
 {selectedItem.status === 'In Progress' && (
 <button className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:shadow-sm transition-all">
 Mark as Completed
 </button>
 )}
 <button className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition-all">
 Update Status
 </button>
 <button className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition-all">
 Add Notes
 </button>
 </div>
 </div>
 )}
 </div>
 </div>
 )}

 {/* EDIT PROPERTY MODAL */}
 {showEditPropertyModal && editingItem && (
 <Modal
 isOpen={showEditPropertyModal}
 onClose={() => {
 setShowEditPropertyModal(false);
 setEditPropertyData({
 name: '',
 stall_number: '',
 type: '',
 location: '',
 size: '',
 monthly_rate: '',
 status: ''
 });
 }}
 title="Edit Property"
 subtitle="Update property information"
 icon={<Building2 className="w-6 h-6" />}
 size="md"
 >
 <form className="space-y-6" onSubmit={(e) => {
 e.preventDefault();
 const propertyData = {
 name: editPropertyData.name,
 stall_number: stallNumberInput,
 type: editPropertyData.type,
 location: editPropertyData.location,
 size: editPropertyData.size,
 monthly_rate: parseFloat(editPropertyData.monthly_rate) || 0,
 status: editPropertyData.status
 };
 handleEditProperty(propertyData);
 }}>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Stall/Unit Number</label>
 <input
 name="stall_number"
 type="text"
 value={stallNumberInput}
 onChange={(e) => setStallNumberInput(e.target.value)}
 disabled={user?.role?.toLowerCase() === 'staff'}
 className={`w-full px-4 py-3 border rounded-lg focus:ring-2 transition-colors ${
 stallNumberError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-emerald-500'
 } ${user?.role?.toLowerCase() === 'staff' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
 placeholder="e.g., Stall 1, Unit A"
 />
 {stallNumberError && (
 <p className="text-red-500 text-xs mt-1">{stallNumberError}</p>
 )}
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Property Name</label>
 <input
 name="name"
 type="text"
 value={editPropertyData.name}
 onChange={(e) => setEditPropertyData(prev => ({ ...prev, name: e.target.value }))}
 disabled={user?.role?.toLowerCase() === 'staff'}
 className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-emerald-500 transition-colors ${
 user?.role?.toLowerCase() === 'staff' ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300 focus:ring-emerald-500'
 }`}
 placeholder="Enter property name"
 required
 />
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Property Type</label>
 <select 
 name="type" 
 value={editPropertyData.type}
 onChange={(e) => setEditPropertyData(prev => ({ ...prev, type: e.target.value }))}
 disabled={user?.role?.toLowerCase() === 'staff'}
 className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-emerald-500 transition-colors ${
 user?.role?.toLowerCase() === 'staff' ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300 focus:ring-emerald-500'
 }`} 
 required
 >
 <option value="Commercial">Commercial</option>
 <option value="Residential">Residential</option>
 </select>
 </div>
 <div className="md:col-span-2">
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Location</label>
 <input
 name="location"
 type="text"
 value={editPropertyData.location}
 onChange={(e) => setEditPropertyData(prev => ({ ...prev, location: e.target.value }))}
 disabled={user?.role?.toLowerCase() === 'staff'}
 className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-emerald-500 transition-colors ${
 user?.role?.toLowerCase() === 'staff' ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300 focus:ring-emerald-500'
 }`}
 placeholder="Enter location details"
 required
 />
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Size (sqm)</label>
 <input
 name="size"
 type="text"
 value={editPropertyData.size}
 onChange={(e) => setEditPropertyData(prev => ({ ...prev, size: e.target.value }))}
 disabled={user?.role?.toLowerCase() === 'staff'}
 className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-emerald-500 transition-colors ${
 user?.role?.toLowerCase() === 'staff' ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300 focus:ring-emerald-500'
 }`}
 placeholder="e.g., 100 sqm or 100"
 required
 />
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Monthly Rate (₱)</label>
 <input
 name="monthly_rate"
 type="number"
 value={editPropertyData.monthly_rate}
 onChange={(e) => setEditPropertyData(prev => ({ ...prev, monthly_rate: e.target.value }))}
 disabled={user?.role?.toLowerCase() === 'staff'}
 className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-emerald-500 transition-colors ${
 user?.role?.toLowerCase() === 'staff' ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300 focus:ring-emerald-500'
 }`}
 placeholder="0.00"
 min="0"
 step="0.01"
 required
 />
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Status</label>
 <select name="status" value={editPropertyData.status} onChange={(e) => setEditPropertyData(prev => ({ ...prev, status: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors" required>
 <option value="Occupied">Occupied</option>
 <option value="Vacant">Vacant</option>
 <option value="Under Maintenance">Under Maintenance</option>
 </select>
 </div>
 </div>
 <div className="flex gap-3 pt-6 border-t border-gray-200">
 <button
 type="button"
 onClick={() => {
 setShowEditPropertyModal(false);
 setEditPropertyData({
 name: '',
 stall_number: '',
 type: '',
 location: '',
 size: '',
 monthly_rate: '',
 status: ''
 });
 }}
 className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={stallNumberError}
 className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
 stallNumberError
 ? 'bg-gray-400 cursor-not-allowed'
 : 'bg-emerald-600 text-white hover:shadow-sm'
 }`}
 >
 Update Property
 </button>
 </div>
 </form>
 </Modal>
 )}

 {/* DELETE PROPERTY MODAL */}
 {showDeletePropertyModal && editingItem && (
 <Modal
 isOpen={showDeletePropertyModal}
 onClose={() => setShowDeletePropertyModal(false)}
 title="Delete Property"
 subtitle="Are you sure you want to delete this property?"
 icon={<AlertTriangle className="w-6 h-6" />}
 size="sm"
 >
 <div className="space-y-4">
 <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
 <div className="flex items-start gap-3">
 <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5" />
 <div>
 <h4 className="font-semibold text-rose-900">Warning</h4>
 <p className="text-rose-700 text-[11px] mt-1">This action cannot be undone. This will permanently delete the property and remove all associated data.</p>
 </div>
 </div>
 </div>
 <div className="bg-gray-50 rounded-lg p-4">
 <h5 className="font-semibold text-gray-900 mb-2">Property Details:</h5>
 <p className="text-gray-700"><strong>Name:</strong> {editingItem.name}</p>
 <p className="text-gray-700"><strong>Address:</strong> {editingItem.address}</p>
 <p className="text-gray-700"><strong>Status:</strong> {editingItem.status}</p>
 </div>
 <div className="flex gap-3 pt-4 border-t border-gray-200">
 <button
 onClick={() => setShowDeletePropertyModal(false)}
 className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={() => handleDeleteProperty()}
 className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:shadow-sm transition-all"
 >
 Delete Property
 </button>
 </div>
 </div>
 </Modal>
 )}

 {/* EDIT TENANT MODAL */}
 {showEditTenantModal && editingItem && (
 <Modal
 isOpen={showEditTenantModal}
 onClose={() => setShowEditTenantModal(false)}
 title="Edit Tenant"
 subtitle="Update tenant information"
 icon={<Users className="w-6 h-6" />}
 size="md"
 >
 <form className="space-y-6" onSubmit={(e) => {
 e.preventDefault();
 const formData = new FormData(e.target);
 const tenantData = {
 name: formData.get('name'),
 business_name: formData.get('business_name'),
 email: formData.get('email'),
 contact_number: formData.get('contact_number'),
 property_rented_id: formData.get('property_rented_id'),
 contract_status: formData.get('contract_status'),
 deposit_paid: formData.get('deposit_paid')
 };
 handleEditTenant(tenantData);
 }}>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Full Name</label>
 <input
 name="name"
 type="text"
 defaultValue={editingItem.name || ''}
 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
 placeholder="Enter full name"
 required
 />
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Business Name (Optional)</label>
 <input
 name="business_name"
 type="text"
 defaultValue={editingItem.businessName || ''}
 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
 placeholder="Enter business name"
 />
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Contact Number</label>
 <input
 name="contact_number"
 type="tel"
 defaultValue={editingItem.contactNumber || ''}
 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
 placeholder="Enter contact number"
 required
 />
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Email</label>
 <input
 name="email"
 type="email"
 defaultValue={editingItem.email || ''}
 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
 placeholder="Enter email address"
 required
 />
 </div>
 <div className="md:col-span-2">
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Deposit Paid (₱)</label>
 <input
 name="deposit_paid"
 type="number"
 defaultValue={editingItem.depositPaid || ''}
 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
 placeholder="0.00"
 min="0"
 step="0.01"
 required
 />
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Assigned Property</label>
 <select name="property_rented_id" defaultValue={editingItem.propertyRentedId || ''} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors">
 <option value="">Select Available Property</option>
 {properties
 .filter(property => {
 // Show vacant properties OR the current property assigned to this tenant
 return !contracts.some(c => 
 c.propertyId == property.id && 
 c.status === 'Active'
 ) || property.id == editingItem.propertyRentedId;
 })
 .map(property => (
 <option key={property.id} value={property.id}>{property.name} - {property.location}</option>
 ))}
 </select>
 <p className="text-xs text-gray-500 mt-1">Change property assignment for this tenant</p>
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Contract Status</label>
 <select name="contract_status" defaultValue={editingItem.contractStatus || ''} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors" required>
 <option value="Active">Active</option>
 <option value="Inactive">Inactive</option>
 <option value="Expired">Expired</option>
 </select>
 </div>
 </div>
 <div className="flex gap-3 pt-6 border-t border-gray-200">
 <button
 type="button"
 onClick={() => setShowEditTenantModal(false)}
 className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
 >
 Cancel
 </button>
 <button
 type="submit"
 className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:shadow-sm transition-all"
 >
 Update Tenant
 </button>
 </div>
 </form>
 </Modal>
 )}

 {/* DELETE TENANT MODAL */}
 {showDeleteTenantModal && editingItem && (
 <Modal
 isOpen={showDeleteTenantModal}
 onClose={() => setShowDeleteTenantModal(false)}
 title="Delete Tenant"
 subtitle="Are you sure you want to delete this tenant?"
 icon={<AlertTriangle className="w-6 h-6" />}
 size="sm"
 >
 <div className="space-y-4">
 <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
 <div className="flex items-start gap-3">
 <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5" />
 <div>
 <h4 className="font-semibold text-rose-900">Warning</h4>
 <p className="text-rose-700 text-[11px] mt-1">This action cannot be undone. This will permanently delete the tenant and remove all associated rental records.</p>
 </div>
 </div>
 </div>
 <div className="bg-gray-50 rounded-lg p-4">
 <h5 className="font-semibold text-gray-900 mb-2">Tenant Details:</h5>
 <p className="text-gray-700"><strong>Name:</strong> {editingItem.name}</p>
 {editingItem.businessName && <p className="text-gray-700"><strong>Business:</strong> {editingItem.businessName}</p>}
 <p className="text-gray-700"><strong>Contact:</strong> {editingItem.contactNumber}</p>
 </div>
 <div className="flex gap-3 pt-4 border-t border-gray-200">
 <button
 onClick={() => setShowDeleteTenantModal(false)}
 className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={() => handleDeleteTenant()}
 className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:shadow-sm transition-all"
 >
 Delete Tenant
 </button>
 </div>
 </div>
 </Modal>
 )}

 {/* EDIT CONTRACT MODAL */}
 {showEditContractModal && editingItem && (
 <Modal
 isOpen={showEditContractModal}
 onClose={() => setShowEditContractModal(false)}
 title="Edit Contract"
 subtitle="Update rental contract details"
 icon={<FileText className="w-6 h-6" />}
 size="md"
 >
 <form className="space-y-6" onSubmit={(e) => {
 e.preventDefault();
 const formData = new FormData(e.target);
 const contractData = {
 contract_number: formData.get('contract_number'),
 property_id: formData.get('property_id'),
 tenant_id: formData.get('tenant_id'),
 start_date: formData.get('start_date'),
 end_date: formData.get('end_date'),
 monthly_rent: formData.get('monthly_rent'),
 deposit: formData.get('deposit'),
 status: formData.get('status')
 };
 handleEditContract(contractData);
 }}>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Contract Number</label>
 <input
 name="contract_number"
 type="text"
 defaultValue={editingItem.contractNumber || ''}
 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
 placeholder="Enter contract number"
 required
 />
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Tenant</label>
 <select name="tenant_id" defaultValue={editingItem.tenantId || ''} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors" required>
 <option value="">Select Tenant</option>
 {tenants.map(tenant => (
 <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Property</label>
 <select name="property_id" defaultValue={editingItem.propertyId || ''} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors" required>
 <option value="">Select Property</option>
 {properties.map(property => (
 <option key={property.id} value={property.id}>{property.name} - {property.location}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Monthly Rent (₱)</label>
 <input
 name="monthly_rent"
 type="number"
 defaultValue={editingItem.monthlyRent || ''}
 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
 placeholder="0.00"
 min="0"
 step="0.01"
 required
 />
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Deposit (₱)</label>
 <input
 name="deposit"
 type="number"
 defaultValue={editingItem.deposit || ''}
 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
 placeholder="0.00"
 min="0"
 step="0.01"
 required
 />
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Status</label>
 <select name="status" defaultValue={editingItem.status || ''} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors" required>
 <option value="Active">Active</option>
 <option value="Expired">Expired</option>
 <option value="Terminated">Terminated</option>
 </select>
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Start Date</label>
 <input
 name="start_date"
 type="date"
 defaultValue={editingItem.startDate || ''}
 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
 required
 />
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">End Date</label>
 <input
 name="end_date"
 type="date"
 defaultValue={editingItem.endDate || ''}
 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
 required
 />
 </div>
 </div>
 <div className="flex gap-3 pt-6 border-t border-gray-200">
 <button
 type="button"
 onClick={() => setShowEditContractModal(false)}
 className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
 >
 Cancel
 </button>
 <button
 type="submit"
 className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:shadow-sm transition-all"
 >
 Update Contract
 </button>
 </div>
 </form>
 </Modal>
 )}

 {/* DELETE CONTRACT MODAL */}
 {showDeleteContractModal && editingItem && (
 <Modal
 isOpen={showDeleteContractModal}
 onClose={() => setShowDeleteContractModal(false)}
 title="Delete Contract"
 subtitle="Are you sure you want to delete this rental contract?"
 icon={<AlertTriangle className="w-6 h-6" />}
 size="sm"
 >
 <div className="space-y-4">
 <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
 <div className="flex items-start gap-3">
 <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5" />
 <div>
 <h4 className="font-semibold text-rose-900">Warning</h4>
 <p className="text-rose-700 text-[11px] mt-1">This action cannot be undone. This will permanently delete the rental contract and all associated payment records.</p>
 </div>
 </div>
 </div>
 <div className="bg-gray-50 rounded-lg p-4">
 <h5 className="font-semibold text-gray-900 mb-2">Contract Details:</h5>
 <p className="text-gray-700"><strong>Contract #:</strong> {editingItem.contractNumber}</p>
 <p className="text-gray-700"><strong>Property:</strong> {editingItem.property}</p>
 <p className="text-gray-700"><strong>Tenant:</strong> {editingItem.tenant}</p>
 <p className="text-gray-700"><strong>Monthly Rent:</strong> ₱{editingItem.monthlyRent?.toLocaleString()}</p>
 </div>
 <div className="flex gap-3 pt-4 border-t border-gray-200">
 <button
 onClick={() => setShowDeleteContractModal(false)}
 className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={() => handleDeleteContract()}
 className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:shadow-sm transition-all"
 >
 Delete Contract
 </button>
 </div>
 </div>
 </Modal>
 )}

 {/* EDIT PAYMENT MODAL */}
 {showEditPaymentModal && editingItem && (
 <Modal
 isOpen={showEditPaymentModal}
 onClose={() => setShowEditPaymentModal(false)}
 title="Edit Payment"
 subtitle="Update payment information"
 icon={<DollarSign className="w-6 h-6" />}
 size="md"
 >
 <form className="space-y-6" onSubmit={(e) => {
 e.preventDefault();
 const formData = new FormData(e.target);
 const paymentData = {
 payment_number: formData.get('payment_number'),
 tenant_id: formData.get('tenant_id'),
 property_id: formData.get('property_id'),
 amount: formData.get('amount'),
 month: formData.get('month'),
 status: formData.get('status'),
 payment_date: formData.get('payment_date'),
 method: formData.get('method')
 };
 handleEditPayment(paymentData);
 }}>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Payment Number (Read-only)</label>
 <input
 name="payment_number"
 type="text"
 defaultValue={editingItem.paymentNumber || ''}
 className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
 placeholder="Payment number"
 disabled
 />
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Tenant</label>
 <select name="tenant_id" defaultValue={editingItem.tenantId || ''} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors" required>
 <option value="">Select Tenant</option>
 {tenants.map(tenant => (
 <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Property</label>
 <select name="property_id" defaultValue={editingItem.propertyId || ''} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors" required>
 <option value="">Select Property</option>
 {properties.map(property => (
 <option key={property.id} value={property.id}>{property.name} - {property.location}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Amount (₱)</label>
 <input
 name="amount"
 type="number"
 defaultValue={editingItem.amount || ''}
 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
 placeholder="0.00"
 min="0"
 step="0.01"
 required
 />
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Month</label>
 <input
 name="month"
 type="text"
 defaultValue={editingItem.month || ''}
 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
 placeholder="e.g., January 2024"
 required
 />
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Status</label>
 <select name="status" defaultValue={editingItem.status || ''} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors" required>
 <option value="Paid">Paid</option>
 <option value="Pending">Pending</option>
 <option value="Overdue">Overdue</option>
 </select>
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Payment Date</label>
 <input
 name="payment_date"
 type="date"
 defaultValue={editingItem.paymentDate || ''}
 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
 />
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Payment Method</label>
 <select name="method" defaultValue={editingItem.method || ''} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors">
 <option value="">Select method</option>
 <option value="Cash">Cash</option>
 <option value="Bank Transfer">Bank Transfer</option>
 <option value="GCash">GCash</option>
 <option value="Check">Check</option>
 </select>
 </div>
 </div>
 <div className="flex gap-3 pt-6 border-t border-gray-200">
 <button
 type="button"
 onClick={() => setShowEditPaymentModal(false)}
 className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
 >
 Cancel
 </button>
 <button
 type="submit"
 className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:shadow-sm transition-all"
 >
 Update Payment
 </button>
 </div>
 </form>
 </Modal>
 )}

 {/* DELETE PAYMENT MODAL */}
 {showDeletePaymentModal && editingItem && (
 <Modal
 isOpen={showDeletePaymentModal}
 onClose={() => setShowDeletePaymentModal(false)}
 title="Delete Payment"
 subtitle="Are you sure you want to delete this payment record?"
 icon={<AlertTriangle className="w-6 h-6" />}
 size="sm"
 >
 <div className="space-y-4">
 <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
 <div className="flex items-start gap-3">
 <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5" />
 <div>
 <h4 className="font-semibold text-rose-900">Warning</h4>
 <p className="text-rose-700 text-[11px] mt-1">This action cannot be undone. This will permanently delete the payment record from the system.</p>
 </div>
 </div>
 </div>
 <div className="bg-gray-50 rounded-lg p-4">
 <h5 className="font-semibold text-gray-900 mb-2">Payment Details:</h5>
 <p className="text-gray-700"><strong>Payment #:</strong> {editingItem.paymentNumber}</p>
 <p className="text-gray-700"><strong>Tenant:</strong> {editingItem.tenant}</p>
 <p className="text-gray-700"><strong>Month:</strong> {editingItem.month}</p>
 <p className="text-gray-700"><strong>Amount:</strong> ₱{editingItem.amount?.toLocaleString()}</p>
 </div>
 <div className="flex gap-3 pt-4 border-t border-gray-200">
 <button
 onClick={() => setShowDeletePaymentModal(false)}
 className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={() => handleDeletePayment()}
 className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:shadow-sm transition-all"
 >
 Delete Payment
 </button>
 </div>
 </div>
 </Modal>
 )}

 {/* EDIT MAINTENANCE MODAL */}
 {showEditMaintenanceModal && editingItem && (
 <Modal
 isOpen={showEditMaintenanceModal}
 onClose={() => setShowEditMaintenanceModal(false)}
 title="Edit Maintenance Request"
 subtitle="Update maintenance request details"
 icon={<Wrench className="w-6 h-6" />}
 size="md"
 >
 <form className="space-y-6" onSubmit={(e) => {
 e.preventDefault();
 const formData = new FormData(e.target);
 const maintenanceData = {
 request_number: formData.get('request_number'),
 property_id: formData.get('property_id'),
 tenant_id: formData.get('tenant_id'),
 issue: formData.get('issue'),
 priority: formData.get('priority'),
 status: formData.get('status'),
 date_reported: formData.get('date_reported'),
 assigned_to: formData.get('assigned_to')
 };
 handleEditMaintenance(maintenanceData);
 }}>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Request Number (Read-only)</label>
 <input
 name="request_number"
 type="text"
 defaultValue={editingItem.requestNumber || ''}
 className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
 placeholder="Request number"
 disabled
 />
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Property</label>
 <select name="property_id" defaultValue={editingItem.propertyId || ''} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors" required>
 <option value="">Select Property</option>
 {properties.map(property => (
 <option key={property.id} value={property.id}>{property.name}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Tenant</label>
 <select name="tenant_id" defaultValue={editingItem.tenantId || ''} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors">
 <option value="">Select Tenant (Optional)</option>
 {tenants.map(tenant => (
 <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Priority</label>
 <select name="priority" defaultValue={editingItem.priority || ''} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors" required>
 <option value="Low">Low</option>
 <option value="Medium">Medium</option>
 <option value="High">High</option>
 <option value="Critical">Critical</option>
 </select>
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Status</label>
 <select name="status" defaultValue={editingItem.status || ''} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors" required>
 <option value="Pending">Pending</option>
 <option value="In Progress">In Progress</option>
 <option value="Completed">Completed</option>
 </select>
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Assigned To</label>
 <input
 name="assigned_to"
 type="text"
 defaultValue={editingItem.assignedTo || ''}
 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
 placeholder="Enter staff name"
 />
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Date Reported</label>
 <input
 name="date_reported"
 type="date"
 defaultValue={editingItem.dateReported || ''}
 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
 required
 />
 </div>
 <div className="md:col-span-2">
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">Issue Description</label>
 <textarea
 name="issue"
 defaultValue={editingItem.issue || ''}
 rows={3}
 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
 placeholder="Describe the maintenance issue"
 required
 ></textarea>
 </div>
 </div>
 <div className="flex gap-3 pt-6 border-t border-gray-200">
 <button
 type="button"
 onClick={() => setShowEditMaintenanceModal(false)}
 className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
 >
 Cancel
 </button>
 <button
 type="submit"
 className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:shadow-sm transition-all"
 >
 Update Request
 </button>
 </div>
 </form>
 </Modal>
 )}

 {/* DELETE MAINTENANCE MODAL */}
 {showDeleteMaintenanceModal && editingItem && (
 <Modal
 isOpen={showDeleteMaintenanceModal}
 onClose={() => setShowDeleteMaintenanceModal(false)}
 title="Delete Maintenance Request"
 subtitle="Are you sure you want to delete this maintenance request?"
 icon={<AlertTriangle className="w-6 h-6" />}
 size="sm"
 >
 <div className="space-y-4">
 <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
 <div className="flex items-start gap-3">
 <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5" />
 <div>
 <h4 className="font-semibold text-rose-900">Warning</h4>
 <p className="text-rose-700 text-[11px] mt-1">This action cannot be undone. This will permanently delete the maintenance request from the system.</p>
 </div>
 </div>
 </div>
 <div className="bg-gray-50 rounded-lg p-4">
 <h5 className="font-semibold text-gray-900 mb-2">Request Details:</h5>
 <p className="text-gray-700"><strong>Request #:</strong> {editingItem.requestNumber}</p>
 <p className="text-gray-700"><strong>Property:</strong> {editingItem.property}</p>
 <p className="text-gray-700"><strong>Tenant:</strong> {editingItem.tenant}</p>
 <p className="text-gray-700"><strong>Priority:</strong> {editingItem.priority}</p>
 </div>
 <div className="flex gap-3 pt-4 border-t border-gray-200">
 <button
 onClick={() => setShowDeleteMaintenanceModal(false)}
 className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={() => handleDeleteMaintenance()}
 className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:shadow-sm transition-all"
 >
 Delete Request
 </button>
 </div>
 </div>
 </Modal>
 )}
 </div>
 );
};

export default Rentals;
