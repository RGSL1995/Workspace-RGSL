import { useState, useEffect } from 'react';
import {
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { GlowCard } from '../../components/ui/GlowCard';

interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'completed' | 'escalated' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  department: string;
  deadline?: string;
  assignee_id: {
    _id: string;
    name: string;
    email: string;
  };
  created_at: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AssignedTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Task['status']>('open');

  useEffect(() => {
    fetchAssignedTasks();
  }, [user]);

  const fetchAssignedTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/tasks/assigned-by/${user?._id}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Failed to fetch assigned tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority: Task['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'high':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'medium':
        return 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  const getProgressPercent = () => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  };

  const filteredTasks = tasks.filter((task) => task.status === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Delegated Directives
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Track tasks and assignments you have delegated to team members
        </p>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <GlowCard className="p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Total Delegated
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
            {tasks.length}
          </div>
        </GlowCard>

        <GlowCard className="p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            In Progress
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-sky-600 dark:text-sky-400 mt-1">
            {tasks.filter((t) => t.status === 'in_progress').length}
          </div>
        </GlowCard>

        <GlowCard className="p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Completed
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {tasks.filter((t) => t.status === 'completed').length}
          </div>
        </GlowCard>

        <GlowCard className="p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Resolution Rate
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-brand-600 dark:text-brand-400 mt-1">
            {getProgressPercent()}%
          </div>
        </GlowCard>
      </div>

      {/* Filter Tabs */}
      <div className="flex p-1 rounded-xl theme-card-subtle w-fit gap-1">
        {[
          { id: 'open' as const, label: 'OPEN', count: tasks.filter((t) => t.status === 'open').length },
          { id: 'in_progress' as const, label: 'IN PROGRESS', count: tasks.filter((t) => t.status === 'in_progress').length },
          { id: 'completed' as const, label: 'COMPLETED', count: tasks.filter((t) => t.status === 'completed').length },
        ].map((tab) => {
          const isActive = filter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
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

      {/* Task List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-200">Loading delegated tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-900/40 p-12 text-center backdrop-blur-xl">
          <CheckCircle2 className="w-10 h-10 text-brand-500 mx-auto mb-3 opacity-80" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-white">
            No {filter.replace('_', ' ')} delegated tasks
          </h3>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <motion.div
              key={task._id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl shadow-xs hover:shadow-md transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${getPriorityBadge(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                    <span className="text-xs font-medium text-slate-600 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      {task.department}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    {task.title}
                  </h3>

                  {task.description && (
                    <p className="text-xs text-slate-600 dark:text-white line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Assignee Badge */}
                {task.assignee_id && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex-shrink-0">
                    <div className="w-6 h-6 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-[10px]">
                      {task.assignee_id.name?.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-xs font-semibold text-slate-800 dark:text-white leading-tight">
                        {task.assignee_id.name}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-200 leading-tight">
                        {task.assignee_id.email}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
