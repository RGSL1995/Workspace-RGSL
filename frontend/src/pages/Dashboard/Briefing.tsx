import { Lightbulb, Clock, AlertCircle, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface BriefingData {
  employee_name: string;
  active_tasks: number;
  overdue_tasks: number;
  upcoming_deadlines: string[];
  important_emails: string[];
  briefing: string;
}

export default function Briefing() {
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBriefing();
  }, []);

  const fetchBriefing = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/ai/briefing`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setBriefing(data);
      }
    } catch (error) {
      console.error('Failed to fetch briefing:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-indigo-600/20 to-blue-600/20 border border-indigo-500/30 rounded-lg p-6 text-center">
        <p className="text-slate-300">Loading your briefing...</p>
      </div>
    );
  }

  if (!briefing) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Main Briefing Card */}
      <div className="bg-gradient-to-br from-indigo-600/20 to-blue-600/20 border border-indigo-500/30 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <Lightbulb className="text-indigo-400 flex-shrink-0 mt-1" size={24} />
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Daily Briefing</h2>
            <p className="text-slate-300">{briefing.briefing}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Tasks */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Clock className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm text-slate-400">Active Tasks</p>
              <p className="text-2xl font-bold text-white">{briefing.active_tasks}</p>
              {briefing.overdue_tasks > 0 && (
                <p className="text-sm text-red-400 mt-1">
                  {briefing.overdue_tasks} overdue
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Emails */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Mail className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm text-slate-400">Important Emails</p>
              <p className="text-2xl font-bold text-white">{briefing.important_emails.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      {briefing.upcoming_deadlines.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-start gap-3 mb-3">
            <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <h3 className="font-semibold text-white">Upcoming Deadlines</h3>
          </div>
          <ul className="space-y-2 ml-7">
            {briefing.upcoming_deadlines.map((deadline, i) => (
              <li key={i} className="text-sm text-slate-300">
                • {deadline}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Important Emails Preview */}
      {briefing.important_emails.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-start gap-3 mb-3">
            <Mail className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
            <h3 className="font-semibold text-white">Important Emails</h3>
          </div>
          <ul className="space-y-2 ml-7">
            {briefing.important_emails.map((email, i) => (
              <li key={i} className="text-sm text-slate-300 line-clamp-2">
                • {email}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={fetchBriefing}
        className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg py-2 text-slate-300 text-sm font-semibold transition"
      >
        Refresh Briefing
      </button>
    </div>
  );
}
