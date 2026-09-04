import { useState } from 'react';
import { Settings, Lock, BarChart3, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import SharedMailboxManagement from '../../components/AdminPanel/SharedMailboxManagement';
import ConnectSharedEmail from '../../components/AdminPanel/ConnectSharedEmail';
import { GlowCard } from '../../components/ui/GlowCard';

export default function ITOperationsPanel() {
  const [activeTab, setActiveTab] = useState<'business' | 'technical' | 'mailboxes'>('business');
  const [systemStatus] = useState({
    database: 'Healthy',
    api: 'Operational',
    emails: 'Active Sync',
    lastBackup: '2 hrs ago',
  });

  const tabs = [
    { id: 'business', label: 'Business Ops', icon: BarChart3 },
    { id: 'technical', label: 'Infrastructure', icon: Settings },
    { id: 'mailboxes', label: 'Shared Mailboxes', icon: Mail },
  ];

  const businessSections = [
    {
      title: 'Company Analytics',
      icon: '📊',
      description: 'View and manage company-wide metrics and KPIs',
      status: 'Ready',
    },
    {
      title: 'Employee Directory',
      icon: '👥',
      description: 'Manage staff roles, sectors, and access permissions',
      status: 'Active',
    },
    {
      title: 'Department Sectors',
      icon: '🏢',
      description: 'Manage department organizational hierarchies',
      status: 'Synced',
    },
    {
      title: 'Mailbox Access',
      icon: '📬',
      description: 'Control shared mailbox delegations and credentials',
      status: 'Active',
    },
    {
      title: 'Workload Telemetry',
      icon: '📈',
      description: 'Monitor employee throughput and queue distribution',
      status: 'Live',
    },
  ];

  const technicalSections = [
    {
      title: 'System Configuration',
      icon: '⚙️',
      description: 'Configure core platform parameters and environment keys',
      capabilities: ['API Configuration', 'Email Sync Intervals', 'Notification Webhooks'],
    },
    {
      title: 'Security & Access',
      icon: '🔐',
      description: 'Manage zero-trust policies and role-based permissions',
      capabilities: ['RBAC Permissions', 'Audit Logs', 'Session Invalidation'],
    },
    {
      title: 'Database Cluster',
      icon: '🗄️',
      description: 'Monitor MongoDB replication, query times, and indexes',
      capabilities: ['Database Health', 'Index Performance', 'TTL Policies'],
    },
    {
      title: 'Telemetry & Logs',
      icon: '📋',
      description: 'Inspect live server logs and error stack traces',
      capabilities: ['Realtime Socket Logs', 'Error Reporting', 'Latency Tracking'],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          IT Operations Control
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Infrastructure health, shared mailboxes, and enterprise system management
        </p>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <GlowCard className="p-3.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Database
          </div>
          <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {systemStatus.database}
          </div>
        </GlowCard>

        <GlowCard className="p-3.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            API Gateway
          </div>
          <div className="text-base sm:text-lg font-bold text-sky-600 dark:text-sky-400 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            {systemStatus.api}
          </div>
        </GlowCard>

        <GlowCard className="p-3.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Mailbox Sync
          </div>
          <div className="text-base sm:text-lg font-bold text-brand-600 dark:text-brand-400 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-500" />
            {systemStatus.emails}
          </div>
        </GlowCard>

        <GlowCard className="p-3.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Last Snapshot
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200 mt-1">
            {systemStatus.lastBackup}
          </div>
        </GlowCard>
      </div>

      {/* Tab Switcher */}
      <div className="flex p-1 rounded-xl theme-card-subtle w-fit gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-white hover:text-indigo-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Business Operations Grid */}
      {activeTab === 'business' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {businessSections.map((section, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl shadow-xs hover:shadow-md transition-all space-y-2.5"
            >
              <div className="flex items-start justify-between">
                <span className="text-2xl">{section.icon}</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {section.status}
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{section.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {section.description}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Technical Operations Grid */}
      {activeTab === 'technical' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {technicalSections.map((section, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl shadow-xs hover:shadow-md transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{section.icon}</span>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    {section.title}
                  </h3>
                </div>
                <Lock size={15} className="text-slate-400" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {section.description}
              </p>
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                {section.capabilities.map((cap, cidx) => (
                  <div key={cidx} className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                    <span>{cap}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Shared Mailboxes Management Tab */}
      {activeTab === 'mailboxes' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl shadow-xs">
            <div className="mb-5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                📬 Connect New Shared Mailbox
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Authorize a new shared mailbox with Google OAuth credentials
              </p>
            </div>
            <ConnectSharedEmail />
          </div>

          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl shadow-xs">
            <div className="mb-5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                👥 Manage Mailbox Assignments
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Assign and revoke team member access to shared mailboxes
              </p>
            </div>
            <SharedMailboxManagement />
          </div>
        </div>
      )}
    </div>
  );
}
