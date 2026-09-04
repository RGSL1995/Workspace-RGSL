import { useState } from 'react';
import { Plus, Loader } from 'lucide-react';
import { motion } from 'motion/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ConnectSharedEmail() {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('RGSL');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleConnect = () => {
    setError('');
    setSuccess('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    setConnecting(true);

    const params = new URLSearchParams({
      email,
      company,
    });

    window.location.href = `${API_URL}/api/auth/google/shared-mailbox?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      {/* Connect Button */}
      {!showForm && (
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setShowForm(true)}
          className="w-full px-4 py-3 rounded-2xl border border-dashed border-brand-300 dark:border-brand-700/60 bg-brand-50/50 dark:bg-brand-950/20 hover:bg-brand-50 dark:hover:bg-brand-950/40 text-brand-700 dark:text-brand-300 transition-all flex items-center justify-center gap-2 text-xs font-semibold"
        >
          <Plus size={16} />
          <span>Connect Shared Mailbox via Google OAuth</span>
        </motion.button>
      )}

      {/* Connection Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-4"
        >
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Shared Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. operations@rgslgroup.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Company Entity
            </label>
            <select
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-xs"
            >
              <option value="RGSL">RGSL</option>
              <option value="LRSD">LRSD</option>
            </select>
          </div>

          {error && (
            <div className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          {success && (
            <div className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs">
              {success}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                setShowForm(false);
                setError('');
              }}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-white text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/80 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
            >
              {connecting ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <span>Authorize with Google</span>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
