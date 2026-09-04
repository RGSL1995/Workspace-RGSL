import {
  LogOut,
  Menu,
  Mail,
  MessageSquare,
  CheckCircle2,
  Cpu,
  Shield,
  Activity,
  Sparkles,
  Settings,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Briefing from './Dashboard/Briefing';
import Inbox from './Dashboard/Inbox';
import AIAssistant from './Dashboard/AIAssistant';
import Tasks from './Dashboard/Tasks';
import AssignedTasks from './Dashboard/AssignedTasks';
import IPO from './Dashboard/IPO';
import AdminTab from '../components/AdminPanel/AdminTab';
import ITOperationsPanel from './Dashboard/ITOperationsPanel';
import PinSetupModal from '../components/PinSetupModal';
import { CyberBackground } from '../components/ui/CyberBackground';
import { ThemeToggle } from '../components/ui/ThemeToggle';

type TabType = 'briefing' | 'inbox' | 'assistant' | 'tasks' | 'assigned' | 'ipo' | 'admin' | 'operations';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Check for OAuth redirect params on mount
  const getInitialTab = (): TabType => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('mailbox_added')) return 'operations';
    return 'briefing';
  };

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);
  const [showPinModal, setShowPinModal] = useState(() => !!(user && !user.pin_hash));
  const [successMessage, setSuccessMessage] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');
    if (success) return success;
    if (error) return `Error: ${error}`;
    return '';
  });

  useEffect(() => {
    if (successMessage) {
      window.history.replaceState({}, document.title, window.location.pathname);
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const navItems = [
    { id: 'briefing', label: 'Daily Briefing', icon: Sparkles },
    { id: 'inbox', label: 'Mail Inbox', icon: Mail },
    { id: 'assistant', label: 'AI Assistant', icon: MessageSquare },
    { id: 'tasks', label: 'My Tasks', icon: CheckCircle2 },
    { id: 'assigned', label: 'Assigned Tasks', icon: Activity },
    { id: 'ipo', label: 'IPO Dashboard', icon: TrendingUp },
    ...(user?.role === 'super_admin'
      ? [{ id: 'admin', label: 'Admin Panel', icon: Settings }]
      : []),
    ...(user?.role === 'it_admin'
      ? [{ id: 'operations', label: 'IT Operations', icon: Cpu }]
      : []),
  ];

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden font-sans transition-colors duration-200">
      {/* PIN Setup Modal */}
      <PinSetupModal isOpen={showPinModal} onClose={() => setShowPinModal(false)} />

      {/* Toast Alert */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl border backdrop-blur-md shadow-lg text-sm font-medium flex items-center gap-2 ${
              successMessage.startsWith('Error')
                ? 'bg-rose-50/90 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                : 'bg-emerald-50/90 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full animate-ping"
              style={{ backgroundColor: successMessage.startsWith('Error') ? '#f43f5e' : '#10b981' }}
            />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient Mesh Background */}
      <CyberBackground />

      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b app-header backdrop-blur-xl px-5 py-3 transition-colors shadow-xs">
        <div className="flex items-center justify-between gap-4">
          {/* Left Brand & Toggle */}
          <div className="flex items-center gap-3.5">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition text-slate-800 dark:text-white"
              aria-label="Toggle Navigation Sidebar"
            >
              <Menu size={18} className="text-slate-800 dark:text-white" />
            </motion.button>

            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/25">
                <Layers size={18} className="text-white" />
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight theme-heading">
                  RGSL<span className="text-indigo-600 dark:text-indigo-400">Group</span>
                </h1>
                {/* <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </span> */}
              </div>
            </div>
          </div>

          {/* Right Utilities */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Real-time telemetry pill */}
            {/* <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full theme-card-subtle text-[11px] font-medium">
              <Radio size={12} className="text-emerald-500 animate-pulse" />
              <span className="text-slate-700 dark:text-white font-semibold">Mesh: Active</span>
            </div> */}

            {/* Theme Toggle Button */}
            <ThemeToggle showLabel={false} />

            {/* User Profile Card */}
            <div className="flex items-center gap-2.5 px-2.5 py-1 rounded-xl theme-card-subtle">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white shadow-sm">
                {user?.name ? user.name.substring(0, 2).toUpperCase() : 'RG'}
              </div>
              <div className="hidden md:block text-left pr-1">
                <p className="font-semibold text-xs theme-heading leading-tight">
                  {user?.name || 'Authorized User'}
                </p>
                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-300 capitalize leading-tight">
                  {user?.role?.replace('_', ' ') || 'Member'}
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-white/10 hover:border-rose-200 dark:hover:border-rose-800 rounded-xl transition text-slate-700 dark:text-white hover:text-rose-600 dark:hover:text-rose-400"
              title="Logout Session"
            >
              <LogOut size={16} className="text-slate-700 dark:text-white hover:text-rose-600" />
            </motion.button>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex min-h-[calc(100vh-61px)]">
        {/* Sidebar */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 250, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="relative app-sidebar border-r p-4 overflow-y-auto backdrop-blur-2xl flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-200 mb-2 px-2.5">
                    Workspace
                  </div>

                  <nav className="space-y-1">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <motion.button
                          key={item.id}
                          whileHover={{ x: 3 }}
                          onClick={() => setActiveTab(item.id as TabType)}
                          className={`w-full relative group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                            isActive
                              ? 'bg-[var(--accent-bg)] text-[var(--accent-text)] border border-[var(--border-color)] shadow-xs'
                              : 'text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon
                              size={16}
                              className={
                                isActive
                                  ? 'text-indigo-600 dark:text-indigo-400'
                                  : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-300 dark:group-hover:text-white'
                              }
                            />
                            <span>{item.label}</span>
                          </div>
                          {isActive && (
                            <motion.div
                              layoutId="activeTabIndicator"
                              className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400"
                            />
                          )}
                        </motion.button>
                      );
                    })}
                  </nav>
                </div>

                {/* Assigned Sectors */}
                {user?.departments && user.departments.length > 0 && (
                  <div>
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-200 mb-2 px-2.5">
                      Assigned Sectors
                    </h3>
                    <div className="space-y-1">
                      {user.departments.map((dept) => (
                        <div
                          key={dept}
                          className="px-3 py-2 rounded-xl text-xs font-semibold theme-card-subtle flex items-center justify-between text-slate-800 dark:text-white"
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            {dept}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-300 font-mono">ACTIVE</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Elevated Role Badge */}
                {user?.role && user.role !== 'department_person' && (
                  <div>
                    <h3 className="text-[11px] font-bold uppercase tracking-wider theme-muted mb-2 px-2.5">
                      Permissions
                    </h3>
                    <div className="p-3 rounded-2xl bg-[var(--accent-bg)] border border-[var(--border-color)] text-xs">
                      <div className="flex items-center gap-1.5 font-bold mb-0.5 text-indigo-700 dark:text-indigo-300">
                        <Shield size={14} />
                        <span>Elevated Admin</span>
                      </div>
                      <p className="text-[11px] theme-muted capitalize">
                        {user?.role.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Status */}
              <div className="pt-3 border-t border-[var(--border-color)] text-[11px] theme-muted flex items-center justify-between">
                <span>Enterprise v2.4</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Secure
                </span>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 p-5 sm:p-7 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'briefing' && (
                <motion.div
                  key="briefing"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <Briefing />
                </motion.div>
              )}

              {activeTab === 'inbox' && (
                <motion.div
                  key="inbox"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <Inbox />
                </motion.div>
              )}

              {activeTab === 'assistant' && (
                <motion.div
                  key="assistant"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="h-[680px]"
                >
                  <AIAssistant />
                </motion.div>
              )}

              {activeTab === 'tasks' && (
                <motion.div
                  key="tasks"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <Tasks />
                </motion.div>
              )}

              {activeTab === 'assigned' && (
                <motion.div
                  key="assigned"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <AssignedTasks />
                </motion.div>
              )}

              {activeTab === 'ipo' && (
                <motion.div
                  key="ipo"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <IPO />
                </motion.div>
              )}

              {activeTab === 'admin' && user?.role === 'super_admin' && (
                <motion.div
                  key="admin"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <AdminTab />
                </motion.div>
              )}

              {activeTab === 'operations' && user?.role === 'it_admin' && (
                <motion.div
                  key="operations"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <ITOperationsPanel />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
