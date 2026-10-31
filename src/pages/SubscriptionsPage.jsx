import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { addBillingInterval, formatCurrency, formatDate, getStatusColor, isPlanAvailable } from '../utils/helpers';
import { RefreshCw, Plus, Play, Pause, X as XIcon, Search, Filter, Calendar, ArrowRight, ChevronDown } from 'lucide-react';

const STATUS_FLOW = ['draft', 'quotation', 'confirmed', 'active', 'closed'];

export default function SubscriptionsPage() {
  const { data, addItem, updateItem } = useData();
  const [view, setView] = useState('table');
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState({ customerId: '', planId: '', status: 'draft', startDate: '', endDate: '', billingFrequency: 'monthly' });

  const customers = data.users.filter(u => u.role === 'customer');

  const filtered = data.subscriptions.filter(s => {
    const matchSearch = s.productName?.toLowerCase().includes(search.toLowerCase()) ||
      customers.find(c => c.id === s.customerId)?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleStatusChange = (sub, newStatus) => {
    updateItem('subscriptions', { id: sub.id, status: newStatus });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const plan = data.plans.find(p => p.id === form.planId);
    const product = plan ? data.products.find(p => p.id === plan.productId) : null;
    const variant = product?.variants?.find(v => v.id === plan?.variantId);

    addItem('subscriptions', {
      ...form,
      productName: product?.name || 'Unknown',
      variantName: variant?.name || 'N/A',
      quantity: plan?.minQuantity || 1,
      price: (plan?.price || 0) * (plan?.minQuantity || 1),
      billingFrequency: plan?.billingFrequency || form.billingFrequency,
      nextBillingDate: form.startDate,
      createdAt: new Date().toISOString().split('T')[0],
    });
    setShowModal(false);
    setForm({ customerId: '', planId: '', status: 'draft', startDate: '', endDate: '', billingFrequency: 'monthly' });
  };

  const pipelineData = STATUS_FLOW.map(status => ({
    status,
    items: data.subscriptions.filter(s => s.status === status),
  }));

  const statusLabels = {
    draft: 'Draft', quotation: 'Quotation', confirmed: 'Confirmed', active: 'Active', closed: 'Closed',
  };

  const pipelineColors = {
    draft: '#94a3b8', quotation: '#fbbf24', confirmed: '#06b6d4', active: '#10b981', closed: '#64748b',
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Subscriptions</h2>
          <p>Track the complete lifecycle from draft to active and closure</p>
        </div>
        <div className="page-actions">
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 3 }}>
            <button className={`filter-chip ${view === 'table' ? 'active' : ''}`} onClick={() => setView('table')} style={{ border: 'none', borderRadius: 'var(--radius-sm)' }}>Table</button>
            <button className={`filter-chip ${view === 'pipeline' ? 'active' : ''}`} onClick={() => setView('pipeline')} style={{ border: 'none', borderRadius: 'var(--radius-sm)' }}>Pipeline</button>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New Subscription</button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="form-input-icon" style={{ flex: 1, maxWidth: 300 }}>
          <Search size={16} className="icon-left" />
          <input type="text" className="form-input" placeholder="Search subscriptions..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['all', ...STATUS_FLOW, 'paused'].map(s => (
          <button key={s} className={`filter-chip ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Pipeline View */}
      {view === 'pipeline' && (
        <div className="pipeline-view">
          {pipelineData.map(col => (
            <div key={col.status} className="pipeline-column">
              <div className="pipeline-column-header" style={{ borderBottomColor: pipelineColors[col.status] }}>
                <h4>{statusLabels[col.status]}</h4>
                <span className="pipeline-count">{col.items.length}</span>
              </div>
              <div className="pipeline-cards">
                {col.items.map(sub => {
                  const customer = customers.find(c => c.id === sub.customerId);
                  return (
                    <div key={sub.id} className="pipeline-card">
                      <h5>{sub.productName}</h5>
                      <p>{customer?.name || 'Unknown'} • {sub.variantName}</p>
                      <div className="pipeline-card-amount">{formatCurrency(sub.price)}<span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>/{sub.billingFrequency}</span></div>
                      <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                        {STATUS_FLOW.indexOf(sub.status) < STATUS_FLOW.length - 1 && (
                          <button className="btn btn-primary btn-sm" style={{ flex: 1, fontSize: '0.7rem' }} onClick={() => handleStatusChange(sub, STATUS_FLOW[STATUS_FLOW.indexOf(sub.status) + 1])}>
                            <ArrowRight size={12} /> {statusLabels[STATUS_FLOW[STATUS_FLOW.indexOf(sub.status) + 1]]}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {col.items.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>No items</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {view === 'table' && (
        <div className="card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Variant</th>
                  <th>Price</th>
                  <th>Frequency</th>
                  <th>Next Billing</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(sub => {
                  const customer = customers.find(c => c.id === sub.customerId);
                  return (
                    <tr key={sub.id}>
                      <td className="td-mono td-primary">{sub.id.toUpperCase()}</td>
                      <td className="td-primary">{customer?.name || 'Unknown'}</td>
                      <td>{sub.productName}</td>
                      <td><span className="tag">{sub.variantName}</span></td>
                      <td className="font-semibold text-accent">{formatCurrency(sub.price)}</td>
                      <td><span className="tag primary">{sub.billingFrequency}</span></td>
                      <td>{formatDate(sub.nextBillingDate)}</td>
                      <td><span className={`status-badge ${getStatusColor(sub.status)}`}><span className="status-dot" /> {sub.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {sub.status === 'active' && (
                            <button className="btn btn-ghost btn-icon btn-sm" title="Pause" onClick={() => handleStatusChange(sub, 'paused')}>
                              <Pause size={14} />
                            </button>
                          )}
                          {sub.status === 'paused' && (
                            <button className="btn btn-ghost btn-icon btn-sm text-accent" title="Resume" onClick={() => handleStatusChange(sub, 'active')}>
                              <Play size={14} />
                            </button>
                          )}
                          {sub.status === 'active' && (
                            <button className="btn btn-ghost btn-icon btn-sm" title="Renew" onClick={() => updateItem('subscriptions', {
                              id: sub.id,
                              endDate: addBillingInterval(sub.endDate || new Date().toISOString().slice(0, 10), sub.billingFrequency),
                              nextBillingDate: addBillingInterval(sub.nextBillingDate || new Date().toISOString().slice(0, 10), sub.billingFrequency),
                            })}>
                              <RefreshCw size={14} />
                            </button>
                          )}
                          {['draft', 'quotation', 'confirmed'].includes(sub.status) && (
                            <button className="btn btn-primary btn-sm" onClick={() => handleStatusChange(sub, STATUS_FLOW[STATUS_FLOW.indexOf(sub.status) + 1])}>
                              <ArrowRight size={12} /> Advance
                            </button>
                          )}
                          {sub.status !== 'closed' && (
                            <button className="btn btn-ghost btn-icon btn-sm text-danger" title="Close" onClick={() => handleStatusChange(sub, 'closed')}>
                              <XIcon size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="empty-state">
              <h3>No subscriptions found</h3>
              <p>Try adjusting your filters or create a new subscription.</p>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="subscription-modal-title" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
            <h3 id="subscription-modal-title">New Subscription</h3>
            <button className="btn btn-ghost btn-icon btn-sm" aria-label="Close dialog" onClick={() => setShowModal(false)}><XIcon size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Customer *</label>
                  <select className="form-input" value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })} required>
                    <option value="">Select customer...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Plan *</label>
                  <select className="form-input" value={form.planId} onChange={e => setForm({ ...form, planId: e.target.value })} required>
                    <option value="">Select plan...</option>
                    {data.plans.filter(p => isPlanAvailable(p)).map(p => {
                      const prod = data.products.find(pr => pr.id === p.productId);
                      return <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.price)}/{p.billingFrequency}</option>;
                    })}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Start Date *</label>
                    <input type="date" className="form-input" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date *</label>
                    <input type="date" className="form-input" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Initial Status</label>
                  <select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="draft">Draft</option>
                    <option value="quotation">Quotation</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="active">Active</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Subscription</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
