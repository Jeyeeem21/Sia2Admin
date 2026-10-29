import { Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import { Printer, CreditCard, ShoppingBag, FileText, Clock, CheckCircle, Package, Users, ArrowRight, TrendingUp } from 'lucide-react';

const Home = () => {
  usePageTitle('Home');
  const services = [
    { icon: Printer, title: 'Printing Services', description: 'Fast and affordable photocopying and printing', color: 'bg-emerald-500' },
    { icon: CreditCard, title: 'ID Creation', description: 'Professional ID card printing and lamination', color: 'bg-emerald-500' },
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
            Mindoro State University – Bongabong Campus
          </div>
          <h1 className="text-[40px] md:text-[52px] font-bold text-gray-900 tracking-tight leading-tight mb-5">
            MinSU Business Center
          </h1>
          <p className="text-[16px] text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed">
            Your one-stop solution for printing, ID creation, and uniform services.
            Fast, reliable, and affordable — all in one platform.
          </p>
          <div className="flex gap-3 justify-center mb-10">
            <Link to="/dashboard"
              className="group inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-[13px] font-semibold text-[13px] hover:bg-emerald-700 active:scale-[0.97] transition-all shadow-[0_4px_12px_rgba(5,150,105,0.25)]">
              Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link to="/services"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-[13px] font-semibold hover:border-emerald-500 hover:text-emerald-600 transition-all">
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
                <div className={`${service.color} w-11 h-11 rounded-xl flex items-center justify-center mb-4`}>
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
          <p className="text-[12px] text-gray-500">© 2025 Mindoro State University – Bongabong Campus | Business Center System</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
