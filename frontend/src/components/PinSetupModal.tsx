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
        }, 2000);
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-md rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-slate-900/80 via-slate-950/90 to-black/90 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_0_40px_-10px_rgba(0,245,255,0.2)]"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'intro' && (
          <div className="space-y-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mx-auto">
              <Key className="w-6 h-6" />
            </div>

            <div className="space-y-3 text-center">
              <h2 className="font-display font-bold text-xl text-white">
                ENABLE FAST PIN LOGIN
              </h2>
              <p className="font-mono text-xs text-slate-400">
                Create a 4-6 digit PIN for faster re-authentication on next visit. No additional login required.
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-400 font-mono">
              <div className="flex items-start gap-2">
                <span className="text-cyan-400 flex-shrink-0">✓</span>
                <span>Skip Google OAuth on return visits</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-400 flex-shrink-0">✓</span>
                <span>Secure PIN stored with bcrypt encryption</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-400 flex-shrink-0">✓</span>
                <span>Optional - you can set it up later</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-3 rounded-xl font-mono text-xs font-medium tracking-wider text-slate-200 border border-white/15 hover:border-cyan-400/60 bg-slate-900/60 hover:bg-slate-800/80 transition-all duration-300"
              >
                SKIP FOR NOW
              </button>
              <button
                onClick={() => setStep('create')}
                className="relative group overflow-hidden px-4 py-3 rounded-xl font-mono text-xs font-bold tracking-wider uppercase bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_20px_rgba(0,245,255,0.3)] hover:shadow-[0_0_30px_rgba(0,245,255,0.5)] transition-all duration-300"
              >
                <span>SET PIN NOW</span>
              </button>
            </div>
          </div>
        )}

        {step === 'create' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                <h3 className="font-mono text-sm text-white font-semibold">
                  CREATE YOUR PIN
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="block font-mono text-xs text-slate-400 tracking-wider">
                  FIRST PIN (4-6 DIGITS)
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••"
                  maxLength={6}
                  className="w-full bg-slate-950/70 border border-white/15 focus:border-cyan-400 rounded-xl px-4 py-3 text-base font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all tracking-[0.35em] text-center"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-xs text-slate-400 tracking-wider">
                  CONFIRM PIN
                </label>
                <input
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••"
                  maxLength={6}
                  className="w-full bg-slate-950/70 border border-white/15 focus:border-cyan-400 rounded-xl px-4 py-3 text-base font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all tracking-[0.35em] text-center"
                />
              </div>
            </div>

            {error && (
              <div className="text-xs font-mono text-rose-400 bg-rose-950/30 border border-rose-500/30 rounded-lg p-3">
                ❌ {error}
              </div>
            )}

            {pin && confirmPin && (
              <div className="text-xs font-mono text-slate-400 text-center p-2 bg-slate-900/50 rounded-lg">
                PIN strength: {pin.length >= 6 ? '🟢 STRONG' : '🟡 MEDIUM'}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-4">
              <button
                onClick={() => {
                  setStep('intro');
                  setPin('');
                  setConfirmPin('');
                  setError('');
                }}
                className="px-4 py-3 rounded-xl font-mono text-xs font-medium tracking-wider text-slate-200 border border-white/15 hover:border-cyan-400/60 bg-slate-900/60 hover:bg-slate-800/80 transition-all duration-300"
              >
                BACK
              </button>
              <button
                onClick={handleSetPin}
                disabled={loading || !pin || !confirmPin}
                className="px-4 py-3 rounded-xl font-mono text-xs font-bold tracking-wider uppercase bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_20px_rgba(0,245,255,0.3)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'ENCRYPTING...' : 'CONFIRM PIN'}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto"
            >
              <CheckCircle2 className="w-8 h-8" />
            </motion.div>

            <div className="space-y-2">
              <h3 className="font-display font-bold text-lg text-white">
                PIN CONFIGURED
              </h3>
              <p className="font-mono text-xs text-slate-400">
                Your PIN is now encrypted and ready. Next time, use PIN login for instant access.
              </p>
            </div>

            <div className="text-xs font-mono text-emerald-400/80 animate-pulse">
              Redirecting to dashboard...
            </div>
          </div>
        )}

        {/* Corner HUD Accents */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-400" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyan-400" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyan-400" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-400" />
      </motion.div>
    </motion.div>
  );
}
