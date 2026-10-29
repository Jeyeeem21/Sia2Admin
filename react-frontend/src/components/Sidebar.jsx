import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePrefetch } from '../hooks/usePrefetch';
import ConfirmModal from './ConfirmModal';
import {
  ChevronRight,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  BarChart3,
  Warehouse,
  LogOut,
  ChevronDown,
  Tag,
  Building2,
  PanelLeft
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProductsSubmenu, setShowProductsSubmenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();
  const userMenuRef = useRef(null);
  
  const { 
    prefetchDashboard, 
    prefetchProducts, 
    prefetchInventory, 
    prefetchOrders, 
    prefetchCategories,
    prefetchStaff,
    prefetchRentals,
    prefetchReports
  } = usePrefetch();

  const getUserInitials = () => {
    if (!user || !user.name) return 'U';
    return user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { 
      icon: Package, 
      label: 'Products', 
      path: '/products',
      hasSubmenu: true,
      submenu: [
        { icon: Tag, label: 'Categories', path: '/categories' }
      ]
    },
    { icon: Warehouse, label: 'Inventory', path: '/inventory' },
    { icon: ShoppingCart, label: 'Orders', path: '/orders' },
    { icon: Users, label: 'Staff', path: '/staff' },
    { icon: Building2, label: 'Rentals', path: '/rentals' },
    { icon: BarChart3, label: 'Reports', path: '/reports' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const isActive = (path) => location.pathname === path;
  
  useEffect(() => {
    if (location.pathname === '/categories') {
      setShowProductsSubmenu(true);
    }
  }, [location.pathname]);

  return (
    <div
      className={`${
        isCollapsed ? 'w-[72px]' : 'w-64'
      } bg-white border-r border-gray-200 h-screen transition-all duration-200 flex flex-col relative`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-gray-100 flex-shrink-0">
        <div className={`flex items-center transition-all duration-200 ${isCollapsed ? 'justify-center w-full' : ''}`}>
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div className={`ml-3 transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
            <h1 className="font-semibold text-sm text-gray-900 leading-tight">InvenTrack</h1>
            <p className="text-[11px] text-gray-500 leading-tight">Management System</p>
          </div>
        </div>
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Collapse sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="absolute -right-3 top-5 p-1 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors z-20"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto sidebar-scroll">
        <div className={`${isCollapsed ? 'hidden' : 'block'} px-3 mb-2`}>
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Menu</span>
        </div>
        <ul className="space-y-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const hasSubmenu = item.hasSubmenu;
            const isSubmenuOpen = hasSubmenu && showProductsSubmenu;
            
            return (
              <li key={item.path}>
                <div>
                  <div className="flex items-center gap-0.5">
                    <Link
                      to={item.path}
                      onClick={() => {
                        if (hasSubmenu && !isCollapsed) {
                          setShowProductsSubmenu(true);
                        }
                      }}
                      onMouseEnter={() => {
                        if (item.path === '/dashboard') prefetchDashboard();
                        else if (item.path === '/products') prefetchProducts();
                        else if (item.path === '/inventory') prefetchInventory();
                        else if (item.path === '/orders') prefetchOrders();
                        else if (item.path === '/staff') prefetchStaff();
                        else if (item.path === '/rentals') prefetchRentals();
                        else if (item.path === '/reports') prefetchReports();
                      }}
                      className={`group relative flex items-center flex-1 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                        active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      title={isCollapsed ? item.label : ''}
                    >
                      <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? 'text-emerald-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                      
                      <span className={`ml-3 transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                        {item.label}
                      </span>
                    </Link>

                    {hasSubmenu && !isCollapsed && (
                      <button
                        onClick={() => setShowProductsSubmenu(!showProductsSubmenu)}
                        className={`p-1.5 rounded-md transition-colors ${
                          active ? 'text-emerald-500 hover:bg-emerald-100' : 'text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isSubmenuOpen ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>

                  {hasSubmenu && isSubmenuOpen && !isCollapsed && (
                    <ul className="mt-0.5 ml-5 pl-3 border-l border-gray-200 space-y-0.5">
                      {item.submenu.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const subActive = isActive(subItem.path);
                        
                        return (
                          <li key={subItem.path}>
                            <Link
                              to={subItem.path}
                              onMouseEnter={() => {
                                if (subItem.path === '/categories') prefetchCategories();
                              }}
                              className={`flex items-center px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                                subActive
                                  ? 'text-emerald-700 bg-emerald-50'
                                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                              }`}
                            >
                              <SubIcon className={`w-4 h-4 flex-shrink-0 ${subActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                              <span className="ml-2.5">{subItem.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Footer */}
      <div className="border-t border-gray-100 p-3 flex-shrink-0 mt-auto" ref={userMenuRef}>
        <div 
          onClick={() => setShowUserMenu(!showUserMenu)}
          className={`flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${isCollapsed ? 'justify-center' : ''}`}
        >
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-emerald-700">{getUserInitials()}</span>
          </div>
          <div className={`ml-2.5 transition-all duration-200 min-w-0 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 flex-1'}`}>
            <p className="text-[13px] font-medium text-gray-900 truncate">{user?.name || 'User'}</p>
            <p className="text-[11px] text-gray-400 truncate">{user?.role === 'admin' ? 'Admin' : user?.role || 'User'}</p>
          </div>
          {!isCollapsed && (
            <ChevronRight className={`ml-auto w-3.5 h-3.5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${showUserMenu ? 'rotate-90' : ''}`} />
          )}
        </div>

        {/* Dropdown */}
        {showUserMenu && (
          <div className={`absolute ${isCollapsed ? 'left-full ml-2 bottom-3' : 'left-3 right-3 bottom-16'} bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden z-50 animate-fade-in`}>
            <div className="p-3 border-b border-gray-100">
              <p className="text-[13px] font-medium text-gray-900">{user?.name || 'User'}</p>
              <p className="text-[11px] text-gray-400">{user?.email || 'user@example.com'}</p>
            </div>
            <div className="py-1">
              <Link to="/settings" className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-gray-50 transition-colors text-left text-[13px] text-gray-600 hover:text-gray-900">
                <Settings className="w-4 h-4 text-gray-400" />
                Settings
              </Link>
            </div>
            <div className="border-t border-gray-100 py-1">
              <button 
                onClick={() => setShowLogoutModal(true)}
                className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-red-50 transition-colors text-left text-[13px] text-red-600"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={logout}
        type="danger"
        title="Log Out"
        message="Are you sure you want to log out? You'll need to sign in again to access your account."
        confirmText="Log Out"
        cancelText="Cancel"
      />
    </div>
  );
};

export default Sidebar;