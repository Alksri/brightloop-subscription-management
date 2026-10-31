export function validatePassword(password) {
  const checks = {
    minLength: password.length > 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
  const isValid = checks.minLength && checks.hasUppercase && checks.hasLowercase && checks.hasSpecial;
  return { isValid, checks };
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount || 0);
}

export function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getInvoiceBalance(invoice, payments = []) {
  if (!invoice || ['paid', 'cancelled'].includes(invoice.status)) return 0;
  const received = payments
    .filter(payment => payment.invoiceId === invoice.id && ['completed', 'partial'].includes(payment.status))
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  return Math.max(0, Number(invoice.totalAmount || 0) - received);
}

export function isPlanAvailable(plan, date = new Date().toISOString().slice(0, 10)) {
  return Boolean(plan && plan.status === 'active' &&
    (!plan.startDate || plan.startDate <= date) &&
    (!plan.endDate || plan.endDate >= date));
}

export function addBillingInterval(date, frequency) {
  const next = new Date(`${date}T12:00:00`);
  if (Number.isNaN(next.getTime())) return '';
  if (frequency === 'daily') next.setDate(next.getDate() + 1);
  else if (frequency === 'weekly') next.setDate(next.getDate() + 7);
  else if (frequency === 'yearly') next.setFullYear(next.getFullYear() + 1);
  else {
    const day = next.getDate();
    next.setDate(1);
    next.setMonth(next.getMonth() + 1);
    const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(day, lastDay));
  }
  return next.toISOString().slice(0, 10);
}

export function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusColor(status) {
  const colors = {
    active: 'status-active',
    draft: 'status-draft',
    quotation: 'status-quotation',
    confirmed: 'status-confirmed',
    paid: 'status-paid',
    paused: 'status-paused',
    closed: 'status-closed',
    overdue: 'status-overdue',
    cancelled: 'status-closed',
    completed: 'status-paid',
    partial: 'status-quotation',
    pending: 'status-draft',
  };
  return colors[status] || 'status-draft';
}

export function calculateDaysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const today = new Date();
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  return diff;
}

export function generateInvoiceNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const r = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `INV-${y}${m}-${r}`;
}

export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
