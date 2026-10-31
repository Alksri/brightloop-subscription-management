import React, { useState } from 'react';
import { LayoutDashboard, Package, Repeat, FileText, Users, LogOut, Plus, Edit, Ban, CreditCard, Sparkles, LogIn, Search, Bell } from 'lucide-react';

const Button = ({ children, variant = 'primary', icon: Icon, className = '', onClick }) => {
  const baseStyle = "flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ease-in-out active:scale-95";
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20",
    secondary: "bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/50",
    success: "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 hover:border-emerald-500/50"
  };
  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

const Card = ({ title, children, className = '' }) => (
  <div className={`bg-gray-900 border border-gray-800 rounded-xl p-6 ${className}`}>
    {title && <h3 className="text-lg font-semibold text-gray-100 mb-4">{title}</h3>}
    {children}
  </div>
);

const DashboardView = () => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-bold text-white">Overview</h2>
        <p className="text-gray-400 text-sm">Welcome back. Here's what's happening today.</p>
      </div>
      <Button icon={Sparkles} variant="primary">Generate AI Insights</Button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card><div className="text-gray-400 text-sm mb-1">Monthly Recurring Revenue</div><div className="text-3xl font-bold text-white">$24,500</div><div className="text-emerald-400 text-sm mt-2">+12% from last month</div></Card>
      <Card><div className="text-gray-400 text-sm mb-1">Active Subscriptions</div><div className="text-3xl font-bold text-white">1,204</div><div className="text-emerald-400 text-sm mt-2">+48 new this week</div></Card>
      <Card><div className="text-gray-400 text-sm mb-1">Outstanding Invoices</div><div className="text-3xl font-bold text-white">$3,240</div><div className="text-red-400 text-sm mt-2">5 invoices overdue</div></Card>
    </div>
    <Card title="AI Business Insights" className="bg-indigo-900/10 border-indigo-500/20">
      <div className="flex gap-4">
        <div className="p-3 bg-indigo-500/20 rounded-lg h-fit"><Sparkles className="text-indigo-400" size={24} /></div>
        <div>
          <h4 className="text-indigo-100 font-medium mb-2">Churn Risk Detected</h4>
          <p className="text-indigo-200/70 text-sm leading-relaxed">Based on recent usage patterns, 3 enterprise customers in the 'Pro' tier have decreased login frequency by 40%. Recommend outreach. Add-on product has 25% higher attachment rate during checkout.</p>
        </div>
      </div>
    </Card>
  </div>
);

const ProductsView = () => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex justify-between items-center">
      <div><h2 className="text-2xl font-bold text-white">Products Catalog</h2><p className="text-gray-400 text-sm">Manage SaaS offerings and pricing plans.</p></div>
      <Button icon={Plus} variant="primary">Add Product</Button>
    </div>
    <Card>
      <div className="space-y-4">
        {['Starter Plan - $29/mo','Pro Plan - $99/mo','Enterprise - Custom'].map((p,i)=>(
          <div key={i} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div className="font-medium text-gray-100">{p}</div>
            <Button icon={Edit} variant="secondary">Edit Product</Button>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

const SubscriptionsView = () => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex justify-between items-center">
      <div><h2 className="text-2xl font-bold text-white">Subscriptions</h2><p className="text-gray-400 text-sm">Monitor and manage customer lifecycles.</p></div>
      <Button icon={Plus} variant="primary">Create Subscription</Button>
    </div>
    <Card>
      <div className="space-y-4">
        {['Acme Corp - Pro Plan - Renews Oct 24','Globex Inc - Enterprise - Renews Nov 01'].map((s,i)=>(
          <div key={i} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div className="font-medium text-gray-100">{s}</div>
            <Button icon={Ban} variant="danger">Cancel Subscription</Button>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

const InvoicesView = () => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex justify-between items-center">
      <div><h2 className="text-2xl font-bold text-white">Invoices & Billing</h2><p className="text-gray-400 text-sm">Track payments and generate new invoices.</p></div>
      <div className="flex gap-3">
        <Button icon={CreditCard} variant="success">Record Payment</Button>
        <Button icon={Plus} variant="primary">Generate Invoice</Button>
      </div>
    </div>
    <Card>
      <div className="space-y-4">
        {['INV-2026-001 - Acme Corp - $99.00 - Pending','INV-2026-002 - Stark Industries - $2,500.00 - Unpaid'].map((inv,i)=>(
          <div key={i} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div className="font-medium text-gray-100">{inv}</div>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

const CustomersView = () => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex justify-between items-center">
      <div><h2 className="text-2xl font-bold text-white">Customers</h2><p className="text-gray-400 text-sm">Manage your client base and contacts.</p></div>
      <Button icon={Plus} variant="primary">Add Customer</Button>
    </div>
    <Card>
      <div className="space-y-4">
        {['Jane Doe - Acme Corp','John Smith - Globex Inc'].map((c,i)=>(
          <div key={i} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div className="font-medium text-gray-100">{c}</div>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', name: 'Products', icon: Package },
    { id: 'subscriptions', name: 'Subscriptions', icon: Repeat },
    { id: 'invoices', name: 'Invoices', icon: FileText },
    { id: 'customers', name: 'Customers', icon: Users },
  ];
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="w-full max-w-md p-8 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl">
          <h1 className="text-2xl font-bold text-center mb-6">BrightLoop</h1>
          <div className="space-y-4">
            <input type="text" placeholder="Email address" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white" />
            <input type="password" placeholder="Password" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white" />
            <Button icon={LogIn} className="w-full justify-center" onClick={() => setIsLoggedIn(true)}>Login</Button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex font-sans">
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col hidden md:flex fixed h-full z-10">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <span className="font-bold text-xl text-white">BrightLoop</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg ${isActive ? 'bg-indigo-500/10 text-indigo-400' : 'text-gray-400 hover:bg-gray-800/50'}`}>
                <Icon size={20} /> {item.name}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={() => setIsLoggedIn(false)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-red-400"> <LogOut size={20} /> Logout</button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col md:pl-64 min-h-screen">
        <header className="h-16 flex items-center justify-between px-8 bg-gray-900/50 border-b border-gray-800">
          <div className="flex items-center bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-1.5 w-64"><Search size={16} className="text-gray-500 mr-2" /><input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm text-gray-200 w-full" /></div>
          <div className="flex items-center gap-4"><Bell size={20} /><div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">A</div></div>
        </header>
        <div className="p-8 flex-1 max-w-6xl mx-auto w-full">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'products' && <ProductsView />}
          {activeTab === 'subscriptions' && <SubscriptionsView />}
          {activeTab === 'invoices' && <InvoicesView />}
          {activeTab === 'customers' && <CustomersView />}
        </div>
      </main>
    </div>
  );
}
