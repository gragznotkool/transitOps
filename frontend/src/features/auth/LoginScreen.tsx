import React, { useState } from 'react';
import { useApp } from '../../lib/context';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { Navigation, ShieldCheck, Truck, Zap } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { setCurrentUser } = useApp();
  const [email, setEmail] = useState('admin@transitops.local');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await api.login(email, password);
      setCurrentUser(data.user);
      toast.success(`Welcome back, ${data.user.full_name}!`);
    } catch (err: any) {
      console.error('Login failed', err);
      toast.error('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-slate-900 text-slate-100 overflow-hidden font-sans">
      
      {/* Left Side: Branding / Abstract Art */}
      <div className="hidden lg:flex w-1/2 relative bg-brand-900 items-center justify-center overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Glassmorphic feature cards floating */}
        <div className="relative z-10 p-12 w-full max-w-2xl flex flex-col gap-12">
          <div className="flex items-center gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl">
              <Truck className="w-8 h-8 text-brand-400" />
            </div>
            <div>
              <h3 className="text-2xl font-display font-bold text-white mb-1">Fleet Intelligence</h3>
              <p className="text-slate-300">Real-time tracking and maintenance prediction.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl">
              <Navigation className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-2xl font-display font-bold text-white mb-1">Dynamic Routing</h3>
              <p className="text-slate-300">OSRM-powered dispatch engine for max efficiency.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-2xl font-display font-bold text-white mb-1">Role-Based Security</h3>
              <p className="text-slate-300">Enterprise-grade multi-tenant architecture.</p>
            </div>
          </div>
        </div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="absolute top-0 right-0 w-full h-full bg-slate-900 z-0"></div>
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-brand-600/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="w-full max-w-md space-y-8 relative z-10 bg-slate-800/40 backdrop-blur-2xl p-10 rounded-3xl border border-slate-700/50 shadow-2xl animate-fade-in">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/30 mb-6 group hover:scale-105 transition-transform">
              <Zap className="w-7 h-7 text-white fill-current group-hover:animate-bounce" />
            </div>
            <h2 className="text-3xl font-extrabold text-white font-display tracking-tight">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Sign in to your TransitOps workspace.
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <label htmlFor="email-address" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 placeholder-slate-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 sm:text-sm transition-all shadow-inner"
                  placeholder="admin@transitops.local"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 placeholder-slate-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 sm:text-sm transition-all shadow-inner"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-brand-500 hover:bg-brand-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-brand-500 transition-all shadow-lg shadow-brand-500/20 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  ) : null}
                  {isLoading ? 'Authenticating...' : 'Sign In to Workspace'}
                </span>
                <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
