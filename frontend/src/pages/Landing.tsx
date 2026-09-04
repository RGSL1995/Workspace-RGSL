import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Shield,
  Zap,
  TrendingUp,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { CyberBackground } from '../components/ui/CyberBackground';

const PIN_LOGIN_DELAY = 500;

export default function Landing() {
  const { authenticated, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [loginMode, setLoginMode] = useState<'pin' | 'google'>('pin');
  const [pinInput, setPinInput] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (authenticated) {
      navigate('/dashboard');
    }
  }, [authenticated, navigate]);

  const handleGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `${apiUrl}/api/auth/google`;
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput) {
      setPinError('PIN is required');
      return;
    }
    if (!/^\d{4,6}$/.test(pinInput)) {
      setPinError('PIN must be 4-6 digits');
      return;
    }

    setPinLoading(true);
    setPinError('');

    try {
      const response = await fetch(`${apiUrl}/api/auth/verify-pin-only`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput }),
      });

      if (response.ok) {
        await new Promise((resolve) => setTimeout(resolve, PIN_LOGIN_DELAY));
        await checkAuth();
        navigate('/dashboard');
      } else {
        const data = await response.json();
        setPinError(data.error || 'Invalid PIN code');
      }
    } catch (error) {
      console.error('Network error during PIN login:', error);
      setPinError('Network connection error');
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 selection:bg-brand-500/20 overflow-x-hidden font-sans transition-colors duration-250">
      {/* Ambient background */}
      <CyberBackground />

      {/* Modern Top Header */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-600 text-white shadow-md shadow-brand-500/20">
            <Layers size={20} />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              RGSL<span className="text-brand-500">.</span>HUB
            </span>
            <span className="block text-[10px] uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500">
              Operations OS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <ThemeToggle showLabel={false} />
          <a
            href="#features"
            className="hidden sm:inline-block text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition"
          >
            Capabilities
          </a>
          <button
            onClick={() => {
              const el = document.getElementById('login-card');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-sm hover:shadow transition"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Hero Main Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[calc(80vh-80px)]">
          {/* Left Column: Value Proposition */}
          <div className="lg:col-span-7 space-y-7">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-xs font-semibold text-brand-700 dark:text-brand-300 shadow-xs"
            >
              <Sparkles size={14} className="text-brand-500" />
              <span>Next-Gen Enterprise Task & Intelligence Hub</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.12]"
            >
              Unified Operations,{' '}
              <span className="bg-gradient-to-r from-brand-600 via-indigo-500 to-sky-500 bg-clip-text text-transparent">
                Accelerated
              </span>{' '}
              by AI.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed"
            >
              Synchronize enterprise mailboxes, automate task delegation, scrape live IPO market metrics, and receive daily neural briefings in a single secure workstation.
            </motion.p>

            {/* Quick Feature Highlights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2"
            >
              {[
                { icon: Sparkles, text: 'Claude AI Briefings' },
                { icon: Mail, text: 'Shared Mailboxes' },
                { icon: TrendingUp, text: 'Live IPO Scraping' },
                { icon: Shield, text: 'Zero-Trust PIN Auth' },
                { icon: CheckCircle2, text: 'Task Automation' },
                { icon: Zap, text: 'Real-time Telemetry' },
              ].map((f, i) => {
                const Icon = f.icon;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-xs backdrop-blur-sm"
                  >
                    <Icon size={14} className="text-brand-500 flex-shrink-0" />
                    <span>{f.text}</span>
                  </div>
                );
              })}
            </motion.div>
          </div>

          {/* Right Column: High-End Authentication Card */}
          <div className="lg:col-span-5" id="login-card">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
              className="p-7 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-black/40 backdrop-blur-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Access Portal
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Select your authentication method
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200/80 dark:border-brand-800">
                  <Lock size={18} />
                </div>
              </div>

              {/* Login Mode Switcher Pills */}
              <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 mb-6">
                <button
                  type="button"
                  onClick={() => setLoginMode('pin')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    loginMode === 'pin'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Quick PIN Access
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMode('google')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    loginMode === 'google'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Google Workspace
                </button>
              </div>

              {/* Forms */}
              <AnimatePresence mode="wait">
                {loginMode === 'pin' ? (
                  <motion.form
                    key="pin-form"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    onSubmit={handlePinSubmit}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                        Security PIN (4-6 digits)
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        value={pinInput}
                        onChange={(e) => {
                          setPinInput(e.target.value.replace(/\D/g, ''));
                          setPinError('');
                        }}
                        placeholder="••••"
                        className="w-full text-center text-2xl tracking-[0.5em] font-mono py-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                        autoFocus
                      />
                    </div>

                    {pinError && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900"
                      >
                        {pinError}
                      </motion.div>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={pinLoading}
                      className="w-full py-3 px-4 rounded-xl font-semibold text-xs uppercase tracking-wider bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/20 disabled:opacity-50 transition flex items-center justify-center gap-2"
                    >
                      {pinLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Authenticating...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify & Enter</span>
                          <ArrowRight size={14} />
                        </>
                      )}
                    </motion.button>
                  </motion.form>
                ) : (
                  <motion.form
                    key="google-form"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    onSubmit={handleGoogleSubmit}
                    className="space-y-4"
                  >
                    <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
                      Sign in securely via your company Google OAuth single sign-on account.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="w-full py-3 px-4 rounded-xl font-semibold text-xs tracking-wide bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/80 transition flex items-center justify-center gap-3"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Continue with Google Workspace</span>
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>

              <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-800 text-center">
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Protected with TLS 1.3 encryption & Role-Based Access Control
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
