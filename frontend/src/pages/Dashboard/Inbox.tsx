import { Mail, Search, Star, Archive, Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import EmailDetail from '../../components/EmailDetail';
import { useEmailSocket } from '../../hooks/useEmailSocket';

interface EmailItem {
  _id: string;
  subject: string;
  from: string;
  classification: 'important' | 'action_required' | 'informational' | 'low_priority';
  received_at: string;
  is_read: boolean;
  confidence_score: number;
}

export default function Inbox() {
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'important'>('all');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Get current user for Socket.io authentication
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/me', {
          credentials: 'include',
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };

    fetchUser();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Socket.io hook for real-time emails
  useEmailSocket(user?._id, (newEmails) => {
    console.log('✨ Adding new emails to dashboard:', newEmails);
    // Prepend new emails to the list
    setEmails((prevEmails) => {
      const newEmailIds = new Set(newEmails.map((e: any) => e._id));
      const filtered = prevEmails.filter((e) => !newEmailIds.has(e._id));
      return [...newEmails, ...filtered];
    });
  });

  useEffect(() => {
    fetchEmails();
  }, [filter]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      let url = 'http://localhost:5000/api/ai/all-emails';

      if (filter === 'important') {
        url = 'http://localhost:5000/api/ai/important-emails';
      } else if (filter === 'unread') {
        url = 'http://localhost:5000/api/ai/unread-emails';
      }

      const response = await fetch(url, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setEmails(data.emails);
      }
    } catch (error) {
      console.error('Failed to fetch emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'important':
        return 'text-red-400 bg-red-500/10';
      case 'action_required':
        return 'text-amber-400 bg-amber-500/10';
      case 'informational':
        return 'text-blue-400 bg-blue-500/10';
      case 'low_priority':
        return 'text-slate-400 bg-slate-500/10';
      default:
        return 'text-slate-400 bg-slate-500/10';
    }
  };

  const getClassificationLabel = (classification: string) => {
    switch (classification) {
      case 'action_required':
        return 'Action Required';
      case 'low_priority':
        return 'Low Priority';
      default:
        return classification.charAt(0).toUpperCase() + classification.slice(1);
    }
  };

  // Filter emails by search query
  const filteredEmails = emails.filter((email) => {
    const query = searchQuery.toLowerCase();
    return (
      email.subject.toLowerCase().includes(query) ||
      email.from.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      {/* Header Section */}
      <div className="bg-slate-800/50 border-b border-slate-700/50 p-6 backdrop-blur-sm">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Mail size={32} className="text-indigo-400" />
            Inbox
          </h1>
          <p className="text-slate-400">
            {emails.length} email{emails.length !== 1 ? 's' : ''} • {filteredEmails.length} shown
          </p>
        </div>

        {/* Search Box */}
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by subject or sender..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-6 pb-4 border-b border-slate-700/50">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'unread'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Unread
        </button>
        <button
          onClick={() => setFilter('important')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'important'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Important
        </button>
      </div>

      {/* Split-Pane Layout */}
      <div className="flex gap-4 flex-1 overflow-hidden p-6 pt-4">
        {/* Left Pane: Email List (50% desktop, full mobile) */}
        <div className={`${selectedEmailId ? 'hidden md:flex md:w-1/2' : 'w-full md:w-1/2'} flex-col overflow-hidden`}>
          {/* Email List Container */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="text-center py-12 text-slate-400">
                <div className="inline-block animate-spin">⚙️</div>
                <p className="mt-2">Loading emails...</p>
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Mail size={32} className="mx-auto mb-4 opacity-50" />
                <p>{searchQuery ? 'No emails match your search' : 'No emails found'}</p>
              </div>
            ) : (
              <div className="space-y-2">
              {filteredEmails.map((email) => (
                <div
                  key={email._id}
                  onClick={() => setSelectedEmailId(email._id)}
                  className={`rounded-lg p-4 transition cursor-pointer border backdrop-blur-sm ${
                    selectedEmailId === email._id
                      ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50 hover:border-indigo-500/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Mail size={18} className="text-slate-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-white truncate">{email.subject}</h3>
                          <p className="text-sm text-slate-400 truncate">{email.from}</p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold flex-shrink-0 ${getClassificationColor(
                            email.classification
                          )}`}
                        >
                          {getClassificationLabel(email.classification)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        {new Date(email.received_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Email Detail (50% desktop, full mobile) */}
        <div className={`${selectedEmailId ? 'w-full md:w-1/2' : 'hidden md:flex md:w-1/2'} overflow-hidden flex-col`}>
          {selectedEmailId ? (
            <EmailDetail emailId={selectedEmailId} onClose={() => setSelectedEmailId(null)} />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400">
              <p>Select an email to read</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
