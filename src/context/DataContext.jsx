import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
const DataContext = createContext();

const generateId = () => {
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
};

// Sample seed data
const seedData = () => ({
  users: [
    { id: 'admin-1', email: 'admin@brightloop.com', password: 'Admin@123', name: 'Sarah Chen', role: 'admin', avatar: 'SC', createdAt: '2026-01-15' },
    { id: 'staff-1', email: 'staff@brightloop.com', password: 'Staff@123', name: 'Marcus Rivera', role: 'staff', avatar: 'MR', createdAt: '2026-02-20' },
    { id: 'cust-1', email: 'customer@acme.com', password: 'Cust@123', name: 'Acme Corp', role: 'customer', avatar: 'AC', company: 'Acme Corporation', createdAt: '2026-03-10' },
    { id: 'cust-2', email: 'info@globex.com', password: 'Cust@123', name: 'Globex Inc', role: 'customer', avatar: 'GI', company: 'Globex Industries', createdAt: '2026-04-05' },
    { id: 'cust-3', email: 'hello@wayne.com', password: 'Cust@123', name: 'Wayne Enterprises', role: 'customer', avatar: 'WE', company: 'Wayne Enterprises', createdAt: '2026-05-12' },
  ],
  products: [
    { id: 'prod-1', name: 'BrightLoop CRM', description: 'Customer relationship management suite', basePrice: 49.99, category: 'Software', status: 'active', variants: [
      { id: 'var-1', name: 'Standard', priceAddon: 0 },
      { id: 'var-2', name: 'Professional', priceAddon: 30 },
      { id: 'var-3', name: 'Enterprise', priceAddon: 100 },
    ], createdAt: '2026-01-10' },
    { id: 'prod-2', name: 'BrightLoop Analytics', description: 'Business intelligence and reporting', basePrice: 79.99, category: 'Software', status: 'active', variants: [
      { id: 'var-4', name: 'Basic', priceAddon: 0 },
      { id: 'var-5', name: 'Advanced', priceAddon: 50 },
    ], createdAt: '2026-02-01' },
    { id: 'prod-3', name: 'BrightLoop HRM', description: 'Human resource management platform', basePrice: 39.99, category: 'Software', status: 'active', variants: [
      { id: 'var-6', name: 'Starter', priceAddon: 0 },
      { id: 'var-7', name: 'Business', priceAddon: 25 },
    ], createdAt: '2026-03-15' },
    { id: 'prod-4', name: 'Cloud Storage Add-on', description: 'Additional 500GB cloud storage', basePrice: 14.99, category: 'Add-on', status: 'active', variants: [], createdAt: '2026-01-20' },
    { id: 'prod-5', name: 'Priority Support', description: '24/7 dedicated support line', basePrice: 29.99, category: 'Add-on', status: 'active', variants: [], createdAt: '2026-02-10' },
  ],
  plans: [
    { id: 'plan-1', name: 'Monthly Starter', productId: 'prod-1', variantId: 'var-1', billingFrequency: 'monthly', price: 49.99, autoRenew: true, status: 'active' },
    { id: 'plan-2', name: 'Monthly Pro', productId: 'prod-1', variantId: 'var-2', billingFrequency: 'monthly', price: 79.99, autoRenew: true, status: 'active' },
    { id: 'plan-3', name: 'Yearly Enterprise CRM', productId: 'prod-1', variantId: 'var-3', billingFrequency: 'yearly', price: 1499.99, autoRenew: true, status: 'active' },
    { id: 'plan-4', name: 'Monthly Analytics Basic', productId: 'prod-2', variantId: 'var-4', billingFrequency: 'monthly', price: 79.99, autoRenew: true, status: 'active' },
    { id: 'plan-5', name: 'Monthly Analytics Advanced', productId: 'prod-2', variantId: 'var-5', billingFrequency: 'monthly', price: 129.99, autoRenew: true, status: 'active' },
    { id: 'plan-6', name: 'Weekly HRM Starter', productId: 'prod-3', variantId: 'var-6', billingFrequency: 'weekly', price: 12.99, autoRenew: false, status: 'active' },
  ],
  subscriptions: [
    { id: 'sub-1', customerId: 'cust-1', planId: 'plan-2', productName: 'BrightLoop CRM', variantName: 'Professional', status: 'active', startDate: '2026-04-01', endDate: '2027-04-01', nextBillingDate: '2026-11-01', billingFrequency: 'monthly', price: 79.99, createdAt: '2026-03-28' },
    { id: 'sub-2', customerId: 'cust-1', planId: 'plan-4', productName: 'BrightLoop Analytics', variantName: 'Basic', status: 'active', startDate: '2026-05-15', endDate: '2027-05-15', nextBillingDate: '2026-11-15', billingFrequency: 'monthly', price: 79.99, createdAt: '2026-05-10' },
    { id: 'sub-3', customerId: 'cust-2', planId: 'plan-3', productName: 'BrightLoop CRM', variantName: 'Enterprise', status: 'active', startDate: '2026-06-01', endDate: '2027-06-01', nextBillingDate: '2027-06-01', billingFrequency: 'yearly', price: 1499.99, createdAt: '2026-05-25' },
    { id: 'sub-4', customerId: 'cust-3', planId: 'plan-5', productName: 'BrightLoop Analytics', variantName: 'Advanced', status: 'active', startDate: '2026-07-01', endDate: '2027-07-01', nextBillingDate: '2026-11-01', billingFrequency: 'monthly', price: 129.99, createdAt: '2026-06-28' },
    { id: 'sub-5', customerId: 'cust-2', planId: 'plan-1', productName: 'BrightLoop CRM', variantName: 'Standard', status: 'paused', startDate: '2026-03-01', endDate: '2027-03-01', nextBillingDate: '2026-11-01', billingFrequency: 'monthly', price: 49.99, createdAt: '2026-02-25' },
    { id: 'sub-6', customerId: 'cust-3', planId: 'plan-6', productName: 'BrightLoop HRM', variantName: 'Starter', status: 'closed', startDate: '2026-01-15', endDate: '2026-07-15', nextBillingDate: null, billingFrequency: 'weekly', price: 12.99, createdAt: '2026-01-10' },
  ],
  quotations: [
    { id: 'quot-1', customerId: 'cust-1', customerName: 'Acme Corp', items: [
      { productId: 'prod-1', productName: 'BrightLoop CRM', variantId: 'var-3', variantName: 'Enterprise', price: 149.99 }
    ], totalAmount: 149.99, status: 'confirmed', validUntil: '2026-12-31', createdAt: '2026-10-01', notes: 'Annual enterprise upgrade' },
    { id: 'quot-2', customerId: 'cust-2', customerName: 'Globex Inc', items: [
      { productId: 'prod-2', productName: 'BrightLoop Analytics', variantId: 'var-5', variantName: 'Advanced', price: 129.99 },
      { productId: 'prod-5', productName: 'Priority Support', variantId: null, variantName: null, price: 29.99 }
    ], totalAmount: 159.98, status: 'draft', validUntil: '2026-11-30', createdAt: '2026-10-15', notes: 'Bundled analytics + support' },
    { id: 'quot-3', customerId: 'cust-3', customerName: 'Wayne Enterprises', items: [
      { productId: 'prod-3', productName: 'BrightLoop HRM', variantId: 'var-7', variantName: 'Business', price: 64.99 }
    ], totalAmount: 64.99, status: 'quotation', validUntil: '2026-11-15', createdAt: '2026-10-20', notes: 'HR platform evaluation' },
  ],
  invoices: [
    { id: 'inv-1', subscriptionId: 'sub-1', customerId: 'cust-1', customerName: 'Acme Corp', items: [{ description: 'BrightLoop CRM - Professional (Monthly)', quantity: 1, unitPrice: 79.99, total: 79.99 }], subtotal: 79.99, taxRate: 18, taxAmount: 14.40, discountAmount: 0, totalAmount: 94.39, status: 'paid', dueDate: '2026-10-15', issuedDate: '2026-10-01', paidDate: '2026-10-10' },
    { id: 'inv-2', subscriptionId: 'sub-2', customerId: 'cust-1', customerName: 'Acme Corp', items: [{ description: 'BrightLoop Analytics - Basic (Monthly)', quantity: 1, unitPrice: 79.99, total: 79.99 }], subtotal: 79.99, taxRate: 18, taxAmount: 14.40, discountAmount: 0, totalAmount: 94.39, status: 'paid', dueDate: '2026-10-20', issuedDate: '2026-10-05', paidDate: '2026-10-18' },
    { id: 'inv-3', subscriptionId: 'sub-3', customerId: 'cust-2', customerName: 'Globex Inc', items: [{ description: 'BrightLoop CRM - Enterprise (Yearly)', quantity: 1, unitPrice: 1499.99, total: 1499.99 }], subtotal: 1499.99, taxRate: 18, taxAmount: 270.00, discountAmount: 0, totalAmount: 1769.99, status: 'confirmed', dueDate: '2026-11-01', issuedDate: '2026-10-15', paidDate: null },
    { id: 'inv-4', subscriptionId: 'sub-4', customerId: 'cust-3', customerName: 'Wayne Enterprises', items: [{ description: 'BrightLoop Analytics - Advanced (Monthly)', quantity: 1, unitPrice: 129.99, total: 129.99 }], subtotal: 129.99, taxRate: 18, taxAmount: 23.40, discountAmount: 10.00, totalAmount: 143.39, status: 'confirmed', dueDate: '2026-11-05', issuedDate: '2026-10-20', paidDate: null },
    { id: 'inv-5', subscriptionId: 'sub-1', customerId: 'cust-1', customerName: 'Acme Corp', items: [{ description: 'BrightLoop CRM - Professional (Monthly)', quantity: 1, unitPrice: 79.99, total: 79.99 }], subtotal: 79.99, taxRate: 18, taxAmount: 14.40, discountAmount: 0, totalAmount: 94.39, status: 'draft', dueDate: '2026-11-15', issuedDate: '2026-11-01', paidDate: null },
    { id: 'inv-6', subscriptionId: 'sub-4', customerId: 'cust-3', customerName: 'Wayne Enterprises', items: [{ description: 'BrightLoop Analytics - Advanced (Monthly)', quantity: 1, unitPrice: 129.99, total: 129.99 }], subtotal: 129.99, taxRate: 18, taxAmount: 23.40, discountAmount: 0, totalAmount: 153.39, status: 'overdue', dueDate: '2026-10-05', issuedDate: '2026-09-20', paidDate: null },
  ],
  payments: [
    { id: 'pay-1', invoiceId: 'inv-1', customerId: 'cust-1', customerName: 'Acme Corp', amount: 94.39, method: 'bank_transfer', reference: 'TXN-20261010-001', date: '2026-10-10', status: 'completed' },
    { id: 'pay-2', invoiceId: 'inv-2', customerId: 'cust-1', customerName: 'Acme Corp', amount: 94.39, method: 'credit_card', reference: 'TXN-20261018-002', date: '2026-10-18', status: 'completed' },
    { id: 'pay-3', invoiceId: 'inv-3', customerId: 'cust-2', customerName: 'Globex Inc', amount: 500.00, method: 'bank_transfer', reference: 'TXN-20261025-003', date: '2026-10-25', status: 'partial' },
  ],
  discountRules: [
    { id: 'disc-1', name: 'New Customer Welcome', type: 'percentage', value: 10, productId: 'all', minQuantity: 1, usageLimit: 100, usageCount: 12, expiryDate: '2027-03-31', status: 'active', createdAt: '2026-06-01' },
    { id: 'disc-2', name: 'Enterprise Loyalty', type: 'fixed', value: 50, productId: 'prod-1', minQuantity: 1, usageLimit: 50, usageCount: 5, expiryDate: '2027-06-30', status: 'active', createdAt: '2026-07-15' },
    { id: 'disc-3', name: 'Bundle Discount', type: 'percentage', value: 15, productId: 'prod-2', minQuantity: 2, usageLimit: 30, usageCount: 3, expiryDate: '2026-12-31', status: 'active', createdAt: '2026-08-01' },
  ],
  taxRules: [
    { id: 'tax-1', name: 'GST Standard', rate: 18, applicableTo: 'all', status: 'active' },
    { id: 'tax-2', name: 'GST Reduced', rate: 12, applicableTo: 'add-ons', status: 'active' },
  ],
  activityLog: [
    { id: 'log-1', action: 'Subscription Created', entity: 'sub-1', user: 'admin-1', timestamp: '2026-03-28T10:30:00' },
    { id: 'log-2', action: 'Invoice Generated', entity: 'inv-1', user: 'system', timestamp: '2026-10-01T00:00:00' },
    { id: 'log-3', action: 'Payment Received', entity: 'pay-1', user: 'staff-1', timestamp: '2026-10-10T14:20:00' },
    { id: 'log-4', action: 'Discount Rule Created', entity: 'disc-1', user: 'admin-1', timestamp: '2026-06-01T09:15:00' },
    { id: 'log-5', action: 'Subscription Paused', entity: 'sub-5', user: 'admin-1', timestamp: '2026-08-15T11:00:00' },
  ],
});

function dataReducer(state, action) {
  let newState;
  switch (action.type) {
    case 'LOAD_DATA':
      return action.payload;
    case 'ADD_ITEM':
      newState = {
        ...state,
        [action.collection]: [...state[action.collection], { ...action.payload, id: action.payload.id || generateId() }]
      };
      break;
    case 'UPDATE_ITEM':
      newState = {
        ...state,
        [action.collection]: state[action.collection].map(item =>
          item.id === action.payload.id ? { ...item, ...action.payload } : item
        )
      };
      break;
    case 'DELETE_ITEM':
      newState = {
        ...state,
        [action.collection]: state[action.collection].filter(item => item.id !== action.payload)
      };
      break;
    case 'BULK_ADD':
      newState = {
        ...state,
        [action.collection]: [...state[action.collection], ...action.payload.map(item => ({ ...item, id: generateId() }))]
      };
      break;
    default:
      return state;
  }
  localStorage.setItem('brightloop_data', JSON.stringify(newState));
  return newState;
}

export function DataProvider({ children }) {
  const [data, dispatch] = useReducer(dataReducer, null);

  useEffect(() => {
    const saved = localStorage.getItem('brightloop_data');
    if (saved) {
      try {
        dispatch({ type: 'LOAD_DATA', payload: JSON.parse(saved) });
      } catch (error) {
        console.warn('Saved BrightLoop data could not be parsed; restoring demo data.', error);
        const seed = seedData();
        localStorage.setItem('brightloop_data', JSON.stringify(seed));
        dispatch({ type: 'LOAD_DATA', payload: seed });
      }
    } else {
      const seed = seedData();
      localStorage.setItem('brightloop_data', JSON.stringify(seed));
      dispatch({ type: 'LOAD_DATA', payload: seed });
    }
  }, []);

  const addItem = useCallback((collection, item) => {
    dispatch({ type: 'ADD_ITEM', collection, payload: item });
  }, []);

  const updateItem = useCallback((collection, item) => {
    dispatch({ type: 'UPDATE_ITEM', collection, payload: item });
  }, []);

  const deleteItem = useCallback((collection, id) => {
    dispatch({ type: 'DELETE_ITEM', collection, payload: id });
  }, []);

  const bulkAdd = useCallback((collection, items) => {
    dispatch({ type: 'BULK_ADD', collection, payload: items });
  }, []);

  const resetData = useCallback(() => {
    const seed = seedData();
    localStorage.setItem('brightloop_data', JSON.stringify(seed));
    dispatch({ type: 'LOAD_DATA', payload: seed });
  }, []);

  if (!data) return null;

  return (
    <DataContext.Provider value={{ data, addItem, updateItem, deleteItem, bulkAdd, resetData }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
}
