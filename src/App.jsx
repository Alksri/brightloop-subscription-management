import React, { useEffect, useState } from 'react';
import {
  Activity, BadgePercent, Banknote, BarChart3, Bell, Building2, ChevronLeft,
  ChevronRight, ClipboardList, CreditCard, FileText, LayoutDashboard, LogOut,
  Menu, Package, Receipt, Search, Settings2, ShieldCheck, Users, X, Zap,
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useData } from './context/DataContext';
import { addBillingInterval } from './utils/helpers';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ProductsPage from './pages/ProductsPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import InvoicesPage from './pages/InvoicesPage';
import {
  CustomersPage, DiscountsPage, PaymentsPage, PlansPage, QuotationsPage,
  TaxesPage, TeamPage, CustomerPortal,
} from './pages/ManagementPages';

const navigation = [
  { section: 'Workspace', items: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'staff'] },
    { id: 'portal', label: 'My account', icon: Building2, roles: ['customer'] },
    { id: 'products', label: 'Products', icon: Package, roles: ['admin'] },
    { id: 'plans', label: 'Plans', icon: ClipboardList, roles: ['admin'] },
    { id: 'subscriptions', label: 'Subscriptions', icon: Activity, roles: ['admin', 'staff'] },
    { id: 'quotations', label: 'Quotations', icon: FileText, roles: ['admin', 'staff'] },
    { id: 'invoices', label: 'Invoices', icon: Receipt, roles: ['admin', 'staff'] },
    { id: 'payments', label: 'Payments', icon: CreditCard, roles: ['admin', 'staff'] },
    { id: 'customers', label: 'Customers', icon: Users, roles: ['admin', 'staff'] },
  ] },
  { section: 'Administration', items: [
    { id: 'discounts', label: 'Discounts', icon: BadgePercent, roles: ['admin'] },
    { id: 'taxes', label: 'Tax rules', icon: Settings2, roles: ['admin'] },
    { id: 'team', label: 'Team access', icon: ShieldCheck, roles: ['admin'] },
  ] },
];

const pageComponents = {
  dashboard: Dashboard,
  products: ProductsPage,
  plans: PlansPage,
  subscriptions: SubscriptionsPage,
  quotations: QuotationsPage,
  invoices: InvoicesPage,
  payments: PaymentsPage,
  customers: CustomersPage,
  discounts: DiscountsPage,
  taxes: TaxesPage,
  team: TeamPage,
  portal: CustomerPortal,
};

export default function App() {
  const { currentUser, logout } = useAuth();
  const { data, updateItem } = useData();
  const [activePage, setActivePage] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const searchRef = React.useRef(null);

  useEffect(() => {
    setActivePage(currentUser?.role === 'customer' ? 'portal' : 'dashboard');
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    data.invoices.filter(invoice =>
      invoice.status === 'confirmed' && invoice.dueDate && invoice.dueDate < today
    ).forEach(invoice => updateItem('invoices', { id: invoice.id, status: 'overdue' }));
    data.subscriptions.filter(subscription =>
      subscription.status === 'active' && subscription.endDate && subscription.endDate < today
    ).forEach(subscription => {
      const plan = data.plans.find(item => item.id === subscription.planId);
      if ((plan?.expiryAction || (plan?.autoRenew ? 'renew' : 'close')) !== 'renew') {
        updateItem('subscriptions', { id: subscription.id, status: 'closed' });
        return;
      }

      let endDate = subscription.endDate;
      let nextBillingDate = subscription.nextBillingDate || subscription.endDate;
      for (let count = 0; endDate < today && count < 2400; count += 1) endDate = addBillingInterval(endDate, subscription.billingFrequency);
      for (let count = 0; nextBillingDate <= today && count < 2400; count += 1) nextBillingDate = addBillingInterval(nextBillingDate, subscription.billingFrequency);
      updateItem('subscriptions', { id: subscription.id, endDate, nextBillingDate });
    });
  }, [data.invoices, data.subscriptions, data.plans, updateItem]);

  useEffect(() => {
    const handleShortcut = event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
        setSearchOpen(true);
      }
      if (event.key === 'Escape') {
        const dialogCloseButton = document.querySelector('[role="dialog"] [aria-label="Close dialog"]');
        if (dialogCloseButton) {
          dialogCloseButton.click();
          return;
        }
        setSearchOpen(false);
        setNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  if (!currentUser) return <LoginPage />;

  const availableNavigation = navigation
    .map(section => ({
      ...section,
      items: section.items.filter(item => item.roles.includes(currentUser.role)),
    }))
    .filter(section => section.items.length > 0);
  const activeItem = availableNavigation.flatMap(section => section.items).find(item => item.id === activePage)
    || availableNavigation[0].items[0];
  const Page = pageComponents[activeItem.id];
  const canSeeAllCustomers = currentUser.role !== 'customer';
  const searchEntries = [
    ...availableNavigation.flatMap(section => section.items.map(item => ({
      id: `page-${item.id}`, label: item.label, type: 'Page', page: item.id,
    }))),
    ...(canSeeAllCustomers ? data.users.filter(user => user.role === 'customer') : data.users.filter(user => user.id === currentUser.id))
      .filter(() => canSeeAllCustomers)
      .map(user => ({ id: `customer-${user.id}`, label: user.name, detail: user.company || user.email, type: 'Customer', page: 'customers' })),
    ...(availableNavigation.some(section => section.items.some(item => item.id === 'products')) ? data.products : [])
      .map(product => ({ id: `product-${product.id}`, label: product.name, detail: product.category, type: 'Product', page: 'products' })),
    ...data.subscriptions
      .filter(subscription => canSeeAllCustomers || subscription.customerId === currentUser.id)
      .map(subscription => ({ id: `subscription-${subscription.id}`, label: subscription.productName, detail: subscription.status, type: 'Subscription', page: currentUser.role === 'customer' ? 'portal' : 'subscriptions' })),
    ...data.invoices
      .filter(invoice => canSeeAllCustomers || invoice.customerId === currentUser.id)
      .map(invoice => ({ id: `invoice-${invoice.id}`, label: invoice.id, detail: invoice.customerName, type: 'Invoice', page: currentUser.role === 'customer' ? 'portal' : 'invoices' })),
    ...data.payments
      .filter(payment => canSeeAllCustomers || payment.customerId === currentUser.id)
      .map(payment => ({ id: `payment-${payment.id}`, label: payment.invoiceId || payment.id, detail: `${payment.customerName || ''} ${payment.method || ''} ${payment.reference || ''}`, type: 'Payment', page: currentUser.role === 'customer' ? 'portal' : 'payments' })),
    ...(availableNavigation.some(section => section.items.some(item => item.id === 'quotations')) ? data.quotations : [])
      .map(quote => ({ id: `quotation-${quote.id}`, label: quote.customerName, detail: quote.items?.map(item => item.productName).join(' '), type: 'Quotation', page: 'quotations' })),
    ...(availableNavigation.some(section => section.items.some(item => item.id === 'plans')) ? data.plans : [])
      .map(plan => ({ id: `plan-${plan.id}`, label: plan.name, detail: plan.billingFrequency, type: 'Plan', page: 'plans' })),
    ...(availableNavigation.some(section => section.items.some(item => item.id === 'discounts')) ? data.discountRules : [])
      .map(rule => ({ id: `discount-${rule.id}`, label: rule.name, detail: rule.status, type: 'Discount', page: 'discounts' })),
    ...(availableNavigation.some(section => section.items.some(item => item.id === 'taxes')) ? data.taxRules : [])
      .map(rule => ({ id: `tax-${rule.id}`, label: rule.name, detail: rule.status, type: 'Tax rule', page: 'taxes' })),
  ];
  const searchResults = search.trim()
    ? searchEntries.filter(entry => `${entry.label} ${entry.detail || ''} ${entry.type}`.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 8)
    : [];
  const visibleInvoices = data.invoices.filter(invoice => canSeeAllCustomers || invoice.customerId === currentUser.id);
  const visibleSubscriptions = data.subscriptions.filter(subscription => canSeeAllCustomers || subscription.customerId === currentUser.id);
  const overdueInvoices = visibleInvoices.filter(invoice => invoice.status === 'overdue');
  const upcomingSubscriptions = visibleSubscriptions.filter(subscription =>
    subscription.status === 'active' && subscription.nextBillingDate &&
    subscription.nextBillingDate <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );
  const notificationCount = overdueInvoices.length + upcomingSubscriptions.length;
  const goToResult = entry => {
    setActivePage(entry.page);
    setSearch('');
    setSearchOpen(false);
    setNotificationsOpen(false);
    setMenuOpen(false);
  };

  return (
    <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {menuOpen && <button className="sidebar-backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo"><Zap size={21} color="white" /></div>
          <div className="sidebar-brand">
            <h2>BrightLoop</h2>
            <span>Subscription operations</span>
          </div>
          <button
            className="sidebar-toggle btn-icon"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-pressed={sidebarCollapsed}
            onClick={() => setSidebarCollapsed(value => !value)}
          >
            {sidebarCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
          </button>
          <button className="mobile-close btn-icon" aria-label="Close menu" onClick={() => setMenuOpen(false)}><X size={18} /></button>
        </div>
        <nav className="sidebar-nav" id="sidebar-navigation" aria-label="Main navigation">
          {availableNavigation.map(section => (
            <React.Fragment key={section.section}>
              <div className="nav-section-title">{section.section}</div>
              {section.items.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={`nav-item ${activeItem.id === item.id ? 'active' : ''}`}
                    title={sidebarCollapsed ? item.label : undefined}
                    aria-current={activeItem.id === item.id ? 'page' : undefined}
                    onClick={() => { setActivePage(item.id); setMenuOpen(false); }}
                  >
                    <Icon className="nav-icon" />
                    <span>{item.label}</span>
                    {item.id === 'invoices' && data.invoices.some(invoice => invoice.status === 'overdue') && (
                      <span className="nav-badge">{data.invoices.filter(invoice => invoice.status === 'overdue').length}</span>
                    )}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">{currentUser.avatar || currentUser.name?.slice(0, 2).toUpperCase()}</div>
            <div className="user-info">
              <div className="user-name">{currentUser.name}</div>
              <div className="user-role">{currentUser.role}</div>
            </div>
          </div>
          <button className="nav-item logout-button" title={sidebarCollapsed ? 'Sign out' : undefined} aria-label="Sign out" onClick={logout}><LogOut className="nav-icon" /><span>Sign out</span></button>
        </div>
      </aside>

      <main className="main-content">
        <header className="header">
          <div className="header-left">
            <button className="mobile-menu btn-icon" aria-label="Open menu" aria-expanded={menuOpen} aria-controls="sidebar-navigation" onClick={() => setMenuOpen(true)}><Menu size={19} /></button>
            <div className="header-breadcrumb"><BarChart3 size={15} /> <span>{activeItem.label}</span></div>
          </div>
          <div className="header-right">
            <div className="global-search" onBlur={event => {
              if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false);
            }}>
              <Search size={16} className="global-search-icon" aria-hidden="true" />
              <input
                ref={searchRef}
                type="search"
                aria-label="Search BrightLoop"
                aria-expanded={searchOpen && searchResults.length > 0}
                aria-controls="global-search-results"
                placeholder="Search anything…"
                value={search}
                onFocus={() => setSearchOpen(true)}
                onChange={event => { setSearch(event.target.value); setSearchOpen(true); setNotificationsOpen(false); }}
                onKeyDown={event => {
                  if (event.key === 'Enter' && searchResults[0]) {
                    event.preventDefault();
                    goToResult(searchResults[0]);
                  }
                }}
              />
              <kbd className="search-shortcut">Ctrl K</kbd>
              {searchOpen && search.trim() && (
                <div className="search-results" id="global-search-results" role="listbox" aria-label="Search results">
                  {searchResults.length ? searchResults.map(entry => (
                    <button key={entry.id} role="option" aria-selected="false" className="search-result" onClick={() => goToResult(entry)}>
                      <span className="search-result-copy"><strong>{entry.label}</strong><small>{entry.detail || entry.type}</small></span>
                      <span className="search-result-type">{entry.type}</span>
                    </button>
                  )) : <p className="search-empty">No matching records or pages.</p>}
                </div>
              )}
            </div>
            <div className="notification-wrap" onBlur={event => {
              if (!event.currentTarget.contains(event.relatedTarget)) setNotificationsOpen(false);
            }}>
              <button
                className="notification-btn btn-icon"
                aria-label={`Notifications${notificationCount ? `, ${notificationCount} alerts` : ''}`}
                aria-expanded={notificationsOpen}
                onClick={() => { setNotificationsOpen(value => !value); setSearchOpen(false); }}
              >
                <Bell size={17} />
                {notificationCount > 0 && <span className="notification-dot" />}
              </button>
              {notificationsOpen && (
                <div className="notification-panel">
                  <div className="notification-panel-header"><strong>Notifications</strong><span>{notificationCount} alerts</span></div>
                  {notificationCount === 0 ? <p className="notification-empty">You’re all caught up.</p> : (
                    <div className="notification-list">
                      {overdueInvoices.slice(0, 5).map(invoice => (
                        <button key={invoice.id} className="notification-item" onClick={() => goToResult({ page: 'invoices' })}>
                          <span className="notification-indicator overdue" />
                          <span><strong>Overdue invoice</strong><small>{invoice.id} · {invoice.customerName}</small></span>
                        </button>
                      ))}
                      {upcomingSubscriptions.slice(0, 5).map(subscription => (
                        <button key={subscription.id} className="notification-item" onClick={() => goToResult({ page: 'subscriptions' })}>
                          <span className="notification-indicator upcoming" />
                          <span><strong>Renewal due soon</strong><small>{subscription.productName} · {subscription.nextBillingDate}</small></span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <span className="header-greeting">BrightLoop Software</span>
            <div className="user-avatar header-avatar">{currentUser.avatar || currentUser.name?.slice(0, 2).toUpperCase()}</div>
          </div>
        </header>
        <Page />
      </main>
    </div>
  );
}
