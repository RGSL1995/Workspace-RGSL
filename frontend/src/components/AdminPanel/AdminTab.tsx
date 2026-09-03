import { useState } from 'react';
import { Settings, BarChart3, Users, Mail } from 'lucide-react';
import DepartmentManagement from './DepartmentManagement';
import AnalyticsDashboard from './AnalyticsDashboard';
import SharedMailboxManagement from './SharedMailboxManagement';

type AdminView = 'departments' | 'analytics' | 'mailboxes';

export default function AdminTab() {
  const [activeView, setActiveView] = useState<AdminView>('analytics');

  const views = [
    {
      id: 'analytics',
      label: 'Analytics Dashboard',
      icon: BarChart3,
      description: 'View system-wide metrics and insights',
    },
    {
      id: 'departments',
      label: 'Departments',
      icon: Users,
      description: 'Manage departments and assignments',
    },
    {
      id: 'mailboxes',
      label: 'Shared Mailboxes',
      icon: Mail,
      description: 'Manage shared email inboxes and access',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-slate-900/80 via-slate-950/90 to-black/90 p-6 backdrop-blur-2xl">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-6 h-6 text-cyan-400" />
          <h2 className="text-2xl font-display font-bold text-white tracking-wider">
            ADMIN CONTROL PANEL
          </h2>
        </div>
        <p className="text-slate-400 font-mono text-xs">
          System administration, analytics, and department management
        </p>
      </div>

      {/* View Switcher */}
      <div className="grid grid-cols-2 gap-3">
        {views.map((view) => {
          const Icon = view.icon;
          const isActive = activeView === view.id;
          return (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id as AdminView)}
              className={`relative rounded-xl border p-4 transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-transparent border-cyan-400 shadow-[0_0_20px_rgba(0,245,255,0.15)]'
                  : 'border-white/10 bg-slate-900/60 hover:border-cyan-500/30 hover:bg-slate-900/80'
              }`}
            >
              <Icon className={`w-5 h-5 mb-2 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <div className="text-left">
                <p className={`font-mono text-sm font-semibold ${isActive ? 'text-white' : 'text-slate-300'}`}>
                  {view.label}
                </p>
                <p className="font-mono text-[11px] text-slate-500 mt-1">{view.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/60 backdrop-blur-xl p-6">
        {activeView === 'analytics' && <AnalyticsDashboard />}
        {activeView === 'departments' && <DepartmentManagement />}
        {activeView === 'mailboxes' && <SharedMailboxManagement />}
      </div>
    </div>
  );
}
