import { useState } from 'react';
import { BarChart3, Users, Mail, Shield } from 'lucide-react';
import DepartmentManagement from './DepartmentManagement';
import AnalyticsDashboard from './AnalyticsDashboard';
import SharedMailboxManagement from './SharedMailboxManagement';

type AdminView = 'analytics' | 'departments' | 'mailboxes';

export default function AdminTab() {
  const [activeView, setActiveView] = useState<AdminView>('analytics');

  const views = [
    {
      id: 'analytics',
      label: 'Analytics Dashboard',
      icon: BarChart3,
      description: 'System-wide metrics and productivity insights',
    },
    {
      id: 'departments',
      label: 'Department Hierarchy',
      icon: Users,
      description: 'Manage departmental roles and personnel allocations',
    },
    {
      id: 'mailboxes',
      label: 'Shared Mailboxes',
      icon: Mail,
      description: 'Manage shared email accounts and team access',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Super Admin Console
          </h2>
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-1">
            <Shield size={12} />
            Privileged
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Global system governance, department organization, and performance telemetry
        </p>
      </div>

      {/* View Switcher Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {views.map((view) => {
          const Icon = view.icon;
          const isActive = activeView === view.id;
          return (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id as AdminView)}
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
                {view.label}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                {view.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-6 shadow-xs">
        {activeView === 'analytics' && <AnalyticsDashboard />}
        {activeView === 'departments' && <DepartmentManagement />}
        {activeView === 'mailboxes' && <SharedMailboxManagement />}
      </div>
    </div>
  );
}
