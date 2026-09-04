import {
  Mail,
  Search,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import EmailDetail from '../../components/EmailDetail';
import { useEmailSocket } from '../../hooks/useEmailSocket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface EmailItem {
  _id: string;
  subject: string;
  from: string;
  classification: 'important' | 'action_required' | 'informational' | 'low_priority';
  received_at: string;
  is_read: boolean;
  is_starred?: boolean;
  body?: string;
  confidence_score: number;
  assigned_to?: {
    _id: string;
    name: string;
    email: string;
  };
  email_connection_id?: {
    _id: string;
    email: string;
    type: 'personal' | 'shared';
  };
}

interface MailboxConnection {
  _id: string;
  email: string;
  type: 'personal' | 'shared';
}

export default function Inbox() {
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'important'>('all');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [mailboxes, setMailboxes] = useState<MailboxConnection[]>([]);
  const [selectedMailbox, setSelectedMailbox] = useState<string>('');

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserAndMailboxes = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          credentials: 'include',
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }

        const mailboxRes = await fetch(`${API_URL}/api/email-connections`, {
          credentials: 'include',
        });
        if (mailboxRes.ok) {
          const mailboxData = await mailboxRes.json();
          const all = [
            ...(mailboxData.personal || []),
            ...(mailboxData.shared || []),
          ];
          setMailboxes(all);
          if (all.length > 0) {
            setSelectedMailbox(all[0]._id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user or mailboxes:', error);
      }
    };

    fetchUserAndMailboxes();

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEmailSocket(user?._id, (newEmails) => {
    setEmails((prevEmails) => {
      const newEmailIds = new Set(newEmails.map((e: any) => e._id));
      const filtered = prevEmails.filter((e) => !newEmailIds.has(e._id));
      return [...newEmails, ...filtered];
    });
  });

  useEffect(() => {
    setPage(1);
    setEmails([]);
    fetchEmails(1);
  }, [filter]);

  const fetchEmails = async (pageNum: number) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      }
      let url = `${API_URL}/api/ai/all-emails?page=${pageNum}`;

      if (filter === 'important') {
        url = `${API_URL}/api/ai/important-emails?page=${pageNum}`;
      } else if (filter === 'unread') {
        url = `${API_URL}/api/ai/unread-emails?page=${pageNum}`;
      }

      const response = await fetch(url, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (pageNum === 1) {
          setEmails(data.emails || []);
        } else {
          setEmails((prev) => [...prev, ...(data.emails || [])]);
        }
        setTotalCount(data.count || 0);
        setHasMore(data.hasMore !== false);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Failed to fetch emails:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current || loadingMore || !hasMore) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 80) {
      setLoadingMore(true);
      fetchEmails(page + 1);
    }
  };

  const getClassificationBadge = (classification: string) => {
    switch (classification) {
      case 'important':
        return {
          label: 'CRITICAL',
          icon: AlertTriangle,
          classes: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800',
        };
      case 'action_required':
        return {
          label: 'ACTION REQUIRED',
          icon: Clock,
          classes: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
        };
      default:
        return null;
    }
  };

  const formatSenderName = (fromStr: string) => {
    if (!fromStr) return 'Unknown';
    const match = fromStr.match(/^"?([^"<]+)"?\s*<?/);
    if (match && match[1]?.trim()) {
      return match[1].trim();
    }
    return fromStr.split('@')[0];
  };

  const formatTimestamp = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const filteredEmails = emails.filter((email) => {
    const query = searchQuery.toLowerCase();
    return (
      (email.subject || '').toLowerCase().includes(query) ||
      (email.from || '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="relative rounded-3xl theme-card overflow-hidden flex flex-col h-[calc(100vh-130px)] min-h-[640px]">
      {/* Header Bar */}
      <div className="border-b app-header px-5 py-3.5 flex-shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Mail size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold theme-heading">
                  Mail Inbox
                </h2>

                {mailboxes.length > 0 && (
                  <select
                    value={selectedMailbox}
                    onChange={(e) => {
                      setSelectedMailbox(e.target.value);
                      setPage(1);
                      setEmails([]);
                    }}
                    className="text-xs font-medium px-2.5 py-1 rounded-lg theme-input focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {mailboxes.map((mailbox) => (
                      <option key={mailbox._id} value={mailbox._id}>
                        {mailbox.type === 'shared' ? '📬 ' : '📧 '}
                        {mailbox.email}
                      </option>
                    ))}
                  </select>
                )}

                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full theme-card-subtle theme-muted">
                  {filteredEmails.length} of {totalCount || emails.length}
                </span>
              </div>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search subject or sender..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 theme-input rounded-xl text-xs placeholder-slate-400 focus:outline-none transition-all shadow-xs"
              />
            </div>

            <div className="flex p-0.5 rounded-xl theme-card-subtle gap-0.5">
              {[
                { id: 'all', label: 'All' },
                { id: 'unread', label: 'Unread' },
                { id: 'important', label: 'Priority' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setFilter(t.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filter === t.id
                      ? 'bg-[var(--bg-card)] text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'theme-muted hover:opacity-80'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <button
              onClick={async () => {
                try {
                  setLoading(true);
                  await fetch(`${API_URL}/api/email-connections/sync`, {
                    method: 'POST',
                    credentials: 'include',
                  });
                } catch (e) {
                  // continue
                } finally {
                  setPage(1);
                  fetchEmails(1);
                }
              }}
              className="p-1.5 rounded-xl theme-input hover:opacity-80 transition"
              title="Sync & refresh inbox"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-500' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Email Feed & Detail Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Email List Column */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className={`overflow-y-auto divide-y divide-[var(--border-color)] app-sidebar transition-all ${
            selectedEmailId ? 'w-full lg:w-5/12 border-r border-[var(--border-color)]' : 'w-full'
          }`}
        >
          {loading && emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 theme-muted">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-500 mb-2" />
              <p className="text-xs font-medium">Syncing mail feed...</p>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 theme-muted">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
              <p className="text-sm font-semibold theme-heading">
                Inbox Zero Reached
              </p>
              <p className="text-xs theme-muted mt-1">No emails matching current criteria</p>
            </div>
          ) : (
            filteredEmails.map((email) => {
              const isSelected = selectedEmailId === email._id;
              const badge = getClassificationBadge(email.classification);

              return (
                <motion.div
                  key={email._id}
                  whileHover={{ backgroundColor: 'rgba(99, 102, 241, 0.05)' }}
                  onClick={() => setSelectedEmailId(email._id)}
                  className={`p-3.5 sm:p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[var(--accent-bg)] border-l-4 border-l-indigo-600'
                      : !email.is_read
                      ? 'bg-indigo-50/30 dark:bg-indigo-950/20'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      {!email.is_read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0" />
                      )}
                      <span
                        className={`text-xs truncate ${
                          !email.is_read
                            ? 'font-bold theme-heading'
                            : 'font-medium theme-body'
                        }`}
                      >
                        {formatSenderName(email.from)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {badge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.classes}`}
                        >
                          {badge.label}
                        </span>
                      )}
                      <span className="text-[11px] theme-muted whitespace-nowrap">
                        {formatTimestamp(email.received_at)}
                      </span>
                    </div>
                  </div>

                  <h4
                    className={`text-xs sm:text-sm line-clamp-1 mb-1 ${
                      !email.is_read
                        ? 'font-bold theme-heading'
                        : 'font-medium theme-body'
                    }`}
                  >
                    {email.subject || '(No Subject)'}
                  </h4>

                  {email.body && (
                    <p className="text-xs theme-muted line-clamp-2 leading-relaxed">
                      {email.body}
                    </p>
                  )}
                </motion.div>
              );
            })
          )}

          {loadingMore && (
            <div className="p-4 text-center text-xs theme-muted flex items-center justify-center gap-2">
              <RefreshCw size={14} className="animate-spin text-indigo-500" />
              <span>Loading more emails...</span>
            </div>
          )}
        </div>

        {/* Email Detail Panel */}
        {selectedEmailId && (
          <div className="hidden lg:flex flex-1 flex-col overflow-hidden theme-card">
            <EmailDetail
              emailId={selectedEmailId}
              onClose={() => setSelectedEmailId(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
