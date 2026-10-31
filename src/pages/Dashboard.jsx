import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { formatCurrency, formatDate, getInvoiceBalance, getStatusColor } from '../utils/helpers';
import { getAIInsights } from '../config/gemini';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, DollarSign, Users, FileText, AlertTriangle, Activity, RefreshCw, Sparkles, CreditCard, ArrowUpRight, Package, Receipt } from 'lucide-react';

const CHART_COLORS = ['#8870FF', '#A4CCF7', '#5200C7', '#B9B0D0', '#fff'];

export default function Dashboard() {
  const { data } = useData();
  const [insights, setInsights] = useState([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState('');
  const [timeRange, setTimeRange] = useState('all');

  const stats = useMemo(() => {
    const activeSubs = data.subscriptions.filter(s => s.status === 'active');
    const rangeDays = { '7d': 7, '30d': 30, '90d': 90 }[timeRange];
    const cutoff = rangeDays ? new Date(Date.now() - rangeDays * 86400000) : null;
    const isInRange = date => !cutoff || (date && new Date(date) >= cutoff);
    const recentPayments = data.payments.filter(payment => isInRange(payment.date));
    const totalRevenue = recentPayments
      .filter(payment => ['completed', 'partial'].includes(payment.status))
      .reduce((sum, payment) => sum + payment.amount, 0);
    const pendingPayments = data.payments.filter(p => p.status === 'partial').reduce((sum, p) => sum + p.amount, 0);
    const periodInvoices = data.invoices.filter(invoice => isInRange(invoice.issuedDate) && invoice.status !== 'cancelled');
    const totalInvoiced = periodInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const paidInvoices = periodInvoices.filter(invoice => invoice.status === 'paid').reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const overdueInvoices = data.invoices.filter(i => i.status === 'overdue');
    const overdueAmount = overdueInvoices.reduce((sum, invoice) => sum + getInvoiceBalance(invoice, data.payments), 0);
    const mrr = activeSubs.reduce((sum, subscription) => {
      const monthlyFactor = { daily: 365 / 12, weekly: 52 / 12, monthly: 1, yearly: 1 / 12 }[subscription.billingFrequency] || 0;
      return sum + subscription.price * monthlyFactor;
    }, 0);
    const arr = mrr * 12;
    const outstandingAmount = data.invoices.reduce((sum, invoice) => sum + getInvoiceBalance(invoice, data.payments), 0);
    const customers = data.users.filter(u => u.role === 'customer');

    return { activeSubs: activeSubs.length, totalRevenue, pendingPayments, totalInvoiced, paidInvoices, overdueCount: overdueInvoices.length, overdueAmount, mrr, arr, outstandingAmount, customerCount: customers.length };
  }, [data, timeRange]);

  const revenueByMonth = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const rangeDays = { '7d': 7, '30d': 30, '90d': 90 }[timeRange];
    const cutoff = rangeDays ? new Date(Date.now() - rangeDays * 86400000) : null;
    return months.map((month, i) => {
      const monthPayments = data.payments.filter(p => {
        const d = new Date(p.date);
        return d.getMonth() === i && (!cutoff || d >= cutoff) && ['completed', 'partial'].includes(p.status);
      });
      const monthInvoices = data.invoices.filter(invoice => {
        const date = new Date(invoice.issuedDate);
        return date.getMonth() === i && (!cutoff || date >= cutoff) && invoice.status !== 'cancelled';
      });
      return {
        month,
        revenue: monthPayments.reduce((sum, payment) => sum + payment.amount, 0),
        invoiced: monthInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0),
      };
    });
  }, [data, timeRange]);

  const subsByStatus = useMemo(() => {
    const statusMap = {};
    data.subscriptions.forEach(s => {
      statusMap[s.status] = (statusMap[s.status] || 0) + 1;
    });
    return Object.entries(statusMap).map(([name, value]) => ({ name, value }));
  }, [data]);

  const revenueByProduct = useMemo(() => {
    const prodMap = {};
    data.subscriptions.forEach(s => {
      prodMap[s.productName] = (prodMap[s.productName] || 0) + s.price;
    });
    return Object.entries(prodMap).map(([name, value]) => ({ name: name.replace('BrightLoop ', ''), value: Math.round(value * 100) / 100 }));
  }, [data]);

  const invoiceStatusData = useMemo(() => {
    const statusMap = {};
    data.invoices.forEach(inv => {
      statusMap[inv.status] = (statusMap[inv.status] || 0) + 1;
    });
    return Object.entries(statusMap).map(([name, value]) => ({ name, value }));
  }, [data]);

  const loadInsights = async () => {
    setLoadingInsights(true);
    setInsightsError('');
    const insightData = {
      activeSubscriptions: stats.activeSubs,
      mrr: stats.mrr,
      arr: stats.arr,
      totalRevenue: stats.totalRevenue,
      outstandingAmount: stats.outstandingAmount,
      overdueInvoices: stats.overdueCount,
      customerCount: stats.customerCount,
      revenueByProduct,
      subscriptionsByStatus: subsByStatus,
    };
    try {
      const result = await getAIInsights(insightData);
      setInsights(result);
    } catch (error) {
      setInsightsError(error.message || 'Gemini insights could not be loaded.');
    } finally {
      setLoadingInsights(false);
    }
  };

  const customTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '0.8125rem' }}>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
          {payload.map((entry, i) => (
            <p key={i} style={{ color: entry.color }}>{entry.name}: {formatCurrency(entry.value)}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="page-content dashboard-page">
      <section className="ai-insights dashboard-insights" id="ai-insights" aria-labelledby="dashboard-insights-title">
        <div className="dashboard-insights-mark" aria-hidden="true"><Sparkles size={28} /></div>
        <div className="dashboard-insights-copy">
          <div className="ai-insights-header">
            <h3 id="dashboard-insights-title">AI-Powered Insights</h3>
            <span className="ai-badge"><Sparkles size={10} /> Gemini</span>
          </div>
        {loadingInsights ? (
          <p className="dashboard-insights-message" role="status">Analyzing your current billing data…</p>
        ) : insightsError ? (
          <p className="dashboard-insights-message dashboard-insights-error" role="alert">{insightsError}</p>
        ) : insights.length > 0 ? (
          <div className="ai-insights-grid">
            {insights.map((insight, i) => (
              <div key={i} className="ai-insight-card">
                <h4>{insight.title}</h4>
                <p>{insight.insight}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="dashboard-insights-message">No insights available yet. Select Refresh to analyze current billing data.</p>
        )}
        </div>
        <button className="btn dashboard-refresh" onClick={loadInsights} disabled={loadingInsights}>
          <RefreshCw size={15} className={loadingInsights ? 'pulse' : ''} />
          {loadingInsights ? 'Analyzing…' : 'Refresh'}
        </button>
      </section>

      <div className="stats-grid dashboard-stats">
        <div className="stat-card info">
          <div className="stat-header"><span className="stat-label">Total Revenue</span><div className="stat-icon info"><CreditCard size={20} /></div></div>
          <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
          <div className="stat-change positive"><ArrowUpRight size={14} /> {formatCurrency(stats.mrr)} monthly recurring</div>
        </div>
        <div className="stat-card primary">
          <div className="stat-header"><span className="stat-label">Active Subscriptions</span><div className="stat-icon primary"><Activity size={20} /></div></div>
          <div className="stat-value">{stats.activeSubs.toLocaleString()}</div>
          <div className="stat-change positive"><ArrowUpRight size={14} /> Currently active</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-header"><span className="stat-label">Total Customers</span><div className="stat-icon accent"><Users size={20} /></div></div>
          <div className="stat-value">{stats.customerCount.toLocaleString()}</div>
          <div className="stat-change">Across every account</div>
        </div>
        <div className="stat-card primary">
          <div className="stat-header"><span className="stat-label">Pending Invoices</span><div className="stat-icon primary"><FileText size={20} /></div></div>
          <div className="stat-value">{data.invoices.filter(invoice => ['draft', 'confirmed', 'overdue'].includes(invoice.status)).length.toLocaleString()}</div>
          <div className="stat-change negative">{stats.overdueCount} overdue · {formatCurrency(stats.outstandingAmount)} outstanding</div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid dashboard-charts">
        <div className="chart-card revenue-chart">
          <div className="dashboard-chart-header">
            <h3><TrendingUp size={17} /> Revenue Trend</h3>
            <div className="dashboard-periods" aria-label="Revenue time range">
              {['7d', '30d', '90d', 'all'].map(range => (
                <button key={range} className={timeRange === range ? 'active' : ''} aria-pressed={timeRange === range} onClick={() => setTimeRange(range)}>
                  {range === 'all' ? 'All' : range}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={revenueByMonth}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8870FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8870FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(136,112,255,0.12)" />
              <XAxis dataKey="month" tick={{ fill: '#B9B0D0', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#B9B0D0', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={customTooltip} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#8870FF" fill="url(#revenueGrad)" strokeWidth={2.5} />
              <Area type="monotone" dataKey="invoiced" name="Invoiced" stroke="#A4CCF7" fill="none" strokeWidth={2} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card product-chart">
          <h3><Package size={17} /> Revenue by Product</h3>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={revenueByProduct}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(136,112,255,0.12)" />
              <XAxis dataKey="name" tick={{ fill: '#B9B0D0', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#B9B0D0', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={customTooltip} />
              <Bar dataKey="value" name="Revenue" radius={[6, 6, 0, 0]}>
                {revenueByProduct.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card subscription-status-chart">
          <h3><Activity size={17} /> Subscriptions by Status</h3>
          <div className="dashboard-donut-layout">
            <ResponsiveContainer width="58%" height={190}>
              <PieChart>
                <Pie data={subsByStatus} cx="50%" cy="50%" innerRadius={54} outerRadius={77} paddingAngle={4} dataKey="value" label={false}>
                  {subsByStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <text x="50%" y="48%" textAnchor="middle" fill="#FFFFFF" fontSize="16" fontWeight="700">{stats.activeSubs.toLocaleString()}</text>
                <text x="50%" y="59%" textAnchor="middle" fill="#B9B0D0" fontSize="10">Active</text>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="dashboard-chart-legend">
              {subsByStatus.map((entry, i) => (
                <div className="dashboard-legend-item" key={entry.name}>
                  <span className="dashboard-legend-swatch" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span>{entry.name} <small>({entry.value})</small></span>
                  <strong>{data.subscriptions.length ? `${Math.round(entry.value / data.subscriptions.length * 100)}%` : '0%'}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="chart-card invoice-status-chart">
          <h3><Receipt size={17} /> Invoice Status Breakdown</h3>
          <div className="dashboard-donut-layout">
            <ResponsiveContainer width="42%" height={136}>
              <PieChart>
                <Pie data={invoiceStatusData} cx="50%" cy="50%" innerRadius={46} outerRadius={68} paddingAngle={4} dataKey="value" label={false}>
                  {invoiceStatusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <text x="50%" y="48%" textAnchor="middle" fill="#FFFFFF" fontSize="15" fontWeight="700">{data.invoices.length.toLocaleString()}</text>
                <text x="50%" y="60%" textAnchor="middle" fill="#B9B0D0" fontSize="10">Total</text>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="dashboard-chart-legend">
              {invoiceStatusData.map((entry, i) => (
                <div className="dashboard-legend-item" key={entry.name}>
                  <span className="dashboard-legend-swatch" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span>{entry.name} <small>({entry.value})</small></span>
                  <strong>{data.invoices.length ? `${Math.round(entry.value / data.invoices.length * 100)}%` : '0%'}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        <section className="chart-card dashboard-promo">
          <div className="dashboard-promo-art" aria-hidden="true"><Receipt size={76} /><Sparkles size={25} /></div>
          <div className="dashboard-promo-copy">
            <p className="dashboard-promo-eyebrow">BrightLoop intelligence</p>
            <h3>Keep growing with BrightLoop</h3>
            <p>Smarter subscription insights. Better billing decisions.</p>
            <button className="btn dashboard-promo-action" onClick={() => document.getElementById('ai-insights')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
              Explore insights <ArrowUpRight size={15} />
            </button>
          </div>
        </section>
      </div>

      {/* Recent Activity & Overdue */}
      <div className="dashboard-activity-grid">
        <div className="card">
          <div className="card-header">
            <h3>Recent Activity</h3>
          </div>
          <div className="card-body">
            <div className="activity-timeline">
              {data.activityLog.slice(-5).reverse().map(log => (
                <div key={log.id} className="activity-item">
                  <div className="activity-dot">
                    <Activity size={14} color="var(--primary-400)" />
                  </div>
                  <div className="activity-content">
                    <p><strong>{log.action}</strong></p>
                    <span className="activity-time">{formatDate(log.timestamp)} • {log.user}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Recent transactions</h3>
            <CreditCard size={16} className="text-muted" />
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Customer</th><th>Method</th><th>Amount</th><th>Date</th></tr></thead>
              <tbody>{[...data.payments].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5).map(payment => (
                <tr key={payment.id}>
                  <td className="td-primary">{payment.customerName}</td>
                  <td>{payment.method?.replace('_', ' ') || '—'}</td>
                  <td className="font-semibold">{formatCurrency(payment.amount)}</td>
                  <td>{formatDate(payment.date)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {data.payments.length === 0 && <div className="empty-state"><p>No payments recorded yet.</p></div>}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Overdue Invoices</h3>
            <span className="nav-badge">{data.invoices.filter(i => i.status === 'overdue').length}</span>
          </div>
          <div className="card-body">
            {data.invoices.filter(i => i.status === 'overdue').length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 16px' }}>
                <p>No overdue invoices 🎉</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.invoices.filter(i => i.status === 'overdue').map(inv => (
                      <tr key={inv.id}>
                        <td className="td-primary td-mono">{inv.id.toUpperCase()}</td>
                        <td>{inv.customerName}</td>
                        <td className="text-danger font-semibold">{formatCurrency(inv.totalAmount)}</td>
                        <td>{formatDate(inv.dueDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
