import React, { useState } from 'react';
import { User } from '../types';
import { authApi } from '../api';
import { CHURCH_NAME, CHURCH_SHORT_NAME } from '../churchBrand';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

const HERO_IMAGE = 'https://images.unsplash.com/photo-1438234569572-585af5966df2?w=1920&auto=format&fit=crop&q=80';

export default function LoginView({ onLogin }: LoginViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setIsLoading(true);
    setError('');
    try {
      const response = await authApi.login(email, password);
      onLogin(response.user);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) { setError('Please fill in all required fields'); return; }
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await authApi.register({
        first_name: firstName, last_name: lastName, email, password, phone, address, date_of_birth: dateOfBirth,
      });
      setSuccess(response.message || 'Registration successful! Login with your email.');
      setIsLogin(true);
      setEmail(email);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await authApi.forgotPassword(email);
      setSuccess(response.message || 'Check your email for reset instructions.');
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Reset failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 focus:bg-white transition-all";

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={HERO_IMAGE} alt={CHURCH_NAME} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-amber-950/40" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-amber-300 mb-4">
              Assemblies of God
            </p>
            <h1 className="font-display text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
              {CHURCH_NAME}
            </h1>
            <p className="text-slate-300 text-lg mt-6 max-w-md leading-relaxed font-light">
              Grace and peace be multiplied. The complete command center for members, giving, worship, check-in, and church life.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: 'bi-people-fill', label: 'Members' },
              { icon: 'bi-qr-code-scan', label: 'QR Check-In' },
              { icon: 'bi-heart-pulse', label: 'Prayer Wall' },
            ].map(f => (
              <div key={f.label} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 text-center">
                <i className={`bi ${f.icon} text-2xl text-amber-400 mb-2 block`}></i>
                <span className="text-xs text-slate-300 font-semibold">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-white mesh-bg">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center lg:text-left">
            <div className="inline-flex lg:hidden items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30 mb-4">
              <i className="bi bi-building text-slate-950 text-xl"></i>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-600 mb-2 lg:hidden">{CHURCH_SHORT_NAME}</p>
            <h2 className="font-display text-2xl font-bold text-slate-900">
              {showForgotPassword ? 'Reset Password' : isLogin ? 'Welcome back' : 'Join the family'}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {showForgotPassword ? 'We\'ll send you reset instructions' : isLogin ? `Sign in to ${CHURCH_NAME}` : 'Create your member account'}
            </p>
          </div>

          {showForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="relative">
                <i className="bi bi-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" className={inputClass} required />
              </div>
              {error && <div className="text-sm text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100">{error}</div>}
              {success && <div className="text-sm text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-100">{success}</div>}
              <button type="submit" disabled={isLoading} className="btn-primary w-full py-3.5">{isLoading ? 'Sending...' : 'Send Reset Link'}</button>
              <button type="button" onClick={() => setShowForgotPassword(false)} className="w-full text-sm text-slate-500 hover:text-slate-800">← Back to login</button>
            </form>
          ) : isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <i className="bi bi-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" className={inputClass} required />
              </div>
              <div className="relative">
                <i className="bi bi-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className={inputClass} required />
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={() => setShowForgotPassword(true)} className="text-xs text-amber-600 font-semibold hover:underline">Forgot password?</button>
              </div>
              {error && <div className="text-sm text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100">{error}</div>}
              {success && <div className="text-sm text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-100">{success}</div>}
              <button type="submit" disabled={isLoading} className="btn-primary w-full py-3.5 text-base">
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
              <p className="text-center text-sm text-slate-500">
                New here?{' '}
                <button type="button" onClick={() => { setIsLogin(false); setError(''); }} className="text-amber-600 font-semibold hover:underline">Create account</button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" className={inputClass.replace('pl-11', 'pl-4')} required />
                <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" className={inputClass.replace('pl-11', 'pl-4')} required />
              </div>
              <div className="relative">
                <i className="bi bi-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className={inputClass} required />
              </div>
              <div className="relative">
                <i className="bi bi-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className={inputClass} />
              </div>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" className={inputClass.replace('pl-11', 'pl-4')} />
              <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Address" className={inputClass.replace('pl-11', 'pl-4')} />
              <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className={inputClass.replace('pl-11', 'pl-4')} />
              {error && <div className="text-sm text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100">{error}</div>}
              {success && <div className="text-sm text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-100">{success}</div>}
              <button type="submit" disabled={isLoading} className="btn-primary w-full py-3.5">{isLoading ? 'Creating...' : 'Create Account'}</button>
              <p className="text-center text-sm text-slate-500">
                Already have an account?{' '}
                <button type="button" onClick={() => { setIsLogin(true); setError(''); }} className="text-amber-600 font-semibold hover:underline">Sign in</button>
              </p>
            </form>
          )}

          <p className="text-center text-[10px] text-slate-400">© {new Date().getFullYear()} {CHURCH_NAME} Management System</p>
        </div>
      </div>
    </div>
  );
}
