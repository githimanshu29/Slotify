import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import {
  Send, Calendar, LogOut, MessageSquare, Bot, User, Sparkles,
  ClipboardList, X as XIcon, Menu, LayoutDashboard,
} from 'lucide-react';

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 animate-slide-left">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shrink-0">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-gray-800/60 border border-slate-700/50 rounded-2xl rounded-bl-md px-5 py-4">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 bg-slate-500 rounded-full"
              style={{ animation: `pulse-dot 1.4s ease-in-out ${i * 0.16}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const renderText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={i} className="font-semibold text-slate-100">{part.slice(2, -2)}</strong>;
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className={`flex items-end gap-3 ${isUser ? 'flex-row-reverse animate-slide-right' : 'animate-slide-left'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        isUser ? 'bg-gradient-to-br from-purple-500 to-violet-600' : 'bg-gradient-to-br from-violet-600 to-cyan-500'
      }`}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>
      <div className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
        isUser
          ? 'bg-gradient-to-r from-violet-600 to-purple-500 text-white rounded-br-md'
          : 'bg-gray-800/60 border border-slate-700/50 text-slate-300 rounded-bl-md'
      }`}>
        {isUser ? message.content : renderText(message.content)}
      </div>
    </div>
  );
}

const quickActions = [
  { label: 'Book Appointment', prompt: 'I want to book an appointment', icon: Calendar },
  { label: 'My Bookings', prompt: 'Show my bookings', icon: ClipboardList },
  { label: 'Cancel Booking', prompt: 'I want to cancel a booking', icon: XIcon },
];

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: "Hey there! 👋 I'm your Slotify booking assistant.\n\nI can help you:\n• **Book** an appointment\n• **List** your existing bookings\n• **Cancel** a booking\n\nJust tell me what you need!",
    }]);
  }, []);

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);
    try {
      const { data } = await API.post('/chat', { message: userMsg });
      setMessages((prev) => [...prev, { role: 'assistant', content: data.data.reply, refCode: data.data.refCode }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: "Sorry, something went wrong. Please try again. 🙁" }]);
    } finally { setIsTyping(false); inputRef.current?.focus(); }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div className="h-screen flex bg-gray-950 overflow-hidden">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-gray-900 border-r border-slate-700/50 flex flex-col transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-500 rounded-xl flex items-center justify-center shadow-md shadow-violet-600/20">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100">Slotify</h1>
              <p className="text-xs text-slate-500">AI Booking Assistant</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-600/10 border border-violet-600/20 text-purple-400">
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm font-medium">Chat</span>
          </div>
          {isAdmin && (
            <Link to="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-gray-800/60 hover:text-slate-100 transition-all duration-200">
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-sm font-medium">Admin Panel</span>
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
              <span className="text-white text-sm font-semibold">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-100 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 text-sm">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-700/50 flex items-center justify-between px-4 sm:px-6 bg-gray-900/50 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-gray-800/60 transition-colors">
              <Menu className="w-5 h-5 text-slate-400" />
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-semibold text-slate-100">AI Assistant</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-500 hidden sm:block">Online</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.map((msg, i) => <ChatMessage key={i} message={msg} />)}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {messages.length <= 1 && (
          <div className="px-4 sm:px-6 pb-2">
            <div className="flex flex-wrap gap-2 justify-center">
              {quickActions.map((action) => (
                <button key={action.label} onClick={() => sendMessage(action.prompt)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800/60 border border-slate-700/50 text-slate-400 hover:text-purple-400 hover:border-violet-600/30 hover:bg-violet-600/5 transition-all duration-200 text-sm">
                  <action.icon className="w-4 h-4" /> {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 sm:p-6 pt-2 sm:pt-2 border-t border-slate-700/50 bg-gray-900/30">
          <div className="flex items-end gap-3 max-w-4xl mx-auto">
            <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Type your message..." rows={1}
              className="flex-1 px-4 py-3.5 rounded-xl bg-gray-800/60 border border-slate-700/50 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all duration-200 resize-none text-sm"
              style={{ maxHeight: '120px' }} />
            <button onClick={() => sendMessage()} disabled={!input.trim() || isTyping}
              className="p-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white hover:shadow-lg hover:shadow-violet-600/25 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 shrink-0">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
