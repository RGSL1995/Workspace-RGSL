import { useEffect, useRef, useState } from 'react';
import {
  Download,
  X,
  AlertCircle,
  Star,
  Eye,
  EyeOff,
  UserPlus,
  FileText,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Attachment {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
}

interface EmailDetailData {
  _id: string;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  body: string;
  html_body?: string;
  attachments: Attachment[];
  classification: string;
  confidence_score: number;
  is_read: boolean;
  is_starred: boolean;
  received_at: string;
  assigned_to?: any;
}

interface Employee {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface EmailDetailProps {
  emailId: string;
  onClose: () => void;
}

export default function EmailDetail({ emailId, onClose }: EmailDetailProps) {
  const [email, setEmail] = useState<EmailDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentSuccess, setAssignmentSuccess] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchEmail();
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [emailId]);

  const fetchEmail = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/ai/email/${emailId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch email');
      }

      const data = await response.json();
      setEmail(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Fetch email error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAttachment = async (attachment: Attachment) => {
    try {
      setDownloadingAttachmentId(attachment.attachmentId);

      const response = await fetch(
        `${API_URL}/api/ai/attachment/${emailId}/${attachment.attachmentId}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Failed to download attachment');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download attachment');
    } finally {
      setDownloadingAttachmentId(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleToggleRead = async () => {
    if (!email) return;
    try {
      setActionLoading(true);
      const response = await fetch(`${API_URL}/api/ai/email/${emailId}/read`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: !email.is_read }),
      });

      if (response.ok) {
        setEmail({ ...email, is_read: !email.is_read });
      }
    } catch (error) {
      console.error('Toggle read error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStar = async () => {
    if (!email) return;
    try {
      setActionLoading(true);
      const response = await fetch(`${API_URL}/api/ai/email/${emailId}/star`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred: !email.is_starred }),
      });

      if (response.ok) {
        setEmail({ ...email, is_starred: !email.is_starred });
      }
    } catch (error) {
      console.error('Toggle star error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      setEmployeesLoading(true);
      const response = await fetch(`${API_URL}/api/employees`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const empList = Array.isArray(data) ? data : data.employees || [];
        setEmployees(empList);
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error('📋 Load employees error:', error);
      setEmployees([]);
    } finally {
      setEmployeesLoading(false);
    }
  };

  const handleOpenAssignModal = () => {
    loadEmployees();
    setAssignmentSuccess(false);
    setShowAssignModal(true);
  };

  const handleAssignEmail = async () => {
    if (!selectedEmployee) return;

    try {
      setAssignmentLoading(true);
      const response = await fetch(`${API_URL}/api/ai/email/${emailId}/assign`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedToId: selectedEmployee }),
      });

      if (response.ok) {
        const data = await response.json();
        setEmail({
          ...email,
          assigned_to: data.email?.assigned_to,
        } as EmailDetailData);
        setAssignmentSuccess(true);
        setTimeout(() => {
          setShowAssignModal(false);
          setSelectedEmployee(null);
          setAssignmentSuccess(false);
        }, 1200);
      } else {
        alert('Failed to delegate task');
      }
    } catch (error) {
      console.error('Assign email error:', error);
      alert('Error delegating directive');
    } finally {
      setAssignmentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-3 theme-card">
        <RefreshCw className="w-6 h-6 text-brand-500 animate-spin mx-auto" />
        <p className="text-xs font-semibold theme-muted">
          Loading email message & attachments...
        </p>
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4 theme-card">
        <AlertCircle className="text-rose-500 mx-auto" size={32} />
        <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error || 'Message not found'}</p>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl theme-card-subtle text-xs font-semibold theme-heading transition"
        >
          Return to Inbox
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full flex flex-col overflow-y-auto font-sans theme-card">
      {/* Control Toolbar */}
      <div className="sticky top-0 z-20 flex items-center justify-between p-3.5 border-b app-header backdrop-blur-xl">
        <div className="flex items-center gap-2">
          {/* Star Toggle */}
          <button
            onClick={handleToggleStar}
            disabled={actionLoading}
            className={`p-2 rounded-xl border transition-all ${
              email.is_starred
                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-500'
                : 'theme-card-subtle text-slate-400 hover:text-slate-700 dark:hover:text-white'
            }`}
            title={email.is_starred ? 'Starred' : 'Star message'}
          >
            <Star size={15} className={email.is_starred ? 'fill-amber-400' : ''} />
          </button>

          {/* Mark Read/Unread */}
          <button
            onClick={handleToggleRead}
            disabled={actionLoading}
            className="p-2 rounded-xl theme-card-subtle text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition"
            title={email.is_read ? 'Mark unread' : 'Mark read'}
          >
            {email.is_read ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>

          {/* Delegate Task Button */}
          <button
            onClick={handleOpenAssignModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition active:scale-95"
          >
            <UserPlus size={14} />
            <span>Create Task</span>
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
          title="Close details"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content Body */}
      <div className="p-6 space-y-6 flex-1">
        {/* Header Metadata */}
        <div className="space-y-3 pb-5 border-b border-[var(--border-color)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full theme-card-subtle theme-heading">
              {email.classification?.replace('_', ' ').toUpperCase()}
            </span>
            <span className="text-xs theme-muted">
              {new Date(email.received_at).toLocaleString()}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold theme-heading leading-tight">
            {email.subject || '(No Subject)'}
          </h1>

          {/* Sender & Receiver Info */}
          <div className="p-3.5 rounded-2xl theme-card-subtle text-xs space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="theme-muted w-12 font-medium">From:</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{email.from}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="theme-muted w-12 font-medium">To:</span>
              <span className="theme-heading">{email.to?.join(', ') || 'Me'}</span>
            </div>
            {email.cc && email.cc.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="theme-muted w-12 font-medium">Cc:</span>
                <span className="theme-muted">{email.cc.join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Attachments Section */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold theme-heading">
              <FileText size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span>Attachments ({email.attachments.length})</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-2">
              {email.attachments.map((att) => (
                <div
                  key={att.attachmentId}
                  className="flex items-center justify-between p-3 rounded-2xl theme-card-subtle"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-xs font-medium theme-heading truncate">{att.filename}</p>
                    <p className="text-[10px] theme-muted">{formatFileSize(att.size)}</p>
                  </div>
                  <button
                    onClick={() => handleDownloadAttachment(att)}
                    disabled={downloadingAttachmentId === att.attachmentId}
                    className="p-1.5 rounded-lg theme-card text-slate-600 dark:text-slate-200 hover:text-indigo-600 transition"
                    title="Download attachment"
                  >
                    {downloadingAttachmentId === att.attachmentId ? (
                      <RefreshCw size={13} className="animate-spin text-indigo-500" />
                    ) : (
                      <Download size={13} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message Body */}
        <div className="space-y-2">
          <div className="p-5 rounded-2xl theme-card-subtle theme-body text-sm leading-relaxed whitespace-pre-wrap">
            {email.body}
          </div>
        </div>
      </div>

      {/* Task Delegation Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-3xl theme-card p-6 space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-2">
                  <UserPlus size={18} className="text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-bold text-base theme-heading">
                    Delegate Email as Task
                  </h3>
                </div>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold theme-body">
                  Select Team Member Assignee:
                </label>

                {employeesLoading ? (
                  <div className="py-6 text-center text-xs text-indigo-500">
                    <RefreshCw size={18} className="animate-spin mx-auto mb-2" />
                    <span>Loading team members...</span>
                  </div>
                ) : (
                  <select
                    value={selectedEmployee || ''}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="w-full theme-input rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Choose Team Member --</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} ({emp.email}) - {emp.role}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {assignmentSuccess ? (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>Task delegated successfully!</span>
                </div>
              ) : (
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-[var(--border-color)] theme-card-subtle text-xs font-semibold theme-heading hover:opacity-80 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAssignEmail}
                    disabled={!selectedEmployee || assignmentLoading}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold text-xs transition shadow-sm"
                  >
                    {assignmentLoading ? 'Delegating...' : 'Confirm Assignment'}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
