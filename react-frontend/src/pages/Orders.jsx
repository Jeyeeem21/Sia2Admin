import { useState, useRef, useEffect, useCallback } from 'react';
import usePageTitle from '../hooks/usePageTitle';
import {
 ShoppingCart,
 Search,
 Plus,
 Eye,
 Pencil,
 CheckCircle,
 Clock,
 Package,
 XCircle,
 Trash2,
 Filter,
 Barcode,
 DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import ViewModal from '../components/ViewModal';
import DeleteModal from '../components/DeleteModal';
import Modal from '../components/Modal';
import AddOrderModal from '../components/AddOrderModal';
import Pagination from '../components/Pagination';
import { 
 useOrders, 
 useCreateOrder, 
 useUpdateOrder, 
 useCompleteOrder, 
 useVoidOrder 
} from '../hooks/useOrders';
import { useProducts } from '../hooks/useProducts';
import { useAuth } from '../contexts/AuthContext';

const Orders = () => {
  usePageTitle('Orders');
 const [searchTerm, setSearchTerm] = useState('');
 const [filterStatus, setFilterStatus] = useState('All');
 const [currentPage, setCurrentPage] = useState(1);
 const [itemsPerPage, setItemsPerPage] = useState(10);
 
 // Refs for barcode scanner
 const barcodeInputRef = useRef(null);
 const quantityInputRef = useRef(null);
 
 // React Query hooks - REALTIME, no repeated loading
 const { data: orders = [], isLoading } = useOrders();
 const { data: products = [] } = useProducts();
 const createOrderMutation = useCreateOrder();
 const updateOrderMutation = useUpdateOrder();
 const completeOrderMutation = useCompleteOrder();
 const voidOrderMutation = useVoidOrder();
 
 // Auth hook for role checking
 const { user } = useAuth();
 
 // Modal states
 const [viewModal, setViewModal] = useState({ isOpen: false, data: null });
 const [addModal, setAddModal] = useState(false);
 const [editModal, setEditModal] = useState({ isOpen: false, data: null });
 const [completeModal, setCompleteModal] = useState({ isOpen: false, order: null });
 const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });
 const [voidModal, setVoidModal] = useState({ isOpen: false, order: null, reason: '' });

 // Order form state
 const [orderForm, setOrderForm] = useState({
 customer_name: '',
 notes: '',
 preferred_pickup_date: new Date().toISOString().split('T')[0],
 order_items: []
 });

 // Current order item being added
 const [currentItem, setCurrentItem] = useState({
 product_id: '',
 quantity: 1,
 unit_price: 0,
 notes: ''
 });

 // Edit order item state
 const [editCurrentItem, setEditCurrentItem] = useState({
 product_id: '',
 quantity: 1,
 unit_price: 0,
 notes: ''
 });

 // Service type options
 // Payment form state
 const [paymentForm, setPaymentForm] = useState({
 payment_method: 'Cash',
 amount: 0,
 reference_number: '',
 notes: ''
 });

 const serviceTypes = [
 'Printing',
 'ID Creation',
 'Tela Purchase',
 'Lamination',
 'Document Binding',
 'Uniform',
 'Other'
 ];

 const paymentMethods = ['Cash', 'GCash'];

 // Add item to order
 const addItemToOrder = () => {
 if (!currentItem.product_id || currentItem.quantity <= 0) {
 toast.error('Please select a product and enter valid quantity');
 return;
 }

 const product = products.find(p => p.product_id == currentItem.product_id);
 if (!product) return;

 const newItem = {
 ...currentItem,
 product_name: product.product_name,
 sku: product.sku,
 unit_price: currentItem.unit_price || product.price
 };

 // Auto-set service_type from first product's category
 const updatedOrderForm = {
 ...orderForm,
 order_items: [...orderForm.order_items, newItem]
 };

 if (orderForm.order_items.length === 0 && product.category?.category_name) {
 updatedOrderForm.service_type = product.category.category_name;
 }

 setOrderForm(updatedOrderForm);

 setCurrentItem({
 product_id: '',
 quantity: 1,
 unit_price: 0,
 notes: ''
 });

 toast.success('Product added to order');
 
 // Refocus barcode scanner after adding
 setTimeout(() => {
 if (barcodeInputRef.current) {
 barcodeInputRef.current.focus();
 }
 }, 100);
 };

 // Add item by barcode (from scanner)
 const addItemByBarcode = useCallback((barcode) => {
 const product = products.find(p => 
 p.barcode === barcode || 
 p.product_id.toString() === barcode
 );

 if (!product) {
 toast.error(`Product with barcode "${barcode}" not found`);
 return;
 }

 if (product.status !== 'active') {
 toast.error(`Product not available - "${product.product_name}" is inactive`);
 return;
 }

 // Check if product already in order
 const existingItemIndex = orderForm.order_items.findIndex(
 item => item.product_id == product.product_id
 );

 if (existingItemIndex >= 0) {
 // Increment quantity
 const updatedItems = [...orderForm.order_items];
 updatedItems[existingItemIndex].quantity += 1;
 setOrderForm({
 ...orderForm,
 order_items: updatedItems
 });
 toast.success(`${product.product_name} quantity increased`);
 } else {
 // Add new item
 const newItem = {
 product_id: product.product_id,
 product_name: product.product_name,
 sku: product.sku,
 quantity: 1,
 unit_price: product.price,
 notes: ''
 };

 const updatedOrderForm = {
 ...orderForm,
 order_items: [...orderForm.order_items, newItem]
 };

 // Auto-set service_type from first product's category
 if (orderForm.order_items.length === 0 && product.category?.category_name) {
 updatedOrderForm.service_type = product.category.category_name;
 }

 setOrderForm(updatedOrderForm);
 toast.success(`${product.product_name} added to order`);
 }

 // Refocus barcode scanner
 setTimeout(() => {
 if (barcodeInputRef.current) {
 barcodeInputRef.current.focus();
 }
 }, 100);
 }, [products, orderForm]);

 // Global barcode scanner - works even when editing quantities
 useEffect(() => {
 if (!addModal) return; // Only active when add modal is open

 let barcodeBuffer = '';
 let bufferTimeout;
 let lastKeyTime = 0;
 let keyCount = 0;

 const handleGlobalKeyDown = (e) => {
 // Ignore if not in add modal or typing in textarea/select
 if (!addModal || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
 return;
 }

 const currentTime = Date.now();
 const timeDiff = currentTime - lastKeyTime;
 
 // Detect barcode scanner by fast typing
 const isFastTyping = timeDiff < 30 && barcodeBuffer.length > 0;
 
 if (isFastTyping) {
 keyCount++;
 } else if (timeDiff > 100) {
 keyCount = 0;
 }
 
 const isDefinitelyScanner = keyCount >= 3;

 if (e.key === 'Enter' && barcodeBuffer.length > 0) {
 const isQuantityInput = e.target === quantityInputRef.current;
 const isLongBarcode = barcodeBuffer.length >= 8;
 
 // Process as barcode if scanner detected or long barcode
 if (isDefinitelyScanner || isLongBarcode || !isQuantityInput) {
 e.preventDefault();
 e.stopPropagation();
 
 // Clear quantity input if barcode entered there
 if (isQuantityInput && e.target) {
 e.target.value = '';
 }
 
 toast.dismiss();
 addItemByBarcode(barcodeBuffer);
 
 barcodeBuffer = '';
 keyCount = 0;
 if (barcodeInputRef.current) {
 barcodeInputRef.current.value = '';
 }
 } else {
 barcodeBuffer = '';
 keyCount = 0;
 }
 } else if (/^[0-9]$/.test(e.key)) {
 const isQuantityInput = e.target === quantityInputRef.current;
 
 // Prevent numbers from entering quantity input if scanner detected
 if ((isDefinitelyScanner || isFastTyping) && isQuantityInput) {
 e.preventDefault();
 e.stopPropagation();
 }
 
 barcodeBuffer += e.key;
 lastKeyTime = currentTime;
 
 // Update barcode input display
 if (barcodeInputRef.current && !isQuantityInput) {
 barcodeInputRef.current.value = barcodeBuffer;
 }
 
 clearTimeout(bufferTimeout);
 bufferTimeout = setTimeout(() => {
 barcodeBuffer = '';
 keyCount = 0;
 }, 100);
 }
 };

 document.addEventListener('keydown', handleGlobalKeyDown, true);
 return () => {
 document.removeEventListener('keydown', handleGlobalKeyDown, true);
 clearTimeout(bufferTimeout);
 };
 }, [addModal, products, orderForm, addItemByBarcode]);

 // Global barcode scanner - opens modal and adds product when scanning outside modal
 useEffect(() => {
 let barcodeBuffer = '';
 let bufferTimeout;
 let lastKeyTime = 0;
 let keyCount = 0;

 const handleGlobalScan = (e) => {
 // Only work when modal is closed and not typing in search/text inputs
 if (addModal || e.target.type === 'search' || e.target.type === 'text' || e.target.tagName === 'INPUT') {
 return;
 }

 const currentTime = Date.now();
 const timeDiff = currentTime - lastKeyTime;
 
 const isFastTyping = timeDiff < 30 && barcodeBuffer.length > 0;
 
 if (isFastTyping) {
 keyCount++;
 } else if (timeDiff > 100) {
 keyCount = 0;
 }
 
 const isDefinitelyScanner = keyCount >= 3;

 if (e.key === 'Enter' && barcodeBuffer.length > 0) {
 const isLongBarcode = barcodeBuffer.length >= 8;
 
 // Only process if definitely from scanner or long barcode
 if (isDefinitelyScanner || isLongBarcode) {
 e.preventDefault();
 e.stopPropagation();
 
 const barcode = barcodeBuffer;
 barcodeBuffer = '';
 keyCount = 0;
 
 // Find product
 const product = products.find(p => 
 p.barcode === barcode || 
 p.product_id.toString() === barcode
 );

 if (!product) {
 toast.error(`Product with barcode "${barcode}" not found`);
 return;
 }

 if (product.status !== 'active') {
 toast.error(`Product not available - "${product.product_name}" is inactive`);
 return;
 }

 // Open modal if closed
 if (!addModal) {
 setAddModal(true);
 }

 // Add product after a short delay to ensure modal is open
 setTimeout(() => {
 const existingItemIndex = orderForm.order_items.findIndex(
 item => item.product_id == product.product_id
 );

 if (existingItemIndex >= 0) {
 // Increment quantity
 const updatedItems = [...orderForm.order_items];
 updatedItems[existingItemIndex].quantity += 1;
 setOrderForm({
 ...orderForm,
 order_items: updatedItems
 });
 toast.success(`${product.product_name} quantity increased`);
 } else {
 // Add new item
 const newItem = {
 product_id: product.product_id,
 product_name: product.product_name,
 sku: product.sku,
 quantity: 1,
 unit_price: product.price,
 notes: ''
 };

 const updatedOrderForm = {
 ...orderForm,
 order_items: [...orderForm.order_items, newItem]
 };

 if (orderForm.order_items.length === 0 && product.category?.category_name) {
 updatedOrderForm.service_type = product.category.category_name;
 }

 setOrderForm(updatedOrderForm);
 toast.success(`${product.product_name} added to order`);
 }

 // Focus barcode input in modal
 if (barcodeInputRef.current) {
 barcodeInputRef.current.focus();
 }
 }, 100);
 } else {
 barcodeBuffer = '';
 keyCount = 0;
 }
 } else if (/^[0-9]$/.test(e.key)) {
 barcodeBuffer += e.key;
 lastKeyTime = currentTime;
 
 clearTimeout(bufferTimeout);
 bufferTimeout = setTimeout(() => {
 barcodeBuffer = '';
 keyCount = 0;
 }, 100);
 }
 };

 document.addEventListener('keydown', handleGlobalScan, true);
 return () => {
 document.removeEventListener('keydown', handleGlobalScan, true);
 clearTimeout(bufferTimeout);
 };
 }, [addModal, products, orderForm, setOrderForm, setAddModal]);

 const removeItemFromOrder = (index) => {
 setOrderForm({
 ...orderForm,
 order_items: orderForm.order_items.filter((_, i) => i !== index)
 });
 toast.success('Product removed from order');
 };

 const updateOrderItemQuantity = (index, newQuantity) => {
 if (newQuantity <= 0) {
 removeItemFromOrder(index);
 return;
 }
 
 const updatedItems = [...orderForm.order_items];
 updatedItems[index].quantity = newQuantity;
 setOrderForm({
 ...orderForm,
 order_items: updatedItems
 });
 };

 const calculateTotal = () => {
 return orderForm.order_items.reduce((total, item) => {
 return total + (item.quantity * item.unit_price);
 }, 0);
 };

 const handleProductSelect = (productId) => {
 const product = products.find(p => p.product_id == productId);
 if (product) {
 setCurrentItem({
 ...currentItem,
 product_id: productId,
 unit_price: product.price
 });
 }
 };

 const handleSubmitOrder = async () => {
 if (orderForm.order_items.length === 0) {
 toast.error('Please add at least one product to the order');
 return;
 }

 // Close modal immediately
 setAddModal(false);
 setOrderForm({
 customer_name: '',
 notes: '',
 preferred_pickup_date: new Date().toISOString().split('T')[0],
 order_items: []
 });
 
 createOrderMutation.mutate(orderForm);
 };

 const handleUpdateStatus = async (orderId, newStatus) => {
 updateOrderMutation.mutate({ 
 id: orderId, 
 data: { status: newStatus } 
 });
 };

 const handleDelete = async () => {
 // Close modal immediately
 setDeleteModal({ isOpen: false, id: null, name: '' });
 
 updateOrderMutation.mutate({ 
 id: deleteModal.id, 
 data: { status: 'Cancelled' } 
 });
 };

 const handleOpenCompleteModal = (order) => {
 setCompleteModal({ isOpen: true, order });
 setPaymentForm({
 payment_method: 'Cash',
 amount: order.total_amount,
 reference_number: '',
 notes: ''
 });
 
 // Auto-focus amount input after modal opens
 setTimeout(() => {
 const amountInput = document.querySelector('input[type="number"][step="0.01"]');
 if (amountInput) {
 amountInput.focus();
 amountInput.select();
 }
 }, 100);
 };

 const handleCompleteOrder = async () => {
 if (!paymentForm.payment_method) {
 toast.error('Please select a payment method');
 return;
 }

 if (paymentForm.payment_method === 'GCash' && !paymentForm.reference_number) {
 toast.error('Please enter GCash reference number');
 return;
 }

 // Close modal immediately
 const orderId = completeModal.order.order_id;
 setCompleteModal({ isOpen: false, order: null });
 
 completeOrderMutation.mutate({
 id: orderId,
 paymentData: paymentForm
 });
 };

 const handleVoidOrder = async () => {
 if (!voidModal.reason || voidModal.reason.trim() === '') {
 toast.error('Please enter a reason for voiding the order');
 return;
 }

 // Close modal immediately
 const orderId = voidModal.order.order_id;
 const reason = voidModal.reason;
 setVoidModal({ isOpen: false, order: null, reason: '' });
 
 voidOrderMutation.mutate({
 id: orderId,
 reason: reason
 });
 };

 const addItemToEditOrder = () => {
 if (!editCurrentItem.product_id || editCurrentItem.quantity <= 0) {
 toast.error('Please select a product and enter valid quantity');
 return;
 }

 const product = products.find(p => p.product_id == editCurrentItem.product_id);
 if (!product) return;

 const newItem = {
 product_id: editCurrentItem.product_id,
 quantity: editCurrentItem.quantity,
 unit_price: editCurrentItem.unit_price || product.price,
 notes: editCurrentItem.notes,
 product: product
 };

 setEditModal({
 ...editModal,
 data: {
 ...editModal.data,
 order_items: [...(editModal.data.order_items || []), newItem]
 }
 });

 setEditCurrentItem({
 product_id: '',
 quantity: 1,
 unit_price: 0,
 notes: ''
 });

 toast.success('Product added to order');
 };

 const removeItemFromEditOrder = (index) => {
 const updatedItems = editModal.data.order_items.filter((_, i) => i !== index);
 setEditModal({
 ...editModal,
 data: {
 ...editModal.data,
 order_items: updatedItems
 }
 });
 toast.success('Product removed from order');
 };

 const handleEditProductSelect = (productId) => {
 const product = products.find(p => p.product_id == productId);
 if (product) {
 setEditCurrentItem({
 ...editCurrentItem,
 product_id: productId,
 unit_price: product.price
 });

 // Auto-update service_type if this is the first product
 if (!editModal.data.order_items || editModal.data.order_items.length === 0) {
 setEditModal({
 ...editModal,
 data: {
 ...editModal.data,
 service_type: product.category?.category_name || ''
 }
 });
 }
 }
 };

 const calculateEditTotal = () => {
 return (editModal.data?.order_items || []).reduce((total, item) => {
 return total + (item.quantity * item.unit_price);
 }, 0);
 };

 const handleEditOrder = async () => {
 if (!editModal.data.order_items || editModal.data.order_items.length === 0) {
 toast.error('Order must have at least one product');
 return;
 }

 const updateData = {
 customer_name: editModal.data.customer_name || null,
 service_type: editModal.data.service_type, // Always send service_type (required)
 status: editModal.data.status,
 notes: editModal.data.notes || null,
 preferred_pickup_date: editModal.data.preferred_pickup_date || null,
 order_items: editModal.data.order_items.map(item => ({
 product_id: item.product_id,
 quantity: item.quantity,
 unit_price: item.unit_price,
 notes: item.notes || null
 }))
 };

 // Close modal immediately
 const orderId = editModal.data.order_id;
 setEditModal({ isOpen: false, data: null });
 
 updateOrderMutation.mutate({
 id: orderId,
 data: updateData
 });
 };

 const viewFields = [
 { key: 'order_number', label: 'Order Number' },
 { key: 'customer_name', label: 'Customer Name', render: (v) => v || 'Walk-in Customer' },
 { key: 'service_type', label: 'Category' },
 { key: 'order_items', label: 'Products', render: (items) => items?.map(item => 
 `${item.product?.product_name || item.product_name || 'Deleted Product'} (x${item.quantity})`
 ).join(', ') || 'N/A' },
 { key: 'total_amount', label: 'Total Amount', render: (v) => `₱${parseFloat(v).toLocaleString()}` },
 { key: 'status', label: 'Order Status' },
 { key: 'notes', label: 'Notes', render: (v) => v || 'N/A' },
 { key: 'created_at', label: 'Order Date', render: (v) => new Date(v).toLocaleString() }
 ];

 const getStatusColor = (status) => {
 const colors = {
 'Completed': 'bg-emerald-100 text-emerald-700 border-emerald-200',
 'Pending': 'bg-amber-100 text-amber-700 border-amber-200',
 'In Progress': 'bg-emerald-100 text-emerald-700 border-emerald-200',
 'Cancelled': 'bg-rose-100 text-rose-700 border-rose-200'
 };
 return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
 };

 const getStatusIcon = (status) => {
 const icons = {
 'Completed': CheckCircle,
 'Pending': Clock,
 'In Progress': Package,
 'Cancelled': XCircle
 };
 return icons[status] || Clock;
 };

 const filteredOrders = orders.filter(order => {
 // Exclude cancelled orders from main Orders page (they're in Reports)
 if (order.status === 'Cancelled') return false;
 
 const matchesSearch = 
 order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
 order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
 order.service_type?.toLowerCase().includes(searchTerm.toLowerCase());
 
 const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
 
 return matchesSearch && matchesStatus;
 });

 // Pagination
 const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
 const startIndex = (currentPage - 1) * itemsPerPage;
 const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

 const stats = {
 total: orders.length,
 pending: orders.filter(o => o.status === 'Pending').length,
 inProgress: orders.filter(o => o.status === 'In Progress').length,
 completed: orders.filter(o => o.status === 'Completed').length,
 totalRevenue: orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0)
 };

 return (
 <div className="p-5 lg:p-6 min-h-full">
 {/* Header */}
 <div className="mb-7">
 <div className="flex items-end justify-between">
 <div>
 <h1 className="text-xl font-bold text-gray-900 tracking-tight">Order Management</h1>
 <p className="text-[11px] text-gray-400 mt-1">Handle customer requests and service orders</p>
 </div>
 </div>
 <div className="flex items-start gap-2 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
 <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
 <div className="text-[11px]">
 <p className="text-emerald-900 font-semibold">Active Orders Only</p>
 <p className="text-emerald-700/70">Completed orders are archived in <span className="font-semibold">Reports</span> for historical analysis.</p>
 </div>
 </div>
 </div>

 {/* Stats Cards */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
 <div className="group relative bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
 <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gray-50 to-transparent rounded-bl-full opacity-60" />
 <div className="relative">
 <div className="bg-emerald-50 p-2.5 rounded-xl ring-4 ring-white w-fit">
 <ShoppingCart className="w-[18px] h-[18px] text-emerald-600" />
 </div>
 <div className="mt-4">
 <p className="text-[22px] font-bold text-gray-900 tracking-tight leading-none">{stats.total}</p>
 <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-1.5">Active Orders</p>
 </div>
 </div>
 </div>
 <div className="group relative bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
 <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gray-50 to-transparent rounded-bl-full opacity-60" />
 <div className="relative">
 <div className="bg-amber-50 p-2.5 rounded-xl ring-4 ring-white w-fit">
 <Clock className="w-[18px] h-[18px] text-amber-600" />
 </div>
 <div className="mt-4">
 <p className="text-[22px] font-bold text-gray-900 tracking-tight leading-none">{stats.pending}</p>
 <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-1.5">Pending</p>
 </div>
 </div>
 </div>
 <div className="group relative bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
 <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gray-50 to-transparent rounded-bl-full opacity-60" />
 <div className="relative">
 <div className="bg-emerald-50 p-2.5 rounded-xl ring-4 ring-white w-fit">
 <Package className="w-[18px] h-[18px] text-emerald-600" />
 </div>
 <div className="mt-4">
 <p className="text-[22px] font-bold text-gray-900 tracking-tight leading-none">{stats.inProgress}</p>
 <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-1.5">In Progress</p>
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
 <p className="text-[22px] font-bold text-gray-900 tracking-tight leading-none">₱{stats.totalRevenue.toFixed(2)}</p>
 <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-1.5">Today's Revenue</p>
 </div>
 </div>
 </div>
 </div>

 {/* Main Content */}
 <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-gray-100">
 {/* Toolbar */}
 <div className="p-5 border-b border-gray-100">
 <div className="flex items-center justify-between gap-3 flex-wrap">
 <div className="relative flex-1 max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
 <input
 type="text"
 placeholder="Search orders..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-[13px] focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 />
 </div>
 
 <div className="flex items-center gap-3">
 <select
 value={filterStatus}
 onChange={(e) => setFilterStatus(e.target.value)}
 className="px-4 py-2.5 border border-gray-200 rounded-xl text-[13px] focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
 >
 <option value="All">All Status</option>
 <option value="Pending">Pending</option>
 <option value="In Progress">In Progress</option>
 <option value="Cancelled">Cancelled</option>
 </select>
 
 <button 
 onClick={() => setAddModal(true)}
 className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[11px] font-semibold hover:bg-emerald-700 active:scale-[0.97] transition-all flex items-center gap-2"
 >
 <Plus className="w-4 h-4" />
 New Order
 </button>
 </div>
 </div>
 </div>

 {/* Table */}
 <>
 {/* Mobile Card View - NO LOADING STATE, instant from cache */}
 <div className="block md:hidden p-4 space-y-4">
 {paginatedOrders.length === 0 ? (
 <div className="text-center text-gray-500 py-12">No orders found</div>
 ) : (
 paginatedOrders.map((order) => (
 <div key={order.order_id} className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
 <div className="flex items-start justify-between">
 <div>
 <h3 className="font-semibold text-gray-900">{order.order_number}</h3>
 <p className="text-[11px] text-gray-500">{order.customer_name || 'Walk-in'}</p>
 </div>
 <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
 order.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
 order.status === 'In Progress' ? 'bg-emerald-100 text-emerald-700' :
 order.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
 'bg-red-100 text-red-700'
 }`}>
 {order.status}
 </span>
 </div>

 <div className="bg-white rounded-lg p-3 space-y-2">
 <div className="text-[11px]">
 <span className="text-gray-600">Service:</span>
 <span className="ml-2 font-medium text-gray-900">{order.service_type}</span>
 </div>
 <div className="text-[11px]">
 <span className="text-gray-600">Items:</span>
 <div className="mt-1 space-y-1">
 {order.order_items && order.order_items.length > 0 ? (
 order.order_items.map((item, idx) => (
 <div key={idx} className="text-xs text-gray-700">
 • {item.product?.product_name || item.product_name || 'Deleted Product'} <span className="text-gray-500">(x{item.quantity})</span>
 </div>
 ))
 ) : (
 <span className="text-gray-400 text-xs">No items</span>
 )}
 </div>
 </div>
 <div className="text-[11px] pt-2 border-t border-gray-200 flex justify-between items-center">
 <span className="text-gray-600">Total:</span>
 <span className="font-bold text-[13px] text-gray-900">₱{parseFloat(order.total_amount).toFixed(2)}</span>
 </div>
 </div>

 <div className="text-xs text-gray-500">
 {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })} • {new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
 </div>

 <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
 <button 
 onClick={() => setViewModal({ isOpen: true, data: order })}
 className="flex-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors text-[11px] font-semibold flex items-center justify-center gap-1"
 >
 <Eye className="w-4 h-4" />
 View
 </button>
 {order.status !== 'Completed' && order.status !== 'Cancelled' && !order.is_voided && (
 <>
 <button 
 onClick={() => setEditModal({ 
 isOpen: true, 
 data: { 
 ...order, 
 service_type: order.service_type || 'Printing' // Ensure valid default
 } 
 })}
 className="flex-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors text-[11px] font-semibold flex items-center justify-center gap-1"
 >
 <Pencil className="w-4 h-4" />
 Edit
 </button>
 {(order.status === 'Pending' || order.status === 'In Progress') && (
 <>
 <button 
 onClick={() => handleOpenCompleteModal(order)}
 className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors"
 title="Complete Order"
 >
 <CheckCircle className="w-4 h-4" />
 </button>
 <button 
 onClick={() => setVoidModal({ isOpen: true, order: order, reason: '' })}
 className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
 title="Void Order"
 >
 <XCircle className="w-4 h-4" />
 </button>
 </>
 )}
 <button 
 onClick={() => setDeleteModal({ isOpen: true, id: order.order_id, name: order.order_number })}
 className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </>
 )}
 </div>
 </div>
 ))
 )}
 </div>

 {/* Desktop Table View */}
 <div className="hidden md:block overflow-x-auto">
 <table className="w-full">
 <thead>
 <tr className="bg-gray-50">
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Order #</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Customer</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Items</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Service</th>
 <th className="px-5 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Amount</th>
 <th className="px-5 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
 <th className="px-5 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-200">
 {paginatedOrders.length === 0 ? (
 <tr>
 <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
 No orders found
 </td>
 </tr>
 ) : (
 paginatedOrders.map((order) => {
 return (
 <tr key={order.order_id} className="hover:bg-gray-50 transition-colors">
 <td className="px-4 py-3 text-[11px] font-semibold text-gray-900">
 {order.order_number}
 </td>
 <td className="px-4 py-3 text-[11px] text-gray-700">
 {order.customer_name || 'Walk-in'}
 </td>
 <td className="px-4 py-3 text-[11px] text-gray-700">
 <div className="space-y-1">
 {order.order_items && order.order_items.length > 0 ? (
 order.order_items.map((item, idx) => (
 <div key={idx} className="text-xs">
 {item.product?.product_name || 'Unknown Product'} <span className="text-gray-500">(x{item.quantity})</span>
 </div>
 ))
 ) : (
 <span className="text-gray-400 text-xs">No items</span>
 )}
 </div>
 </td>
 <td className="px-4 py-3 text-[11px] text-gray-700">
 {order.service_type}
 </td>
 <td className="px-4 py-3 text-[11px] font-semibold text-right text-gray-900">
 ₱{parseFloat(order.total_amount).toFixed(2)}
 </td>
 <td className="px-4 py-3 text-center">
 <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
 order.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
 order.status === 'In Progress' ? 'bg-emerald-100 text-emerald-700' :
 order.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
 'bg-red-100 text-red-700'
 }`}>
 {order.status}
 </span>
 </td>
 <td className="px-4 py-3 text-[11px] text-gray-500">
 <div>{new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}</div>
 <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
 </td>
 <td className="px-4 py-3">
 <div className="flex items-center justify-center gap-2">
 <button 
 onClick={() => setViewModal({ isOpen: true, data: order })}
 className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
 title="View Details"
 >
 <Eye className="w-4 h-4" />
 </button>
 {order.status !== 'Completed' && order.status !== 'Cancelled' && !order.is_voided && (
 <>
 <button 
 onClick={() => setEditModal({ 
 isOpen: true, 
 data: { 
 ...order, 
 service_type: order.service_type || 'Printing' // Ensure valid default
 } 
 })}
 className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
 title="Edit Order"
 >
 <Pencil className="w-4 h-4" />
 </button>
 {(order.status === 'Pending' || order.status === 'In Progress') && (
 <>
 <button 
 onClick={() => handleOpenCompleteModal(order)}
 className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
 title="Complete & Pay"
 >
 <CheckCircle className="w-4 h-4" />
 </button>
 {(user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'staff') && (
 <button 
 onClick={() => setVoidModal({ isOpen: true, order: order, reason: '' })}
 className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
 title="Void Order"
 >
 <XCircle className="w-4 h-4" />
 </button>
 )}
 </>
 )}
 {(user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'staff') && (
 <button 
 onClick={() => setDeleteModal({ isOpen: true, id: order.order_id, name: order.order_number })}
 className="p-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-colors"
 title="Delete Order"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 )}
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

 {/* Pagination */}
 <Pagination
 currentPage={currentPage}
 totalPages={totalPages}
 totalItems={filteredOrders.length}
 itemsPerPage={itemsPerPage}
 onPageChange={setCurrentPage}
 onItemsPerPageChange={(value) => {
 setItemsPerPage(value);
 setCurrentPage(1);
 }}
 />
 </>
 </div>

 <AddOrderModal
 isOpen={addModal}
 onClose={() => setAddModal(false)}
 orderForm={orderForm}
 setOrderForm={setOrderForm}
 currentItem={currentItem}
 setCurrentItem={setCurrentItem}
 products={products}
 addItemToOrder={addItemToOrder}
 removeItemFromOrder={removeItemFromOrder}
 handleSubmitOrder={handleSubmitOrder}
 barcodeInputRef={barcodeInputRef}
 quantityInputRef={quantityInputRef}
 updateOrderItemQuantity={updateOrderItemQuantity}
 />

 {/* View Modal */}
 <ViewModal
 isOpen={viewModal.isOpen}
 onClose={() => setViewModal({ isOpen: false, data: null })}
 title="Order Details"
 data={viewModal.data}
 fields={viewFields}
 />

 {/* Edit Order Modal */}
 {editModal.isOpen && (
 <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
 <div className="bg-white rounded-xl shadow-sm max-w-3xl w-full my-8">
 <div className="bg-emerald-600 text-white px-5 py-3 rounded-t-xl">
 <h2 className="text-lg font-bold">Edit Order - {editModal.data?.order_number}</h2>
 </div>
 
 <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Customer Name
 </label>
 <input
 type="text"
 value={editModal.data?.customer_name || ''}
 onChange={(e) => setEditModal({ 
 ...editModal, 
 data: { ...editModal.data, customer_name: e.target.value } 
 })}
 className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-gray-900 bg-white"
 placeholder="Walk-in customer"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Preferred Pickup Date
 </label>
 <input
 type="date"
 value={editModal.data?.preferred_pickup_date || ''}
 onChange={(e) => setEditModal({ 
 ...editModal, 
 data: { ...editModal.data, preferred_pickup_date: e.target.value } 
 })}
 className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-gray-900 bg-white"
 />
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Service Type
 </label>
 <input
 type="text"
 value={editModal.data?.service_type || ''}
 onChange={(e) => setEditModal({ 
 ...editModal, 
 data: { ...editModal.data, service_type: e.target.value } 
 })}
 placeholder="Auto-filled from product category"
 className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-gray-900 bg-white"
 />
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Order Status
 </label>
 <select
 value={editModal.data?.status || ''}
 onChange={(e) => setEditModal({ 
 ...editModal, 
 data: { ...editModal.data, status: e.target.value } 
 })}
 className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-gray-900 bg-white"
 >
 <option value="Pending">Pending</option>
 <option value="In Progress">In Progress</option>
 <option value="Completed">Completed</option>
 <option value="Cancelled">Cancelled</option>
 </select>
 </div>
 </div>

 {/* Add Product to Order */}
 <div className="bg-amber-50 rounded-xl p-4 border-2 border-amber-200">
 <label className="block text-[11px] font-bold text-amber-800 mb-3">
 Add Product to Order
 </label>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
 <div className="md:col-span-2">
 <select
 value={editCurrentItem.product_id}
 onChange={(e) => handleEditProductSelect(e.target.value)}
 className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-gray-900 bg-white"
 >
 <option value="">Select a product...</option>
 {products.map(product => (
 <option key={product.product_id} value={product.product_id}>
 {product.product_name} - ₱{parseFloat(product.price).toLocaleString()}
 </option>
 ))}
 </select>
 </div>
 <div>
 <input
 type="number"
 min="1"
 value={editCurrentItem.quantity}
 onChange={(e) => setEditCurrentItem({ ...editCurrentItem, quantity: parseInt(e.target.value) })}
 className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-gray-900 bg-white"
 placeholder="Qty"
 />
 </div>
 </div>
 <button
 type="button"
 onClick={addItemToEditOrder}
 className="mt-3 w-full px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
 >
 <Plus className="w-4 h-4" />
 Add to Order
 </button>
 </div>

 {/* Order Items List - Editable */}
 <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
 <label className="block text-[11px] font-semibold text-gray-700 mb-3">
 Order Items ({editModal.data?.order_items?.length || 0})
 </label>
 {(!editModal.data?.order_items || editModal.data.order_items.length === 0) ? (
 <p className="text-gray-500 text-center py-4">No items in order</p>
 ) : (
 <div className="space-y-2">
 {editModal.data.order_items.map((item, index) => (
 <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
 <div>
 <p className="font-semibold text-gray-900">{item.product?.product_name}</p>
 <p className="text-[11px] text-gray-500">
 {item.quantity} × ₱{parseFloat(item.unit_price).toLocaleString()} = ₱{(item.quantity * item.unit_price).toLocaleString()}
 </p>
 </div>
 <button
 onClick={() => removeItemFromEditOrder(index)}
 className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
 title="Remove item"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 ))}
 </div>
 )}
 <div className="mt-3 pt-3 border-t-2 border-gray-300">
 <div className="flex justify-between items-center">
 <span className="text-[11px] font-bold text-gray-700">Total Amount:</span>
 <span className="text-xl font-bold text-amber-600">
 ₱{calculateEditTotal().toLocaleString()}
 </span>
 </div>
 </div>
 </div>

 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Notes
 </label>
 <textarea
 value={editModal.data?.notes || ''}
 onChange={(e) => setEditModal({ 
 ...editModal, 
 data: { ...editModal.data, notes: e.target.value } 
 })}
 rows="3"
 className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-gray-900 bg-white"
 placeholder="Order notes..."
 />
 </div>
 </div>

 <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end gap-3 border-t border-gray-200">
 <button
 onClick={() => setEditModal({ isOpen: false, data: null })}
 className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-all"
 >
 Cancel
 </button>
 <button
 onClick={handleEditOrder}
 className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 shadow-sm hover:shadow-md transition-all"
 >
 Update Order
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Complete Order / Payment Modal */}
 {completeModal.isOpen && (
 <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
 <div className="bg-white rounded-xl shadow-sm max-w-lg w-full">
 <div className="bg-emerald-600 text-white px-6 py-4 rounded-t-xl">
 <h2 className="text-lg font-bold">Complete Order & Process Payment</h2>
 </div>
 
 <form
 onSubmit={(e) => {
 e.preventDefault();
 handleCompleteOrder();
 }}
 className="p-5 space-y-5"
 >
 {/* Order Summary */}
 <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
 <div className="flex justify-between items-center mb-2">
 <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Order Number:</span>
 <span className="text-[11px] font-semibold text-gray-900">{completeModal.order?.order_number}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Amount:</span>
 <span className="text-[22px] font-bold text-emerald-600">
 ₱{parseFloat(completeModal.order?.total_amount || 0).toLocaleString()}
 </span>
 </div>
 </div>

 {/* Payment Method Selection */}
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-3">
 Payment Method <span className="text-red-500">*</span>
 </label>
 <div className="grid grid-cols-2 gap-3">
 <button
 type="button"
 onClick={() => setPaymentForm({ ...paymentForm, payment_method: 'Cash' })}
 className={`px-4 py-3 border-2 rounded-xl text-[13px] font-semibold transition-all ${
 paymentForm.payment_method === 'Cash'
 ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
 : 'border-gray-200 text-gray-600 hover:border-gray-300'
 }`}
 >
 💵 Cash
 </button>
 <button
 type="button"
 onClick={() => setPaymentForm({ ...paymentForm, payment_method: 'GCash' })}
 className={`px-4 py-3 border-2 rounded-xl text-[13px] font-semibold transition-all ${
 paymentForm.payment_method === 'GCash'
 ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
 : 'border-gray-200 text-gray-600 hover:border-gray-300'
 }`}
 >
 📱 GCash
 </button>
 </div>
 </div>

 {/* Amount Paid */}
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Amount Paid <span className="text-red-500">*</span>
 </label>
 <input
 type="number"
 step="0.01"
 value={paymentForm.amount}
 onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) })}
 className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none text-gray-900 bg-white"
 placeholder="Enter amount"
 />
 {paymentForm.amount > completeModal.order?.total_amount && (
 <p className="text-[11px] text-amber-600 mt-2">
 Change: ₱{(paymentForm.amount - completeModal.order?.total_amount).toFixed(2)}
 </p>
 )}
 </div>

 {/* GCash Reference Number */}
 {paymentForm.payment_method === 'GCash' && (
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 GCash Reference Number <span className="text-red-500">*</span>
 </label>
 <input
 type="text"
 value={paymentForm.reference_number}
 onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
 className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none text-gray-900 bg-white"
 placeholder="Enter GCash reference number"
 />
 </div>
 )}

 {/* Payment Notes */}
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Notes (Optional)
 </label>
 <textarea
 value={paymentForm.notes}
 onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
 rows="2"
 className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none text-gray-900 bg-white"
 placeholder="Add payment notes..."
 />
 </div>
 </form>

 <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end gap-3 border-t border-gray-200">
 <button
 type="button"
 onClick={() => setCompleteModal({ isOpen: false, order: null })}
 className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-all"
 >
 Cancel
 </button>
 <button
 type="submit"
 onClick={(e) => {
 e.preventDefault();
 handleCompleteOrder();
 }}
 className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold shadow-sm hover:shadow-md transition-all"
 >
 Complete Order & Record Payment
 </button>
 <p className="text-xs text-gray-500 w-full text-center mt-2">
 Press <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">Enter</kbd> to submit
 </p>
 </div>
 </div>
 </div>
 )}

 {/* Void Order Modal */}
 {voidModal.isOpen && (
 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-xl shadow-sm max-w-md w-full">
 <div className="bg-red-600 text-white p-6 rounded-t-xl">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-white/20 rounded-lg">
 <XCircle className="w-6 h-6" />
 </div>
 <div>
 <h2 className="text-lg font-bold">Void Order</h2>
 <p className="text-red-100 text-[11px]">Order: {voidModal.order?.order_number}</p>
 </div>
 </div>
 </div>

 <div className="p-6">
 <p className="text-gray-600 mb-4">
 Voiding this order will cancel it and restore all items back to inventory. Please provide a reason:
 </p>

 <div className="space-y-4">
 <div>
 <label className="block text-[11px] font-semibold text-gray-700 mb-2">
 Reason for Voiding <span className="text-rose-500">*</span>
 </label>
 <textarea
 value={voidModal.reason}
 onChange={(e) => setVoidModal({ ...voidModal, reason: e.target.value })}
 placeholder="E.g., Customer cancelled, Wrong order, Duplicate entry..."
 className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-red-500 transition-colors"
 rows="3"
 maxLength="500"
 />
 <p className="text-xs text-gray-500 mt-1">{voidModal.reason.length}/500 characters</p>
 </div>

 <div className="bg-red-50 border border-red-200 rounded-lg p-4">
 <h4 className="font-semibold text-red-900 mb-2 text-[11px]">Order Details:</h4>
 <div className="text-[11px] text-red-800 space-y-1">
 <p><strong>Customer:</strong> {voidModal.order?.customer_name || 'Walk-in'}</p>
 <p><strong>Items:</strong> {voidModal.order?.order_items?.length || 0} item(s)</p>
 <p><strong>Total:</strong> ₱{voidModal.order?.total_amount?.toFixed(2)}</p>
 <p><strong>Status:</strong> {voidModal.order?.status}</p>
 </div>
 </div>
 </div>
 </div>

 <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end gap-3 border-t border-gray-200">
 <button
 onClick={() => setVoidModal({ isOpen: false, order: null, reason: '' })}
 className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-all"
 >
 Cancel
 </button>
 <button
 onClick={handleVoidOrder}
 className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold shadow-sm hover:shadow-md transition-all"
 >
 Void Order
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Delete Modal */}
 <DeleteModal
 isOpen={deleteModal.isOpen}
 onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
 title="Delete Order"
 message="Are you sure you want to delete this order? This action cannot be undone and will return the items to inventory."
 itemName={deleteModal.name}
 onConfirm={handleDelete}
 />
 </div>
 );
};

export default Orders;
