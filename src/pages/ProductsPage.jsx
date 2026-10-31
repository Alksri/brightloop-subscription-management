import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { formatCurrency } from '../utils/helpers';
import { Package, Plus, Edit3, Trash2, X, Tag, Layers, Search } from 'lucide-react';

export default function ProductsPage() {
  const { data, addItem, updateItem, deleteItem } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', description: '', basePrice: '', costPrice: '', notes: '', category: 'Software', status: 'active', variants: [] });
  const [variantForm, setVariantForm] = useState({ name: '', priceAddon: '' });

  const filtered = data.products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditItem(null); setForm({ name: '', description: '', basePrice: '', costPrice: '', notes: '', category: 'Software', status: 'active', variants: [] }); setShowModal(true); };
  const openEdit = (product) => { setEditItem(product); setForm({ ...product, basePrice: String(product.basePrice) }); setShowModal(true); };

  const addVariant = () => {
    if (!variantForm.name.trim()) return;
    setForm({ ...form, variants: [...form.variants, { id: 'var-' + Date.now(), name: variantForm.name, priceAddon: parseFloat(variantForm.priceAddon) || 0 }] });
    setVariantForm({ name: '', priceAddon: '' });
  };

  const removeVariant = (id) => {
    setForm({ ...form, variants: form.variants.filter(v => v.id !== id) });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const productData = {
      ...form,
      basePrice: parseFloat(form.basePrice),
      costPrice: Number(form.costPrice) || 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    if (editItem) {
      updateItem('products', { ...productData, id: editItem.id });
    } else {
      addItem('products', productData);
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteItem('products', id);
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Products & Plans</h2>
          <p>Manage your software products, add-ons, and pricing variants</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Product</button>
      </div>

      <div className="filters-bar">
        <div className="form-input-icon" style={{ flex: 1, maxWidth: 320 }}>
          <Search size={16} className="icon-left" />
          <input type="text" className="form-input" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['All', 'Software', 'Add-on'].map(cat => (
          <button key={cat} className={`filter-chip ${search === '' && cat === 'All' ? 'active' : ''}`} onClick={() => setSearch(cat === 'All' ? '' : cat)}>{cat}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-5)' }}>
        {filtered.map(product => (
          <div key={product.id} className="card" style={{ transition: 'var(--transition-base)' }}>
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div className="stat-icon primary" style={{ width: 44, height: 44 }}>
                    <Package size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{product.name}</h3>
                    <span className="tag primary" style={{ marginTop: 4 }}>{product.category}</span>
                  </div>
                </div>
                <span className={`status-badge ${product.status === 'active' ? 'status-active' : 'status-closed'}`}>
                  <span className="status-dot" /> {product.status}
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginBottom: 16 }}>{product.description || product.notes}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Sales Price</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-400)' }}>{formatCurrency(product.basePrice)}</span>
              </div>
              {product.variants.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Variants</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {product.variants.map(v => (
                      <span key={v.id} className="tag" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <Layers size={10} /> {v.name} {v.priceAddon > 0 && `+${formatCurrency(v.priceAddon)}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="divider" />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(product)}><Edit3 size={14} /> Edit</button>
                <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleDelete(product.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon"><Package size={28} /></div>
          <h3>No products found</h3>
          <p>Try adjusting your search or create a new product.</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
        <div className="modal modal-lg" role="dialog" aria-modal="true" aria-labelledby="product-modal-title" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
            <h3 id="product-modal-title">{editItem ? 'Edit Product' : 'Add New Product'}</h3>
            <button className="btn btn-ghost btn-icon btn-sm" aria-label="Close dialog" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Product Name *</label>
                    <input className="form-input" placeholder="e.g. BrightLoop CRM" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      <option value="Software">Software</option>
                      <option value="Add-on">Add-on</option>
                      <option value="Service">Service</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" placeholder="Product description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Sales Price (USD) *</label>
                    <input type="number" min="0" step="0.01" className="form-input" placeholder="49.99" value={form.basePrice} onChange={e => setForm({ ...form, basePrice: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cost Price (USD)</label>
                    <input type="number" min="0" step="0.01" className="form-input" placeholder="25.00" value={form.costPrice ?? ''} onChange={e => setForm({ ...form, costPrice: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Internal notes</label>
                  <textarea className="form-input" placeholder="Notes for your team..." value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="divider" />
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 12 }}>Product Variants</h4>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input className="form-input" placeholder="Variant name" value={variantForm.name} onChange={e => setVariantForm({ ...variantForm, name: e.target.value })} style={{ flex: 2 }} />
                  <input type="number" step="0.01" className="form-input" placeholder="Price add-on" value={variantForm.priceAddon} onChange={e => setVariantForm({ ...variantForm, priceAddon: e.target.value })} style={{ flex: 1 }} />
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addVariant}><Plus size={14} /> Add</button>
                </div>
                {form.variants.map(v => (
                  <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.8125rem' }}>{v.name} — +{formatCurrency(v.priceAddon)}</span>
                    <button type="button" className="btn btn-ghost btn-icon btn-sm text-danger" onClick={() => removeVariant(v.id)}><X size={14} /></button>
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editItem ? 'Update Product' : 'Create Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
