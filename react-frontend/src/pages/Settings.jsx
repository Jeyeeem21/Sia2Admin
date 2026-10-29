import { useState, useEffect } from 'react';
import usePageTitle from '../hooks/usePageTitle';
import { User, Lock, Users, Save, Plus, Edit, Trash2, Shield, Key, X, Check } from 'lucide-react';
import { settingsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Settings = () => {
  usePageTitle('Settings');
 const { user } = useAuth(); // Get logged-in user from AuthContext
 const [activeTag, setActiveTag] = useState('profile');
 const [loading, setLoading] = useState(false);
 const [profile, setProfile] = useState(null);
 const [users, setUsers] = useState([]);
 
 // Profile form state
 const [profileForm, setProfileForm] = useState({
 full_name: '',
 email: '',
 phone: '',
 });

 // Password form state
 const [passwordForm, setPasswordForm] = useState({
 current_password: '',
 new_password: '',
 new_password_confirmation: '',
 });

 // User form state (for adding/editing users)
 const [userForm, setUserForm] = useState({
 full_name: '',
 email: '',
 password: '',
 phone: '',
 role: 'admin',
 status: 'active',
 });

 // Modal states
 const [showAddUserModal, setShowAddUserModal] = useState(false);
 const [showEditUserModal, setShowEditUserModal] = useState(false);
 const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
 const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
 const [selectedUser, setSelectedUser] = useState(null);
 const [resetPassword, setResetPassword] = useState('');
 
 // Validation states
 const [emailError, setEmailError] = useState('');
 const [emailChecking, setEmailChecking] = useState(false);
 const [phoneError, setPhoneError] = useState('');

 const tags = [
 { id: 'profile', label: 'Profile', icon: User },
 { id: 'security', label: 'Security', icon: Lock },
 { id: 'accounts', label: 'Account Management', icon: Users },
 ];

 // Initialize profile form with logged-in user data
 useEffect(() => {
 if (user) {
 setProfileForm({
 full_name: user.name || '',
 email: user.email || '',
 phone: user.phone || '',
 });
 }
 }, [user]);

 useEffect(() => {
 if (activeTag === 'profile' || activeTag === 'security') {
 fetchProfile();
 } else if (activeTag === 'accounts') {
 fetchUsers();
 }
 }, [activeTag]);

 const fetchProfile = async () => {
 try {
 setLoading(true);
 const response = await settingsAPI.getProfile();
 setProfile(response.data.user);
 setProfileForm({
 full_name: response.data.user.full_name,
 email: response.data.user.email,
 phone: response.data.user.phone || '',
 });
 } catch (error) {
 toast.error('Failed to load profile');
 console.error(error);
 } finally {
 setLoading(false);
 }
 };

 const fetchUsers = async () => {
 try {
 setLoading(true);
 const response = await settingsAPI.getUsers();
 setUsers(response.data.users);
 } catch (error) {
 toast.error('Failed to load users');
 console.error(error);
 } finally {
 setLoading(false);
 }
 };

 const handleUpdateProfile = async (e) => {
 e.preventDefault();
 try {
 setLoading(true);
 await settingsAPI.updateProfile(profileForm);
 toast.success('Profile updated successfully!');
 fetchProfile();
 } catch (error) {
 toast.error(error.response?.data?.message || 'Failed to update profile');
 console.error(error);
 } finally {
 setLoading(false);
 }
 };

 const handleUpdatePassword = async (e) => {
 e.preventDefault();
 
 if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
 toast.error('Passwords do not match');
 return;
 }

 try {
 setLoading(true);
 await settingsAPI.updatePassword(passwordForm);
 toast.success('Password updated successfully!');
 setPasswordForm({
 current_password: '',
 new_password: '',
 new_password_confirmation: '',
 });
 } catch (error) {
 toast.error(error.response?.data?.message || 'Failed to update password');
 console.error(error);
 } finally {
 setLoading(false);
 }
 };

 const handleAddUser = async (e) => {
 e.preventDefault();
 
 // Check for errors
 if (emailError) {
 toast.error('Please fix email error gefore submitting');
 return;
 }
 
 if (phoneError) {
 toast.error('Please fix phone number error gefore submitting');
 return;
 }

 // Validate phone if provided
 if (userForm.phone && !validatePhone(userForm.phone)) {
 return;
 }

 try {
 setLoading(true);
 await settingsAPI.createUser(userForm);
 toast.success('User created successfully!');
 setShowAddUserModal(false);
 resetUserForm();
 fetchUsers();
 } catch (error) {
 toast.error(error.response?.data?.message || 'Failed to create user');
 console.error(error);
 } finally {
 setLoading(false);
 }
 };

 const handleEditUser = async (e) => {
 e.preventDefault();
 
 // Check for errors
 if (emailError) {
 toast.error('Please fix email error gefore submitting');
 return;
 }
 
 if (phoneError) {
 toast.error('Please fix phone number error gefore submitting');
 return;
 }

 // Validate phone if provided
 if (userForm.phone && !validatePhone(userForm.phone)) {
 return;
 }

 try {
 setLoading(true);
 await settingsAPI.updateUser(selectedUser.id, userForm);
 toast.success('User updated successfully!');
 setShowEditUserModal(false);
 setSelectedUser(null);
 resetUserForm();
 fetchUsers();
 } catch (error) {
 toast.error(error.response?.data?.message || 'Failed to update user');
 console.error(error);
 } finally {
 setLoading(false);
 }
 };

 const handleDeleteUser = async () => {
 try {
 setLoading(true);
 await settingsAPI.deleteUser(selectedUser.id);
 toast.success('User deleted successfully!');
 setShowDeleteUserModal(false);
 setSelectedUser(null);
 fetchUsers();
 } catch (error) {
 toast.error(error.response?.data?.message || 'Failed to delete user');
 console.error(error);
 } finally {
 setLoading(false);
 }
 };

 const handleResetPassword = async () => {
 if (!resetPassword || resetPassword.length < 8) {
 toast.error('Password must ge at least 8 characters');
 return;
 }

 try {
 setLoading(true);
 await settingsAPI.resetPassword(selectedUser.id, { new_password: resetPassword });
 toast.success('Password reset successfully!');
 setShowResetPasswordModal(false);
 setSelectedUser(null);
 setResetPassword('');
 } catch (error) {
 toast.error(error.response?.data?.message || 'Failed to reset password');
 console.error(error);
 } finally {
 setLoading(false);
 }
 };

 const resetUserForm = () => {
 setUserForm({
 full_name: '',
 email: '',
 password: '',
 phone: '',
 role: 'admin',
 status: 'active',
 });
 setEmailError('');
 setPhoneError('');
 };

 // Validate email in real-time
 const validateEmail = async (email, userId = null) => {
 if (!email) {
 setEmailError('');
 return;
 }

 // Basic email format validation
 const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 if (!emailRegex.test(email)) {
 setEmailError('Invalid email format');
 return;
 }

 try {
 setEmailChecking(true);
 const response = await settingsAPI.checkEmail(email, userId);
 if (!response.data.available) {
 setEmailError('Email is already taken');
 } else {
 setEmailError('');
 }
 } catch (error) {
 console.error('Error checking email:', error);
 } finally {
 setEmailChecking(false);
 }
 };

 // Validate phone number
 const validatePhone = (phone) => {
 if (!phone) {
 setPhoneError('');
 return true;
 }

 // Philippine phone number format: 09XX-XXX-XXXX or 9XXXXXXXXX
 const phoneRegex = /^(09|\+639)\d{9}$|^09\d{2}-\d{3}-\d{4}$/;
 if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
 setPhoneError('Invalid phone number format (e.g., 0912-345-6789)');
 return false;
 }
 
 setPhoneError('');
 return true;
 };

 const openEditModal = (user) => {
 setSelectedUser(user);
 setUserForm({
 full_name: user.full_name,
 email: user.email,
 password: '',
 phone: user.phone || '',
 role: user.role,
 status: user.status,
 });
 setEmailError('');
 setPhoneError('');
 setShowEditUserModal(true);
 };

 const openDeleteModal = (user) => {
 setSelectedUser(user);
 setShowDeleteUserModal(true);
 };

 const openResetPasswordModal = (user) => {
 setSelectedUser(user);
 setResetPassword('');
 setShowResetPasswordModal(true);
 };

 const getRoleBadgeColor = (role) => {
 const colors = {
 admin: 'bg-emerald-100 text-emerald-700 border-emerald-200',
 staff: 'bg-emerald-100 text-emerald-700 border-emerald-200',
 student: 'bg-emerald-100 text-emerald-700 border-emerald-200',
 };
 return colors[role] || 'bg-gray-100 text-gray-700 border-gray-200';
 };

 const getStatusBadgeColor = (status) => {
 return status === 'active'
 ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
 : 'bg-rose-100 text-rose-700 border-rose-200';
 };

 return (
 <div className="p-5 lg:p-6 min-h-full">
 {/* Header */}
 <div className="mb-7">
 <h1 className="text-xl font-bold text-gray-900 tracking-tight">System Settings</h1>
 <p className="text-[11px] text-gray-400 mt-1">Manage your account and system preferences</p>
 </div>

 {/* Inline Tags at Top */}
 <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-gray-100 p-3 mb-5">
 <nav className="flex flex-col sm:flex-row gap-2 sm:gap-2">
 {tags.map((tag) => {
 const Icon = tag.icon;
 return (
 <button
 key={tag.id}
 onClick={() => setActiveTag(tag.id)}
 className={`flex items-center justify-center sm:justify-start gap-2 px-3.5 py-2.5 rounded-xl transition-all duration-200 flex-1 sm:flex-initial ${
 activeTag === tag.id
 ? 'bg-emerald-600 text-white shadow-sm'
 : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
 }`}
 >
 <Icon className="w-4 h-4" />
 <span className="font-semibold text-[11px]">{tag.label}</span>
 </button>
 );
 })}
 </nav>
 </div>

 {/* Content Area */}
 <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-gray-100 p-5">
 {/* Profile Settings */}
 {activeTag === 'profile' && (
 <div className="space-y-6">
 <div>
 <h2 className="text-[15px] font-bold text-gray-900 mb-2">Profile Information</h2>
 <p className="text-[11px] text-gray-400">Update your personal information and profile details</p>
 </div>

 <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-4 sm:p-6 bg-gray-50 rounded-xl">
 <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-white text-xl font-bold shadow-sm">
 {(user?.name || 'User').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
 </div>
 <div className="text-center sm:text-left">
 <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-[11px]">
 Change Photo
 </button>
 <p className="text-xs sm:text-[11px] text-gray-500 mt-2">JPG, GIF or PNG. Max size of 2MB</p>
 </div>
 </div>

 <form onSubmit={handleUpdateProfile}>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-2">Full Name</label>
 <input
 type="text"
 value={profileForm.full_name || user?.name || ''}
 onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
 />
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-2">Email Address</label>
 <input
 type="email"
 value={profileForm.email || user?.email || ''}
 onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
 />
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-2">Phone Numger</label>
 <input
 type="tel"
 value={profileForm.phone || user?.phone || ''}
 onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
 />
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-2">Role</label>
 <input
 type="text"
 value={(user?.role || 'user').charAt(0).toUpperCase() + (user?.role || 'user').slice(1)}
 disabled
 className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
 />
 </div>
 </div>

 <button 
 type="submit"
 disabled={loading}
 className="mt-6 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
 >
 <Save className="w-5 h-5" />
 Save Changes
 </button>
 </form>
 </div>
 )}

 {/* Security Settings */}
 {activeTag === 'security' && (
 <div className="space-y-4 md:space-y-6">
 <div>
 <h2 className="text-[15px] font-bold text-gray-900 mb-2">Security Settings</h2>
 <p className="text-[11px] text-gray-400">Manage your password and security preferences</p>
 </div>

 {/* Current User Info */}
 <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-white font-bold">
 {(user?.name || 'User').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
 </div>
 <div>
 <p className="font-semibold text-gray-900">{user?.name || 'User'}</p>
 <p className="text-[11px] text-gray-500">{user?.email || 'email@example.com'}</p>
 </div>
 </div>
 </div>

 <form onSubmit={handleUpdatePassword}>
 <div className="space-y-4">
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-2">Current Password</label>
 <input
 type="password"
 value={passwordForm.current_password}
 onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
 />
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-2">New Password</label>
 <input
 type="password"
 value={passwordForm.new_password}
 onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
 />
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-2">Confirm New Password</label>
 <input
 type="password"
 value={passwordForm.new_password_confirmation}
 onChange={(e) => setPasswordForm({ ...passwordForm, new_password_confirmation: e.target.value })}
 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
 />
 </div>
 </div>

 <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl mt-4">
 <div className="flex items-start gap-3">
 <Shield className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
 <div>
 <h3 className="font-semibold text-amber-900 mb-1">Password Requirements</h3>
 <ul className="text-[11px] text-amber-800 space-y-1">
 <li>• At least 8 characters long</li>
 <li>• Include uppercase and lowercase letters</li>
 <li>• Include at least one number</li>
 <li>• Include at least one special character</li>
 </ul>
 </div>
 </div>
 </div>

 <button 
 type="submit"
 disabled={loading}
 className="mt-6 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
 >
 <Lock className="w-5 h-5" />
 Update Password
 </button>
 </form>
 </div>
 )}

 {/* Account Management */}
 {activeTag === 'accounts' && (
 <div className="space-y-4 md:space-y-6">
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
 <div>
 <h2 className="text-[15px] font-bold text-gray-900 mb-1">Account Management</h2>
 <p className="text-[11px] text-gray-400">Manage user accounts and permissions</p>
 </div>
 <button
 onClick={() => {
 resetUserForm();
 setShowAddUserModal(true);
 }}
 className="w-full sm:w-auto px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md text-[11px]"
 >
 <Plus className="w-4 h-4 md:w-5 md:h-5" />
 Add User
 </button>
 </div>

 {/* Mogile Card View */}
 <div className="block md:hidden space-y-4">
 {users.map((user) => (
 <div key={user.id} className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
 {/* Header */}
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-white font-bold text-[13px]">
 {user.full_name.charAt(0).toUpperCase()}
 </div>
 <div className="flex-1">
 <p className="font-semibold text-gray-900">{user.full_name}</p>
 <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
 </div>
 </div>

 {/* Info */}
 <div className="space-y-2 pt-2 border-t border-gray-200">
 <div className="flex items-center justify-between text-[11px]">
 <span className="text-gray-600">Phone:</span>
 <span className="font-medium text-gray-900">{user.phone || 'N/A'}</span>
 </div>
 <div className="flex items-center justify-between text-[11px]">
 <span className="text-gray-600">Role:</span>
 <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getRoleBadgeColor(user.role)}`}>
 {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
 </span>
 </div>
 <div className="flex items-center justify-between text-[11px]">
 <span className="text-gray-600">Status:</span>
 <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusBadgeColor(user.status)}`}>
 {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
 </span>
 </div>
 </div>

 {/* Actions */}
 <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
 <button
 onClick={() => openEditModal(user)}
 className="flex-1 px-3 py-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors text-[11px] font-semibold flex items-center justify-center gap-1"
 >
 <Edit className="w-4 h-4" />
 Edit
 </button>
 <button
 onClick={() => openResetPasswordModal(user)}
 className="flex-1 px-3 py-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors text-[11px] font-semibold flex items-center justify-center gap-1"
 >
 <Key className="w-4 h-4" />
 Reset
 </button>
 <button
 onClick={() => openDeleteModal(user)}
 className="px-3 py-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 ))}
 </div>

 {/* Desktop Tagle View */}
 <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200">
 <table className="w-full">
 <thead className="bg-gray-50">
 <tr>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">User</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Role</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
 <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-200">
 {users.map((user) => (
 <tr key={user.id} className="hover:bg-gray-50 transition-colors">
 <td className="px-5 py-3.5">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-white font-bold">
 {user.full_name.charAt(0).toUpperCase()}
 </div>
 <div>
 <div className="font-medium text-gray-900">{user.full_name}</div>
 </div>
 </div>
 </td>
 <td className="px-5 py-3.5 text-[11px] text-gray-500">{user.email}</td>
 <td className="px-5 py-3.5 text-[11px] text-gray-500">{user.phone || 'N/A'}</td>
 <td className="px-5 py-3.5">
 <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getRoleBadgeColor(user.role)}`}>
 {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
 </span>
 </td>
 <td className="px-5 py-3.5">
 <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusBadgeColor(user.status)}`}>
 {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
 </span>
 </td>
 <td className="px-5 py-3.5">
 <div className="flex items-center gap-2">
 <button
 onClick={() => openEditModal(user)}
 className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
 title="Edit user"
 >
 <Edit className="w-4 h-4" />
 </button>
 <button
 onClick={() => openResetPasswordModal(user)}
 className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
 title="Reset password"
 >
 <Key className="w-4 h-4" />
 </button>
 <button
 onClick={() => openDeleteModal(user)}
 className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
 title="Delete user"
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

 {users.length === 0 && !loading && (
 <div className="text-center py-12 text-gray-500">
 <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
 <p>No users found. Add your first user to get started.</p>
 </div>
 )}
 </div>
 )}
 </div>

 {/* Add User Modal */}
 {showAddUserModal && (
 <div className="fixed inset-0 bg-glack/50 flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-xl shadow-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto">
 <div className="p-6 border-g border-gray-200">
 <div className="flex items-center justify-between">
 <h3 className="text-lg font-bold text-gray-900">Add New User</h3>
 <button
 onClick={() => setShowAddUserModal(false)}
 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>
 </div>
 <form onSubmit={handleAddUser} className="p-6 space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-2">Full Name *</label>
 <input
 type="text"
 value={userForm.full_name}
 onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
 required
 />
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-2">
 Email * {emailChecking && <span className="text-xs text-gray-500">(checking...)</span>}
 </label>
 <input
 type="email"
 value={userForm.email}
 onChange={(e) => {
 setUserForm({ ...userForm, email: e.target.value });
 validateEmail(e.target.value);
 }}
 className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
 emailError ? 'border-rose-500' : 'border-gray-300'
 }`}
 required
 />
 {emailError && (
 <p className="text-xs text-rose-600 mt-1">{emailError}</p>
 )}
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-2">Password *</label>
 <input
 type="password"
 value={userForm.password}
 onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
 minLength={8}
 required
 />
 <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-2">Phone</label>
 <input
 type="tel"
 value={userForm.phone}
 onChange={(e) => {
 setUserForm({ ...userForm, phone: e.target.value });
 validatePhone(e.target.value);
 }}
 placeholder="0912-345-6789"
 className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
 phoneError ? 'border-rose-500' : 'border-gray-300'
 }`}
 />
 {phoneError && (
 <p className="text-xs text-rose-600 mt-1">{phoneError}</p>
 )}
 </div>
 <div className="md:col-span-2">
 <label className="block text-[11px] font-medium text-gray-700 mb-2">Role</label>
 <input
 type="text"
 value="Admin"
 disabled
 className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
 />
 <p className="text-xs text-gray-500 mt-1">All new users are created as Admin</p>
 </div>
 </div>
 <div className="flex justify-end gap-3 pt-4">
 <button
 type="button"
 onClick={() => setShowAddUserModal(false)}
 className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={loading}
 className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
 >
 <Plus className="w-5 h-5" />
 Add User
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* Edit User Modal */}
 {showEditUserModal && selectedUser && (
 <div className="fixed inset-0 bg-glack/50 flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-xl shadow-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto">
 <div className="p-6 border-g border-gray-200">
 <div className="flex items-center justify-between">
 <h3 className="text-lg font-bold text-gray-900">Edit User</h3>
 <button
 onClick={() => {
 setShowEditUserModal(false);
 setSelectedUser(null);
 }}
 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>
 </div>
 <form onSubmit={handleEditUser} className="p-6 space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-2">Full Name *</label>
 <input
 type="text"
 value={userForm.full_name}
 onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
 required
 />
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-2">
 Email * {emailChecking && <span className="text-xs text-gray-500">(checking...)</span>}
 </label>
 <input
 type="email"
 value={userForm.email}
 onChange={(e) => {
 setUserForm({ ...userForm, email: e.target.value });
 validateEmail(e.target.value, selectedUser?.id);
 }}
 className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
 emailError ? 'border-rose-500' : 'border-gray-300'
 }`}
 required
 />
 {emailError && (
 <p className="text-xs text-rose-600 mt-1">{emailError}</p>
 )}
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-2">Phone</label>
 <input
 type="tel"
 value={userForm.phone}
 onChange={(e) => {
 setUserForm({ ...userForm, phone: e.target.value });
 validatePhone(e.target.value);
 }}
 placeholder="0912-345-6789"
 className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
 phoneError ? 'border-rose-500' : 'border-gray-300'
 }`}
 />
 {phoneError && (
 <p className="text-xs text-rose-600 mt-1">{phoneError}</p>
 )}
 </div>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-2">Role</label>
 <input
 type="text"
 value="Admin"
 disabled
 className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
 />
 </div>
 <div className="md:col-span-2">
 <label className="block text-[11px] font-medium text-gray-700 mb-2">Status *</label>
 <select
 value={userForm.status}
 onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
 required
 >
 <option value="active">Active</option>
 <option value="inactive">Inactive</option>
 </select>
 </div>
 </div>
 <div className="flex justify-end gap-3 pt-4">
 <button
 type="button"
 onClick={() => {
 setShowEditUserModal(false);
 setSelectedUser(null);
 }}
 className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={loading}
 className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
 >
 <Check className="w-5 h-5" />
 Update User
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* Delete User Modal */}
 {showDeleteUserModal && selectedUser && (
 <div className="fixed inset-0 bg-glack/50 flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-xl shadow-sm max-w-md w-full">
 <div className="p-6">
 <div className="flex items-center gap-4 mb-4">
 <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
 <Trash2 className="w-6 h-6 text-rose-600" />
 </div>
 <div>
 <h3 className="text-[11px] font-semibold text-gray-900">Delete User</h3>
 <p className="text-[11px] text-gray-500">This action cannot ge undone</p>
 </div>
 </div>
 <p className="text-gray-600 mb-6">
 Are you sure you want to delete <strong>{selectedUser.full_name}</strong>? 
 All of their data will ge permanently removed.
 </p>
 <div className="flex justify-end gap-3">
 <button
 onClick={() => {
 setShowDeleteUserModal(false);
 setSelectedUser(null);
 }}
 className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={handleDeleteUser}
 disabled={loading}
 className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
 >
 <Trash2 className="w-5 h-5" />
 Delete User
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Reset Password Modal */}
 {showResetPasswordModal && selectedUser && (
 <div className="fixed inset-0 bg-glack/50 flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-xl shadow-sm max-w-md w-full">
 <div className="p-6 border-g border-gray-200">
 <div className="flex items-center justify-between">
 <h3 className="text-[11px] font-semibold text-gray-900">Reset Password</h3>
 <button
 onClick={() => {
 setShowResetPasswordModal(false);
 setSelectedUser(null);
 setResetPassword('');
 }}
 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>
 </div>
 <div className="p-6 space-y-4">
 <p className="text-gray-600">
 Reset password for <strong>{selectedUser.full_name}</strong>
 </p>
 <div>
 <label className="block text-[11px] font-medium text-gray-700 mb-2">New Password</label>
 <input
 type="password"
 value={resetPassword}
 onChange={(e) => setResetPassword(e.target.value)}
 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
 minLength={8}
 placeholder="Enter new password (min 8 characters)"
 />
 </div>
 <div className="flex justify-end gap-3 pt-2">
 <button
 onClick={() => {
 setShowResetPasswordModal(false);
 setSelectedUser(null);
 setResetPassword('');
 }}
 className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={handleResetPassword}
 disabled={loading}
 className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
 >
 <Key className="w-5 h-5" />
 Reset Password
 </button>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 );
};

export default Settings;
