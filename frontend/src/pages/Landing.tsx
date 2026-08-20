import { ArrowRight, CheckCircle, Zap, Users, Mail, Brain, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const { authenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authenticated) {
      navigate('/dashboard');
    }
  }, [authenticated, navigate]);

  const handleSignIn = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-slate-950/80 backdrop-blur-sm z-50 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">
              RG
            </div>
            <div>
              <div className="text-lg font-bold">RGSL WorkSpace</div>
              <div className="text-xs text-slate-400">Task Management</div>
            </div>
          </div>
          <button
            onClick={handleSignIn}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold transition flex items-center gap-2">
            <LogIn size={18} />
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-6 inline-block px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full">
            <span className="text-indigo-300 text-sm font-semibold">🚀 Internal Productivity Platform</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Unified Workspace for RGSL Group
          </h1>

          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
            Streamline workflows across Finance, Trading, Lending, and Compliance departments.
            Real-time collaboration, AI-powered insights, and intelligent task prioritization—unified in one platform.
          </p>

          <button
            onClick={handleSignIn}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold flex items-center justify-center gap-2 transition mx-auto">
            Launch Dashboard <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-12 px-6 bg-slate-800/30">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-indigo-400 mb-2">4</div>
            <p className="text-slate-300">Departments</p>
          </div>
          <div>
            <div className="text-4xl font-bold text-indigo-400 mb-2">Real-Time</div>
            <p className="text-slate-300">Notifications</p>
          </div>
          <div>
            <div className="text-4xl font-bold text-indigo-400 mb-2">AI-Powered</div>
            <p className="text-slate-300">Insights</p>
          </div>
          <div>
            <div className="text-4xl font-bold text-indigo-400 mb-2">Cross-Dept</div>
            <p className="text-slate-300">Collaboration</p>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Core Features</h2>
            <p className="text-slate-300 text-lg">Designed for your workflow, powered by AI</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 hover:border-indigo-500/50 transition">
              <Zap className="text-indigo-400 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-3">Real-Time Updates</h3>
              <p className="text-slate-300">
                Live notifications across all departments. Instant task updates, deadline alerts, and escalation notifications.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 hover:border-indigo-500/50 transition">
              <Brain className="text-indigo-400 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-3">AI Assistant</h3>
              <p className="text-slate-300">
                Personalized insights by role. Get smart recommendations on priorities, deadlines, and workload optimization.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 hover:border-indigo-500/50 transition">
              <Mail className="text-indigo-400 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-3">Gmail Integration</h3>
              <p className="text-slate-300">
                Connect your mailbox. AI classifies emails and auto-creates tasks from important messages.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 hover:border-indigo-500/50 transition">
              <Users className="text-indigo-400 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-3">Team Collaboration</h3>
              <p className="text-slate-300">
                Assign tasks cross-department. Clear visibility on who's doing what across Finance, Trading, Lending, Compliance.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 hover:border-indigo-500/50 transition">
              <CheckCircle className="text-indigo-400 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-3">Smart Escalation</h3>
              <p className="text-slate-300">
                Escalate blocked tasks up the chain. Managers and admins get immediate visibility on roadblocks.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 hover:border-indigo-500/50 transition">
              <Zap className="text-indigo-400 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-3">Role-Based Access</h3>
              <p className="text-slate-300">
                Employees see their tasks. Managers see team workload. Admins see org-wide visibility.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="py-20 px-6 bg-slate-800/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">RGSL Departments</h2>
            <p className="text-slate-300">Connected through unified task management</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { name: 'Finance', color: 'from-green-500/20 to-emerald-600/20', border: 'border-green-500/30' },
              { name: 'Trading', color: 'from-blue-500/20 to-cyan-600/20', border: 'border-blue-500/30' },
              { name: 'Lending', color: 'from-purple-500/20 to-pink-600/20', border: 'border-purple-500/30' },
              { name: 'Compliance', color: 'from-amber-500/20 to-orange-600/20', border: 'border-amber-500/30' },
            ].map((dept) => (
              <div key={dept.name} className={`bg-gradient-to-br ${dept.color} border ${dept.border} rounded-lg p-8 text-center`}>
                <h3 className="text-2xl font-bold">{dept.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Getting Started</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: 1, title: 'Sign In', desc: 'Google OAuth authentication (RGSL internal)' },
              { num: 2, title: 'Set Preferences', desc: 'Link your Gmail, set notification preferences' },
              { num: 3, title: 'Create & Track', desc: 'Build and assign tasks across departments' },
              { num: 4, title: 'Get Insights', desc: 'Let AI guide your priorities and deadlines' },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-full text-xl font-bold">
                  {step.num}
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-slate-300 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-slate-800/30">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-slate-300 mb-8">
            Sign in with your RGSL email to access the dashboard and start managing tasks smarter.
          </p>
          <button
            onClick={handleSignIn}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold text-lg transition flex items-center justify-center gap-2 mx-auto">
            <LogIn size={20} />
            Sign In to Dashboard
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-700 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">About</h4>
              <p className="text-slate-400 text-sm">
                Internal task management and AI productivity platform for RGSL Group's Finance, Trading, Lending, and Compliance teams.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Departments</h4>
              <ul className="space-y-1 text-slate-400 text-sm">
                <li>Finance</li>
                <li>Trading</li>
                <li>Lending</li>
                <li>Compliance</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">Contact IT</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 text-center text-slate-400 text-sm">
            <p>&copy; 2026 RGSL Group. Internal Use Only.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
