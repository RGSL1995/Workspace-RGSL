import { useEffect, useState } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface Analytics {
  tasks?: {
    byStatus: Array<{ _id: string; count: number }>;
    byPriority: Array<{ _id: string; count: number }>;
    byDepartment: Array<{ _id: string; count: number }>;
    overdue: number;
    total: number;
  };
  emails?: {
    total: number;
    byClassification: Array<{ _id: string; count: number }>;
  };
  employees?: {
    total: number;
    byRole: Array<{ _id: string; count: number }>;
  };
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_URL}/api/analytics/system`, {
        credentials: 'include',
      });

      if (res.ok) {
        setAnalytics(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'text-amber-400 bg-amber-950/50';
      case 'in_progress':
        return 'text-cyan-400 bg-cyan-950/50';
      case 'completed':
        return 'text-emerald-400 bg-emerald-950/50';
      default:
        return 'text-slate-400 bg-slate-900/50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Tasks', value: analytics?.tasks?.total || 0, icon: Clock, color: 'cyan' },
          { label: 'Total Emails', value: analytics?.emails?.total || 0, icon: CheckCircle, color: 'indigo' },
          { label: 'Employees', value: analytics?.employees?.total || 0, icon: CheckCircle, color: 'purple' },
          {
            label: 'Overdue Tasks',
            value: analytics?.tasks?.overdue || 0,
            icon: AlertTriangle,
            color: 'red',
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`rounded-lg border p-4 bg-gradient-to-br border-${stat.color}-500/20 from-${stat.color}-950/50 to-transparent`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-mono text-xs text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <Icon className={`w-4 h-4 text-${stat.color}-400`} />
              </div>
              <p className={`font-display text-3xl font-bold text-${stat.color}-300`}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Tasks by Status */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-white/10 bg-slate-900/60 p-4">
        <h3 className="font-mono text-sm font-semibold text-white mb-4">TASKS BY STATUS</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {analytics?.tasks?.byStatus?.map((stat) => (
            <div
              key={stat._id}
              className={`rounded-lg p-3 text-center border ${getStatusColor(stat._id)} border-white/10`}
            >
              <p className="text-xs font-mono uppercase tracking-wider mb-1">{stat._id}</p>
              <p className="text-2xl font-bold">{stat.count}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Tasks by Department & Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Department Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-white/10 bg-slate-900/60 p-4">
          <h3 className="font-mono text-sm font-semibold text-white mb-4">TASKS BY DEPARTMENT</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {analytics?.tasks?.byDepartment?.map((stat) => (
              <div key={stat._id} className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-white/5">
                <span className="font-mono text-xs text-slate-300">{stat._id}</span>
                <span className="font-mono text-sm font-bold text-cyan-400">{stat.count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Priority Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-white/10 bg-slate-900/60 p-4">
          <h3 className="font-mono text-sm font-semibold text-white mb-4">TASKS BY PRIORITY</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {analytics?.tasks?.byPriority?.map((stat) => {
              const colorMap: any = {
                critical: 'text-red-400',
                high: 'text-orange-400',
                medium: 'text-amber-400',
                low: 'text-cyan-400',
              };
              return (
                <div key={stat._id} className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-white/5">
                  <span className="font-mono text-xs text-slate-300 uppercase">{stat._id}</span>
                  <span className={`font-mono text-sm font-bold ${colorMap[stat._id] || 'text-slate-300'}`}>
                    {stat.count}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Employees by Role */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-white/10 bg-slate-900/60 p-4">
        <h3 className="font-mono text-sm font-semibold text-white mb-4">EMPLOYEES BY ROLE</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {analytics?.employees?.byRole?.map((stat) => (
            <div key={stat._id} className="rounded-lg p-3 bg-slate-950/60 border border-white/10 text-center">
              <p className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">{stat._id}</p>
              <p className="text-xl font-bold text-indigo-400">{stat.count}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Refresh Button */}
      <button
        onClick={fetchAnalytics}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-all font-mono text-xs"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        REFRESH ANALYTICS
      </button>
    </div>
  );
}
