import { useEffect, useRef, useState } from 'react';
import { Download, X, AlertCircle, Star, Eye, EyeOff, UserPlus } from 'lucide-react';

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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchEmail();
    // Auto-scroll to top when email changes
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [emailId]);

  const fetchEmail = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`http://localhost:5000/api/ai/email/${emailId}`, {
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
        `http://localhost:5000/api/ai/attachment/${emailId}/${attachment.attachmentId}`,
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
      const response = await fetch(`http://localhost:5000/api/ai/email/${emailId}/read`, {
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
      const response = await fetch(`http://localhost:5000/api/ai/email/${emailId}/star`, {
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
      console.log('📋 Fetching employees...');
      const response = await fetch('http://localhost:5000/api/employees', {
        credentials: 'include',
      });

      console.log('📋 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Employees loaded:', data);
        // Response is an array directly
        const empList = Array.isArray(data) ? data : (data.employees || []);
        setEmployees(empList);
      } else {
        const errorData = await response.text();
        console.error('📋 Error response:', errorData);
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
    setShowAssignModal(true);
  };

  const handleAssignEmail = async () => {
    if (!selectedEmployee) return;

    try {
      setAssignmentLoading(true);
      const response = await fetch(`http://localhost:5000/api/ai/email/${emailId}/assign`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedToId: selectedEmployee }),
      });

      if (response.ok) {
        const data = await response.json();
        setEmail({
          ...email,
          assigned_to: data.email.assigned_to,
        } as EmailDetailData);
        setShowAssignModal(false);
        setSelectedEmployee(null);
        alert('Email assigned successfully! Task created.');
      } else {
        alert('Failed to assign email');
      }
    } catch (error) {
      console.error('Assign email error:', error);
      alert('Error assigning email');
    } finally {
      setAssignmentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-slate-400">Loading email...</p>
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="text-red-400 mx-auto mb-2" size={32} />
          <p className="text-red-400">{error || 'Email not found'}</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden">
      {/* Email Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 min-h-0">
            <h2 className="text-xl font-bold text-white mb-2 break-words">{email.subject}</h2>
            <div className="space-y-1">
              <p className="text-sm text-slate-300">
                <span className="text-slate-400">From:</span> {email.from}
              </p>
              <p className="text-sm text-slate-300">
                <span className="text-slate-400">To:</span> {email.to.join(', ')}
              </p>
              {email.cc && email.cc.length > 0 && (
                <p className="text-sm text-slate-300">
                  <span className="text-slate-400">CC:</span> {email.cc.join(', ')}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-2">
                {new Date(email.received_at).toLocaleString()}
              </p>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleOpenAssignModal}
              disabled={actionLoading}
              className="p-2 hover:bg-slate-700 rounded transition disabled:opacity-50"
              title="Assign to person"
            >
              <UserPlus size={20} className="text-slate-400" />
            </button>
            <button
              onClick={handleToggleRead}
              disabled={actionLoading}
              className="p-2 hover:bg-slate-700 rounded transition disabled:opacity-50"
              title={email?.is_read ? 'Mark as unread' : 'Mark as read'}
            >
              {email?.is_read ? (
                <EyeOff size={20} className="text-slate-400" />
              ) : (
                <Eye size={20} className="text-slate-400" />
              )}
            </button>
            <button
              onClick={handleToggleStar}
              disabled={actionLoading}
              className="p-2 hover:bg-slate-700 rounded transition disabled:opacity-50"
              title={email?.is_starred ? 'Unstar' : 'Star'}
            >
              <Star
                size={20}
                className={email?.is_starred ? 'text-yellow-400 fill-yellow-400' : 'text-slate-400'}
              />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded transition"
            >
              <X size={20} className="text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Email Body */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="prose prose-invert max-w-none">
          <div className="text-slate-200 whitespace-pre-wrap break-words text-sm leading-relaxed">
            {email.body || <span className="text-slate-500 italic">No body content</span>}
          </div>
        </div>
      </div>

      {/* Attachments */}
      {email.attachments && email.attachments.length > 0 && (
        <div className="bg-slate-800 border-t border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-white mb-3">
            📎 Attachments ({email.attachments.length})
          </h3>
          <div className="space-y-2">
            {email.attachments.map((attachment) => (
              <div
                key={attachment.attachmentId}
                className="flex items-center justify-between bg-slate-700/50 border border-slate-600 rounded p-3 hover:bg-slate-700 transition"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{attachment.filename}</p>
                  <p className="text-xs text-slate-400">{formatFileSize(attachment.size)}</p>
                </div>
                <button
                  onClick={() => handleDownloadAttachment(attachment)}
                  disabled={downloadingAttachmentId === attachment.attachmentId}
                  className="ml-2 p-2 hover:bg-slate-600 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Download attachment"
                >
                  <Download
                    size={18}
                    className={
                      downloadingAttachmentId === attachment.attachmentId
                        ? 'text-slate-500'
                        : 'text-indigo-400'
                    }
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Assign Email to Person</h3>
              <button
                type="button"
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedEmployee(null);
                }}
                className="p-1 hover:bg-slate-700 rounded transition"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {employeesLoading ? (
              <p className="text-slate-400 text-center py-4">Loading employees...</p>
            ) : employees.length === 0 ? (
              <p className="text-slate-400 text-center py-4">No employees found</p>
            ) : (
              <>
                <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                  {employees.map((emp) => (
                    <div
                      key={emp._id}
                      onClick={() => setSelectedEmployee(emp._id)}
                      className={`p-3 rounded-lg cursor-pointer transition border ${
                        selectedEmployee === emp._id
                          ? 'bg-indigo-600/20 border-indigo-500'
                          : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'
                      }`}
                    >
                      <p className="font-semibold text-white">{emp.name}</p>
                      <p className="text-xs text-slate-400">{emp.email}</p>
                      <p className="text-xs text-slate-500">{emp.role}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssignModal(false);
                      setSelectedEmployee(null);
                    }}
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAssignEmail}
                    disabled={!selectedEmployee || assignmentLoading}
                    className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {assignmentLoading ? 'Assigning...' : 'Assign & Create Task'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
