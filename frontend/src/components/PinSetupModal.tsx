import { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Key, X, CheckCircle2 } from 'lucide-react';

interface PinSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PinSetupModal({ isOpen, onClose, onSuccess }: PinSetupModalProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'intro' | 'create' | 'success'>('intro');

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleSetPin = async () => {
    if (!pin || !confirmPin) {
      setError('Both PIN fields are required');
      return;
    }
    if (!/^\d{4,6}$/.test(pin)) {
      setError('PIN must be 4-6 digits');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/api/auth/set-pin`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (response.ok) {
        setStep('success');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1800);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to set PIN');
      }
    } catch (error) {
      setError('Network error while setting PIN');
      console.error('PIN setup error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-7 sm:p-8 backdrop-blur-2xl shadow-2xl"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1 rounded-xl"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'intro' && (
          <div className="space-y-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 mx-auto shadow-xs">
              <Key className="w-6 h-6" />
            </div>

            <div className="space-y-2 text-center">
              <h2 className="font-bold text-xl text-slate-900 dark:text-white">
                Set Up Fast PIN Access
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Create a 4-6 digit PIN for instant, secure sign-in on your return visits.
              </p>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
              <div className="flex items-start gap-2">
                <span className="text-brand-600 dark:text-brand-400 font-bold">✓</span>
                <span>Fast single-step login without Google OAuth</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-brand-600 dark:text-brand-400 font-bold">✓</span>
                <span>Bcrypt hashing with salted enterprise security</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-brand-600 dark:text-brand-400 font-bold">✓</span>
                <span>Optional - configure anytime from preferences</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition"
              >
                Skip For Now
              </button>
              <button
                onClick={() => setStep('create')}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/20 transition"
              >
                Set PIN Now
              </button>
            </div>
          </div>
        )}

        {step === 'create' && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Create Your Security PIN
              </h3>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Enter PIN (4-6 digits)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••"
                  maxLength={6}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:border-brand-500 rounded-xl px-4 py-3 text-xl font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition tracking-[0.4em] text-center"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Confirm PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••"
                  maxLength={6}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:border-brand-500 rounded-xl px-4 py-3 text-xl font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition tracking-[0.4em] text-center"
                />
              </div>
            </div>

            {error && (
              <div className="text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl p-3">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  setStep('intro');
                  setPin('');
                  setConfirmPin('');
                  setError('');
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-white border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition"
              >
                Back
              </button>
              <button
                onClick={handleSetPin}
                disabled={loading || !pin || !confirmPin}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white shadow-md shadow-brand-500/20 transition"
              >
                {loading ? 'Securing...' : 'Save PIN'}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-5 text-center py-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 mx-auto"
            >
              <CheckCircle2 className="w-7 h-7" />
            </motion.div>

            <div className="space-y-1">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                PIN Configured
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your security PIN is ready for quick future sign-ins.
              </p>
            </div>

            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-pulse">
              Entering dashboard...
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
