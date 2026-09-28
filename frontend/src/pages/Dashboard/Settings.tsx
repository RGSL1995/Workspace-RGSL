import { Settings as SettingsIcon, Upload } from 'lucide-react';
import NotificationSettings from '../../components/NotificationSettings';
import AnchorFreeDateUpload from '../../components/AnchorFreeDateUpload';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

type SettingsTab = 'notifications' | 'anchor';

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('notifications');

  if (!user) {
    return <div>Loading...</div>;
  }

  const tabs = [
    {
      id: 'notifications',
      label: 'Email Notifications',
      icon: SettingsIcon,
      description: 'Configure IPO email notification preferences',
    },
    {
      id: 'anchor',
      label: 'Anchor Free Dates',
      icon: Upload,
      description: 'Upload anchor investor free dates from Excel',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Settings
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your preferences and data
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tabs.map((tab) => {
          const Icon = tab.icon as any;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`text-left p-4 rounded-2xl border transition-all ${
                isActive
                  ? 'bg-brand-50/80 dark:bg-brand-950/50 border-brand-300 dark:border-brand-700 shadow-sm'
                  : 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-xs'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Icon size={18} />
              </div>
              <p
                className={`text-sm font-bold ${
                  isActive
                    ? 'text-brand-700 dark:text-brand-300'
                    : 'text-slate-800 dark:text-slate-200'
                }`}
              >
                {tab.label}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                {tab.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-6 shadow-xs">
        {activeTab === 'notifications' && (
          <NotificationSettings userId={user._id} />
        )}
        {activeTab === 'anchor' && <AnchorFreeDateUpload />}
      </div>
    </div>
  );
}
