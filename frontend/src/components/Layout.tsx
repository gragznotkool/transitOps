import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../lib/context';
import { 
  LayoutDashboard, 
  Navigation, 
  Wrench, 
  DollarSign, 
  Sun, 
  Moon, 
  LogOut, 
  Search, 
  Filter, 
  MapPin, 
  ShieldAlert,
  ChevronDown
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { 
    darkMode, 
    toggleDarkMode, 
    filters, 
    setFilters, 
    currentUser, 
    switchRole,
    demoMode,
    setDemoMode 
  } = useApp();

  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Trips & Dispatch', path: '/trips', icon: Navigation },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench },
    { name: 'Finance & Expenses', path: '/finance', icon: DollarSign },
  ];

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-850 dark:bg-darkBg dark:text-slate-100 transition-colors duration-200">
      
      {/* Sidebar Navigation */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 dark:border-darkBorder bg-white dark:bg-darkCard transition-all">
        {/* Brand header */}
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-slate-100 dark:border-darkBorder/40">
          <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <span className="font-extrabold text-sm tracking-wider">T</span>
          </div>
          <span className="font-extrabold text-lg tracking-tight font-display bg-gradient-to-r from-brand-500 to-indigo-500 bg-clip-text text-transparent">
            TransitOps
          </span>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 py-6 px-4 space-y-1">
          {navItems.map(item => {
            const isActive = currentPath === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive 
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-darkBorder/40 space-y-4">
          
          {/* Demo Mode Toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-darkBorder/50">
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Simulation Mode</span>
              <span className="text-[10px] text-slate-400">Offline Mock Data Engine</span>
            </div>
            <button
              onClick={() => setDemoMode(!demoMode)}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors focus:outline-none ${
                demoMode ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-750'
              }`}
            >
              <div 
                className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ${
                  demoMode ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* User Session Info */}
          {currentUser && (
            <div className="flex items-center justify-between px-2">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[140px]">{currentUser.full_name}</span>
                <span className="text-[10px] font-semibold uppercase text-brand-500 block">{currentUser.role}</span>
              </div>
              <button 
                onClick={() => alert('Log out is disabled during evaluation.')}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Top Header Panel */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-darkBorder bg-white dark:bg-darkCard z-10 transition-colors">
          
          {/* Left panel: Filters / Search */}
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={filters.searchQuery}
                onChange={e => handleFilterChange('searchQuery', e.target.value)}
                placeholder="Search fleet, routes, drivers..."
                className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 transition"
              />
            </div>
          </div>

          {/* Right panel: Filter drop-downs, Role switcher, theme toggle */}
          <div className="flex items-center gap-3">
            
            {/* Region Filter */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filters.region}
                onChange={e => handleFilterChange('region', e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="all">All Regions</option>
                <option value="North">North</option>
                <option value="South">South</option>
                <option value="East">East</option>
                <option value="West">West</option>
              </select>
            </div>

            {/* Vehicle Type Filter */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filters.vehicleType}
                onChange={e => handleFilterChange('vehicleType', e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="all">All Capacities</option>
                <option value="Heavy Duty">Heavy Duty</option>
                <option value="Medium Duty">Medium Duty</option>
                <option value="Light Duty">Light Duty</option>
              </select>
            </div>

            {/* Role Switcher Evaluation Selector */}
            <div className="relative group">
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-darkBorder rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer transition">
                <ShieldAlert className="w-3.5 h-3.5 text-brand-500" />
                <span>Switch Role</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
              
              <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl shadow-lg border border-slate-200 dark:border-darkBorder bg-white dark:bg-darkCard py-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                {['Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst'].map(role => (
                  <button
                    key={role}
                    onClick={() => switchRole(role)}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-800 dark:hover:text-white transition"
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition"
              aria-label="Toggle Theme Mode"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

          </div>
        </header>

        {/* Screen Content Wrapper */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

    </div>
  );
};
