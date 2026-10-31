import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { validatePassword, validateEmail } from '../utils/helpers';
import { Zap, Mail, Lock, Eye, EyeOff, User, Building, CheckCircle2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const { data, addItem } = useData();
  const [tab, setTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ email: '', password: '', name: '', company: '', role: 'customer', confirmPassword: '' });

  const passwordValidation = validatePassword(form.password);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    const user = data.users.find(u => u.email.toLowerCase() === form.email.trim().toLowerCase() && u.password === form.password);
    if (user) {
      login(user);
    } else {
      setError('Invalid email or password. Try admin@brightloop.com / Admin@123');
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError('');
    if (!validateEmail(form.email)) { setError('Please enter a valid email'); return; }
    if (!passwordValidation.isValid) { setError('Password does not meet requirements'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (!form.name.trim()) { setError('Please enter your full name'); return; }
    if (data.users.find(u => u.email.toLowerCase() === form.email.trim().toLowerCase())) { setError('An account with this email already exists'); return; }
    const user = {
      name: form.name.trim(),
      company: form.company.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: 'customer',
      avatar: form.name.trim().slice(0, 2).toUpperCase(),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    addItem('users', user);
    login(user);
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (!validateEmail(form.email)) { setError('Please enter a valid email'); return; }
    setSuccess('Password reset email delivery is not configured in this local demo. Configure Firebase Authentication to send reset links.');
  };

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon">
            <Zap size={28} color="white" />
          </div>
          <h1>BrightLoop</h1>
          <p>Subscription Management Platform</p>
        </div>

        {error && (
          <div className="toast error" role="alert" style={{ marginBottom: 16, minWidth: 'auto', animation: 'none' }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        {success && (
          <div className="toast success" role="status" style={{ marginBottom: 16, minWidth: 'auto', animation: 'none' }}>
            <CheckCircle2 size={16} />
            {success}
          </div>
        )}

        {tab !== 'forgot' && (
          <div className="login-tabs">
            <button className={`login-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError(''); setSuccess(''); }}>Sign In</button>
            <button className={`login-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setError(''); setSuccess(''); }}>Create Account</button>
          </div>
        )}

        {tab === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email Address</label>
              <div className="form-input-icon">
                <Mail size={16} className="icon-left" />
                <input id="login-email" type="email" className="form-input" placeholder="you@company.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <div className="form-input-icon">
                <Lock size={16} className="icon-left" />
                <input id="login-password" type={showPassword ? 'text' : 'password'} className="form-input" placeholder="Enter your password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                <button type="button" className="icon-right" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setTab('forgot'); setError(''); setSuccess(''); }}>Forgot Password?</button>
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg">Sign In</button>
            <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              <strong style={{ color: 'var(--text-secondary)' }}>Demo Accounts:</strong><br />
              Admin: admin@brightloop.com / Admin@123<br />
              Staff: staff@brightloop.com / Staff@123<br />
              Customer: customer@acme.com / Cust@123
            </div>
          </form>
        )}

        {tab === 'register' && (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label" htmlFor="register-name">Full Name</label>
              <div className="form-input-icon">
                <User size={16} className="icon-left" />
                <input id="register-name" type="text" className="form-input" placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="register-company">Company (Optional)</label>
              <div className="form-input-icon">
                <Building size={16} className="icon-left" />
                <input id="register-company" type="text" className="form-input" placeholder="Your Company Inc." value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="register-email">Email Address</label>
              <div className="form-input-icon">
                <Mail size={16} className="icon-left" />
                <input id="register-email" type="email" className="form-input" placeholder="you@company.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="register-password">Password</label>
              <div className="form-input-icon">
                <Lock size={16} className="icon-left" />
                <input id="register-password" type={showPassword ? 'text' : 'password'} className="form-input" placeholder="Create a strong password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                <button type="button" className="icon-right" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="password-checks">
                <span className={`password-check ${passwordValidation.checks.minLength ? 'valid' : ''}`}>
                  {passwordValidation.checks.minLength ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />} 9+ characters
                </span>
                <span className={`password-check ${passwordValidation.checks.hasUppercase ? 'valid' : ''}`}>
                  {passwordValidation.checks.hasUppercase ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />} Uppercase
                </span>
                <span className={`password-check ${passwordValidation.checks.hasLowercase ? 'valid' : ''}`}>
                  {passwordValidation.checks.hasLowercase ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />} Lowercase
                </span>
                <span className={`password-check ${passwordValidation.checks.hasSpecial ? 'valid' : ''}`}>
                  {passwordValidation.checks.hasSpecial ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />} Special char
                </span>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="register-confirm-password">Confirm Password</label>
              <div className="form-input-icon">
                <Lock size={16} className="icon-left" />
                <input id="register-confirm-password" type="password" className="form-input" placeholder="Confirm your password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={!passwordValidation.isValid}>Create Account</button>
          </form>
        )}

        {tab === 'forgot' && (
          <form onSubmit={handleForgotPassword}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 8 }}>Reset Password</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 20 }}>Enter your email to receive a password reset link.</p>
            <div className="form-group">
              <div className="form-input-icon">
                <Mail size={16} className="icon-left" />
                <input id="reset-email" type="email" className="form-input" aria-label="Email Address" placeholder="you@company.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" style={{ marginBottom: 12 }}>Send Reset Link</button>
            <button type="button" className="btn btn-ghost btn-block" onClick={() => { setTab('login'); setError(''); setSuccess(''); }}>Back to Sign In</button>
          </form>
        )}
      </div>
    </div>
  );
}
