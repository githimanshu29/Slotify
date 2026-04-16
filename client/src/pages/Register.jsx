import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, UserPlus, Calendar, Shield } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex bg-gray-950">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-900 items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/15 via-gray-900 to-violet-600/10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />

        <div className="relative z-10 text-center px-12 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-100">Slotify</h1>
          </div>
          <p className="text-xl text-slate-400 mb-8 leading-relaxed">Your AI Booking Assistant</p>

          <div className="mt-8 space-y-5 text-left max-w-sm mx-auto">
            {[
              { icon: '⚡', title: 'Instant Booking', desc: 'Book in seconds with natural language' },
              { icon: '🤖', title: 'AI-Powered', desc: 'Smart intent extraction from your messages' },
              { icon: '📱', title: 'Manage Easily', desc: 'List, reschedule, or cancel anytime' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <span className="text-2xl mt-0.5">{item.icon}</span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-gray-950">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-11 h-11 bg-gradient-to-br from-cyan-500 to-violet-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100">Slotify</h1>
          </div>

          <h2 className="text-3xl font-bold text-slate-100 mb-2">Create account</h2>
          <p className="text-slate-400 mb-8">Start booking appointments in seconds</p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="register-name" className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
              <input id="register-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required
                className="w-full px-4 py-3.5 rounded-xl bg-gray-800/60 border border-slate-700/50 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all duration-200" />
            </div>

            <div>
              <label htmlFor="register-email" className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
              <input id="register-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required
                className="w-full px-4 py-3.5 rounded-xl bg-gray-800/60 border border-slate-700/50 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all duration-200" />
            </div>

            <div>
              <label htmlFor="register-password" className="block text-sm font-medium text-slate-400 mb-2">Password</label>
              <div className="relative">
                <input id="register-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" required minLength={6}
                  className="w-full px-4 py-3.5 rounded-xl bg-gray-800/60 border border-slate-700/50 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all duration-200 pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-slate-500 text-xs">
                <Shield className="w-3.5 h-3.5" /><span>Minimum 6 characters required</span>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-semibold text-base hover:shadow-lg hover:shadow-violet-600/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><UserPlus className="w-5 h-5" /> Create Account</>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-slate-400 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-400 hover:text-violet-400 font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
