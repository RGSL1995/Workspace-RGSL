import { useState } from 'react';
import { Settings, Lock, BarChart3, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export default function ITOperationsPanel() {
  const [activeTab, setActiveTab] = useState<'business' | 'technical'>('business');
  const [systemStatus] = useState({
    database: 'healthy',
    api: 'operational',
    emails: 'syncing',
    lastBackup: '2 hours ago',
  });

  const tabs = [
    { id: 'business', label: '📊 Business Operations', icon: BarChart3 },
    { id: 'technical', label: '🔧 Technical Operations', icon: Settings },
  ];

  const businessSections = [
    {
      title: 'Company Analytics',
      icon: '📊',
      description: 'View and manage company-wide metrics',
      status: 'Available',
    },
    {
      title: 'Employee Management',
      icon: '👥',
      description: 'Manage employees and assignments',
      status: 'Available',
    },
    {
      title: 'Department Management',
      icon: '🏢',
      description: 'Manage departments and organization',
      status: 'Available',
    },
    {
      title: 'Mailbox Management',
      icon: '📬',
      description: 'Control shared mailbox access',
      status: 'Available',
    },
    {
      title: 'Workload Monitoring',
      icon: '📈',
      description: 'Monitor employee workload and distribution',
      status: 'Available',
    },
  ];

  const technicalSections = [
    {
      title: 'System Settings',
      icon: '⚙️',
      description: 'Configure system parameters and settings',
      capabilities: ['API Configuration', 'Email Sync Settings', 'Notification Config'],
    },
    {
      title: 'Security Management',
      icon: '🔐',
      description: 'Manage security and access controls',
      capabilities: ['User Permissions', 'Access Logs', 'Security Alerts'],
    },
    {
      title: 'Database Management',
      icon: '🗄️',
      description: 'Monitor and manage database operations',
      capabilities: ['Database Status', 'Backup Management', 'Data Maintenance'],
    },
    {
      title: 'Monitoring & Logs',
      icon: '📋',
      description: 'View system logs and performance metrics',
      capabilities: ['System Logs', 'Error Tracking', 'Performance Metrics'],
    },
    {
      title: 'Integrations',
      icon: '🔄',
      description: 'Manage external service integrations',
      capabilities: ['Gmail API', 'OAuth Status', 'Webhooks'],
    },
    {
      title: 'Backup Management',
      icon: '💾',
      description: 'Manage system backups and recovery',
      capabilities: ['Backup Status', 'Restore Options', 'Backup History'],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-r from-slate-900/80 via-slate-950/90 to-black/90 p-6 backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-6 h-6 text-yellow-400" />
          <h2 className="text-2xl font-display font-bold text-white tracking-wider">
            IT OPERATIONS DASHBOARD
          </h2>
        </div>
        <p className="text-slate-400 font-mono text-xs">
          Complete control over business operations and technical systems
        </p>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <motion.div
          whileHover={{ y: -2 }}
          className="p-3 rounded-lg border border-cyan-500/30 bg-cyan-950/30 backdrop-blur-sm"
        >
          <div className="text-[10px] font-mono text-cyan-400 mb-1">DATABASE</div>
          <div className="text-sm font-semibold text-cyan-300">{systemStatus.database}</div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="p-3 rounded-lg border border-blue-500/30 bg-blue-950/30 backdrop-blur-sm"
        >
          <div className="text-[10px] font-mono text-blue-400 mb-1">API SERVER</div>
          <div className="text-sm font-semibold text-blue-300">{systemStatus.api}</div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="p-3 rounded-lg border border-purple-500/30 bg-purple-950/30 backdrop-blur-sm"
        >
          <div className="text-[10px] font-mono text-purple-400 mb-1">EMAIL SYNC</div>
          <div className="text-sm font-semibold text-purple-300">{systemStatus.emails}</div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-950/30 backdrop-blur-sm"
        >
          <div className="text-[10px] font-mono text-emerald-400 mb-1">LAST BACKUP</div>
          <div className="text-sm font-semibold text-emerald-300">{systemStatus.lastBackup}</div>
        </motion.div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-3 border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 font-mono text-sm transition-all border-b-2 ${
              activeTab === tab.id
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'business' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {businessSections.map((section, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-4 rounded-lg border border-cyan-500/20 bg-slate-900/60 hover:border-cyan-500/50 hover:bg-slate-900/80 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{section.icon}</span>
                <span className="px-2 py-1 rounded text-[9px] font-mono bg-emerald-500/30 text-emerald-300 border border-emerald-500/40">
                  {section.status}
                </span>
              </div>
              <h3 className="font-semibold text-white mb-1">{section.title}</h3>
              <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                {section.description}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === 'technical' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {technicalSections.map((section, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-4 rounded-lg border border-purple-500/20 bg-slate-900/60 hover:border-purple-500/50 hover:bg-slate-900/80 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-2xl block mb-1">{section.icon}</span>
                  <h3 className="font-semibold text-white">{section.title}</h3>
                </div>
                <Lock size={16} className="text-purple-400 mt-1" />
              </div>
              <p className="text-xs text-slate-400 mb-3">{section.description}</p>
              <div className="space-y-1">
                {section.capabilities.map((cap, cidx) => (
                  <div key={cidx} className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-purple-400"></span>
                    {cap}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Notes */}
      <div className="p-4 rounded-lg border border-white/10 bg-slate-900/40 backdrop-blur-sm">
        <div className="text-sm text-slate-400 space-y-2">
          <p className="font-semibold text-cyan-300">ℹ️ Full System Access</p>
          <p>
            As IT Admin, you have complete access to both business operations and technical systems.
            You can manage all aspects of the platform from employee assignments to system configuration.
          </p>
        </div>
      </div>
    </div>
  );
}
