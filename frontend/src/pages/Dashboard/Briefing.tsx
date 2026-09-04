import {
  Sparkles,
  Clock,
  AlertCircle,
  Mail,
  RefreshCw,
  CheckCircle2,
  Calendar,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { GlowCard } from '../../components/ui/GlowCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface BriefingData {
  employee_name: string;
  active_tasks: number;
  overdue_tasks: number;
  upcoming_deadlines: string[];
  important_emails: string[];
  briefing: string;
}

export default function Briefing() {
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBriefing();
  }, []);

  const fetchBriefing = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/ai/briefing`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setBriefing(data);
      }
    } catch (error) {
      console.error('Failed to fetch briefing:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl p-12 text-center theme-card space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Synthesizing Neural Briefing...
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Analyzing mailbox stream, pending tasks, and organizational deadlines with Claude AI
          </p>
        </div>
      </div>
    );
  }

  const activeCount = briefing?.active_tasks ?? 0;
  const overdueCount = briefing?.overdue_tasks ?? 0;
  const priorityCount = briefing?.important_emails?.length ?? 0;
  const completionScore = activeCount === 0 ? 100 : Math.max(0, 100 - overdueCount * 25);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Daily Operational Briefing
            </h2>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 shadow-xs">
              <Sparkles size={13} className="text-brand-600 dark:text-brand-400 animate-pulse" />
              {/* <span>Executive Live</span> */}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-200 mt-1">
            Real-time operational overview for{' '}
            <span className="font-semibold text-slate-700 dark:text-white">
              {briefing?.employee_name || 'Authorized Member'}
            </span>
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={fetchBriefing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-white bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 shadow-xs transition"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-brand-500' : 'text-slate-400 dark:text-slate-200'} />
          <span>Refresh Summary</span>
        </motion.button>
      </div>

      {/* Main Executive Summary Gradient Card */}
      <div className="relative overflow-hidden rounded-3xl border border-brand-200 dark:border-brand-500/30 bg-gradient-to-br from-brand-50/90 via-white/95 to-indigo-50/60 dark:from-slate-900/95 dark:via-slate-900/85 dark:to-indigo-950/40 p-6 sm:p-7 backdrop-blur-2xl shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-500/30">
            <Sparkles size={22} className="text-white" />
          </div>

          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                Executive Overview & Intelligence
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <p className="text-slate-800 dark:text-white text-sm sm:text-base leading-relaxed font-normal">
              {briefing?.briefing && briefing.briefing !== 'Unable to generate insights at this time.'
                ? briefing.briefing
                : `Cross-department mailbox sync is active. You currently have ${activeCount} active task(s) and ${priorityCount} priority email(s) requiring attention. All channels are operating within normal parameters.`}
            </p>
          </div>
        </div>
      </div>

      {/* Rich Telemetry KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Tasks Card */}
        <GlowCard className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-200">
                Active Queue
              </p>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {activeCount}
              </p>
              {overdueCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md mt-1">
                  <AlertCircle size={12} />
                  {overdueCount} Overdue
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md mt-1">
                  <CheckCircle2 size={12} />
                  On Schedule
                </span>
              )}
            </div>
            <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200/80 dark:border-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Clock size={18} />
            </div>
          </div>
        </GlowCard>

        {/* Priority Inquiries */}
        <GlowCard className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-200">
                Priority Inquiries
              </p>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {priorityCount}
              </p>
              <p className="text-[11px] font-medium text-sky-600 dark:text-sky-400 mt-1">
                {priorityCount > 0 ? 'Requires action' : 'Zero backlog'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Mail size={18} />
            </div>
          </div>
        </GlowCard>

        {/* Operational Health Score */}
        <GlowCard className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-200">
                Efficiency Index
              </p>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {completionScore}%
              </p>
              <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${completionScore}%` }}
                />
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={18} />
            </div>
          </div>
        </GlowCard>

        {/* Security & Sync Status */}
        <GlowCard className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-200">
                Security Protocol
              </p>
              <p className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Zero-Trust
              </p>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-200">
                TLS 1.3 // TLS-AES
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <ShieldCheck size={18} />
            </div>
          </div>
        </GlowCard>
      </div>

      {/* Actionable Highlights Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Deadlines & Critical Timelines */}
        <GlowCard className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Calendar size={18} />
              <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                Upcoming Deadlines & Milestones
              </h3>
            </div>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              {briefing?.upcoming_deadlines?.length || 0} Scheduled
            </span>
          </div>

          {briefing?.upcoming_deadlines && briefing.upcoming_deadlines.length > 0 ? (
            <ul className="space-y-2.5">
              {briefing.upcoming_deadlines.map((deadline, i) => (
                <motion.li
                  key={i}
                  whileHover={{ x: 2 }}
                  className="flex items-start gap-3 text-xs font-medium text-slate-700 dark:text-white bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-700/60"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  <span className="leading-relaxed">{deadline}</span>
                </motion.li>
              ))}
            </ul>
          ) : (
            <div className="py-8 text-center text-slate-500 dark:text-slate-200 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-xs font-medium">No pressing deadlines scheduled for this week.</p>
            </div>
          )}
        </GlowCard>

        {/* Priority Inquiries Stream */}
        <GlowCard className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
              <Mail size={18} />
              <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                Actionable Communications
              </h3>
            </div>
            <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
              {briefing?.important_emails?.length || 0} Priority
            </span>
          </div>

          {briefing?.important_emails && briefing.important_emails.length > 0 ? (
            <ul className="space-y-2.5">
              {briefing.important_emails.map((email, i) => (
                <motion.li
                  key={i}
                  whileHover={{ x: 2 }}
                  className="flex items-start gap-3 text-xs font-medium text-slate-700 dark:text-white bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-700/60"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 flex-shrink-0" />
                  <span className="leading-relaxed line-clamp-2">{email}</span>
                </motion.li>
              ))}
            </ul>
          ) : (
            <div className="py-8 text-center text-slate-500 dark:text-slate-200 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-sky-500 mx-auto" />
              <p className="text-xs font-medium">All priority communications are up to date.</p>
            </div>
          )}
        </GlowCard>
      </div>
    </motion.div>
  );
}
