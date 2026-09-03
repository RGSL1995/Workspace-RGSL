import { useState, useEffect } from 'react';
import { CheckCircle, Clock, Send } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';

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

  // Fetch tasks assigned by current user on mount
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

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300';
      case 'in_progress':
        return 'bg-blue-500/20 border-blue-500/40 text-blue-300';
      case 'escalated':
        return 'bg-orange-500/20 border-orange-500/40 text-orange-300';
      default:
        return 'bg-slate-500/20 border-slate-500/40 text-slate-300';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'critical':
        return 'text-red-400';
      case 'high':
        return 'text-orange-400';
      case 'medium':
        return 'text-yellow-400';
      default:
        return 'text-green-400';
    }
  };

  const getProgressPercent = () => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  };

  const filteredTasks = tasks.filter((task) => task.status === filter);

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg border border-cyan-500/30 bg-cyan-950/30 backdrop-blur-sm">
          <div className="text-xs font-mono text-cyan-400 mb-1">TOTAL ASSIGNED</div>
          <div className="text-2xl font-bold text-cyan-300">{tasks.length}</div>
        </div>
        <div className="p-3 rounded-lg border border-blue-500/30 bg-blue-950/30 backdrop-blur-sm">
          <div className="text-xs font-mono text-blue-400 mb-1">IN PROGRESS</div>
          <div className="text-2xl font-bold text-blue-300">
            {tasks.filter((t) => t.status === 'in_progress').length}
          </div>
        </div>
        <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-950/30 backdrop-blur-sm">
          <div className="text-xs font-mono text-emerald-400 mb-1">COMPLETED</div>
          <div className="text-2xl font-bold text-emerald-300">
            {tasks.filter((t) => t.status === 'completed').length}
          </div>
        </div>
        <div className="p-3 rounded-lg border border-purple-500/30 bg-purple-950/30 backdrop-blur-sm">
          <div className="text-xs font-mono text-purple-400 mb-1">COMPLETION RATE</div>
          <div className="text-2xl font-bold text-purple-300">{getProgressPercent()}%</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['open', 'in_progress', 'completed'] as Task['status'][]).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1 rounded text-xs font-mono uppercase transition-all ${
              filter === status
                ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-300'
                : 'bg-slate-900/60 border border-white/10 text-slate-400 hover:text-slate-200'
            }`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading assigned tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No {filter} tasks assigned</div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <motion.div
              key={task._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border ${getStatusColor(task.status)} backdrop-blur-sm cursor-pointer hover:shadow-lg transition-all`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm mb-1">{task.title}</h3>
                  <p className="text-xs opacity-80 line-clamp-2">{task.description}</p>

                  {/* Assignee Badge */}
                  <div className="flex gap-2 mt-2 items-center">
                    <div className="px-2 py-1 rounded bg-indigo-500/30 border border-indigo-500/40 text-xs font-mono text-indigo-300 flex items-center gap-1">
                      <Send size={12} />
                      {task.assignee_id?.name || 'Unknown'}
                    </div>
                    <span className={getPriorityColor(task.priority)}>
                      ⬤ {task.priority}
                    </span>
                    <span>📁 {task.department}</span>
                    {task.deadline && (
                      <span>📅 {new Date(task.deadline).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                {task.status === 'completed' && (
                  <div className="flex-shrink-0">
                    <CheckCircle size={20} className="text-emerald-400" />
                  </div>
                )}
                {task.status === 'in_progress' && (
                  <div className="flex-shrink-0">
                    <Clock size={20} className="text-blue-400 animate-pulse" />
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
