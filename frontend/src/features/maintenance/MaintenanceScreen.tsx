import React, { useState } from 'react';
import { useApp } from '../../lib/context';
import { 
  useMaintenanceLogs, 
  useVehicles, 
  useCreateMaintenanceMutation, 
  useCloseMaintenanceMutation 
} from '../../lib/queries';
import { MAINTENANCE_STATUS_COLORS } from '../../lib/statusColors';
import { 
  Plus, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight
} from 'lucide-react';

export const MaintenanceScreen: React.FC = () => {
  const { demoMode } = useApp();
  
  // Queries
  const { data: logs } = useMaintenanceLogs(demoMode);
  const { data: vehicles } = useVehicles(demoMode);

  // Mutations
  const createMaintenanceMutation = useCreateMaintenanceMutation(demoMode);
  const closeMaintenanceMutation = useCloseMaintenanceMutation(demoMode);

  // UI States
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [formState, setFormState] = useState({
    vehicle_id: '',
    service_type: 'Routine Oil Service',
    cost: '',
    description: '',
  });

  // Unique Feature 1: Predictive Maintenance Alerts calculation
  const getPredictiveAlerts = () => {
    if (!vehicles) return [];
    
    return vehicles
      .filter(v => v.status !== 'Retired')
      .map(v => {
        // Find last closed service log for this vehicle
        const vehicleLogs = logs?.filter(l => l.vehicle_id === v.id && l.status === 'Closed') || [];
        
        let kmSinceLastService = v.odometer_km;
        let lastServiceDate = 'Never';

        if (vehicleLogs.length > 0) {
          // Sort by closed_at descending
          const sorted = [...vehicleLogs].sort((a, b) => 
            new Date(b.closed_at || '').getTime() - new Date(a.closed_at || '').getTime()
          );
          
          // Let's assume the odometer was recorded. Since odometer isn't strictly tracked in log,
          // we compute based on current odo vs estimated odo at service. For demonstration,
          // we use simulated values (e.g. 15k km intervals)
          kmSinceLastService = v.odometer_km % 15000;
          lastServiceDate = new Date(sorted[0].closed_at || '').toLocaleDateString();
        }

        // Alert threshold is 12,000 km since last service (approaching 15,000 km limit)
        const isApproachingThreshold = kmSinceLastService > 11500 || v.odometer_km > 120000;
        const percentUntilService = Math.min(Math.round((kmSinceLastService / 15000) * 100), 100);

        return {
          vehicle: v,
          kmSinceLastService: Math.round(kmSinceLastService),
          lastServiceDate,
          isDue: isApproachingThreshold,
          percentUntilService,
        };
      })
      .filter(alert => alert.isDue && alert.vehicle.status === 'Available');
  };

  const handleCreateLog = (e: React.FormEvent) => {
    e.preventDefault();
    createMaintenanceMutation.mutate(
      {
        vehicle_id: Number(formState.vehicle_id),
        service_type: formState.service_type,
        cost: Number(formState.cost),
        description: formState.description,
      },
      {
        onSuccess: () => {
          setShowCreateModal(false);
          setFormState({ vehicle_id: '', service_type: 'Routine Oil Service', cost: '', description: '' });
        },
      }
    );
  };

  const handleCloseTicket = (id: number) => {
    if (confirm('Are you sure you want to close this maintenance ticket? The vehicle will be returned to Available status.')) {
      closeMaintenanceMutation.mutate(id);
    }
  };

  const openScheduleWithVehicle = (vehicleId: number) => {
    setFormState({
      ...formState,
      vehicle_id: vehicleId.toString(),
      description: 'Scheduled via Predictive Maintenance threshold trigger alert.',
    });
    setShowCreateModal(true);
  };

  const alerts = getPredictiveAlerts();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-display">Maintenance Logs</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Track and schedule maintenance operations for the fleet.</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white shadow-sm transition-all self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          Schedule Maintenance
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Maintenance Tickets */}
        <div className="glass-panel p-5 lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Service Tickets</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-darkBorder/60 text-xs text-slate-400 uppercase font-semibold">
                  <th className="pb-3 font-medium">Vehicle / Log</th>
                  <th className="pb-3 font-medium">Description</th>
                  <th className="pb-3 font-medium">Cost / Dates</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-darkBorder/40 text-sm">
                {logs && logs.length > 0 ? (
                  logs.map(log => {
                    const statusColor = MAINTENANCE_STATUS_COLORS[log.status] || MAINTENANCE_STATUS_COLORS.Open;
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition">
                        <td className="py-4 pr-3">
                          <div className="font-bold text-slate-800 dark:text-slate-100 uppercase text-xs flex items-center gap-1">
                            <Wrench className="w-3.5 h-3.5 text-slate-400" />
                            {log.vehicle?.registration_number}
                          </div>
                          <span className="text-xs font-semibold text-brand-500 dark:text-brand-400 block mt-1">{log.service_type}</span>
                        </td>
                        <td className="py-4 px-2 max-w-[200px]">
                          <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{log.description}</span>
                        </td>
                        <td className="py-4">
                          <div className="font-bold text-slate-800 dark:text-slate-150">${log.cost.toLocaleString()}</div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Opened: {new Date(log.created_at).toLocaleDateString()}</span>
                        </td>
                        <td className="py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${statusColor.dot}`} />
                            {log.status}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          {log.status === 'Open' ? (
                            <button
                              onClick={() => handleCloseTicket(log.id)}
                              className="px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition"
                            >
                              Close Ticket
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium flex items-center gap-1 justify-end">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Resolved
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      <Wrench className="w-12 h-12 mx-auto stroke-[1.5] mb-2" />
                      <p className="font-semibold">No maintenance tickets found</p>
                      <p className="text-xs">Schedule maintenance using the button above.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Unique Feature 1: Predictive Maintenance Alerts */}
        <div className="glass-panel p-5 space-y-4 flex flex-col">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
              Predictive Diagnostics
            </h3>
            <p className="text-xs text-slate-400">Vehicles approaching threshold services</p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[420px] pr-1">
            {alerts.length > 0 ? (
              alerts.map(alert => (
                <div 
                  key={alert.vehicle.id} 
                  className="p-4 rounded-xl border border-amber-200/50 bg-amber-500/5 dark:border-amber-900/40 dark:bg-amber-950/10 space-y-3 animate-fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded border border-amber-500/20">
                      {alert.vehicle.registration_number}
                    </span>
                    <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-wider">Due Soon</span>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">{alert.vehicle.name_model}</h4>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Service Interval:</span>
                      <span className="font-semibold text-slate-600 dark:text-slate-300">{alert.kmSinceLastService.toLocaleString()} / 15,000 km</span>
                    </div>

                    {/* Progress Bar representation */}
                    <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-amber-500 h-full rounded-full" 
                        style={{ width: `${alert.percentUntilService}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => openScheduleWithVehicle(alert.vehicle.id)}
                    className="w-full py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-amber-500/30 hover:border-amber-500/60 dark:border-amber-900/40 text-amber-600 dark:text-amber-400 rounded-lg shadow-sm transition flex items-center justify-center gap-1"
                  >
                    Schedule Service <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-12">
                <CheckCircle2 className="w-10 h-10 mb-2 stroke-[1.5] text-emerald-500" />
                <p className="text-sm font-semibold">All vehicles running healthy</p>
                <p className="text-xs text-center">Diagnostics report no critical mileage limits breached.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Schedule Maintenance Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-darkCard rounded-2xl border border-slate-200 dark:border-darkBorder shadow-xl max-w-md w-full p-6 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-darkBorder/40 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Schedule Fleet Service</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateLog} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Select Fleet Vehicle</label>
                <select 
                  required
                  value={formState.vehicle_id}
                  onChange={e => setFormState({ ...formState, vehicle_id: e.target.value })}
                  className="w-full text-sm p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">Choose vehicle...</option>
                  {vehicles?.filter(v => v.status !== 'Retired').map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registration_number} — {v.name_model} ({v.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Service Type</label>
                <select 
                  required
                  value={formState.service_type}
                  onChange={e => setFormState({ ...formState, service_type: e.target.value })}
                  className="w-full text-sm p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="Routine Oil Service">Routine Oil Service</option>
                  <option value="Brake Replacement">Brake Replacement</option>
                  <option value="Engine Check">Engine Check</option>
                  <option value="Tire Rotation / Replacement">Tire Rotation / Replacement</option>
                  <option value="Body Repair">Body Repair</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Estimated Cost ($)</label>
                <input 
                  type="number" 
                  required
                  value={formState.cost}
                  onChange={e => setFormState({ ...formState, cost: e.target.value })}
                  placeholder="e.g. 500"
                  className="w-full text-sm p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Detailed Description</label>
                <textarea 
                  required
                  value={formState.description}
                  onChange={e => setFormState({ ...formState, description: e.target.value })}
                  placeholder="Record issues, items to repair or parts replaced..."
                  rows={3}
                  className="w-full text-sm p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-sm transition animate-pulse-blue"
                >
                  Confirm Service Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
