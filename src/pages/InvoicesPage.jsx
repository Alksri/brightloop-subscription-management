import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { addBillingInterval, formatCurrency, formatDate, getInvoiceBalance, getStatusColor, generateInvoiceNumber } from '../utils/helpers';
import { FileText, Search, Download, Eye, X, Printer, Send, Zap, Ban } from 'lucide-react';

export default function InvoicesPage() {
  const { data, addItem, updateItem } = useData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDetail, setShowDetail] = useState(null);
  const [showBulkGen, setShowBulkGen] = useState(false);
  const [billingDate, setBillingDate] = useState(new Date().toISOString().slice(0, 10));
  const [generating, setGenerating] = useState(false);

  const filtered = data.invoices.filter(inv => {
    const matchSearch = inv.customerName?.toLowerCase().includes(search.toLowerCase()) || inv.id?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleStatusChange = (invoiceId, newStatus) => {
    const updates = { id: invoiceId, status: newStatus };
    if (newStatus === 'paid') updates.paidDate = new Date().toISOString().split('T')[0];
    updateItem('invoices', updates);
  };

  const generateBulkInvoices = () => {
    if (generating) return;
    setGenerating(true);
    const newInvoices = [];
    const usageUpdates = new Map();
    const activeSubs = data.subscriptions.filter(sub =>
      sub.status === 'active' && sub.nextBillingDate && sub.nextBillingDate <= billingDate
    );

    activeSubs.forEach(sub => {
      const customer = data.users.find(u => u.id === sub.customerId);
      if (!customer) return;
      const plan = data.plans.find(item => item.id === sub.planId);
      const product = data.products.find(item => item.id === plan?.productId);
      const quantity = Math.max(1, Number(sub.quantity || plan?.minQuantity || 1));
      const unitPrice = Number(plan?.price ?? sub.price);
      const activeTaxes = data.taxRules.filter(rule => rule.status === 'active');
      const taxRule = activeTaxes.find(rule => rule.applicableTo === product?.id)
        || activeTaxes.find(rule => rule.applicableTo === 'add-ons' && product?.category === 'Add-on')
        || activeTaxes.find(rule => rule.applicableTo === 'all');
      const taxRate = Number(taxRule?.rate || 0);
      let period = sub.nextBillingDate;
      while (period && period <= billingDate && (!sub.endDate || period <= sub.endDate)) {
        const alreadyBilled = data.invoices.some(invoice =>
          invoice.subscriptionId === sub.id &&
          (invoice.billingPeriod === period || invoice.issuedDate === period)
        );
        if (!alreadyBilled) {
          const subtotal = Math.round(unitPrice * quantity * 100) / 100;
          const applicableDiscount = data.discountRules.find(rule => {
            const uses = usageUpdates.get(rule.id) ?? rule.usageCount ?? 0;
            const withinDates = (!rule.startDate || rule.startDate <= period) && (!rule.expiryDate || rule.expiryDate >= period);
            const productMatches = rule.productId === 'all' || rule.productId === product?.id;
            const hasUses = !rule.usageLimit || uses < rule.usageLimit;
            return rule.status === 'active' && withinDates && productMatches && hasUses && quantity >= (rule.minQuantity || 1);
          });
          const discountAmount = applicableDiscount
            ? Math.min(subtotal, applicableDiscount.type === 'percentage'
              ? subtotal * (applicableDiscount.value / 100)
              : applicableDiscount.value)
            : 0;
          if (applicableDiscount) {
            usageUpdates.set(applicableDiscount.id, (usageUpdates.get(applicableDiscount.id) ?? applicableDiscount.usageCount ?? 0) + 1);
          }

          const afterDiscount = subtotal - discountAmount;
          const taxAmount = Math.round(afterDiscount * (taxRate / 100) * 100) / 100;
          const dueDate = new Date(`${period}T12:00:00`);
          dueDate.setDate(dueDate.getDate() + 15);
          newInvoices.push({
            id: generateInvoiceNumber(),
            subscriptionId: sub.id,
            billingPeriod: period,
            customerId: sub.customerId,
            customerName: customer.name,
            items: [{ description: `${sub.productName} - ${sub.variantName} (${sub.billingFrequency})`, quantity, unitPrice, total: subtotal }],
            subtotal,
            taxRate,
            taxAmount,
            discountAmount: Math.round(discountAmount * 100) / 100,
            totalAmount: Math.round((afterDiscount + taxAmount) * 100) / 100,
            status: 'draft',
            dueDate: dueDate.toISOString().slice(0, 10),
            issuedDate: period,
            paidDate: null,
          });
        }
        const nextPeriod = addBillingInterval(period, sub.billingFrequency);
        if (!nextPeriod || nextPeriod <= period) break;
        period = nextPeriod;
      }
      if (period !== sub.nextBillingDate) {
        updateItem('subscriptions', { id: sub.id, nextBillingDate: period });
      }
    });

    if (newInvoices.length > 0) {
      newInvoices.forEach(inv => addItem('invoices', inv));
    }
    usageUpdates.forEach((usageCount, id) => updateItem('discountRules', { id, usageCount }));
    setGenerating(false);
    setShowBulkGen(false);
  };

  const dueSubscriptions = data.subscriptions.filter(sub =>
    sub.status === 'active' && sub.nextBillingDate && sub.nextBillingDate <= billingDate &&
    (!sub.endDate || sub.nextBillingDate <= sub.endDate) &&
    !data.invoices.some(invoice => invoice.subscriptionId === sub.id &&
      (invoice.billingPeriod === sub.nextBillingDate || invoice.issuedDate === sub.nextBillingDate))
  );

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Invoices</h2>
          <p>Manage billing, generate invoices, and track payment status</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-accent" onClick={() => setShowBulkGen(true)}>
            <Zap size={16} /> Auto-Generate Invoices
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {[
          { label: 'Total Invoiced', value: formatCurrency(data.invoices.filter(invoice => invoice.status !== 'cancelled').reduce((s, i) => s + i.totalAmount, 0)), color: 'primary' },
          { label: 'Paid', value: formatCurrency(data.invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.totalAmount, 0)), color: 'accent' },
          { label: 'Outstanding', value: formatCurrency(data.invoices.reduce((sum, invoice) => sum + getInvoiceBalance(invoice, data.payments), 0)), color: 'warning' },
          { label: 'Overdue', value: formatCurrency(data.invoices.filter(i => i.status === 'overdue').reduce((sum, invoice) => sum + getInvoiceBalance(invoice, data.payments), 0)), color: 'danger' },
        ].map(stat => (
          <div key={stat.label} className={`stat-card ${stat.color}`}>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value" style={{ fontSize: '1.35rem' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="form-input-icon" style={{ flex: 1, maxWidth: 300 }}>
          <Search size={16} className="icon-left" />
          <input type="text" className="form-input" placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['all', 'draft', 'confirmed', 'paid', 'overdue', 'cancelled'].map(s => (
          <button key={s} className={`filter-chip ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Customer</th>
                <th>Subtotal</th>
                <th>Tax</th>
                <th>Discount</th>
                <th>Total</th>
                <th>Issued</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv.id}>
                  <td className="td-mono td-primary">{inv.id.toUpperCase()}</td>
                  <td className="td-primary">{inv.customerName}</td>
                  <td>{formatCurrency(inv.subtotal)}</td>
                  <td>{formatCurrency(inv.taxAmount)} <span className="text-dim text-xs">({inv.taxRate}%)</span></td>
                  <td>{inv.discountAmount > 0 ? <span className="text-accent">-{formatCurrency(inv.discountAmount)}</span> : '—'}</td>
                  <td className="font-semibold">{formatCurrency(inv.totalAmount)}</td>
                  <td>{formatDate(inv.issuedDate)}</td>
                  <td>{formatDate(inv.dueDate)}</td>
                  <td><span className={`status-badge ${getStatusColor(inv.status)}`}><span className="status-dot" /> {inv.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-icon btn-sm" title="View" onClick={() => setShowDetail(inv)}><Eye size={14} /></button>
                      {inv.status === 'draft' && (
                        <button className="btn btn-ghost btn-icon btn-sm text-primary" title="Confirm" onClick={() => handleStatusChange(inv.id, 'confirmed')}><Send size={14} /></button>
                      )}
                      {['draft', 'confirmed', 'overdue'].includes(inv.status) && (
                        <button className="btn btn-ghost btn-icon btn-sm text-danger" title="Cancel invoice" onClick={() => {
                          if (confirm(`Cancel invoice ${inv.id}?`)) handleStatusChange(inv.id, 'cancelled');
                        }}><Ban size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon"><FileText size={28} /></div>
            <h3>No invoices found</h3>
            <p>Generate invoices from active subscriptions.</p>
          </div>
        )}
      </div>

      {/* Invoice Detail Modal */}
      {showDetail && (
        <div className="modal-backdrop" onClick={() => setShowDetail(null)}>
        <div className="modal modal-lg" role="dialog" aria-modal="true" aria-labelledby="invoice-detail-title" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
            <h3 id="invoice-detail-title">Invoice Details</h3>
            <button className="btn btn-ghost btn-icon btn-sm" aria-label="Close dialog" onClick={() => setShowDetail(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="invoice-preview">
                <div className="invoice-preview-header">
                  <div className="invoice-company">
                    <div className="invoice-company-logo"><Zap size={24} /></div>
                    <div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>BrightLoop Software</h3>
                      <p className="text-sm text-muted">billing@brightloop.com</p>
                    </div>
                  </div>
                  <div className="invoice-meta">
                    <div className="invoice-number">{showDetail.id.toUpperCase()}</div>
                    <p className="text-sm text-muted">Issued: {formatDate(showDetail.issuedDate)}</p>
                    <p className="text-sm text-muted">Due: {formatDate(showDetail.dueDate)}</p>
                    <span className={`status-badge ${getStatusColor(showDetail.status)}`} style={{ marginTop: 8 }}><span className="status-dot" /> {showDetail.status}</span>
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <p className="text-xs text-dim" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Bill To</p>
                  <p className="font-semibold">{showDetail.customerName}</p>
                </div>

                <table className="invoice-items-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th style={{ textAlign: 'right' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Unit Price</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {showDetail.items?.map((item, i) => (
                      <tr key={i}>
                        <td className="td-primary">{item.description}</td>
                        <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                        <td style={{ textAlign: 'right' }} className="font-semibold">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="invoice-totals">
                  <div className="invoice-total-row">
                    <span className="text-muted">Subtotal</span>
                    <span>{formatCurrency(showDetail.subtotal)}</span>
                  </div>
                  {showDetail.discountAmount > 0 && (
                    <div className="invoice-total-row">
                      <span className="text-muted">Discount</span>
                      <span className="text-accent">-{formatCurrency(showDetail.discountAmount)}</span>
                    </div>
                  )}
                  <div className="invoice-total-row">
                    <span className="text-muted">Tax ({showDetail.taxRate}%)</span>
                    <span>{formatCurrency(showDetail.taxAmount)}</span>
                  </div>
                  <div className="invoice-total-row grand-total">
                    <span>Total Due</span>
                    <span>{formatCurrency(showDetail.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => window.print()}><Printer size={14} /> Print</button>
              <button className="btn btn-secondary" onClick={() => window.print()}><Download size={14} /> Save as PDF</button>
              {showDetail.status === 'draft' && (
                <button className="btn btn-primary" onClick={() => { handleStatusChange(showDetail.id, 'confirmed'); setShowDetail({ ...showDetail, status: 'confirmed' }); }}>
                  <Send size={14} /> Confirm & Send
                </button>
              )}
              {['draft', 'confirmed', 'overdue'].includes(showDetail.status) && (
                <button className="btn btn-danger" onClick={() => {
                  if (confirm(`Cancel invoice ${showDetail.id}?`)) {
                    handleStatusChange(showDetail.id, 'cancelled');
                    setShowDetail({ ...showDetail, status: 'cancelled' });
                  }
                }}><Ban size={14} /> Cancel</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Generate Modal */}
      {showBulkGen && (
        <div className="modal-backdrop" onClick={() => setShowBulkGen(false)}>
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="bulk-invoice-title" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
            <h3 id="bulk-invoice-title">Auto-Generate Invoices</h3>
            <button className="btn btn-ghost btn-icon btn-sm" aria-label="Close dialog" onClick={() => setShowBulkGen(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div className="stat-icon accent" style={{ width: 56, height: 56, margin: '0 auto 16px' }}>
                  <Zap size={28} />
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 8 }}>Bulk Invoice Generation</h3>
                <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
                  This will generate one invoice for each active subscription due on or before the selected billing date. Previously billed periods are skipped.
                </p>
                <label className="form-group" style={{ textAlign: 'left' }}>
                  <span className="form-label">Billing date</span>
                  <input className="form-input" type="date" value={billingDate} onChange={event => setBillingDate(event.target.value)} />
                </label>
                <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
                  <strong>{dueSubscriptions.length} subscriptions</strong> are due by {formatDate(billingDate)}.
                </p>
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 16, textAlign: 'left' }}>
                  <p className="text-sm"><strong>Tax Rules Applied:</strong></p>
                  {data.taxRules.filter(t => t.status === 'active').map(t => (
                    <p key={t.id} className="text-sm text-muted">• {t.name}: {t.rate}%</p>
                  ))}
                  <p className="text-sm mt-2"><strong>Active Discounts:</strong></p>
                  {data.discountRules.filter(d => d.status === 'active').map(d => (
                    <p key={d.id} className="text-sm text-muted">• {d.name}: {d.type === 'percentage' ? `${d.value}%` : formatCurrency(d.value)}</p>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowBulkGen(false)}>Cancel</button>
              <button className="btn btn-accent" onClick={generateBulkInvoices} disabled={generating || dueSubscriptions.length === 0}>
                <Zap size={14} /> {generating ? 'Generating...' : 'Generate Due Invoices'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
