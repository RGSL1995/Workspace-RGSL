import { useEffect, useState } from 'react';
import { RefreshCw, AlertTriangle, Clock, Users, Mail } from 'lucide-react';
import { GlowCard } from '../ui/GlowCard';

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
    const interval = setInterval(fetchAnalytics, 30000);
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
        <RefreshCw className="w-6 h-6 text-brand-500 animate-spin" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800';
      case 'in_progress':
        return 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800';
      case 'completed':
        return 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800';
      default:
        return 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <GlowCard className="p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Tasks
            </p>
            <Clock className="w-4 h-4 text-brand-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {analytics?.tasks?.total || 0}
          </p>
        </GlowCard>

        <GlowCard className="p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Emails
            </p>
            <Mail className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-sky-600 dark:text-sky-400">
            {analytics?.emails?.total || 0}
          </p>
        </GlowCard>

        <GlowCard className="p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Team Members
            </p>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">
            {analytics?.employees?.total || 0}
          </p>
        </GlowCard>

        <GlowCard className="p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-500">
              Overdue Tasks
            </p>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-rose-600 dark:text-rose-400">
            {analytics?.tasks?.overdue || 0}
          </p>
        </GlowCard>
      </div>

      {/* Tasks by Status */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Tasks by Status
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {analytics?.tasks?.byStatus?.map((stat) => (
            <div
              key={stat._id}
              className={`rounded-2xl p-4 text-center border ${getStatusBadge(stat._id)}`}
            >
              <p className="text-xs font-bold uppercase tracking-wider mb-1">
                {stat._id.replace('_', ' ')}
              </p>
              <p className="text-2xl font-bold">{stat.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tasks by Department & Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Department Stats */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Tasks by Department
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {analytics?.tasks?.byDepartment?.map((stat) => (
              <div
                key={stat._id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-xs"
              >
                <span className="font-medium text-slate-700 dark:text-slate-300">{stat._id}</span>
                <span className="font-bold text-brand-600 dark:text-brand-400">{stat.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Stats */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Tasks by Priority
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {analytics?.tasks?.byPriority?.map((stat) => {
              const colorMap: any = {
                critical: 'text-rose-600 dark:text-rose-400',
                high: 'text-amber-600 dark:text-amber-400',
                medium: 'text-sky-600 dark:text-sky-400',
                low: 'text-slate-600 dark:text-slate-400',
              };
              return (
                <div
                  key={stat._id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-xs"
                >
                  <span className="font-medium text-slate-700 dark:text-slate-300 uppercase">
                    {stat._id}
                  </span>
                  <span className={`font-bold ${colorMap[stat._id] || 'text-slate-700 dark:text-slate-300'}`}>
                    {stat.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
