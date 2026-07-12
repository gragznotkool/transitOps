import React, { useRef, useState } from 'react';
import { useApp } from '../../lib/context';
import { AddVehicleModal } from '../vehicles/AddVehicleModal';
import { AddDriverModal } from '../drivers/AddDriverModal';
import { 
  useKPIs, 
  useVehicles, 
  useFleetUtilization,
  useFuelEfficiency,
  useCostTrends
} from '../../lib/queries';

import { 
  Truck, 
  Calendar, 
  TrendingUp, 
  Wrench,
  AlertTriangle, 
  Compass, 
  Download, 
  Printer, 
  CheckCircle2,
  Plus
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { FleetMap } from './FleetMap';

export const DashboardScreen: React.FC = () => {
  const { demoMode, filters, darkMode } = useApp();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [twinFilter, setTwinFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showAddDriver, setShowAddDriver] = useState(false);

  // Queries
  const { data: kpis, isLoading: kpisLoading } = useKPIs(demoMode);
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles(demoMode);
  const { data: utilizationData } = useFleetUtilization(demoMode);
  const { data: efficiencyData } = useFuelEfficiency(demoMode);
  const { data: costTrendsData } = useCostTrends(demoMode);

  // Filter vehicles according to global filters + local digital twin filters
  const filteredVehiclesForTwin = vehicles?.filter(v => {
    // Apply global filters first
    const matchesGlobalType = filters.vehicleType === 'all' || v.type === filters.vehicleType;
    const matchesGlobalRegion = filters.region === 'all' || v.region === filters.region;
    const matchesSearch = v.registration_number.toLowerCase().includes(filters.searchQuery.toLowerCase()) || 
                          v.name_model.toLowerCase().includes(filters.searchQuery.toLowerCase());
    
    // Apply local digital twin status filters
    const matchesStatus = twinFilter === 'all' || v.status === twinFilter;

    return matchesGlobalType && matchesGlobalRegion && matchesSearch && matchesStatus;
  });

  // Calculate Predictive Maintenance Alerts Client-Side (Unique Feature #1 preview on Dashboard)
  const getDueMaintenanceCount = () => {
    if (!vehicles) return 0;
    // Assume service due threshold is 5,000 km since last service (calculated as current odometer % 15000 for oils, or absolute threshold)
    // For mock, any vehicle with odometer > 120,000 is marked due soon
    return vehicles.filter(v => v.odometer_km > 120000 && v.status === 'Available').length;
  };


  // PDF Export
  const exportPDF = () => {
    setIsExporting(true);
    const element = dashboardRef.current;
    if (!element) return;

    // Dynamically import html2pdf.js to avoid bundle load warnings
    import('html2pdf.js').then((html2pdfModule) => {
      const html2pdf = html2pdfModule.default || html2pdfModule;
      const opt = {
        margin: 10,
        filename: `transitops-dashboard-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }, pagebreak: { mode: 'avoid-all' }
      };
      
      html2pdf().from(element).set(opt).save().then(() => {
        setIsExporting(false);
      }).catch((err: any) => {
        console.error(err);
        setIsExporting(false);
      });
    }).catch(err => {
      console.error("Failed to load html2pdf.js", err);
      setIsExporting(false);
    });
  };

  // CSV Export (Client-Side generator for reports data)
  const exportCSV = (reportName: string) => {
    let data: any[] = [];
    let headers: string[] = [];

    if (reportName === 'fleet-utilization' && utilizationData) {
      data = utilizationData;
      headers = ['date', 'utilization_pct'];
    } else if (reportName === 'fuel-efficiency' && efficiencyData) {
      data = efficiencyData;
      headers = ['type', 'km_per_liter'];
    } else if (reportName === 'cost-trends' && costTrendsData) {
      data = costTrendsData;
      headers = ['month', 'Fuel', 'Maintenance', 'Tolls', 'Insurance'];
    }

    if (data.length === 0) return;

    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header] ?? '')).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transitops-${reportName}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (kpisLoading || vehiclesLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
        <span className="ml-3 text-slate-500 dark:text-slate-400 font-medium">Loading Dashboard Analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-display">Fleet Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time tracking, metrics, and operations overview. {demoMode && <span className="text-brand-500 font-semibold">(DEMO MODE ACTIVE)</span>}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => exportCSV('fleet-utilization')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-white dark:bg-darkCard hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-darkBorder transition-all"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => setShowAddDriver(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add Driver
          </button>
          <button
            onClick={() => setShowAddVehicle(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add Vehicle
          </button>
          <button
            onClick={exportPDF}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white shadow-sm transition-all disabled:opacity-70"
          >
            {isExporting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <Printer className="w-4 h-4" />
            )}
            Download PDF Report
          </button>
        </div>
      </div>

      {/* Main dashboard content capture boundary for PDF printing */}
      <div ref={dashboardRef} className="space-y-6 p-1 rounded-xl">
        
        {/* KPI Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* Card 1: Utilization */}
          <div className="glass-panel glass-panel-hover p-5 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Fleet Utilization</span>
              <div className="p-2 rounded-lg bg-brand-500/10 text-brand-500">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold font-display text-slate-900 dark:text-white">
                {kpis?.fleet_utilization_pct}%
              </span>
              <div className="mt-2 w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-brand-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${kpis?.fleet_utilization_pct || 0}%` }}
                ></div>
              </div>
            </div>
            <div className="mt-4 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Optimal efficiency threshold met
            </div>
          </div>

          {/* Card 2: Active Vehicles */}
          <div className="glass-panel glass-panel-hover p-5 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Fleet State</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Truck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-display text-slate-900 dark:text-white">
                {kpis?.active_vehicles}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">registered</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t border-slate-100 dark:border-darkBorder/60 pt-3">
              <div>
                <span className="text-slate-400 block">Available:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{kpis?.available_vehicles}</span>
              </div>
              <div>
                <span className="text-slate-400 block">In Shop:</span>
                <span className="font-semibold text-amber-500">{kpis?.in_maintenance}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Trips */}
          <div className="glass-panel glass-panel-hover p-5 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Trips Status</span>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-display text-slate-900 dark:text-white">
                {kpis?.active_trips}
              </span>
              <span className="text-sm text-blue-500 font-semibold">Active Dispatch</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t border-slate-100 dark:border-darkBorder/60 pt-3">
              <div>
                <span className="text-slate-400 block">Pending Drafts:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{kpis?.pending_trips}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Drivers on duty:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{kpis?.drivers_on_duty}</span>
              </div>
            </div>
          </div>

          {/* Card 4: Predictive Maintenance Alert */}
          <div className="glass-panel glass-panel-hover p-5 relative overflow-hidden flex flex-col justify-between border-l-4 border-l-amber-500 dark:border-l-amber-500">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Predictive Maintenance</span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Wrench className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold font-display text-slate-900 dark:text-white">
                {getDueMaintenanceCount()}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">Vehicles Due Soon</span>
            </div>
            <div className="mt-4 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium bg-amber-500/10 px-2 py-1 rounded-md self-start">
              <AlertTriangle className="w-3.5 h-3.5" /> High threshold mileage alerts
            </div>
          </div>

        </div>

        {/* Charts & Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Utilization Area Chart */}
          <div className="glass-panel p-5 lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Fleet Utilization Trend</h3>
                <p className="text-xs text-slate-400">Historical weekly rolling average percentage</p>
              </div>
              <button 
                onClick={() => exportCSV('fleet-utilization')}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-600 transition"
                title="Download CSV Data"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={utilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="utilizationColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6379ff" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6379ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                      borderColor: darkMode ? '#334155' : '#e2e8f0',
                      color: darkMode ? '#f8fafc' : '#0f172a',
                      borderRadius: '8px'
                    }} 
                  />
                  <Area type="monotone" dataKey="utilization_pct" name="Utilization %" stroke="#6379ff" strokeWidth={2} fillOpacity={1} fill="url(#utilizationColor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fuel Efficiency Bar Chart */}
          <div className="glass-panel p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Fuel Efficiency by Type</h3>
                <p className="text-xs text-slate-400">Average kilometers per liter (KM/L)</p>
              </div>
              <button 
                onClick={() => exportCSV('fuel-efficiency')}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-600 transition"
                title="Download CSV Data"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={efficiencyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="type" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                      borderColor: darkMode ? '#334155' : '#e2e8f0',
                      color: darkMode ? '#f8fafc' : '#0f172a',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="km_per_liter" name="KM/L" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} stroke="none" background={{ fill: 'transparent' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cost Trends Stacked Bar Chart */}
          <div className="glass-panel p-5 lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Operational Expense Trends</h3>
                <p className="text-xs text-slate-400">Monthly breakdown of operating costs (USD)</p>
              </div>
              <button 
                onClick={() => exportCSV('cost-trends')}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-600 transition"
                title="Download CSV Data"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costTrendsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#f1f5f9'} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                      borderColor: darkMode ? '#334155' : '#e2e8f0',
                      color: darkMode ? '#f8fafc' : '#0f172a',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Fuel" name="Fuel Logs" stackId="a" fill="#6379ff" />
                  <Bar dataKey="Maintenance" name="Maintenance" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="Tolls" name="Tolls & Fees" stackId="a" fill="#06b6d4" />
                  <Bar dataKey="Insurance" name="Insurance" stackId="a" fill="#ec4899" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Unique Feature 4: "Digital Twin" Fleet Map View */}
        <div className="grid grid-cols-1 gap-6">
          
          {/* Digital Twin Map */}
          <div className="glass-panel p-5 space-y-4 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                  <Compass className="w-5 h-5 text-brand-500 animate-spin-slow" />
                  Digital Twin Fleet View
                </h3>
                <p className="text-xs text-slate-400">Virtual overview of current vehicles status</p>
              </div>
              
              {/* Twin Filter Badges */}
              <div className="flex flex-wrap gap-1.5">
                {['all', 'Available', 'On Trip', 'In Shop', 'Retired'].map(status => (
                  <button
                    key={status}
                    onClick={() => setTwinFilter(status)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-all ${
                      twinFilter === status 
                        ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Virtualized Fleet Grid Grid representing locations */}
            <div className="flex-1 w-full h-[400px]">
              <FleetMap vehicles={filteredVehiclesForTwin || []} />
            </div>
          </div>


        </div>

      </div>

      {/* PDF Export Target boundary end */}
      {showAddVehicle && <AddVehicleModal onClose={() => setShowAddVehicle(false)} />}
      {showAddDriver && <AddDriverModal onClose={() => setShowAddDriver(false)} />}
    </div>

  );
};
