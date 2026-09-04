import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  Mail,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';

interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'completed' | 'escalated' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  department: string;
  deadline?: string;
  assignee_id: string;
  created_at: string;
  email_id?: {
    _id: string;
    subject: string;
    from: string;
    body: string;
    html_body?: string;
    received_at: string;
  };
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Task['status']>('open');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const { on } = useSocket(user?._id);

  useEffect(() => {
    fetchTasks();
  }, [user]);

  useEffect(() => {
    on('task:created', (newTask: Task) => {
      setTasks((prevTasks) => [newTask, ...prevTasks]);
    });
  }, [on]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/tasks/user/${user?._id}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      const response = await fetch(`${API_URL}/api/tasks/${taskId}/status`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updated = await response.json();
        setTasks((prev) => prev.map((t) => (t._id === taskId ? updated : t)));
      }
    } catch (error) {
      console.error('Failed to update task:', error);
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

  const filteredTasks = tasks.filter((task) => task.status === filter);

  const statusTabs: { id: Task['status']; label: string; count: number }[] = [
    { id: 'open', label: 'To Do', count: tasks.filter((t) => t.status === 'open').length },
    { id: 'in_progress', label: 'In Progress', count: tasks.filter((t) => t.status === 'in_progress').length },
    { id: 'completed', label: 'Completed', count: tasks.filter((t) => t.status === 'completed').length },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Tasks
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-200 mt-0.5">
            Manage your individual action items and delegated directives
          </p>
        </div>

        {/* Status Switcher Tabs */}
        <div className="flex p-1 rounded-xl theme-card-subtle gap-1">
          {statusTabs.map((tab) => {
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
      </div>

      {/* Task List Cards */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 dark:text-slate-200 text-xs font-medium">
          Loading assigned tasks...
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-900/40 p-12 text-center backdrop-blur-xl">
          <CheckCircle2 className="w-10 h-10 text-brand-500 mx-auto mb-3 opacity-80" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-white">
            No {filter.replace('_', ' ')} tasks
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-200 mt-1">All clear for this queue category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const isExpanded = expandedTaskId === task._id;
            return (
              <motion.div
                key={task._id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl theme-card overflow-hidden"
              >
                <div
                  onClick={() => setExpandedTaskId(isExpanded ? null : task._id)}
                  className="p-4 sm:p-5 cursor-pointer flex items-start justify-between gap-4"
                >
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getPriorityBadge(
                          task.priority
                        )}`}
                      >
                        {task.priority} Priority
                      </span>

                      {task.department && (
                        <span className="text-[11px] font-medium text-slate-600 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          {task.department}
                        </span>
                      )}

                      {task.deadline && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                          <Calendar size={12} />
                          <span>{new Date(task.deadline).toLocaleDateString()}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                        {task.title}
                      </h3>
                      {task.email_id && (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded-md"
                          title="Created from Email"
                        >
                          <Mail size={12} />
                          <span>From Email</span>
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-600 dark:text-white line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                    )}
                  </div>

                  {/* Quick Status Action Buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {task.status !== 'completed' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => updateTaskStatus(task._id, 'completed')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold transition"
                        title="Mark Complete"
                      >
                        <CheckCircle2 size={14} />
                        <span className="hidden sm:inline">Complete</span>
                      </motion.button>
                    )}

                    {task.status === 'open' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => updateTaskStatus(task._id, 'in_progress')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-semibold transition"
                        title="Start Task"
                      >
                        <Clock size={14} />
                        <span className="hidden sm:inline">Start</span>
                      </motion.button>
                    )}

                    <button
                      onClick={() => setExpandedTaskId(isExpanded ? null : task._id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details & Source Email */}
                <AnimatePresence>
                  {isExpanded && task.email_id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-slate-100 dark:border-slate-800 p-4 sm:p-5 bg-slate-50/60 dark:bg-slate-800/40"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                          <Mail size={14} className="text-brand-500" />
                          <span>Source Email Thread</span>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {task.email_id.subject}
                          </div>
                          <div className="text-slate-500 text-[11px] mt-0.5">
                            From: {task.email_id.from}
                          </div>
                        </div>
                        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-h-48 overflow-y-auto">
                          {task.email_id.body}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
