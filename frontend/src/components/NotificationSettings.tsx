import { useEffect, useState } from 'react';
import {
  Bell,
  Mail,
  AlertCircle,
  CheckCircle2,
  Settings,
  RefreshCw,
  Send,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface NotificationPreference {
  userId?: string;
  email: string;
  notificationTypes: {
    ipo_new: boolean;
    ipo_status_change: boolean;
    ipo_gmp_update: boolean;
  };
  ipoFilters: {
    allSectors: boolean;
    sectors: string[];
    minPrice: number | null;
    maxPrice: number | null;
  };
  isActive: boolean;
}

interface NotificationSettingsProps {
  userId: string;
}

export default function NotificationSettings({ userId }: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState<NotificationPreference>({
    email: '',
    notificationTypes: {
      ipo_new: true,
      ipo_status_change: true,
      ipo_gmp_update: true,
    },
    ipoFilters: {
      allSectors: true,
      sectors: [],
      minPrice: null,
      maxPrice: null,
    },
    isActive: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sectors, setSectors] = useState<string[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>('types');

  useEffect(() => {
    fetchPreferences();
    fetchSectors();
  }, [userId]);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/notifications/preferences`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      } else {
        throw new Error('Failed to fetch preferences');
      }
    } catch (err) {
      console.error('Fetch preferences error:', err);
      setError('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchSectors = async () => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/sectors`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSectors(data.sectors || []);
      }
    } catch (err) {
      console.error('Fetch sectors error:', err);
    }
  };

  const handleUpdatePreferences = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`${API_URL}/api/notifications/preferences`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      const data = await response.json();
      setPreferences(data);
      setSuccess('Notification settings updated successfully!');

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Update preferences error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    try {
      setTestEmailSending(true);
      setError(null);
      setSuccess(null);

      if (!preferences.email) {
        setError('Please enter an email address first');
        return;
      }

      const response = await fetch(`${API_URL}/api/notifications/test-email`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: preferences.email }),
      });

      if (!response.ok) {
        throw new Error('Failed to send test email');
      }

      setSuccess('Test email sent successfully! Check your inbox.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Send test email error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send test email');
    } finally {
      setTestEmailSending(false);
    }
  };

  const toggleNotificationType = (type: keyof typeof preferences.notificationTypes) => {
    setPreferences({
      ...preferences,
      notificationTypes: {
        ...preferences.notificationTypes,
        [type]: !preferences.notificationTypes[type],
      },
    });
  };

  const toggleSector = (sector: string) => {
    setPreferences({
      ...preferences,
      ipoFilters: {
        ...preferences.ipoFilters,
        sectors: preferences.ipoFilters.sectors.includes(sector)
          ? preferences.ipoFilters.sectors.filter((s) => s !== sector)
          : [...preferences.ipoFilters.sectors, sector],
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-center space-y-3 theme-card rounded-xl">
        <RefreshCw className="w-6 h-6 text-brand-500 animate-spin mx-auto" />
        <p className="text-xs font-semibold theme-muted">Loading notification settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-[var(--border-color)]">
        <Bell className="w-5 h-5 text-brand-500" />
        <h2 className="text-lg font-bold theme-heading">IPO Notification Settings</h2>
      </div>

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 size={16} />
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Email Input */}
      <div className="space-y-2 p-4 rounded-xl theme-card-subtle">
        <label className="block text-xs font-semibold theme-heading">
          Notification Email Address
        </label>
        <input
          type="email"
          value={preferences.email}
          onChange={(e) =>
            setPreferences({ ...preferences, email: e.target.value })
          }
          placeholder="your.email@example.com"
          className="w-full theme-input rounded-lg px-3 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <p className="text-[10px] theme-muted">
          We'll send IPO notifications to this email address
        </p>
      </div>

      {/* Notification Types */}
      <div className="space-y-3 p-4 rounded-xl theme-card-subtle">
        <button
          onClick={() =>
            setExpandedSection(
              expandedSection === 'types' ? null : 'types'
            )
          }
          className="flex items-center justify-between w-full text-xs font-semibold theme-heading hover:opacity-80 transition"
        >
          <span className="flex items-center gap-2">
            <Mail size={14} className="text-brand-500" />
            Notification Types
          </span>
          <span className="text-[10px] theme-muted">
            {expandedSection === 'types' ? '−' : '+'}
          </span>
        </button>

        {expandedSection === 'types' && (
          <div className="space-y-3 mt-3 pt-3 border-t border-[var(--border-color)]">
            {/* New IPO Checkbox */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.notificationTypes.ipo_new}
                onChange={() => toggleNotificationType('ipo_new')}
                className="w-4 h-4 accent-brand-500 rounded"
              />
              <div className="flex-1">
                <p className="text-xs font-semibold theme-heading">New IPO Listed</p>
                <p className="text-[10px] theme-muted">
                  Get notified when a new IPO is listed
                </p>
              </div>
            </label>

            {/* Status Change Checkbox */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.notificationTypes.ipo_status_change}
                onChange={() => toggleNotificationType('ipo_status_change')}
                className="w-4 h-4 accent-brand-500 rounded"
              />
              <div className="flex-1">
                <p className="text-xs font-semibold theme-heading">IPO Status Changes</p>
                <p className="text-[10px] theme-muted">
                  Get notified when IPO status changes (e.g., upcoming → open)
                </p>
              </div>
            </label>

            {/* GMP Update Checkbox */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.notificationTypes.ipo_gmp_update}
                onChange={() => toggleNotificationType('ipo_gmp_update')}
                className="w-4 h-4 accent-brand-500 rounded"
              />
              <div className="flex-1">
                <p className="text-xs font-semibold theme-heading">GMP Updates</p>
                <p className="text-[10px] theme-muted">
                  Get notified when Grey Market Premium is updated
                </p>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* Sector Filters */}
      <div className="space-y-3 p-4 rounded-xl theme-card-subtle">
        <div className="flex items-center justify-between">
          <button
            onClick={() =>
              setExpandedSection(
                expandedSection === 'sectors' ? null : 'sectors'
              )
            }
            className="flex items-center justify-between flex-1 text-xs font-semibold theme-heading hover:opacity-80 transition"
          >
            <span className="flex items-center gap-2">
              <Settings size={14} className="text-brand-500" />
              Sector Filters
            </span>
            <span className="text-[10px] theme-muted">
              {expandedSection === 'sectors' ? '−' : '+'}
            </span>
          </button>
        </div>

        {expandedSection === 'sectors' && (
          <div className="space-y-3 mt-3 pt-3 border-t border-[var(--border-color)]">
            {/* All Sectors Toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.ipoFilters.allSectors}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    ipoFilters: {
                      ...preferences.ipoFilters,
                      allSectors: e.target.checked,
                      sectors: [],
                    },
                  })
                }
                className="w-4 h-4 accent-brand-500 rounded"
              />
              <p className="text-xs font-semibold theme-heading">
                Notify for all sectors
              </p>
            </label>

            {/* Specific Sectors */}
            {!preferences.ipoFilters.allSectors && (
              <div className="grid grid-cols-2 gap-2">
                {sectors.map((sector) => (
                  <label key={sector} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.ipoFilters.sectors.includes(sector)}
                      onChange={() => toggleSector(sector)}
                      className="w-3.5 h-3.5 accent-brand-500 rounded"
                    />
                    <p className="text-xs theme-body">{sector}</p>
                  </label>
                ))}
              </div>
            )}

            {/* Price Range */}
            <div className="space-y-2 pt-3 border-t border-[var(--border-color)]">
              <p className="text-xs font-semibold theme-heading">Price Range (Optional)</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min price (₹)"
                  value={preferences.ipoFilters.minPrice || ''}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      ipoFilters: {
                        ...preferences.ipoFilters,
                        minPrice: e.target.value ? Number(e.target.value) : null,
                      },
                    })
                  }
                  className="theme-input rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <input
                  type="number"
                  placeholder="Max price (₹)"
                  value={preferences.ipoFilters.maxPrice || ''}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      ipoFilters: {
                        ...preferences.ipoFilters,
                        maxPrice: e.target.value ? Number(e.target.value) : null,
                      },
                    })
                  }
                  className="theme-input rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2.5">
        <button
          onClick={handleSendTestEmail}
          disabled={testEmailSending}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-[var(--border-color)] theme-card-subtle text-xs font-semibold theme-heading hover:opacity-80 transition disabled:opacity-40"
        >
          {testEmailSending ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
          Send Test Email
        </button>

        <button
          onClick={handleUpdatePreferences}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-semibold text-xs transition"
        >
          {saving ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <CheckCircle2 size={14} />
          )}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Info Box */}
      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 space-y-1">
        <p className="font-semibold">💡 How it works:</p>
        <p>
          Once enabled, you'll receive email notifications about IPO listings that match your preferences. Use the test email feature to verify your email address.
        </p>
      </div>
    </div>
  );
}
