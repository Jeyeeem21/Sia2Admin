const fs = require('fs');
const base = 'c:/laragon/www/SIA/react-frontend/src';

// ─── Login.jsx ───
const login = `import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      if (!result.success) { setError(result.message); toast.error(result.message); }
    } catch {
      const msg = 'An error occurred. Please try again.';
      setError(msg); toast.error(msg);
    } finally { setLoading(false); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-600 rounded-2xl mb-4 shadow-[0_8px_25px_rgba(5,150,105,0.25)]">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Welcome back</h1>
          <p className="text-[13px] text-gray-500 mt-1">Sign in to your Business Center account</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-7">
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-[13px] text-red-600">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="email" name="email" value={formData.email} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-[13px] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                  placeholder="you@example.com" required />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-[13px] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                  placeholder="Enter your password" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-emerald-600 text-white py-2.5 rounded-xl text-[13px] font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-[0_4px_12px_rgba(5,150,105,0.2)] disabled:opacity-50 disabled:cursor-not-allowed mt-1">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in\u2026
                </span>
              ) : 'Sign In'}
            </button>
          </form>
          <div className="mt-5 pt-5 border-t border-gray-100 text-center">
            <p className="text-[13px] text-gray-500">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-semibold">Create Account</Link>
            </p>
          </div>
        </div>
        <p className="text-center text-[11px] text-gray-400 mt-6">\u00A9 2025 Mindoro State University \u2013 Bongabong Campus</p>
      </div>
    </div>
  );
};

export default Login;
`;

// ─── Register.jsx ───
const register = `import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, UserPlus, ShieldCheck } from 'lucide-react';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '', role: 'customer' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) { alert('Passwords do not match!'); return; }
    console.log('Register:', formData);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const inputClass = "w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-[13px] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all";
  const labelClass = "block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-600 rounded-2xl mb-4 shadow-[0_8px_25px_rgba(5,150,105,0.25)]">
            <UserPlus className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Create an Account</h1>
          <p className="text-[13px] text-gray-500 mt-1">Register to start using our services</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                  className={inputClass} placeholder="Enter your full name" required />
              </div>
            </div>
            <div>
              <label className={labelClass}>Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="email" name="email" value={formData.email} onChange={handleChange}
                  className={inputClass} placeholder="Enter your email" required />
              </div>
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-[13px] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                  placeholder="Create a password" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className={labelClass}>Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-[13px] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                  placeholder="Confirm your password" required />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className={labelClass}>Role</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select name="role" value={formData.role} onChange={handleChange}
                  className={inputClass + " appearance-none bg-white"} required>
                  <option value="customer">Customer</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <button type="submit"
              className="w-full bg-emerald-600 text-white py-2.5 rounded-xl text-[13px] font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-[0_4px_12px_rgba(5,150,105,0.2)] mt-2">
              Create Account
            </button>
          </form>
          <div className="mt-5 pt-5 border-t border-gray-100 text-center">
            <p className="text-[13px] text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold">Sign In</Link>
            </p>
          </div>
        </div>
        <p className="text-center text-[11px] text-gray-400 mt-6">\u00A9 2025 Mindoro State University \u2013 Bongabong Campus</p>
      </div>
    </div>
  );
};

export default Register;
`;

// ─── Home.jsx ───
const home = `import { Link } from 'react-router-dom';
import { Printer, CreditCard, ShoppingBag, FileText, Clock, CheckCircle, Package, Users, ArrowRight, TrendingUp } from 'lucide-react';

const Home = () => {
  const services = [
    { icon: Printer, title: 'Printing Services', description: 'Fast and affordable photocopying and printing', color: 'bg-emerald-500' },
    { icon: CreditCard, title: 'ID Creation', description: 'Professional ID card printing and lamination', color: 'bg-violet-500' },
    { icon: ShoppingBag, title: 'Uniform & Fabric Sales', description: 'Quality tela and uniform materials', color: 'bg-rose-500' },
    { icon: FileText, title: 'Document Services', description: 'Binding, lamination, and document processing', color: 'bg-amber-500' },
  ];

  const features = [
    { icon: Clock, text: 'Quick Processing' },
    { icon: CheckCircle, text: 'Quality Assured' },
    { icon: Package, text: 'Track Orders' },
    { icon: Users, text: 'Student-Friendly' },
  ];

  const stats = [
    { value: '5000+', label: 'Students Served' },
    { value: '10+', label: 'Services Offered' },
    { value: '99%', label: 'Satisfaction Rate' },
    { value: '24/7', label: 'Order Tracking' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-white border-b border-gray-100">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.06)_0%,_transparent_60%)]" />
        <div className="relative max-w-5xl mx-auto px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-[12px] font-semibold mb-6 border border-emerald-100">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Mindoro State University \u2013 Bongabong Campus
          </div>
          <h1 className="text-[40px] md:text-[52px] font-bold text-gray-900 tracking-tight leading-tight mb-5">
            MinSU Business Center
          </h1>
          <p className="text-[16px] text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed">
            Your one-stop solution for printing, ID creation, and uniform services.
            Fast, reliable, and affordable \u2014 all in one platform.
          </p>
          <div className="flex gap-3 justify-center mb-10">
            <Link to="/dashboard"
              className="group inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-[13px] font-semibold hover:bg-emerald-700 active:scale-[0.97] transition-all shadow-[0_4px_12px_rgba(5,150,105,0.25)]">
              Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link to="/services"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-[13px] font-semibold hover:border-emerald-500 hover:text-emerald-600 transition-all">
              View Services
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-4 py-2 rounded-full">
                <f.icon className="w-4 h-4 text-emerald-600" />
                <span className="text-[12px] font-semibold text-gray-700">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="max-w-5xl mx-auto px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-[28px] font-bold text-gray-900 tracking-tight">Our Services</h2>
          <p className="text-[14px] text-gray-500 mt-2">Comprehensive business solutions for the MinSU community</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map((service, i) => {
            const Icon = service.icon;
            return (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                <div className={\`\${service.color} w-11 h-11 rounded-xl flex items-center justify-center mb-4\`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-[13px] font-bold text-gray-900 mb-1.5">{service.title}</h3>
                <p className="text-[12px] text-gray-500 leading-relaxed">{service.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="bg-emerald-600 py-14">
        <div className="max-w-5xl mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {stats.map((s, i) => (
              <div key={i}>
                <div className="text-[36px] font-bold tracking-tight mb-1">{s.value}</div>
                <div className="text-[12px] text-emerald-100 font-medium uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 py-8">
        <div className="max-w-5xl mx-auto px-8 text-center">
          <p className="text-[12px] text-gray-500">\u00A9 2025 Mindoro State University \u2013 Bongabong Campus | Business Center System</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
`;

fs.writeFileSync(base+'/pages/Login.jsx', login, 'utf8');
console.log('✓ Login.jsx');
fs.writeFileSync(base+'/pages/Register.jsx', register, 'utf8');
console.log('✓ Register.jsx');
fs.writeFileSync(base+'/pages/Home.jsx', home, 'utf8');
console.log('✓ Home.jsx');
console.log('Done!');
