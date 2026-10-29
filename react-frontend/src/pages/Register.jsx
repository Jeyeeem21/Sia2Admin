import { useState } from 'react';
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
        <p className="text-center text-[11px] text-gray-400 mt-6">© 2025 Mindoro State University – Bongabong Campus</p>
      </div>
    </div>
  );
};

export default Register;
