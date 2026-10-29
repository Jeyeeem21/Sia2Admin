import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Tag,
  Warehouse,
  ShoppingCart,
  Users,
  Building2,
  BarChart3,
  Settings
} from 'lucide-react';

const MobileBottomNav = () => {
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', color: 'text-emerald-500' },
    { icon: Package, label: 'Products', path: '/products', color: 'text-emerald-500' },
    { icon: Tag, label: 'Categories', path: '/categories', color: 'text-blue-500' },
    { icon: Warehouse, label: 'Inventory', path: '/inventory', color: 'text-emerald-500' },
    { icon: ShoppingCart, label: 'Orders', path: '/orders', color: 'text-amber-500' },
    { icon: Users, label: 'Staff', path: '/staff', color: 'text-rose-500' },
    { icon: Building2, label: 'Rentals', path: '/rentals', color: 'text-emerald-500' },
    // { icon: GraduationCap, label: 'Toga Rentals', path: '/toga-rentals', color: 'text-purple-500' }, // Hidden for admin
    { icon: BarChart3, label: 'Reports', path: '/reports', color: 'text-violet-500' },
    { icon: Settings, label: 'Settings', path: '/settings', color: 'text-gray-500' },
  ];

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-around px-1 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors min-w-0 flex-1 ${
                active
                  ? 'text-emerald-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-emerald-600' : ''}`} />
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;