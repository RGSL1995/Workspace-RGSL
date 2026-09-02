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
  Sparkles,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BorderBeam } from './ui/BorderBeam';

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
      <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
        <p className="font-mono text-xs text-cyan-300 tracking-wider">
          FETCHING DIRECTIVE PAYLOAD & ATTACHMENTS...
        </p>
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
        <AlertCircle className="text-rose-400 mx-auto" size={36} />
        <p className="text-xs font-mono text-rose-300">{error || 'Directive not found'}</p>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-white/10 hover:border-cyan-400 text-xs font-mono text-white transition-all"
        >
          RETURN TO STREAM
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full flex flex-col overflow-y-auto font-sans">
      {/* HUD Control Toolbar */}
      <div className="sticky top-0 z-20 flex items-center justify-between p-4 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          {/* Star Toggle */}
          <button
            onClick={handleToggleStar}
            disabled={actionLoading}
            className={`p-2 rounded-xl border transition-all ${
              email.is_starred
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
            }`}
            title={email.is_starred ? 'Starred' : 'Star directive'}
          >
            <Star size={16} className={email.is_starred ? 'fill-amber-400' : ''} />
          </button>

          {/* Mark Read/Unread */}
          <button
            onClick={handleToggleRead}
            disabled={actionLoading}
            className="p-2 rounded-xl bg-slate-900/60 border border-white/10 text-slate-400 hover:text-white hover:border-cyan-400/40 transition-all"
            title={email.is_read ? 'Mark unread' : 'Mark read'}
          >
            {email.is_read ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>

          {/* Delegate Task Button */}
          <button
            onClick={handleOpenAssignModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 text-cyan-300 hover:text-white hover:border-cyan-400 text-xs font-mono tracking-wider font-semibold transition-all shadow-[0_0_15px_rgba(0,245,255,0.15)] active:scale-95"
          >
            <UserPlus size={14} />
            <span>DELEGATE AS TASK</span>
          </button>
        </div>

        {/* Close inspector button */}
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-900/60 border border-white/10 text-slate-400 hover:text-white hover:border-rose-400/40 transition-all"
          title="Close inspector"
        >
          <X size={16} />
        </button>
      </div>

      {/* Directive Content Body */}
      <div className="p-6 space-y-6 flex-1">
        {/* Header Metadata */}
        <div className="space-y-3 pb-5 border-b border-white/10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 font-bold tracking-wider">
              DIRECTIVE // {email.classification?.toUpperCase()}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {new Date(email.received_at).toLocaleString()}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-display font-bold text-white leading-tight">
            {email.subject || '(No Subject)'}
          </h1>

          {/* Sender & Receiver Info */}
          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-white/5 font-mono text-xs space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 w-12">FROM:</span>
              <span className="text-cyan-300 font-semibold">{email.from}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 w-12">TO:</span>
              <span className="text-slate-300">{email.to?.join(', ') || 'Me'}</span>
            </div>
            {email.cc && email.cc.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500 w-12">CC:</span>
                <span className="text-slate-400">{email.cc.join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Attachments Section */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <FileText size={14} className="text-cyan-400" />
              <span>PAYLOAD ATTACHMENTS ({email.attachments.length})</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-2.5">
              {email.attachments.map((att) => (
                <div
                  key={att.attachmentId}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/10 hover:border-cyan-400/40 transition-all"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-xs font-mono text-white truncate">{att.filename}</p>
                    <p className="text-[10px] font-mono text-slate-500">{formatFileSize(att.size)}</p>
                  </div>
                  <button
                    onClick={() => handleDownloadAttachment(att)}
                    disabled={downloadingAttachmentId === att.attachmentId}
                    className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 hover:text-white hover:border-cyan-400 transition-all flex-shrink-0"
                    title="Download attachment"
                  >
                    {downloadingAttachmentId === att.attachmentId ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Download size={14} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message Body */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 pb-2">
            <Sparkles size={14} className="text-purple-400" />
            <span>PAYLOAD TEXT STREAM</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/10 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
            {email.body}
          </div>
        </div>
      </div>

      {/* Futuristic Task Delegation Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-2xl border border-cyan-500/40 bg-slate-950 p-6 space-y-5 shadow-[0_0_50px_rgba(0,245,255,0.2)]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <UserPlus size={18} className="text-cyan-400" />
                  <h3 className="font-display font-bold text-base text-white">
                    DISPATCH OPERATIONAL TASK
                  </h3>
                </div>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-mono text-slate-400">
                  SELECT ASSIGNEE FOR DIRECTIVE:
                </label>

                {employeesLoading ? (
                  <div className="py-6 text-center text-xs font-mono text-cyan-400">
                    <RefreshCw size={18} className="animate-spin mx-auto mb-2" />
                    <span>Loading personnel mesh...</span>
                  </div>
                ) : (
                  <select
                    value={selectedEmployee || ''}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="w-full bg-slate-900 border border-white/15 focus:border-cyan-400 rounded-xl px-4 py-3 text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  >
                    <option value="">-- Choose Operator --</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} ({emp.email}) - {emp.role}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {assignmentSuccess ? (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs font-mono text-emerald-300 flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>TASK CREATED & DISPATCHED!</span>
                </div>
              ) : (
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 bg-slate-900 text-xs font-mono text-slate-300 hover:bg-slate-800 transition"
                  >
                    CANCEL
                  </button>
                  <button
                    type="button"
                    onClick={handleAssignEmail}
                    disabled={!selectedEmployee || assignmentLoading}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-slate-950 font-bold font-mono text-xs tracking-wider uppercase transition shadow-[0_0_15px_rgba(0,245,255,0.3)]"
                  >
                    {assignmentLoading ? 'DISPATCHING...' : 'CONFIRM DISPATCH'}
                  </button>
                </div>
              )}
              <BorderBeam size={100} duration={8} colorFrom="#00f5ff" colorTo="#a855f7" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
