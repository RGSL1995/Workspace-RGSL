import { useState, useEffect } from 'react';
import {
  Bell,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Search,
  Calendar,
  DollarSign,
  TrendingUp,
  Tag,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { GlowCard } from '../../components/ui/GlowCard';

interface IPO {
  _id: string;
  company_name: string;
  listing_date: string;
  price_band_min?: number;
  price_band_max?: number;
  status: 'upcoming' | 'open' | 'closed' | 'listed';
  sector?: string;
  gmp?: number;
  exchange?: string;
  link?: string;
  issue_dates?: string;
  est_listing?: string;
  trend?: string;
}

interface IPOStats {
  total: number;
  upcoming: number;
  open: number;
  closed: number;
  listed: number;
}

export default function IPOPage() {
  const { user } = useAuth();
  const [ipos, setIPOs] = useState<IPO[]>([]);
  const [stats, setStats] = useState<IPOStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'open' | 'closed' | 'listed' | 'all'>('upcoming');
  const [notifications, setNotifications] = useState<IPO[]>([]);
  const { socket } = useSocket(user?._id);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchIPOs();
    subscribeToIPONotifications();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('ipo:new', (ipo: IPO) => {
      setNotifications((prev) => [ipo, ...prev]);
      fetchIPOs();
    });

    return () => {
      socket.off('ipo:new');
    };
  }, [socket]);

  const fetchIPOs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/ipo?limit=1000`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch IPOs: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      setIPOs(data.ipos || []);

      const statsRes = await fetch(`${API_URL}/api/ipo/stats/overview`, {
        credentials: 'include',
      });

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('❌ [IPO] Error fetching IPOs:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToIPONotifications = () => {
    if (!socket) return;
    socket.emit('subscribe:ipo');
  };

  const triggerManualSync = async () => {
    try {
      setSyncing(true);
      console.log('🔄 [IPO] Triggering manual sync...');

      const response = await fetch(`${API_URL}/api/ipo/admin/sync`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Manual sync failed: ${response.status}`);
      }

      await fetchIPOs();
    } catch (error) {
      console.error('❌ [IPO] Manual sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  const getFilteredIPOs = () => {
    let filtered = ipos;

    if (activeTab !== 'all') {
      filtered = filtered.filter((ipo) => ipo.status === activeTab);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (ipo) =>
          ipo.company_name.toLowerCase().includes(q) ||
          (ipo.sector && ipo.sector.toLowerCase().includes(q)) ||
          (ipo.exchange && ipo.exchange.toLowerCase().includes(q))
      );
    }

    // Deduplicate by normalized company name to ensure each card appears exactly once
    const seen = new Set<string>();
    return filtered.filter((ipo) => {
      const normKey = ipo.company_name.toLowerCase().trim();
      if (seen.has(normKey)) return false;
      seen.add(normKey);
      return true;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'upcoming':
        return 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800';
      case 'closed':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'listed':
        return 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBA';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredIPOs = getFilteredIPOs();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              IPO Market Intelligence
            </h2>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Feed
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-200 mt-0.5">
            Real-time Grey Market Premiums (GMP), issue dates, price bands, and listing returns
          </p>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={fetchIPOs}
            disabled={loading || syncing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-white bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 shadow-xs transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-brand-500' : 'text-slate-400 dark:text-slate-200'} />
            <span>Refresh</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={triggerManualSync}
            disabled={syncing || loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 border border-indigo-500 shadow-sm transition"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Syncing...' : 'Sync Market Data'}</span>
          </motion.button>
        </div>
      </div>

      {/* Stats KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button
            onClick={() => setActiveTab('all')}
            className={`text-left transition-transform hover:scale-[1.02] ${activeTab === 'all' ? 'ring-2 ring-indigo-500 rounded-2xl' : ''}`}
          >
            <GlowCard className="p-3.5 h-full">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-200">
                Total Monitored
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {stats.total}
              </div>
            </GlowCard>
          </button>

          <button
            onClick={() => setActiveTab('upcoming')}
            className={`text-left transition-transform hover:scale-[1.02] ${activeTab === 'upcoming' ? 'ring-2 ring-sky-500 rounded-2xl' : ''}`}
          >
            <GlowCard className="p-3.5 h-full">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                Upcoming
              </div>
              <div className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1">
                {stats.upcoming}
              </div>
            </GlowCard>
          </button>

          <button
            onClick={() => setActiveTab('open')}
            className={`text-left transition-transform hover:scale-[1.02] ${activeTab === 'open' ? 'ring-2 ring-emerald-500 rounded-2xl' : ''}`}
          >
            <GlowCard className="p-3.5 h-full">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Open Now
              </div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {stats.open}
              </div>
            </GlowCard>
          </button>

          <button
            onClick={() => setActiveTab('closed')}
            className={`text-left transition-transform hover:scale-[1.02] ${activeTab === 'closed' ? 'ring-2 ring-amber-500 rounded-2xl' : ''}`}
          >
            <GlowCard className="p-3.5 h-full">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Closed
              </div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {stats.closed}
              </div>
            </GlowCard>
          </button>

          <button
            onClick={() => setActiveTab('listed')}
            className={`text-left transition-transform hover:scale-[1.02] ${activeTab === 'listed' ? 'ring-2 ring-purple-500 rounded-2xl' : ''}`}
          >
            <GlowCard className="p-3.5 h-full">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Listed
              </div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                {stats.listed}
              </div>
            </GlowCard>
          </button>
        </div>
      )}

      {/* New IPO Alerts */}
      <AnimatePresence>
        {notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/40 backdrop-blur-sm flex items-start gap-3"
          >
            <Bell size={18} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200">New IPO Detected</p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                {notifications[0].company_name} is listing on {formatDate(notifications[0].listing_date)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex p-1 rounded-xl theme-card-subtle w-full sm:w-fit gap-1 overflow-x-auto">
          {[
            { id: 'upcoming' as const, label: 'Upcoming', count: stats?.upcoming ?? ipos.filter((i) => i.status === 'upcoming').length },
            { id: 'open' as const, label: 'Open Now', count: stats?.open ?? ipos.filter((i) => i.status === 'open').length },
            { id: 'closed' as const, label: 'Closed', count: stats?.closed ?? ipos.filter((i) => i.status === 'closed').length },
            { id: 'listed' as const, label: 'Listed', count: stats?.listed ?? ipos.filter((i) => i.status === 'listed').length },
            { id: 'all' as const, label: 'All IPOs', count: stats?.total ?? ipos.length },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-700 dark:text-white hover:text-indigo-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-black/5 dark:bg-white/10 text-slate-700 dark:text-white'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-300" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company or sector..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* IPO List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400 dark:text-slate-200 flex flex-col items-center justify-center gap-2">
          <RefreshCw size={20} className="animate-spin text-brand-500" />
          <span>Syncing real-time market offerings...</span>
        </div>
      ) : filteredIPOs.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-900/40 p-12 text-center backdrop-blur-xl">
          <AlertCircle className="w-10 h-10 text-slate-400 dark:text-slate-200 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-white">
            No IPOs Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-200 mt-1">
            {searchQuery ? 'No IPOs match your search criteria.' : 'No offerings currently in this category.'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredIPOs.map((ipo, idx) => (
            <motion.a
              key={ipo._id}
              href={ipo.link || '#'}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.02, 0.3) }}
              className="p-5 rounded-2xl theme-card group block space-y-3.5 hover:border-indigo-500/40 transition-all shadow-xs hover:shadow-md"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="space-y-0.5 min-w-0 flex-1">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                    {ipo.company_name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-300">
                    <span className="font-medium text-slate-600 dark:text-slate-200">{ipo.sector || 'Mainboard IPO'}</span>
                    <span>•</span>
                    <span className="text-[11px]">{ipo.exchange || 'NSE / BSE'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusBadge(
                      ipo.status
                    )}`}
                  >
                    {ipo.status}
                  </span>
                  {ipo.link && (
                    <ExternalLink size={13} className="text-slate-400 dark:text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  )}
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                {/* Price Band */}
                <div className="flex items-start gap-1.5">
                  <DollarSign size={14} className="text-slate-400 dark:text-slate-300 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-300 font-medium uppercase tracking-wider block">
                      Price Band
                    </span>
                    <p className="font-semibold text-slate-800 dark:text-white mt-0.5">
                      {ipo.price_band_min && ipo.price_band_max
                        ? ipo.price_band_min === ipo.price_band_max
                          ? `₹${ipo.price_band_min}`
                          : `₹${ipo.price_band_min} - ₹${ipo.price_band_max}`
                        : '—'}
                    </p>
                  </div>
                </div>

                {/* GMP */}
                <div className="flex items-start gap-1.5">
                  <TrendingUp size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-300 font-medium uppercase tracking-wider block">
                      Grey Market (GMP)
                    </span>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {ipo.gmp && ipo.gmp > 0 ? `+₹${ipo.gmp}` : ipo.gmp === 0 ? '₹0 (Flat)' : '—'}
                    </p>
                  </div>
                </div>

                {/* Issue Dates */}
                <div className="flex items-start gap-1.5">
                  <Calendar size={14} className="text-slate-400 dark:text-slate-300 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-300 font-medium uppercase tracking-wider block">
                      Issue / Listing
                    </span>
                    <p className="font-semibold text-slate-800 dark:text-white mt-0.5">
                      {ipo.issue_dates || formatDate(ipo.listing_date)}
                    </p>
                  </div>
                </div>

                {/* Estimated Listing / Gain */}
                <div className="flex items-start gap-1.5">
                  <Tag size={14} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-300 font-medium uppercase tracking-wider block">
                      Est. Listing
                    </span>
                    <p className="font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">
                      {ipo.est_listing || '—'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      )}
    </div>
  );
}
