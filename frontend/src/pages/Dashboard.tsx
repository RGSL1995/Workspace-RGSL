import { LogOut, Menu, Mail, MessageSquare, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import Briefing from './Dashboard/Briefing';
import Inbox from './Dashboard/Inbox';
import AIAssistant from './Dashboard/AIAssistant';

type TabType = 'briefing' | 'inbox' | 'assistant' | 'tasks';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('briefing');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Top Navigation */}
      <nav className="bg-slate-900 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-800 rounded-lg transition"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">RGSL WorkSpace</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold text-sm">{user?.name}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 hover:bg-red-600/20 rounded-lg transition text-red-400"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 bg-slate-900 border-r border-slate-700 p-6 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Dashboard</h3>
                <nav className="space-y-2">
                  <button
                    onClick={() => setActiveTab('briefing')}
                    className={`w-full text-left px-3 py-2 rounded-lg font-semibold transition ${
                      activeTab === 'briefing'
                        ? 'bg-indigo-600/20 text-indigo-300'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    Briefing
                  </button>
                  <button
                    onClick={() => setActiveTab('inbox')}
                    className={`w-full text-left px-3 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
                      activeTab === 'inbox'
                        ? 'bg-indigo-600/20 text-indigo-300'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Mail size={16} />
                    Inbox
                  </button>
                  <button
                    onClick={() => setActiveTab('assistant')}
                    className={`w-full text-left px-3 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
                      activeTab === 'assistant'
                        ? 'bg-indigo-600/20 text-indigo-300'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <MessageSquare size={16} />
                    AI Assistant
                  </button>
                  <button
                    onClick={() => setActiveTab('tasks')}
                    className={`w-full text-left px-3 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
                      activeTab === 'tasks'
                        ? 'bg-indigo-600/20 text-indigo-300'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <CheckCircle size={16} />
                    My Tasks
                  </button>
                </nav>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Departments</h3>
                <div className="space-y-1">
                  {user?.departments.map((dept) => (
                    <div
                      key={dept}
                      className="px-3 py-2 rounded-lg text-slate-300 text-sm bg-slate-800/30"
                    >
                      {dept}
                    </div>
                  ))}
                </div>
              </div>

              {user?.role !== 'department_person' && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Admin</h3>
                  <nav className="space-y-2">
                    <a
                      href="#"
                      className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition text-sm"
                    >
                      {user?.role === 'department_head' ? 'Team Overview' : 'All Employees'}
                    </a>
                  </nav>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'briefing' && <Briefing />}
            {activeTab === 'inbox' && <Inbox />}
            {activeTab === 'assistant' && (
              <div className="h-96">
                <AIAssistant />
              </div>
            )}
            {activeTab === 'tasks' && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center">
                <p className="text-slate-400">Tasks will appear here</p>
                <p className="text-sm text-slate-500 mt-2">Create your first task to get started</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
