import { Mail, Star, AlertCircle, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

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

  useEffect(() => {
    fetchEmails();
  }, [filter]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const url =
        filter === 'important'
          ? 'http://localhost:5000/api/ai/important-emails'
          : 'http://localhost:5000/api/ai/unread-emails';

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

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2">
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

      {/* Email List */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-8 text-slate-400">Loading emails...</div>
        ) : emails.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No emails found</div>
        ) : (
          emails.map((email) => (
            <div
              key={email._id}
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-indigo-500/50 transition cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <Mail size={18} className="text-slate-400 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-white truncate">{email.subject}</h3>
                      <p className="text-sm text-slate-400">{email.from}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold flex-shrink-0 ${getClassificationColor(
                        email.classification
                      )}`}
                    >
                      {getClassificationLabel(email.classification)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                      <div
                        className="bg-indigo-500 h-1.5 rounded-full"
                        style={{ width: `${email.confidence_score * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-slate-400">
                      {Math.round(email.confidence_score * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {new Date(email.received_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
