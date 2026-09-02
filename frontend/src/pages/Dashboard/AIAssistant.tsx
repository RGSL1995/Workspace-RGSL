import { Send, Sparkles, Bot, User, RefreshCw } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { BorderBeam } from '../../components/ui/BorderBeam';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hello! I am RGSL Neural Intelligence core. I can summarize cross-company communications, highlight overdue deliverables, draft operational responses, and prioritize workloads. How can I assist your operations today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'Summarize high-priority emails',
    'What tasks are due today?',
    'Analyze Finance department queue',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/ai/ask`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: textToSend }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: data.answer,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error('Server returned an error');
      }
    } catch (error) {
      console.error('Failed to get AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: 'Neural communication timeout. Please check system connectivity and retry.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col h-full rounded-2xl border border-cyan-500/30 bg-slate-950/80 backdrop-blur-2xl overflow-hidden shadow-[0_0_40px_-10px_rgba(0,245,255,0.15)]">
      {/* Top HUD Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,245,255,0.3)]">
            <Bot size={20} />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-sm text-white tracking-wider">
                CLAUDE NEURAL INTELLIGENCE
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/40 text-purple-300">
                AI ACTIVE
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400">
              Direct telemetry & enterprise operational assistant
            </p>
          </div>
        </div>

        <div className="text-[10px] font-mono text-cyan-400/80 border border-cyan-500/20 px-2.5 py-1 rounded-lg bg-cyan-950/30">
          MODEL: CLAUDE 3.5 SONNET
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => {
          const isUser = message.type === 'user';
          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold border ${
                  isUser
                    ? 'bg-indigo-600/30 border-indigo-400/50 text-indigo-300'
                    : 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300'
                }`}
              >
                {isUser ? <User size={16} /> : <Sparkles size={16} />}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl p-4 font-sans text-sm leading-relaxed ${
                  isUser
                    ? 'bg-gradient-to-r from-indigo-600/90 to-blue-600/90 text-white border border-indigo-400/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                    : 'bg-slate-900/80 border border-white/10 text-slate-200 backdrop-blur-xl'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <span className="text-[10px] font-mono text-slate-400 mt-2 block opacity-70">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </motion.div>
          );
        })}

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
              <Sparkles size={16} className="animate-spin" />
            </div>
            <div className="bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-4 text-xs font-mono text-cyan-300 flex items-center gap-2">
              <RefreshCw size={14} className="animate-spin" />
              <span>Analyzing enterprise matrix...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Chips */}
      <div className="px-6 py-2 bg-slate-950/40 border-t border-white/5 flex gap-2 overflow-x-auto">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={loading}
            className="text-[11px] font-mono whitespace-nowrap px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-950/20 text-cyan-300 hover:border-cyan-400/50 hover:bg-cyan-900/30 transition-all disabled:opacity-50"
          >
            ⚡ {prompt}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900/70 border-t border-white/10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Command neural assistant or ask for operational briefing..."
            disabled={loading}
            className="flex-1 bg-slate-950/80 border border-white/15 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 disabled:opacity-50 transition-all"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="relative group overflow-hidden px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-slate-950 font-bold font-mono transition-all flex items-center justify-center shadow-[0_0_20px_rgba(0,245,255,0.3)]"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
      <BorderBeam size={100} duration={8} colorFrom="#00f5ff" colorTo="#a855f7" />
    </div>
  );
}
