import {
  LogOut,
  Menu,
  Mail,
  MessageSquare,
  CheckCircle,
  Cpu,
  Shield,
  Activity,
  ChevronRight,
  Sparkles,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Briefing from './Dashboard/Briefing';
import Inbox from './Dashboard/Inbox';
import AIAssistant from './Dashboard/AIAssistant';
import AdminTab from '../components/AdminPanel/AdminTab';
import PinSetupModal from '../components/PinSetupModal';
import { CyberBackground } from '../components/ui/CyberBackground';
import { BorderBeam } from '../components/ui/BorderBeam';

type TabType = 'briefing' | 'inbox' | 'assistant' | 'tasks' | 'admin';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('briefing');
  const [showPinModal, setShowPinModal] = useState(() => !!(user && !user.pin_hash));

  const navItems = [
    { id: 'briefing', label: 'Daily Briefing', icon: Sparkles, color: 'text-cyan-400' },
    { id: 'inbox', label: 'Mail Inbox', icon: Mail, color: 'text-indigo-400' },
    { id: 'assistant', label: 'AI Assistant', icon: MessageSquare, color: 'text-purple-400' },
    { id: 'tasks', label: 'Operational Tasks', icon: CheckCircle, color: 'text-emerald-400' },
    ...(user?.role === 'super_admin'
      ? [{ id: 'admin', label: 'Admin Panel', icon: Settings, color: 'text-rose-400' }]
      : []),
  ];

  return (
    <div className="relative min-h-screen w-full bg-[#030712] text-slate-100 overflow-x-hidden font-sans selection:bg-cyan-500/30">
      {/* PIN Setup Modal */}
      <PinSetupModal isOpen={showPinModal} onClose={() => setShowPinModal(false)} />

      {/* Background layer */}
      <CyberBackground />
      <div className="fixed inset-0 pointer-events-none scanline-overlay z-[1] opacity-40" />

      {/* Futuristic Top Navigation HUD */}
      <nav className="relative z-30 border-b border-cyan-500/20 bg-slate-950/70 backdrop-blur-xl px-6 py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-cyan-950/40 border border-white/10 hover:border-cyan-500/40 rounded-xl transition text-slate-300 hover:text-cyan-400 active:scale-95"
              aria-label="Toggle Sidebar"
            >
              <Menu size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Cpu size={18} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-display font-bold tracking-wider text-white">
                    RGSL<span className="text-cyan-400">.</span>HUB
                  </h1>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                    LIVE
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5">
            {/* Live Telemetry Pill */}
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-cyan-300/80 border border-cyan-500/20 bg-cyan-950/30 px-3 py-1.5 rounded-lg">
              <Activity size={14} className="text-cyan-400 animate-spin" />
              <span>LATENCY: 0.9ms</span>
            </div>

            {/* User Profile Badge */}
            <div className="flex items-center gap-3 border border-white/10 bg-slate-900/60 px-3 py-1.5 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-[0_0_12px_rgba(0,245,255,0.4)]">
                {user?.name ? user.name.substring(0, 2).toUpperCase() : 'RG'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="font-semibold text-xs text-white leading-tight">{user?.name}</p>
                <p className="text-[10px] font-mono text-cyan-400/90 leading-tight">
                  {user?.role?.replace('_', ' ').toUpperCase()}
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-2 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 rounded-xl transition text-red-400 hover:text-red-300"
              title="Logout Session"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      <div className="relative z-10 flex min-h-[calc(100vh-65px)]">
        {/* Animated Cyber Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative bg-slate-950/80 border-r border-white/10 p-5 overflow-y-auto backdrop-blur-2xl flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-3 px-1">
                    <span>NAVIGATION MATRIX</span>
                    <span className="text-cyan-400/80 text-[10px]">[ HUD ]</span>
                  </div>

                  <nav className="space-y-1.5">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id as TabType)}
                          className={`w-full relative group flex items-center justify-between px-3.5 py-2.5 rounded-xl font-mono text-xs tracking-wider transition-all duration-300 ${
                            isActive
                              ? 'text-white bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-transparent border border-cyan-500/40 shadow-[0_0_20px_rgba(0,245,255,0.15)] font-semibold'
                              : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 relative z-10">
                            <Icon size={16} className={isActive ? item.color : 'text-slate-400 group-hover:text-white'} />
                            <span>{item.label}</span>
                          </div>
                          {isActive && (
                            <ChevronRight size={14} className="text-cyan-400 animate-pulse" />
                          )}
                          {isActive && (
                            <BorderBeam size={80} duration={6} colorFrom="#00f5ff" colorTo="#818cf8" />
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Departments Section */}
                <div>
                  <h3 className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2.5 px-1">
                    ASSIGNED SECTORS
                  </h3>
                  <div className="space-y-1.5">
                    {user?.departments?.map((dept) => (
                      <div
                        key={dept}
                        className="px-3 py-2 rounded-xl text-xs font-mono text-slate-300 bg-slate-900/40 border border-white/5 flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          {dept}
                        </span>
                        <span className="text-[10px] text-slate-500">SYNCED</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Admin Quick View */}
                {user?.role !== 'department_person' && (
                  <div>
                    <h3 className="text-[11px] font-mono uppercase tracking-wider text-purple-400 mb-2 px-1">
                      SUPERVISOR CORE
                    </h3>
                    <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-950/20 text-xs font-mono text-purple-300">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Shield size={14} />
                        <span className="font-semibold">Elevated Access</span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {user?.role === 'department_head' ? 'Department Head' : 'Super Administrator'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom System Status */}
              <div className="pt-4 border-t border-white/10 text-[10px] font-mono text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>SECURITY:</span>
                  <span className="text-emerald-400">ZERO-TRUST ACTIVE</span>
                </div>
                <div className="flex justify-between">
                  <span>CLUSTER:</span>
                  <span>US-EAST-1 // 100%</span>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'briefing' && (
                <motion.div
                  key="briefing"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                >
                  <Briefing />
                </motion.div>
              )}

              {activeTab === 'inbox' && (
                <motion.div
                  key="inbox"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                >
                  <Inbox />
                </motion.div>
              )}

              {activeTab === 'assistant' && (
                <motion.div
                  key="assistant"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="h-[650px]"
                >
                  <AIAssistant />
                </motion.div>
              )}

              {activeTab === 'tasks' && (
                <motion.div
                  key="tasks"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl border border-cyan-500/20 bg-slate-900/60 backdrop-blur-xl p-10 text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-4">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="font-display font-semibold text-xl text-white mb-2">
                    Neural Task Matrix
                  </h3>
                  <p className="text-slate-400 font-mono text-sm max-w-md mx-auto">
                    Automated tasks extracted by Claude AI from inbound communications will be synchronized here.
                  </p>
                </motion.div>
              )}

              {activeTab === 'admin' && user?.role === 'super_admin' && (
                <motion.div
                  key="admin"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                >
                  <AdminTab />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
