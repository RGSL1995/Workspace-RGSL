import {
  Mail,
  Search,
  Sparkles,
  RefreshCw,
  Clock,
  AlertTriangle,
  Star,
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import EmailDetail from '../../components/EmailDetail';
import { useEmailSocket } from '../../hooks/useEmailSocket';
import { BorderBeam } from '../../components/ui/BorderBeam';

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
  const [density, setDensity] = useState<'compact' | 'comfortable'>('compact');
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

  // Get current user and mailboxes
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

        // Fetch mailboxes (personal + shared)
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
          // Set first mailbox as default
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

  // Socket.io hook for real-time emails
  useEmailSocket(user?._id, (newEmails) => {
    console.log('✨ Adding new emails to dashboard:', newEmails);
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
          classes: 'text-rose-400 bg-rose-950/60 border-rose-500/40',
        };
      case 'action_required':
        return {
          label: 'ACTION',
          icon: Clock,
          classes: 'text-amber-400 bg-amber-950/60 border-amber-500/40',
        };
      default:
        return null;
    }
  };

  const formatSenderName = (fromStr: string) => {
    if (!fromStr) return 'Unknown';
    // Extract name before '<' if present (e.g. "John Doe <john@rgslgroup.com>")
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
    <div className="relative rounded-2xl border border-cyan-500/30 bg-slate-950/85 backdrop-blur-2xl shadow-[0_0_40px_-10px_rgba(0,245,255,0.15)] overflow-hidden flex flex-col h-[calc(100vh-140px)] min-h-[700px]">
      {/* HUD Header Bar */}
      <div className="border-b border-white/10 bg-slate-900/70 px-5 py-3.5 flex-shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(0,245,255,0.3)]">
              <Mail size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-display font-bold text-white tracking-wider">
                  MAIL INBOX
                </h2>

                {/* Mailbox Selector */}
                {mailboxes.length > 0 && (
                  <select
                    value={selectedMailbox}
                    onChange={(e) => {
                      setSelectedMailbox(e.target.value);
                      setPage(1);
                      setEmails([]);
                    }}
                    className="text-[11px] font-mono px-2 py-1 rounded bg-slate-900/80 border border-cyan-500/40 text-cyan-300 hover:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    {mailboxes.map((mailbox) => (
                      <option key={mailbox._id} value={mailbox._id}>
                        {mailbox.type === 'shared' ? '📬 ' : '📧 '}
                        {mailbox.email}
                      </option>
                    ))}
                  </select>
                )}

                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                  {filteredEmails.length} OF {totalCount || emails.length}
                </span>
              </div>
            </div>
          </div>

          {/* Search, Filter & Density Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400/80 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search subject or sender..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950/90 border border-white/15 focus:border-cyan-400 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 transition-all"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex p-0.5 rounded-lg bg-slate-950/90 border border-white/10 gap-0.5">
              {[
                { id: 'all', label: 'ALL' },
                { id: 'unread', label: 'UNREAD' },
                { id: 'important', label: 'CRITICAL' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setFilter(t.id as any)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono tracking-wider transition-all duration-200 ${
                    filter === t.id
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-[0_0_10px_rgba(0,245,255,0.3)]'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Density Switcher */}
            <div className="hidden sm:flex items-center p-0.5 rounded-lg bg-slate-950/90 border border-white/10 gap-0.5">
              <button
                onClick={() => setDensity('compact')}
                className={`px-2 py-1 rounded-md text-[10px] font-mono tracking-wider transition-all ${
                  density === 'compact'
                    ? 'bg-cyan-950/90 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Compact Density (15+ visible)"
              >
                15+ COMPACT
              </button>
              <button
                onClick={() => setDensity('comfortable')}
                className={`px-2 py-1 rounded-md text-[10px] font-mono tracking-wider transition-all ${
                  density === 'comfortable'
                    ? 'bg-cyan-950/90 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Comfortable Density"
              >
                COMFORT
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Split View Content Area */}
      <div className="flex-1 grid lg:grid-cols-12 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-white/10">
        {/* Left Email Stream List */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className={`${
            selectedEmailId ? 'hidden lg:flex lg:col-span-5' : 'col-span-12 lg:col-span-5'
          } flex-col overflow-y-auto h-full p-2 space-y-1`}
        >
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto" />
              <p className="font-mono text-xs text-cyan-300 tracking-wider">
                STREAMING DIRECTIVES...
              </p>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-center text-slate-500 mx-auto">
                <Mail size={20} />
              </div>
              <p className="font-mono text-xs text-slate-400">
                {searchQuery ? 'NO EMAILS MATCHING CRITERIA' : 'INBOX EMPTY'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredEmails.map((email) => {
                const badge = getClassificationBadge(email.classification);
                const isSelected = selectedEmailId === email._id;
                const senderName = formatSenderName(email.from);
                const timestamp = formatTimestamp(email.received_at);

                return (
                  <motion.div
                    key={email._id}
                    onClick={() => setSelectedEmailId(email._id)}
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.15 }}
                    className={`relative rounded-lg cursor-pointer border transition-all select-none ${
                      density === 'compact' ? 'px-3 py-2 min-h-[46px]' : 'p-3.5 min-h-[72px]'
                    } ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_15px_rgba(0,245,255,0.2)]'
                        : email.is_read
                        ? 'bg-slate-900/30 border-white/5 hover:border-cyan-500/30 hover:bg-slate-900/60'
                        : 'bg-slate-900/70 border-white/15 hover:border-cyan-400/50 hover:bg-slate-900/90 font-medium'
                    }`}
                  >
                    {/* Row Item Flex */}
                    <div className="flex items-center gap-2.5 w-full">
                      {/* Unread beacon & Star indicator */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {!email.is_read ? (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f5ff] animate-pulse" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-transparent" />
                        )}
                        {email.is_starred && (
                          <Star size={12} className="text-amber-400 fill-amber-400 flex-shrink-0" />
                        )}
                      </div>

                      {/* Sender Name Column (Fixed width for tabular alignment) */}
                      <div className="w-28 sm:w-32 flex-shrink-0 truncate font-mono text-xs text-slate-200">
                        {senderName}
                      </div>

                      {/* Subject and Snippet Column */}
                      <div className="flex-1 min-w-0 truncate text-xs">
                        <span className={email.is_read ? 'text-slate-300' : 'text-white font-semibold'}>
                          {email.subject || '(No Subject)'}
                        </span>
                        {density === 'comfortable' && email.body && (
                          <span className="text-slate-500 text-[11px] ml-1.5 font-normal">
                            - {email.body.substring(0, 70)}...
                          </span>
                        )}
                      </div>

                      {/* AI Classification Badge */}
                      {badge && (
                        <div className="flex-shrink-0">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-mono font-bold tracking-wider ${badge.classes}`}
                          >
                            <badge.icon size={10} />
                            <span className="hidden sm:inline">{badge.label}</span>
                          </span>
                        </div>
                      )}

                      {/* Mailbox Source Badge (for shared inboxes) */}
                      {email.email_connection_id?.type === 'shared' && (
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-mono font-bold tracking-wider text-purple-300 bg-purple-950/60 border-purple-500/40">
                            📬 {email.email_connection_id.email.split('@')[0]}
                          </span>
                        </div>
                      )}

                      {/* Assignee Badge */}
                      {email.assigned_to && (
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-mono font-bold tracking-wider text-indigo-300 bg-indigo-950/60 border-indigo-500/40">
                            👤 {email.assigned_to.name.split(' ')[0]}
                          </span>
                        </div>
                      )}

                      {/* Timestamp Column */}
                      <div className="w-14 sm:w-16 flex-shrink-0 text-right font-mono text-[10px] text-slate-400">
                        {timestamp}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Auto-loading stream indicator */}
          {loadingMore && (
            <div className="py-3 text-center text-xs font-mono text-cyan-300 flex items-center justify-center gap-2">
              <RefreshCw size={14} className="animate-spin" />
              <span>STREAMING MORE DIRECTIVES...</span>
            </div>
          )}
        </div>

        {/* Right Detail Pane */}
        <div
          className={`${
            selectedEmailId ? 'col-span-12 lg:col-span-7' : 'hidden lg:flex lg:col-span-7'
          } flex flex-col h-full overflow-hidden bg-slate-950/50`}
        >
          {selectedEmailId ? (
            <EmailDetail emailId={selectedEmailId} onClose={() => setSelectedEmailId(null)} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400/80">
                <Sparkles size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-semibold text-base text-white">
                  DIRECTIVE INSPECTOR
                </h3>
                <p className="font-mono text-xs text-slate-400 max-w-sm">
                  Select any email from the stream to read content, review AI synthesis, download attachments, or delegate tasks.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      <BorderBeam size={160} duration={12} colorFrom="#00f5ff" colorTo="#a855f7" />
    </div>
  );
}
