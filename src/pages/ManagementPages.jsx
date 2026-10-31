import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { formatCurrency, formatDate, getInvoiceBalance, isPlanAvailable, validateEmail, validatePassword } from '../utils/helpers';
import { BadgePercent, Banknote, Building2, CreditCard, FileText, Plus, Receipt, ShieldCheck, Trash2 } from 'lucide-react';

function PageHeading({ title, description }) {
  return <div className="page-header"><div><h2>{title}</h2><p>{description}</p></div></div>;
}

function Message({ children, type = 'success' }) {
  return children ? <div className={`form-message ${type}`} role={type === 'error' ? 'alert' : 'status'}>{children}</div> : null;
}

function EmptyTableRow({ colSpan, children }) {
  return <tr className="empty-table-row"><td colSpan={colSpan}>{children}</td></tr>;
}

export function CustomersPage() {
  const { data, addItem } = useData();
  const [form, setForm] = useState({ name: '', company: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const customers = data.users.filter(user => user.role === 'customer');

  const submit = event => {
    event.preventDefault();
    setMessage('');
    if (!validateEmail(form.email)) return setMessage('Enter a valid email address.');
    if (!validatePassword(form.password).isValid) return setMessage('Use at least 8 characters with uppercase, lowercase, and a special character.');
    if (data.users.some(user => user.email.toLowerCase() === form.email.trim().toLowerCase())) return setMessage('An account with this email already exists.');
    addItem('users', {
      ...form,
      email: form.email.trim().toLowerCase(),
      name: form.name.trim(),
      role: 'customer',
      avatar: form.name.trim().slice(0, 2).toUpperCase(),
      createdAt: new Date().toISOString().slice(0, 10),
    });
    setForm({ name: '', company: '', email: '', password: '' });
    setMessage('Customer account created.');
  };

  return (
    <div className="page-content">
      <PageHeading title="Customers" description="Customer accounts, company details, and subscription relationships." />
      <div className="management-grid">
        <section className="card">
          <div className="card-header"><h3>Add a customer</h3></div>
          <form className="card-body" onSubmit={submit}>
            <Message type={message === 'Customer account created.' ? 'success' : 'error'}>{message}</Message>
            <label className="form-group"><span className="form-label">Contact name</span><input className="form-input" required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
            <label className="form-group"><span className="form-label">Company</span><input className="form-input" value={form.company} onChange={event => setForm({ ...form, company: event.target.value })} /></label>
            <label className="form-group"><span className="form-label">Email</span><input className="form-input" type="email" required value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /></label>
            <label className="form-group"><span className="form-label">Temporary password</span><input className="form-input" type="password" required value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} /></label>
            <button className="btn btn-primary" type="submit"><Plus size={16} /> Create customer</button>
          </form>
        </section>
        <section className="card">
          <div className="card-header"><h3>Customer directory</h3><span className="nav-badge">{customers.length}</span></div>
          <div className="table-container"><table className="data-table">
            <thead><tr><th>Customer</th><th>Company</th><th>Email</th><th>Subscriptions</th></tr></thead>
            <tbody>{customers.length ? customers.map(customer => (
              <tr key={customer.id}>
                <td className="td-primary">{customer.name}</td>
                <td>{customer.company || '—'}</td>
                <td>{customer.email}</td>
                <td>{data.subscriptions.filter(subscription => subscription.customerId === customer.id).length}</td>
              </tr>
            )) : <EmptyTableRow colSpan={4}>No customers yet. Create an account to get started.</EmptyTableRow>}</tbody>
          </table></div>
        </section>
      </div>
    </div>
  );
}

export function TeamPage() {
  const { data, addItem } = useData();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const staff = data.users.filter(user => user.role === 'staff');

  const submit = event => {
    event.preventDefault();
    setMessage('');
    if (!validateEmail(form.email)) return setMessage('Enter a valid email address.');
    if (!validatePassword(form.password).isValid) return setMessage('Use at least 8 characters with uppercase, lowercase, and a special character.');
    if (data.users.some(user => user.email.toLowerCase() === form.email.trim().toLowerCase())) return setMessage('An account with this email already exists.');
    addItem('users', {
      ...form,
      email: form.email.trim().toLowerCase(),
      role: 'staff',
      avatar: form.name.trim().slice(0, 2).toUpperCase(),
      createdAt: new Date().toISOString().slice(0, 10),
    });
    setForm({ name: '', email: '', password: '' });
    setMessage('Staff account created.');
  };

  return (
    <div className="page-content">
      <PageHeading title="Team access" description="Only administrators can add internal staff accounts." />
      <div className="management-grid">
        <section className="card"><div className="card-header"><h3><ShieldCheck size={17} /> Invite a staff member</h3></div>
          <form className="card-body" onSubmit={submit}>
            <Message type={message === 'Staff account created.' ? 'success' : 'error'}>{message}</Message>
            <label className="form-group"><span className="form-label">Full name</span><input className="form-input" required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
            <label className="form-group"><span className="form-label">Work email</span><input className="form-input" type="email" required value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /></label>
            <label className="form-group"><span className="form-label">Temporary password</span><input className="form-input" type="password" required value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} /></label>
            <button className="btn btn-primary" type="submit"><Plus size={16} /> Add staff</button>
          </form>
        </section>
        <section className="card"><div className="card-header"><h3>Staff members</h3><span className="nav-badge">{staff.length}</span></div>
          <div className="table-container"><table className="data-table"><thead><tr><th>Name</th><th>Email</th><th>Access</th></tr></thead>
            <tbody>{staff.length ? staff.map(user => <tr key={user.id}><td className="td-primary">{user.name}</td><td>{user.email}</td><td><span className="tag primary">Staff</span></td></tr>) : <EmptyTableRow colSpan={3}>No team members yet.</EmptyTableRow>}</tbody>
          </table></div>
        </section>
      </div>
    </div>
  );
}

export function PlansPage() {
  const { data, addItem, updateItem } = useData();
  const [form, setForm] = useState({ name: '', productId: '', variantId: '', billingFrequency: 'monthly', price: '', minQuantity: '1', startDate: '', endDate: '', expiryAction: 'close' });
  const [error, setError] = useState('');

  const selectedProduct = data.products.find(product => product.id === form.productId);
  const submit = event => {
    event.preventDefault();
    setError('');
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setError('The availability end date must be on or after the start date.');
      return;
    }
    const plan = {
      ...form,
      price: Number(form.price),
      minQuantity: Math.max(1, Number(form.minQuantity)),
      autoRenew: form.expiryAction === 'renew',
      status: 'active',
    };
    addItem('plans', plan);
    setForm({ name: '', productId: '', variantId: '', billingFrequency: 'monthly', price: '', minQuantity: '1', startDate: '', endDate: '', expiryAction: 'close' });
  };

  return (
    <div className="page-content">
      <PageHeading title="Plans" description="Set recurring prices, billing cadence, quantities, availability, and renewal behavior." />
      <div className="management-grid">
        <section className="card"><div className="card-header"><h3>Create a plan</h3></div>
          <form className="card-body" onSubmit={submit}>
            <Message type="error">{error}</Message>
            <label className="form-group"><span className="form-label">Plan name</span><input className="form-input" required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
            <label className="form-group"><span className="form-label">Product</span><select className="form-input" required value={form.productId} onChange={event => setForm({ ...form, productId: event.target.value, variantId: '' })}><option value="">Select a product</option>{data.products.filter(product => product.status === 'active').map(product => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
            {selectedProduct?.variants?.length > 0 && <label className="form-group"><span className="form-label">Variant</span><select className="form-input" value={form.variantId} onChange={event => setForm({ ...form, variantId: event.target.value })}><option value="">No variant</option>{selectedProduct.variants.map(variant => <option key={variant.id} value={variant.id}>{variant.name} (+{formatCurrency(variant.priceAddon)})</option>)}</select></label>}
            <div className="form-row">
              <label className="form-group"><span className="form-label">Price</span><input className="form-input" type="number" min="0" step="0.01" required value={form.price} onChange={event => setForm({ ...form, price: event.target.value })} /></label>
              <label className="form-group"><span className="form-label">Billing frequency</span><select className="form-input" value={form.billingFrequency} onChange={event => setForm({ ...form, billingFrequency: event.target.value })}>{['daily', 'weekly', 'monthly', 'yearly'].map(frequency => <option key={frequency}>{frequency}</option>)}</select></label>
            </div>
            <label className="form-group"><span className="form-label">Minimum quantity</span><input className="form-input" type="number" min="1" required value={form.minQuantity} onChange={event => setForm({ ...form, minQuantity: event.target.value })} /></label>
            <div className="form-row">
              <label className="form-group"><span className="form-label">Available from</span><input className="form-input" type="date" value={form.startDate} onChange={event => setForm({ ...form, startDate: event.target.value })} /></label>
              <label className="form-group"><span className="form-label">Available until</span><input className="form-input" type="date" value={form.endDate} onChange={event => setForm({ ...form, endDate: event.target.value })} /></label>
            </div>
            <label className="form-group"><span className="form-label">At expiry</span><select className="form-input" value={form.expiryAction} onChange={event => setForm({ ...form, expiryAction: event.target.value })}><option value="close">Close subscription</option><option value="renew">Renew subscription</option></select></label>
            <button className="btn btn-primary" type="submit"><Plus size={16} /> Add plan</button>
          </form>
        </section>
        <section className="card"><div className="card-header"><h3>Available plans</h3><span className="nav-badge">{data.plans.length}</span></div>
          <div className="table-container"><table className="data-table"><thead><tr><th>Plan</th><th>Product</th><th>Price</th><th>Billing</th><th>Availability</th><th>Status</th></tr></thead>
            <tbody>{data.plans.length ? data.plans.map(plan => {
              const product = data.products.find(item => item.id === plan.productId);
              return <tr key={plan.id}><td className="td-primary">{plan.name}</td><td>{product?.name || '—'}</td><td>{formatCurrency(plan.price)}</td><td>{plan.billingFrequency}</td><td>{plan.startDate || 'Now'} – {plan.endDate || 'Ongoing'}</td><td><button className={`status-badge ${plan.status === 'active' ? 'status-active' : 'status-closed'}`} onClick={() => updateItem('plans', { id: plan.id, status: plan.status === 'active' ? 'inactive' : 'active' })}>{plan.status || 'active'}</button></td></tr>;
            }) : <EmptyTableRow colSpan={6}>No plans yet. Create a plan to define recurring pricing.</EmptyTableRow>}</tbody>
          </table></div>
        </section>
      </div>
    </div>
  );
}

export function DiscountsPage() {
  const { data, addItem, updateItem } = useData();
  const [form, setForm] = useState({ name: '', type: 'percentage', value: '', productId: 'all', minQuantity: '1', startDate: '', expiryDate: '', usageLimit: '' });
  const [error, setError] = useState('');

  const submit = event => {
    event.preventDefault();
    setError('');
    if (form.startDate && form.expiryDate && form.expiryDate < form.startDate) {
      setError('The expiry date must be on or after the start date.');
      return;
    }
    addItem('discountRules', {
      ...form,
      value: Number(form.value),
      minQuantity: Math.max(1, Number(form.minQuantity)),
      usageLimit: Number(form.usageLimit) || 0,
      usageCount: 0,
      status: 'active',
      createdAt: new Date().toISOString().slice(0, 10),
    });
    setForm({ name: '', type: 'percentage', value: '', productId: 'all', minQuantity: '1', startDate: '', expiryDate: '', usageLimit: '' });
  };

  return (
    <div className="page-content">
      <PageHeading title="Discount rules" description="Create admin-managed fixed or percentage discounts with eligibility and usage limits." />
      <div className="management-grid">
        <section className="card"><div className="card-header"><h3><BadgePercent size={17} /> New discount</h3></div>
          <form className="card-body" onSubmit={submit}>
            <Message type="error">{error}</Message>
            <label className="form-group"><span className="form-label">Rule name</span><input className="form-input" required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
            <div className="form-row">
              <label className="form-group"><span className="form-label">Discount type</span><select className="form-input" value={form.type} onChange={event => setForm({ ...form, type: event.target.value })}><option value="percentage">Percentage</option><option value="fixed">Fixed amount</option></select></label>
              <label className="form-group"><span className="form-label">Value</span><input className="form-input" type="number" min="0.01" step="0.01" max={form.type === 'percentage' ? 100 : undefined} required value={form.value} onChange={event => setForm({ ...form, value: event.target.value })} /></label>
            </div>
            <label className="form-group"><span className="form-label">Applies to</span><select className="form-input" value={form.productId} onChange={event => setForm({ ...form, productId: event.target.value })}><option value="all">All products and subscriptions</option>{data.products.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
            <label className="form-group"><span className="form-label">Minimum quantity</span><input className="form-input" type="number" min="1" value={form.minQuantity} onChange={event => setForm({ ...form, minQuantity: event.target.value })} /></label>
            <div className="form-row">
              <label className="form-group"><span className="form-label">Starts on</span><input className="form-input" type="date" value={form.startDate} onChange={event => setForm({ ...form, startDate: event.target.value })} /></label>
              <label className="form-group"><span className="form-label">Expires on</span><input className="form-input" type="date" value={form.expiryDate} onChange={event => setForm({ ...form, expiryDate: event.target.value })} /></label>
            </div>
            <label className="form-group"><span className="form-label">Maximum uses (0 = unlimited)</span><input className="form-input" type="number" min="0" value={form.usageLimit} onChange={event => setForm({ ...form, usageLimit: event.target.value })} /></label>
            <button className="btn btn-primary" type="submit"><Plus size={16} /> Create rule</button>
          </form>
        </section>
        <section className="card"><div className="card-header"><h3>Active rules</h3><span className="nav-badge">{data.discountRules.length}</span></div>
          <div className="table-container"><table className="data-table"><thead><tr><th>Rule</th><th>Discount</th><th>Applies to</th><th>Uses</th><th>Expiry</th><th>Status</th></tr></thead>
            <tbody>{data.discountRules.length ? data.discountRules.map(rule => <tr key={rule.id}><td className="td-primary">{rule.name}</td><td>{rule.type === 'percentage' ? `${rule.value}%` : formatCurrency(rule.value)}</td><td>{rule.productId === 'all' ? 'All products' : data.products.find(product => product.id === rule.productId)?.name || 'Product'}</td><td>{rule.usageCount || 0} / {rule.usageLimit || '∞'}</td><td>{formatDate(rule.expiryDate)}</td><td><button className={`status-badge ${rule.status === 'active' ? 'status-active' : 'status-closed'}`} onClick={() => updateItem('discountRules', { id: rule.id, status: rule.status === 'active' ? 'inactive' : 'active' })}>{rule.status}</button></td></tr>) : <EmptyTableRow colSpan={6}>No discount rules configured.</EmptyTableRow>}</tbody>
          </table></div>
        </section>
      </div>
    </div>
  );
}

export function TaxesPage() {
  const { data, addItem, updateItem } = useData();
  const [form, setForm] = useState({ name: '', rate: '', applicableTo: 'all' });
  const submit = event => {
    event.preventDefault();
    addItem('taxRules', { ...form, rate: Number(form.rate), status: 'active' });
    setForm({ name: '', rate: '', applicableTo: 'all' });
  };

  return (
    <div className="page-content">
      <PageHeading title="Tax rules" description="Configure the rates that are applied automatically when billing subscriptions." />
      <div className="management-grid">
        <section className="card"><div className="card-header"><h3>Add a tax rule</h3></div>
          <form className="card-body" onSubmit={submit}>
            <label className="form-group"><span className="form-label">Rule name</span><input className="form-input" required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
            <label className="form-group"><span className="form-label">Rate (%)</span><input className="form-input" type="number" min="0" max="100" step="0.01" required value={form.rate} onChange={event => setForm({ ...form, rate: event.target.value })} /></label>
            <label className="form-group"><span className="form-label">Applies to</span><select className="form-input" value={form.applicableTo} onChange={event => setForm({ ...form, applicableTo: event.target.value })}><option value="all">All products</option><option value="add-ons">Add-ons</option>{data.products.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
            <button className="btn btn-primary" type="submit"><Plus size={16} /> Add rule</button>
          </form>
        </section>
        <section className="card"><div className="card-header"><h3>Tax configuration</h3></div>
          <div className="table-container"><table className="data-table"><thead><tr><th>Rule</th><th>Rate</th><th>Scope</th><th>Status</th></tr></thead>
            <tbody>{data.taxRules.length ? data.taxRules.map(rule => <tr key={rule.id}><td className="td-primary">{rule.name}</td><td>{rule.rate}%</td><td>{rule.applicableTo === 'all' ? 'All products' : rule.applicableTo === 'add-ons' ? 'Add-ons' : data.products.find(product => product.id === rule.applicableTo)?.name || 'Product'}</td><td><button className={`status-badge ${rule.status === 'active' ? 'status-active' : 'status-closed'}`} onClick={() => updateItem('taxRules', { id: rule.id, status: rule.status === 'active' ? 'inactive' : 'active' })}>{rule.status}</button></td></tr>) : <EmptyTableRow colSpan={4}>No tax rules configured.</EmptyTableRow>}</tbody>
          </table></div>
        </section>
      </div>
    </div>
  );
}

export function PaymentsPage() {
  const { data, addItem, updateItem } = useData();
  const [form, setForm] = useState({ invoiceId: '', amount: '', method: 'bank_transfer', date: new Date().toISOString().slice(0, 10), reference: '' });
  const [message, setMessage] = useState('');

  const submit = event => {
    event.preventDefault();
    setMessage('');
    const invoice = data.invoices.find(item => item.id === form.invoiceId);
    if (!invoice) return setMessage('Select an invoice.');
    const amount = Number(form.amount);
    const alreadyPaid = data.payments.filter(payment => payment.invoiceId === invoice.id && ['completed', 'partial'].includes(payment.status)).reduce((sum, payment) => sum + payment.amount, 0);
    const remaining = Math.max(0, invoice.totalAmount - alreadyPaid);
    if (!Number.isFinite(amount) || amount <= 0 || amount > remaining + 0.001) return setMessage(`Enter an amount above zero and no more than the remaining balance (${formatCurrency(remaining)}).`);

    addItem('payments', {
      invoiceId: invoice.id,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      amount,
      method: form.method,
      reference: form.reference.trim(),
      note: form.reference.trim(),
      date: form.date,
      status: amount >= remaining ? 'completed' : 'partial',
    });
    if (amount >= remaining) updateItem('invoices', { id: invoice.id, status: 'paid', paidDate: form.date });
    setForm({ invoiceId: '', amount: '', method: 'bank_transfer', date: new Date().toISOString().slice(0, 10), reference: '' });
  };

  const unpaidInvoices = data.invoices.filter(invoice => !['paid', 'cancelled'].includes(invoice.status));
  return (
    <div className="page-content">
      <PageHeading title="Payments" description="Record incoming transfers and card payments against the correct invoice." />
      <div className="management-grid">
        <section className="card"><div className="card-header"><h3><Banknote size={17} /> Record payment</h3></div>
          <form className="card-body" onSubmit={submit}>
            <Message type="error">{message}</Message>
            <label className="form-group"><span className="form-label">Invoice</span><select className="form-input" required value={form.invoiceId} onChange={event => {
              const invoice = data.invoices.find(item => item.id === event.target.value);
              const paid = data.payments.filter(payment => payment.invoiceId === invoice?.id && ['completed', 'partial'].includes(payment.status)).reduce((sum, payment) => sum + payment.amount, 0);
              setForm({ ...form, invoiceId: event.target.value, amount: invoice ? String(Math.max(0, invoice.totalAmount - paid).toFixed(2)) : '' });
            }}><option value="">Choose an outstanding invoice</option>{unpaidInvoices.map(invoice => <option key={invoice.id} value={invoice.id}>{invoice.id} · {invoice.customerName} · {formatCurrency(invoice.totalAmount)}</option>)}</select></label>
            <label className="form-group"><span className="form-label">Amount</span><input className="form-input" type="number" min="0.01" step="0.01" required value={form.amount} onChange={event => setForm({ ...form, amount: event.target.value })} /></label>
            <label className="form-group"><span className="form-label">Method</span><select className="form-input" value={form.method} onChange={event => setForm({ ...form, method: event.target.value })}>{['bank_transfer', 'credit_card', 'cash', 'check', 'other'].map(method => <option key={method} value={method}>{method.replace('_', ' ')}</option>)}</select></label>
            <label className="form-group"><span className="form-label">Date</span><input className="form-input" type="date" required value={form.date} onChange={event => setForm({ ...form, date: event.target.value })} /></label>
            <label className="form-group"><span className="form-label">Reference / note</span><input className="form-input" value={form.reference} onChange={event => setForm({ ...form, reference: event.target.value })} /></label>
            <button className="btn btn-primary" type="submit"><Plus size={16} /> Save payment</button>
          </form>
        </section>
        <section className="card"><div className="card-header"><h3>Payment history</h3><span className="nav-badge">{data.payments.length}</span></div>
          <div className="table-container"><table className="data-table"><thead><tr><th>Invoice</th><th>Customer</th><th>Method</th><th>Amount</th><th>Date</th><th>Note</th></tr></thead>
            <tbody>{data.payments.length ? [...data.payments].reverse().map(payment => <tr key={payment.id}><td className="td-mono td-primary">{payment.invoiceId}</td><td>{payment.customerName}</td><td>{payment.method?.replace('_', ' ')}</td><td>{formatCurrency(payment.amount)}</td><td>{formatDate(payment.date)}</td><td>{payment.note || payment.reference || '—'}</td></tr>) : <EmptyTableRow colSpan={6}>No payments recorded yet.</EmptyTableRow>}</tbody>
          </table></div>
        </section>
      </div>
    </div>
  );
}

export function QuotationsPage() {
  const { data, addItem, updateItem } = useData();
  const [form, setForm] = useState({ customerId: '', planId: '', template: '30', startDate: new Date().toISOString().slice(0, 10) });
  const customers = data.users.filter(user => user.role === 'customer');

  const createQuote = event => {
    event.preventDefault();
    const customer = customers.find(user => user.id === form.customerId);
    const plan = data.plans.find(item => item.id === form.planId && isPlanAvailable(item));
    const product = data.products.find(item => item.id === plan?.productId);
    if (!customer || !plan || !product) return;
    const variant = product.variants?.find(item => item.id === plan.variantId);
    const validUntil = new Date(`${form.startDate}T12:00:00`);
    validUntil.setDate(validUntil.getDate() + Number(form.template));
    addItem('quotations', {
      customerId: customer.id,
      customerName: customer.name,
      planId: plan.id,
      template: { '14': 'Short offer', '30': 'Standard offer', '365': 'Annual offer' }[form.template],
      items: [{ productId: product.id, productName: product.name, variantId: variant?.id || null, variantName: variant?.name || null, quantity: plan.minQuantity || 1, price: plan.price }],
      totalAmount: plan.price * (plan.minQuantity || 1),
      status: 'draft',
      startDate: form.startDate,
      validUntil: validUntil.toISOString().slice(0, 10),
      createdAt: new Date().toISOString().slice(0, 10),
    });
    setForm({ ...form, customerId: '', planId: '' });
  };

  const setStatus = quote => {
    if (quote.status === 'draft') {
      updateItem('quotations', { id: quote.id, status: 'quotation' });
      return;
    }
    if (quote.status !== 'quotation') return;
    const plan = data.plans.find(item => item.id === quote.planId);
    const product = data.products.find(item => item.id === plan?.productId);
    if (!plan || !product) return;
    if (!quote.subscriptionId) {
      addItem('subscriptions', {
        customerId: quote.customerId,
        planId: plan.id,
        productName: product.name,
        variantName: quote.items?.[0]?.variantName || 'N/A',
        status: 'confirmed',
        startDate: quote.startDate,
        endDate: '',
        nextBillingDate: quote.startDate,
        billingFrequency: plan.billingFrequency,
        quantity: plan.minQuantity || 1,
        price: quote.totalAmount,
        createdAt: new Date().toISOString().slice(0, 10),
      });
    }
    updateItem('quotations', { id: quote.id, status: 'confirmed', subscriptionId: quote.subscriptionId || 'created' });
  };

  return (
    <div className="page-content">
      <PageHeading title="Quotations" description="Prepare customer offers from reusable validity templates and convert accepted quotes into subscriptions." />
      <section className="card quote-create"><div className="card-header"><h3><FileText size={17} /> Create from a template</h3></div>
        <form className="card-body quote-form" onSubmit={createQuote}>
          <label className="form-group"><span className="form-label">Customer</span><select className="form-input" required value={form.customerId} onChange={event => setForm({ ...form, customerId: event.target.value })}><option value="">Select customer</option>{customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
          <label className="form-group"><span className="form-label">Plan and product lines</span><select className="form-input" required value={form.planId} onChange={event => setForm({ ...form, planId: event.target.value })}><option value="">Select plan</option>{data.plans.filter(plan => isPlanAvailable(plan)).map(plan => <option key={plan.id} value={plan.id}>{plan.name} · {formatCurrency(plan.price)} / {plan.billingFrequency}</option>)}</select></label>
          <label className="form-group"><span className="form-label">Quotation template</span><select className="form-input" value={form.template} onChange={event => setForm({ ...form, template: event.target.value })}><option value="30">Standard offer · valid 30 days</option><option value="14">Short offer · valid 14 days</option><option value="365">Annual contract · valid 365 days</option></select></label>
          <label className="form-group"><span className="form-label">Subscription start date</span><input className="form-input" type="date" required value={form.startDate} onChange={event => setForm({ ...form, startDate: event.target.value })} /></label>
          <button className="btn btn-primary quote-submit" type="submit"><Plus size={16} /> Create quotation</button>
        </form>
      </section>
      <section className="card" style={{ marginTop: 20 }}><div className="card-header"><h3>Offers</h3></div>
        <div className="table-container"><table className="data-table"><thead><tr><th>Customer</th><th>Items</th><th>Total</th><th>Created</th><th>Valid until</th><th>Status</th><th>Next step</th></tr></thead>
          <tbody>{data.quotations.length ? data.quotations.map(quote => {
            const expired = quote.validUntil && new Date(`${quote.validUntil}T23:59:59`) < new Date() && quote.status !== 'confirmed';
            const nextStatus = quote.status === 'draft' ? 'Send offer' : 'Confirm & create subscription';
            return <tr key={quote.id}><td className="td-primary">{quote.customerName}</td><td>{quote.items?.map(item => item.productName).join(', ') || '—'}</td><td>{formatCurrency(quote.totalAmount)}</td><td>{formatDate(quote.createdAt)}</td><td>{formatDate(quote.validUntil)}</td><td><span className={`status-badge ${expired ? 'status-overdue' : `status-${quote.status}`}`}>{expired ? 'expired' : quote.status}</span></td><td>{!expired && quote.status !== 'confirmed' ? <button className="btn btn-secondary btn-sm" onClick={() => setStatus(quote)}>{nextStatus}</button> : quote.subscriptionId ? 'Subscription created' : '—'}</td></tr>;
          }) : <EmptyTableRow colSpan={7}>No quotations yet. Create an offer from a plan above.</EmptyTableRow>}</tbody>
        </table></div>
      </section>
    </div>
  );
}

export function CustomerPortal() {
  const { currentUser } = useAuth();
  const { data, updateItem } = useData();
  const subscriptions = data.subscriptions.filter(subscription => subscription.customerId === currentUser.id);
  const invoices = data.invoices.filter(invoice => invoice.customerId === currentUser.id);
  return (
    <div className="page-content">
      <PageHeading title="My account" description="Your subscriptions, renewal dates, and billing history." />
      <div className="stats-grid portal-stats">
        <div className="stat-card primary"><div className="stat-label">Active subscriptions</div><div className="stat-value">{subscriptions.filter(item => item.status === 'active').length}</div></div>
        <div className="stat-card warning"><div className="stat-label">Outstanding balance</div><div className="stat-value">{formatCurrency(invoices.reduce((sum, invoice) => sum + getInvoiceBalance(invoice, data.payments), 0))}</div></div>
      </div>
      <section className="card"><div className="card-header"><h3>My subscriptions</h3></div>
        <div className="table-container"><table className="data-table"><thead><tr><th>Product</th><th>Plan</th><th>Price</th><th>Renews</th><th>Status</th><th>Manage</th></tr></thead>
          <tbody>{subscriptions.length ? subscriptions.map(subscription => <tr key={subscription.id}><td className="td-primary">{subscription.productName}</td><td>{subscription.variantName}</td><td>{formatCurrency(subscription.price)} / {subscription.billingFrequency}</td><td>{formatDate(subscription.nextBillingDate)}</td><td>{subscription.status}</td><td>{subscription.status === 'active' ? <button className="btn btn-secondary btn-sm" onClick={() => updateItem('subscriptions', { id: subscription.id, status: 'paused' })}>Pause</button> : subscription.status === 'paused' ? <button className="btn btn-secondary btn-sm" onClick={() => updateItem('subscriptions', { id: subscription.id, status: 'active' })}>Resume</button> : '—'}</td></tr>) : <EmptyTableRow colSpan={6}>No subscriptions yet.</EmptyTableRow>}</tbody>
        </table></div>
      </section>
      <section className="card" style={{ marginTop: 20 }}><div className="card-header"><h3>My invoices</h3></div>
        <div className="table-container"><table className="data-table"><thead><tr><th>Invoice</th><th>Issued</th><th>Due</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>{invoices.length ? invoices.map(invoice => <tr key={invoice.id}><td className="td-mono td-primary">{invoice.id}</td><td>{formatDate(invoice.issuedDate)}</td><td>{formatDate(invoice.dueDate)}</td><td>{formatCurrency(invoice.totalAmount)}</td><td>{invoice.status}</td></tr>) : <EmptyTableRow colSpan={5}>No invoices available yet.</EmptyTableRow>}</tbody>
        </table></div>
      </section>
    </div>
  );
}
