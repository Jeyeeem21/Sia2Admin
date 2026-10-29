import { useState, useEffect, memo } from 'react';
import usePageTitle from '../hooks/usePageTitle';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Box,
  Calendar,
  CalendarDays,
  CalendarRange,
  X,
  AlertCircle,
  Building2,
  Users,
  Home,
  Activity,
  BarChart3,
  Layers,
  ShoppingBag,
  Sparkles
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid,
  Tooltip, Area, AreaChart
} from 'recharts';
import { useDashboard } from '../hooks/useDashboard';
import { StatsCardSkeleton } from '../components/LoadingStates';
import { useQuery } from '@tanstack/react-query';
import { salesAnalyticsAPI, rentalsAPI } from '../services/api';

const PESO = '\u20B1';

/* ------------------------------------------------------------------ */
/*  Stat Card                                                         */
/* ------------------------------------------------------------------ */
const StatsCard = memo(({ stat, index }) => {
  const Icon = stat.icon;
  return (
    <div className="group relative bg-white rounded-2xl p-5 border border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
      <div className={`absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-[0.07] ${stat.bgColor} group-hover:scale-125 transition-transform duration-500`} />
      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className={`${stat.bgColor} p-2.5 rounded-xl`}>
            <Icon className={`w-4 h-4 ${stat.textColor}`} />
          </div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{stat.title}</p>
        </div>
        <div className="flex items-end justify-between">
          <p className="text-[22px] font-bold text-gray-900 tracking-tight leading-none">{stat.value}</p>
          <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
            stat.trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
          }`}>
            {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {stat.change}
          </span>
        </div>
      </div>
    </div>
  );
});
StatsCard.displayName = 'StatsCard';

/* ------------------------------------------------------------------ */
/*  Sales Comparison Card                                              */
/* ------------------------------------------------------------------ */
const SalesCard = ({ icon: Icon, iconBg, iconColor, label, labelColor, current, currentLabel, previous, previousLabel, previousOrders, currentOrders, trend, growthRate, vsLabel }) => (
  <div className="bg-white rounded-2xl p-5 border border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300">
    <div className="flex items-center gap-3 mb-5">
      <div className={`${iconBg} p-2.5 rounded-xl`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <span className={`text-[10px] font-bold ${labelColor} uppercase tracking-widest`}>{label}</span>
    </div>

    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{currentLabel}</p>
    <p className="text-[22px] font-bold text-gray-900 tracking-tight mt-1">
      {PESO}{current.toLocaleString()}
    </p>
    <p className="text-[11px] text-gray-400 mt-0.5">{currentOrders} orders</p>

    <div className="border-t border-dashed border-gray-100 mt-4 pt-4">
      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{previousLabel}</p>
      <p className="text-[15px] font-bold text-gray-300 mt-1">{PESO}{previous.toLocaleString()}</p>
      <p className="text-[11px] text-gray-300">{previousOrders} orders</p>
    </div>

    <div className={`mt-4 flex items-center gap-2 px-3 py-2 rounded-xl ${
      trend === 'up' ? 'bg-emerald-50/60' : trend === 'down' ? 'bg-red-50/60' : 'bg-gray-50/60'
    }`}>
      {trend === 'up' ? (
        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
      ) : trend === 'down' ? (
        <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
      ) : (
        <Activity className="w-3.5 h-3.5 text-gray-400" />
      )}
      <span className={`text-[12px] font-bold ${
        trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-gray-400'
      }`}>
        {growthRate > 0 ? '+' : ''}{growthRate}%
      </span>
      <span className="text-[10px] text-gray-400 font-medium">{vsLabel}</span>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Section Header                                                     */
/* ------------------------------------------------------------------ */
const SectionHeader = ({ icon: Icon, title, subtitle, action }) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
      <div className="bg-gray-100/80 p-2 rounded-xl">
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      <div>
        <h2 className="text-[13px] font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Custom Tooltip                                                     */
/* ------------------------------------------------------------------ */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white px-3.5 py-2.5 rounded-xl shadow-2xl text-[11px] border border-gray-700">
      <p className="font-semibold mb-1.5 text-gray-300">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-[11px] leading-relaxed">
          <span className="text-gray-400">{p.name}:</span>{' '}
          <span className="text-white font-bold">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </p>
      ))}
    </div>
  );
};

/* ================================================================== */
/*  DASHBOARD                                                          */
/* ================================================================== */
const Dashboard = () => {
  usePageTitle('Dashboard');
  const navigate = useNavigate();
  const [salesPeriod, setSalesPeriod] = useState('daily');

  const { data: dashboardData, isLoading } = useDashboard();
  const { data: salesAnalytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['salesAnalytics'],
    queryFn: async () => {
      const response = await salesAnalyticsAPI.getOverview();
      return response.data;
    },
  });
  const { data: rentalsStats } = useQuery({
    queryKey: ['rentalStats'],
    queryFn: async () => {
      const response = await rentalsAPI.getStats();
      return response.data;
    },
    refetchInterval: 1000,
  });

  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (!dashboardData?.low_stock_items || dashboardData.low_stock_items.length === 0) {
      setShowNotification(false);
      return;
    }
    let hideTimer, cycleTimer;
    const cycle = () => {
      setShowNotification(true);
      hideTimer = setTimeout(() => {
        setShowNotification(false);
        setCurrentNotificationIndex(prev => (prev + 1) % dashboardData.low_stock_items.length);
      }, 5000);
    };
    cycle();
    cycleTimer = setInterval(cycle, 10000);
    return () => { clearTimeout(hideTimer); clearInterval(cycleTimer); };
  }, [dashboardData]);

  /* Loading */
  if (isLoading || !dashboardData) {
    return (
      <div className="p-5 lg:p-6 min-h-full">
        <div className="mb-8">
          <div className="h-6 w-44 bg-gray-200 rounded-xl animate-pulse mb-2.5" />
          <div className="h-3.5 w-64 bg-gray-100 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCardSkeleton /><StatsCardSkeleton /><StatsCardSkeleton /><StatsCardSkeleton />
        </div>
      </div>
    );
  }

  /* Data */
  const stats = [
    {
      title: "Today's Revenue",
      value: `${PESO}${dashboardData.stats.today_revenue.toLocaleString()}`,
      change: `${PESO}${dashboardData.stats.total_revenue.toLocaleString()}`,
      trend: 'up',
      icon: DollarSign,
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Active Orders',
      value: dashboardData.stats.active_orders.toString(),
      change: `${dashboardData.orders_by_status.pending} pending`,
      trend: 'up',
      icon: ShoppingBag,
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Low Stock',
      value: dashboardData.stats.low_stock_count.toString(),
      change: 'Needs restock',
      trend: 'down',
      icon: AlertTriangle,
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Total Products',
      value: dashboardData.stats.total_products.toString(),
      change: `${dashboardData.orders_by_status.completed} completed`,
      trend: 'up',
      icon: Package,
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
  ];

  let salesData = [];
  let periodDescription = '';
  if (salesPeriod === 'daily') {
    salesData = dashboardData.daily_sales.map(i => ({ name: i.label, revenue: i.revenue, orders: i.orders }));
    periodDescription = `Daily \u00b7 ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`;
  } else if (salesPeriod === 'weekly') {
    salesData = dashboardData.weekly_sales.map(i => ({ name: i.label, revenue: i.revenue, orders: i.orders }));
    periodDescription = `Weekly \u00b7 ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`;
  } else {
    salesData = dashboardData.monthly_sales.map(i => ({ name: i.label, revenue: i.revenue, orders: i.orders }));
    periodDescription = `Monthly \u00b7 ${new Date().getFullYear()}`;
  }

  const inventoryData = [
    { name: 'Available', value: dashboardData.stats.available_count || 0, color: '#16a34a' },
    { name: 'Low Stock', value: dashboardData.stats.low_stock_count || 0, color: '#f59e0b' },
    { name: 'Out of Stock', value: dashboardData.stats.out_of_stock_count || 0, color: '#ef4444' },
  ];

  const categoryData = dashboardData.top_products.map((p, i) => ({
    name: p.product_name,
    value: p.total_sold,
    color: ['#16a34a', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'][i % 5],
  }));

  const recentOrders = dashboardData.recent_orders.map(o => ({
    id: o.order_number,
    customer: o.customer_name || 'Walk-in',
    status: o.status,
    amount: `${PESO}${parseFloat(o.total_amount).toLocaleString()}`,
    time: new Date(o.created_at).toLocaleString(),
  }));

  const lowStockProducts = dashboardData.low_stock_items.map(i => ({
    name: i.product_name,
    stock: i.quantity,
    threshold: i.reorder_level,
  }));

  const statusStyles = {
    'Completed': { bg: 'bg-emerald-50 text-emerald-700', icon: CheckCircle },
    'Pending': { bg: 'bg-amber-50 text-amber-700', icon: Clock },
    'In Progress': { bg: 'bg-emerald-50 text-emerald-700', icon: TrendingUp },
    'Cancelled': { bg: 'bg-red-50 text-red-600', icon: XCircle },
  };

  const periodBtns = ['daily', 'weekly', 'monthly'];

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div className="p-5 lg:p-6 min-h-full">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              Live &middot; Auto-refreshes every 30s
            </p>
          </div>
          <p className="text-[11px] text-gray-400 font-medium hidden sm:block">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => <StatsCard key={i} stat={stat} index={i} />)}
      </div>

      {/* Sales Analytics Cards */}
      {!analyticsLoading && salesAnalytics && (
        <div className="mb-8">
          <SectionHeader icon={TrendingUp} title="Sales Performance" subtitle="Comparison across time periods" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SalesCard
              icon={Calendar} iconBg="bg-emerald-50" iconColor="text-emerald-600"
              label="Daily" labelColor="text-emerald-600"
              current={salesAnalytics.daily.today.total_sales}
              currentLabel="Today"
              currentOrders={salesAnalytics.daily.today.total_orders}
              previous={salesAnalytics.daily.yesterday.total_sales}
              previousLabel="Yesterday"
              previousOrders={salesAnalytics.daily.yesterday.total_orders}
              trend={salesAnalytics.daily.trend}
              growthRate={salesAnalytics.daily.growth_rate}
              vsLabel="vs yesterday"
            />
            <SalesCard
              icon={CalendarDays} iconBg="bg-emerald-50" iconColor="text-emerald-600"
              label="Monthly" labelColor="text-emerald-600"
              current={salesAnalytics.monthly.current.total_sales}
              currentLabel="This Month"
              currentOrders={salesAnalytics.monthly.current.total_orders}
              previous={salesAnalytics.monthly.previous.total_sales}
              previousLabel="Last Month"
              previousOrders={salesAnalytics.monthly.previous.total_orders}
              trend={salesAnalytics.monthly.trend}
              growthRate={salesAnalytics.monthly.growth_rate}
              vsLabel="vs last month"
            />
            <SalesCard
              icon={CalendarRange} iconBg="bg-amber-50" iconColor="text-amber-600"
              label="Yearly" labelColor="text-amber-600"
              current={salesAnalytics.yearly.current.total_sales}
              currentLabel="This Year"
              currentOrders={salesAnalytics.yearly.current.total_orders}
              previous={salesAnalytics.yearly.previous.total_sales}
              previousLabel="Last Year"
              previousOrders={salesAnalytics.yearly.previous.total_orders}
              trend={salesAnalytics.yearly.trend}
              growthRate={salesAnalytics.yearly.growth_rate}
              vsLabel="vs last year"
            />
          </div>
        </div>
      )}

      {/* Sales Chart */}
      <div className="mb-8 bg-white rounded-2xl p-6 border border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-[13px] font-bold text-gray-900">Sales Overview</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">{periodDescription}</p>
          </div>
          <div className="flex bg-gray-100/80 rounded-xl p-1">
            {periodBtns.map(p => (
              <button
                key={p}
                onClick={() => setSalesPeriod(p)}
                className={`px-3.5 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all duration-200 ${
                  salesPeriod === p
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={salesData} margin={{ top: 10, right: 5, bottom: 0, left: 5 }}>
            <defs>
              <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#16a34a" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gOrders" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2.5} fill="url(#gRevenue)" name="Revenue" dot={false} activeDot={{ r: 4, fill: '#16a34a', stroke: '#fff', strokeWidth: 2 }} />
            <Area type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} fill="url(#gOrders)" name="Orders" dot={false} activeDot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-6 mt-3 px-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 rounded-full bg-emerald-500" />
            <span className="text-[11px] text-gray-400 font-medium">Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 rounded-full bg-emerald-400" />
            <span className="text-[11px] text-gray-400 font-medium">Orders</span>
          </div>
        </div>
      </div>

      {/* Top Products + Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <SectionHeader icon={BarChart3} title="Top Selling Products" subtitle="By units sold" />
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#cbd5e1"
                height={60}
                interval={0}
                tick={({ x, y, payload }) => {
                  const words = payload.value.split(' ');
                  return (
                    <g transform={`translate(${x},${y})`}>
                      {words.map((w, i) => (
                        <text key={i} x={0} y={i * 12 + 8} textAnchor="middle" fill="#94a3b8" fontSize={10}>{w}</text>
                      ))}
                    </g>
                  );
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Units Sold" barSize={40}>
                {categoryData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col">
          <SectionHeader icon={Layers} title="Inventory" subtitle="Stock overview" />
          <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-xl p-4 mb-4">
            <p className="text-[10px] text-emerald-700/60 uppercase tracking-wider font-bold">Total Items</p>
            <p className="text-2xl font-bold text-emerald-700 mt-0.5">{dashboardData.stats.total_products}</p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={inventoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {inventoryData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-3">
            {inventoryData.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl bg-gray-50/60 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full ring-2 ring-white" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px] font-medium text-gray-600">{item.name}</span>
                </div>
                <span className="text-[11px] font-bold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rentals */}
      {rentalsStats && (
        <div className="mb-8">
          <SectionHeader
            icon={Building2}
            title="Rental Properties"
            subtitle="Property rental analytics"
            action={
              <button onClick={() => navigate('/rentals')} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[11px] font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all">
                Manage Rentals
              </button>
            }
          />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Properties', value: rentalsStats.total_properties, sub: `${rentalsStats.occupied_properties} occupied \u00b7 ${rentalsStats.vacant_properties} vacant`, icon: Home, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', badge: `${Math.round((rentalsStats.occupied_properties / rentalsStats.total_properties) * 100) || 0}%`, badgeBg: 'bg-emerald-50 text-emerald-600' },
              { label: 'Active Tenants', value: rentalsStats.total_tenants, sub: `${rentalsStats.active_contracts} active contracts`, icon: Users, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', badge: 'Active', badgeBg: 'bg-emerald-50 text-emerald-600' },
              { label: 'Monthly Revenue', value: `${PESO}${(rentalsStats.monthly_revenue || 0).toLocaleString()}`, sub: `From ${rentalsStats.occupied_properties} properties`, icon: DollarSign, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', badge: 'Monthly', badgeBg: 'bg-emerald-50 text-emerald-600' },
              { label: 'Pending Tasks', value: (rentalsStats.pending_payments || 0) + (rentalsStats.pending_maintenance || 0), sub: `${rentalsStats.pending_payments} payments \u00b7 ${rentalsStats.pending_maintenance} maint.`, icon: AlertTriangle, iconBg: 'bg-amber-50', iconColor: 'text-amber-600', badge: 'Pending', badgeBg: 'bg-amber-50 text-amber-600' },
            ].map((c, i) => {
              const CIcon = c.icon;
              return (
                <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`${c.iconBg} p-2.5 rounded-xl`}>
                      <CIcon className={`w-4 h-4 ${c.iconColor}`} />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badgeBg}`}>{c.badge}</span>
                  </div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{c.label}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{c.value}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{c.sub}</p>
                </div>
              );
            })}
          </div>

          {rentalsStats.expiring_contracts > 0 && (
            <div className="mb-6 bg-gradient-to-r from-amber-50/80 to-orange-50/60 rounded-2xl p-4 flex items-center gap-3 border border-amber-100/80">
              <div className="bg-amber-100 p-2.5 rounded-xl shrink-0">
                <Calendar className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-amber-900">
                  {rentalsStats.expiring_contracts} {rentalsStats.expiring_contracts === 1 ? 'contract' : 'contracts'} expiring soon
                </p>
                <p className="text-[11px] text-amber-700/70 mt-0.5">Review and renew within 60 days</p>
              </div>
              <button onClick={() => navigate('/rentals')} className="shrink-0 px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-[11px] font-semibold hover:bg-emerald-700 transition-colors">
                Review
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Property Status */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <h3 className="text-[13px] font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="bg-gray-100/80 p-2 rounded-xl">
                  <Home className="w-4 h-4 text-gray-500" />
                </div>
                Property Status
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Occupied', value: rentalsStats.occupied_properties, color: '#16a34a' },
                      { name: 'Vacant', value: rentalsStats.vacant_properties, color: '#e2e8f0' },
                    ]}
                    cx="50%" cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={85}
                    innerRadius={40}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {[{ color: '#16a34a' }, { color: '#e2e8f0' }].map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-emerald-50/80 rounded-xl p-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                    <span className="text-[11px] font-semibold text-gray-500">Occupied</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{rentalsStats.occupied_properties}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {rentalsStats.total_properties > 0 ? Math.round((rentalsStats.occupied_properties / rentalsStats.total_properties) * 100) : 0}% occupancy
                  </p>
                </div>
                <div className="bg-gray-50/80 rounded-xl p-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2.5 h-2.5 bg-gray-300 rounded-full" />
                    <span className="text-[11px] font-semibold text-gray-500">Vacant</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{rentalsStats.vacant_properties}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Available to rent</p>
                </div>
              </div>
            </div>

            {/* Revenue & Tasks */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <h3 className="text-[13px] font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="bg-gray-100/80 p-2 rounded-xl">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                </div>
                Revenue & Tasks
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={[
                    { name: 'Revenue', value: rentalsStats.monthly_revenue / 1000 },
                    { name: 'Payments', value: rentalsStats.pending_payments * 2 },
                    { name: 'Maintenance', value: rentalsStats.pending_maintenance * 3 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={36}>
                    {[{ color: '#16a34a' }, { color: '#4ade80' }, { color: '#bbf7d0' }].map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-emerald-50/80 rounded-xl py-2.5 px-3 text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Monthly</p>
                  <p className="text-[13px] font-bold text-emerald-600 mt-0.5">{PESO}{(rentalsStats.monthly_revenue / 1000).toFixed(1)}K</p>
                </div>
                <div className="bg-gray-50/80 rounded-xl py-2.5 px-3 text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payments</p>
                  <p className="text-[13px] font-bold text-gray-900 mt-0.5">{rentalsStats.pending_payments}</p>
                </div>
                <div className="bg-gray-50/80 rounded-xl py-2.5 px-3 text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Maint.</p>
                  <p className="text-[13px] font-bold text-gray-900 mt-0.5">{rentalsStats.pending_maintenance}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Orders + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gray-100/80 p-2 rounded-xl">
                <ShoppingBag className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <h2 className="text-[13px] font-bold text-gray-900">Recent Orders</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">Latest transactions</p>
              </div>
            </div>
            <button onClick={() => navigate('/orders')} className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-[11px] font-semibold hover:bg-emerald-700 active:scale-[0.97] transition-all">
              View All
            </button>
          </div>

          {/* Mobile */}
          <div className="block md:hidden p-4 space-y-3">
            {recentOrders.map((order) => {
              const s = statusStyles[order.status] || { bg: 'bg-gray-50 text-gray-700', icon: Clock };
              const SIcon = s.icon;
              return (
                <div key={order.id} className="bg-gray-50/60 rounded-xl p-3.5 space-y-2.5 border border-gray-100/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-900">#{order.id}</span>
                    <button onClick={() => navigate('/orders')} className="p-1.5 hover:bg-emerald-50 rounded-lg transition-colors">
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 text-[10px] font-bold">
                      {order.customer.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-900">{order.customer}</p>
                      <p className="text-[10px] text-gray-400">{order.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-lg ${s.bg}`}>
                      <SIcon className="w-3 h-3" />
                      {order.status}
                    </span>
                    <span className="text-[11px] font-bold text-gray-900">{order.amount}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Order</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-5 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order, i) => {
                  const s = statusStyles[order.status] || { bg: 'bg-gray-50 text-gray-700', icon: Clock };
                  const SIcon = s.icon;
                  return (
                    <tr key={order.id} className={`hover:bg-gray-50/50 transition-colors ${i < recentOrders.length - 1 ? 'border-b border-gray-50' : ''}`}>
                      <td className="px-5 py-3.5 text-[11px] font-semibold text-gray-900">{order.id}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 text-[10px] font-bold shrink-0">
                            {order.customer.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-gray-900 truncate">{order.customer}</p>
                            <p className="text-[10px] text-gray-400 truncate">{order.time}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-lg ${s.bg}`}>
                          <SIcon className="w-3 h-3" />
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[11px] font-bold text-gray-900">{order.amount}</td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => navigate('/orders')} className="p-1.5 hover:bg-emerald-50 rounded-lg transition-colors" title="View details">
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-2xl border border-gray-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100/80 flex items-center gap-3">
            <div className="bg-gray-100/80 p-2 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <h2 className="text-[13px] font-bold text-gray-900">Low Stock Alert</h2>
              <p className="text-[11px] text-gray-400">Items needing attention</p>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
              {lowStockProducts.length === 0 && (
                <div className="text-center py-10">
                  <Sparkles className="w-8 h-8 text-emerald-300 mx-auto mb-3" />
                  <p className="text-[12px] font-semibold text-gray-500">All items well stocked</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">No items below threshold</p>
                </div>
              )}
              {lowStockProducts.map((product, i) => {
                const pct = Math.min((product.stock / product.threshold) * 100, 100);
                return (
                  <div key={i} className="p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-[11px] font-bold text-gray-900 truncate pr-3">{product.name}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        pct <= 25 ? 'bg-red-50 text-red-600' : pct <= 50 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {product.stock} / {product.threshold}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          pct <= 25 ? 'bg-red-500' : pct <= 50 ? 'bg-amber-400' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => navigate('/inventory')}
              className="w-full mt-5 bg-emerald-600 text-white py-2.5 rounded-xl text-[11px] font-bold hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Box className="w-3.5 h-3.5" />
              Reorder Items
            </button>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {showNotification && dashboardData?.low_stock_items?.length > 0 && (() => {
        const item = dashboardData.low_stock_items[currentNotificationIndex];
        return (
          <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-slide-up">
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.1)] border border-gray-100/80 p-4">
              <div className="flex items-start gap-3">
                <div className="bg-amber-50 p-2 rounded-xl shrink-0">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-[11px] font-bold text-gray-900">Low Stock Alert</p>
                    <button onClick={() => setShowNotification(false)} className="text-gray-300 hover:text-gray-500 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-700 font-semibold truncate">{item.product_name}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      <span className="font-bold text-gray-600">{item.quantity}</span> left
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Min: {item.reorder_level}
                    </span>
                  </div>
                  {dashboardData.low_stock_items.length > 1 && (
                    <p className="text-[10px] text-gray-300 mt-1.5 font-semibold">
                      {currentNotificationIndex + 1} of {dashboardData.low_stock_items.length}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Dashboard;
