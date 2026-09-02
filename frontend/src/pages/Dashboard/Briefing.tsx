import {
  Sparkles,
  Clock,
  AlertCircle,
  Mail,
  RefreshCw,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { GlowCard } from '../../components/ui/GlowCard';
import { BorderBeam } from '../../components/ui/BorderBeam';

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
      <div className="relative rounded-2xl border border-cyan-500/30 bg-slate-950/60 p-12 text-center backdrop-blur-xl">
        <div className="flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="font-mono text-sm text-cyan-300 tracking-wider">
            SYNTHESIZING NEURAL BRIEFING WITH CLAUDE AI...
          </p>
        </div>
      </div>
    );
  }

  if (!briefing) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-display font-bold text-white">
              DAILY OPERATIONAL BRIEFING
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
              AI SYNTHESIZED
            </span>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Personalized intelligence for {briefing.employee_name || 'Operator'}
          </p>
        </div>

        <button
          onClick={fetchBriefing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/30 hover:border-cyan-400 transition-all duration-300 active:scale-95"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>RE-SYNTHESIZE</span>
        </button>
      </div>

      {/* Main AI Synthesis Executive Card */}
      <div className="relative rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-slate-900/90 via-slate-950/90 to-indigo-950/40 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_0_35px_-5px_rgba(0,245,255,0.2)]">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 flex-shrink-0 shadow-[0_0_15px_rgba(0,245,255,0.3)]">
            <Sparkles size={24} />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-cyan-400 font-semibold tracking-wider">
                EXECUTIVE SUMMARY
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <p className="text-slate-200 text-sm sm:text-base font-light leading-relaxed">
              {briefing.briefing}
            </p>
          </div>
        </div>
        <BorderBeam size={120} duration={9} colorFrom="#00f5ff" colorTo="#a855f7" />
      </div>

      {/* Telemetry Stats Grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Active Tasks Metric */}
        <GlowCard className="p-5 border-cyan-500/20">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-mono text-slate-400">ACTIVE TASK QUEUE</p>
              <p className="text-3xl font-display font-bold text-white tracking-tight">
                {briefing.active_tasks}
              </p>
              {briefing.overdue_tasks > 0 ? (
                <div className="inline-flex items-center gap-1 text-xs font-mono text-red-400 bg-red-950/40 border border-red-500/30 px-2 py-0.5 rounded-md mt-1">
                  <AlertCircle size={12} />
                  <span>{briefing.overdue_tasks} overdue</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-md mt-1">
                  <CheckCircle2 size={12} />
                  <span>All tasks on schedule</span>
                </div>
              )}
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Clock size={20} />
            </div>
          </div>
        </GlowCard>

        {/* Priority Communications */}
        <GlowCard className="p-5 border-indigo-500/20">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-mono text-slate-400">PRIORITY COMMUNICATIONS</p>
              <p className="text-3xl font-display font-bold text-white tracking-tight">
                {briefing.important_emails.length}
              </p>
              <p className="text-xs font-mono text-indigo-300 mt-1">
                Requiring your review or response
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Mail size={20} />
            </div>
          </div>
        </GlowCard>
      </div>

      {/* Deadlines & High Priority Highlights */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Deadlines list */}
        {briefing.upcoming_deadlines.length > 0 && (
          <GlowCard className="p-5 border-amber-500/20">
            <div className="flex items-center gap-2 mb-3 text-amber-400">
              <Calendar size={18} />
              <h3 className="font-mono text-xs font-bold tracking-wider text-amber-300 uppercase">
                Critical Deadlines
              </h3>
            </div>
            <ul className="space-y-2">
              {briefing.upcoming_deadlines.map((deadline, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs font-mono text-slate-300 bg-slate-900/50 p-2.5 rounded-lg border border-white/5"
                >
                  <span className="text-amber-400 font-bold">&gt;</span>
                  <span>{deadline}</span>
                </li>
              ))}
            </ul>
          </GlowCard>
        )}

        {/* Important Emails breakdown */}
        {briefing.important_emails.length > 0 && (
          <GlowCard className="p-5 border-blue-500/20">
            <div className="flex items-center gap-2 mb-3 text-blue-400">
              <Mail size={18} />
              <h3 className="font-mono text-xs font-bold tracking-wider text-blue-300 uppercase">
                High Priority Subjects
              </h3>
            </div>
            <ul className="space-y-2">
              {briefing.important_emails.map((email, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs font-mono text-slate-300 bg-slate-900/50 p-2.5 rounded-lg border border-white/5 line-clamp-2"
                >
                  <span className="text-blue-400 font-bold">•</span>
                  <span>{email}</span>
                </li>
              ))}
            </ul>
          </GlowCard>
        )}
      </div>
    </div>
  );
}
