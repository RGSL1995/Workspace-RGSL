import { useState, useEffect } from 'react';
import { CheckCircle, Clock, Mail } from 'lucide-react';
import { motion } from 'motion/react';
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

  // Fetch tasks on mount
  useEffect(() => {
    fetchTasks();
  }, [user]);

  // Listen for real-time task creation via Socket.io
  useEffect(() => {
    on('task:created', (newTask: Task) => {
      console.log('✅ [TASKS] New task received via Socket.io:', newTask);
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

  const filteredTasks = tasks.filter((task) => task.status === filter);

  return (
    <div className="space-y-4">
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
        <div className="text-center py-12 text-slate-400">Loading tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No {filter} tasks</div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => {
            const isExpanded = expandedTaskId === task._id;
            return (
              <motion.div
                key={task._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-lg border ${getStatusColor(task.status)} backdrop-blur-sm transition-all`}
              >
                <div
                  onClick={() => setExpandedTaskId(isExpanded ? null : task._id)}
                  className="p-4 cursor-pointer hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{task.title}</h3>
                        {task.email_id && <Mail size={14} className="text-indigo-400" />}
                      </div>
                      <p className="text-xs opacity-80 line-clamp-2 mt-1">{task.description}</p>
                      <div className="flex gap-2 mt-2 text-xs opacity-70 flex-wrap">
                        <span className={getPriorityColor(task.priority)}>
                          ⬀ {task.priority}
                        </span>
                        <span>📁 {task.department}</span>
                        {task.deadline && (
                          <span>📅 {new Date(task.deadline).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      {task.status !== 'completed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTaskStatus(task._id, 'completed');
                          }}
                          className="p-2 rounded hover:bg-emerald-500/20 transition-colors"
                          title="Mark complete"
                        >
                          <CheckCircle size={16} className="text-emerald-400" />
                        </button>
                      )}
                      {task.status === 'open' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTaskStatus(task._id, 'in_progress');
                          }}
                          className="p-2 rounded hover:bg-blue-500/20 transition-colors"
                          title="Start task"
                        >
                          <Clock size={16} className="text-blue-400" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Email Preview (if task came from email assignment) */}
                {isExpanded && task.email_id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-white/10 p-4 bg-slate-900/40"
                  >
                    <div className="space-y-3">
                      <div>
                        <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">📧 Source Email</div>
                        <div className="text-xs text-slate-300">
                          <div className="font-semibold">{task.email_id.subject}</div>
                          <div className="text-slate-400 text-[11px] mt-1">From: {task.email_id.from}</div>
                          <div className="text-slate-500 text-[10px] mt-1">
                            {new Date(task.email_id.received_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="bg-slate-950/60 rounded border border-white/5 p-3">
                        <div className="text-xs text-slate-300 max-h-40 overflow-y-auto">
                          {task.email_id.body.substring(0, 500)}
                          {task.email_id.body.length > 500 && '...'}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
