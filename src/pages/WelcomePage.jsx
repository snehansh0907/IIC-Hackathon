import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DuesOSLogo } from '../components/common/DuesOSLogo';

export function WelcomePage() {
  const { enterDemoMode, login, signup } = useAuth();
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'signup'

  // Sign In Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // Sign Up Form State
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState(null);

  // Demo loading state
  const [demoLoading, setDemoLoading] = useState(false);

  const handleDemoClick = async () => {
    setDemoLoading(true);
    try {
      await enterDemoMode();
    } catch (err) {
      console.error(err);
      setDemoLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError(null);
    if (!loginEmail || !loginPassword) {
      setLoginError('Please enter both email and password.');
      return;
    }

    setLoginLoading(true);
    const result = await login({ email: loginEmail, password: loginPassword });
    if (!result.success) {
      setLoginError(result.error || 'Failed to sign in. Please verify your credentials.');
      setLoginLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setSignupError(null);

    if (!fullName.trim()) {
      setSignupError('Full name is required.');
      return;
    }
    if (!signupEmail.trim()) {
      setSignupError('Email address is required.');
      return;
    }
    if (signupPassword.length < 6) {
      setSignupError('Password must be at least 6 characters.');
      return;
    }
    if (signupPassword !== confirmPassword) {
      setSignupError('Passwords do not match.');
      return;
    }
    if (!businessName.trim()) {
      setSignupError('Business/Company name is required.');
      return;
    }

    setSignupLoading(true);
    const result = await signup({
      name: fullName,
      email: signupEmail,
      password: signupPassword,
      businessName,
    });

    if (!result.success) {
      setSignupError(result.error || 'Failed to create account.');
      setSignupLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F4] text-[#1B1C19] flex flex-col justify-between font-sans">
      {/* Top Brand Bar */}
      <header className="bg-[#151D1C] border-b border-[#2C2D29] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DuesOSLogo className="w-8 h-8" />
            <div>
              <span className="font-bold text-base tracking-tight text-white block leading-tight">DuesOS</span>
              <span className="text-[10px] text-gray-400 font-mono">Financial Intelligence for MSMEs</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-300 font-mono">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Operational & Ready</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto w-full px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="text-center mb-10">
          <span className="inline-block px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300/60 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            Welcome to DuesOS
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#151D1C] tracking-tight mb-2">
            Predict Cash Flow & Eliminate Overdue Receivables
          </h1>
          <p className="text-sm text-gray-600 max-w-xl mx-auto">
            Choose an option below to explore preloaded demonstration records or set up your own isolated business workspace.
          </p>
        </div>

        {/* 2-Column Split: Demo Workspace vs Real Account */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          
          {/* Card 1: Demo Account */}
          <div className="bg-white border-2 border-brand-gold/80 rounded-lg p-8 shadow-sm flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 bg-brand-gold text-[#151D1C] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl">
              Instant Exploration
            </div>

            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <span className="material-symbols-outlined text-2xl">preview</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#151D1C]">Demo Account</h2>
                  <span className="text-xs font-mono text-gray-500">Sharma Engineering Pvt. Ltd.</span>
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed mb-6">
                Explore DuesOS with a preloaded financial workspace. Inspect customer credit scoring, cash runway forecasting, and test live email reminders.
              </p>

              <div className="space-y-2.5 mb-8 text-xs font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                  <span>Preloaded with 38 Invoices & 13 Customers</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                  <span>Live Cash Runway & 45-Day Deficit Radar</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                  <span>Real Resend Email Reminders Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                  <span>No login or credentials required</span>
                </div>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={handleDemoClick}
                disabled={demoLoading}
                className="w-full py-3.5 px-4 bg-[#151D1C] hover:bg-[#253231] text-white font-bold text-sm rounded shadow flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {demoLoading ? (
                  <span className="material-symbols-outlined text-base animate-spin text-brand-gold">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-base text-brand-gold">rocket_launch</span>
                )}
                <span>Continue with Demo Account</span>
              </button>
              <span className="block text-center text-[11px] text-gray-400 mt-2 font-mono">
                Instant access • Zero setup required
              </span>
            </div>
          </div>

          {/* Card 2: Your Account (Sign In / Sign Up) */}
          <div className="bg-white border border-[#E0DED7] rounded-lg p-8 shadow-sm flex flex-col justify-between">
            <div>
              {/* Header Tabs */}
              <div className="flex border-b border-[#E0DED7] mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setLoginError(null);
                    setSignupError(null);
                  }}
                  className={`flex-1 pb-3 text-xs font-bold transition-colors ${
                    authMode === 'signin'
                      ? 'text-[#151D1C] border-b-2 border-[#151D1C]'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setLoginError(null);
                    setSignupError(null);
                  }}
                  className={`flex-1 pb-3 text-xs font-bold transition-colors ${
                    authMode === 'signup'
                      ? 'text-[#151D1C] border-b-2 border-[#151D1C]'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Sign In Form */}
              {authMode === 'signin' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {loginError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">error</span>
                      <span>{loginError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="user@example.com"
                      required
                      className="w-full px-3 py-2 border border-[#E0DED7] rounded text-xs focus:outline-none focus:border-brand-gold bg-[#FBF9F4]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-3 py-2 border border-[#E0DED7] rounded text-xs focus:outline-none focus:border-brand-gold bg-[#FBF9F4]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3 px-4 bg-[#151D1C] hover:bg-[#253231] text-white font-bold text-xs rounded flex items-center justify-center gap-2 transition-all mt-6 disabled:opacity-50"
                  >
                    {loginLoading ? (
                      <span className="material-symbols-outlined text-sm animate-spin text-brand-gold">progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined text-sm text-brand-gold">login</span>
                    )}
                    <span>{loginLoading ? 'Signing In...' : 'Sign In to Workspace'}</span>
                  </button>
                </form>
              )}

              {/* Create Account Form */}
              {authMode === 'signup' && (
                <form onSubmit={handleSignupSubmit} className="space-y-3.5">
                  {signupError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">error</span>
                      <span>{signupError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Snehansh Tripathy"
                        required
                        className="w-full px-3 py-2 border border-[#E0DED7] rounded text-xs focus:outline-none focus:border-brand-gold bg-[#FBF9F4]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Business / Company
                      </label>
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="ABC Engineering"
                        required
                        className="w-full px-3 py-2 border border-[#E0DED7] rounded text-xs focus:outline-none focus:border-brand-gold bg-[#FBF9F4]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="user@example.com"
                      required
                      className="w-full px-3 py-2 border border-[#E0DED7] rounded text-xs focus:outline-none focus:border-brand-gold bg-[#FBF9F4]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full px-3 py-2 border border-[#E0DED7] rounded text-xs focus:outline-none focus:border-brand-gold bg-[#FBF9F4]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full px-3 py-2 border border-[#E0DED7] rounded text-xs focus:outline-none focus:border-brand-gold bg-[#FBF9F4]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={signupLoading}
                    className="w-full py-3 px-4 bg-[#151D1C] hover:bg-[#253231] text-white font-bold text-xs rounded flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-50"
                  >
                    {signupLoading ? (
                      <span className="material-symbols-outlined text-sm animate-spin text-brand-gold">progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined text-sm text-brand-gold">person_add</span>
                    )}
                    <span>{signupLoading ? 'Creating Workspace...' : 'Create Account & Workspace'}</span>
                  </button>
                </form>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#E0DED7] text-center">
              <span className="text-[11px] text-gray-500">
                Data is isolated to your private tenant workspace.
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-gray-500 border-t border-[#E0DED7] font-mono">
        DuesOS • Financial Operating System for Indian MSMEs
      </footer>
    </div>
  );
}

export default WelcomePage;
