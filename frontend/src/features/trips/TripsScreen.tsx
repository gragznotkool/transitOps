import React, { useState } from 'react';
import { useApp } from '../../lib/context';
import { 
  useTrips, 
  useVehicles, 
  useDrivers,
  useCreateTripMutation,
  useDispatchTripMutation,
  useCompleteTripMutation,
  useCancelTripMutation
} from '../../lib/queries';
import { TRIP_STATUS_COLORS } from '../../lib/statusColors';
import { LocationAutocomplete } from '../../components/ui/LocationAutocomplete';
import { api } from '../../lib/api';
import { 
  Plus, 
  Navigation, 
  User as UserIcon, 
  Truck, 
  Clock, 
  ArrowRight,
  Calculator,
  CheckCircle2,
  XCircle,
  FileText
} from 'lucide-react';

export const TripsScreen: React.FC = () => {
  const { demoMode, filters } = useApp();
  
  // Queries
  const { data: trips } = useTrips(demoMode);
  const { data: vehicles } = useVehicles(demoMode);
  const { data: drivers } = useDrivers(demoMode);

  // Mutations
  const createTripMutation = useCreateTripMutation(demoMode);
  const dispatchTripMutation = useDispatchTripMutation(demoMode);
  const completeTripMutation = useCompleteTripMutation(demoMode);
  const cancelTripMutation = useCancelTripMutation(demoMode);

  // UI state
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showCompleteModalId, setShowCompleteModalId] = useState<number | null>(null);
  const [showSimulator, setShowSimulator] = useState<boolean>(false);

  // Complete Trip Form State
  const [actualDistance, setActualDistance] = useState<string>('');
  const [finalOdometer, setFinalOdometer] = useState<string>('');
  const [fuelConsumed, setFuelConsumed] = useState<string>('');

  // Create Trip Form State
  const [tripForm, setTripForm] = useState({
    source: '',
    destination: '',
    vehicle_id: '',
    driver_id: '',
    cargo_weight_kg: '',
    planned_distance_km: '',
  });

  // Simulator Form State
  const [simForm, setSimForm] = useState({
    source: 'Depot A',
    destination: 'Depot B',
    distance: '350',
    weight: '6000',
    source_lat: undefined as number | undefined,
    source_lon: undefined as number | undefined,
    dest_lat: undefined as number | undefined,
    dest_lon: undefined as number | undefined,
  });

  const selectedTrip = trips?.find(t => t.id === selectedTripId);

  const [liveFuelPrice, setLiveFuelPrice] = useState(111.45);
  
  // Fetch live fuel prices on mount
  React.useEffect(() => {
    api.getFuelPrices().then(res => {
      if (res && res.price) setLiveFuelPrice(res.price);
    }).catch(console.error);
  }, []);

  // Fetch OSRM driving distance when coordinates change
  React.useEffect(() => {
    if (simForm.source_lat && simForm.source_lon && simForm.dest_lat && simForm.dest_lon) {
      fetch(`http://router.project-osrm.org/route/v1/driving/${simForm.source_lon},${simForm.source_lat};${simForm.dest_lon},${simForm.dest_lat}?overview=false`)
        .then(res => res.json())
        .then(data => {
          if (data.routes && data.routes[0]) {
            const distKm = (data.routes[0].distance / 1000).toFixed(1);
            setSimForm(prev => ({ ...prev, distance: distKm }));
          }
        }).catch(err => console.error('OSRM fetch error:', err));
    }
  }, [simForm.source_lat, simForm.source_lon, simForm.dest_lat, simForm.dest_lon]);


  // Filtered lists for dropdown selection (only show Available ones)
  const availableVehicles = vehicles?.filter(v => v.status === 'Available');
  const availableDrivers = drivers?.filter(d => d.status === 'Available');

  // Route Cost Simulator logic (Unique Feature #2)
  const runSimulation = () => {
    if (!vehicles) return [];
    const distance = Number(simForm.distance) || 0;
    const weight = Number(simForm.weight) || 0;

    return vehicles
      .filter(v => v.status !== 'Retired')
      .map(v => {
        const capacityOk = v.max_load_capacity_kg >= weight;
        
        // Efficiency mapping
        let kmPerLiter = 4.0; // default Heavy
        if (v.type === 'Light Duty') kmPerLiter = 8.5;
        else if (v.type === 'Medium Duty') kmPerLiter = 6.0;

        const fuelCost = capacityOk ? (distance / kmPerLiter) * liveFuelPrice : 0; // Live ₹/liter
        const driverCost = capacityOk ? distance * 12.5 : 0; // ₹12.5 per km driver wage
        const totalCost = fuelCost + driverCost;

        return {
          vehicle: v,
          capacityOk,
          fuelCost: Math.round(fuelCost),
          driverCost: Math.round(driverCost),
          totalCost: Math.round(totalCost),
        };
      })
      .sort((a, b) => {
        if (!a.capacityOk && b.capacityOk) return 1;
        if (a.capacityOk && !b.capacityOk) return -1;
        return a.totalCost - b.totalCost;
      });
  };

  const handleCreateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    createTripMutation.mutate(
      {
        source: tripForm.source,
        destination: tripForm.destination,
        vehicle_id: Number(tripForm.vehicle_id),
        driver_id: Number(tripForm.driver_id),
        cargo_weight_kg: Number(tripForm.cargo_weight_kg),
        planned_distance_km: Number(tripForm.planned_distance_km),
      },
      {
        onSuccess: () => {
          setShowCreateModal(false);
          setTripForm({ source: '', destination: '', vehicle_id: '', driver_id: '', cargo_weight_kg: '', planned_distance_km: '' });
        },
      }
    );
  };

  const handleDispatchTrip = (id: number) => {
    dispatchTripMutation.mutate(id);
  };

  const handleCompleteTripSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showCompleteModalId === null) return;
    
    completeTripMutation.mutate(
      {
        id: showCompleteModalId,
        metrics: {
          actual_distance_km: Number(actualDistance),
          final_odometer: Number(finalOdometer),
          fuel_consumed_liters: Number(fuelConsumed),
        },
      },
      {
        onSuccess: () => {
          setShowCompleteModalId(null);
          setActualDistance('');
          setFinalOdometer('');
          setFuelConsumed('');
        },
      }
    );
  };

  const handleCancelTrip = (id: number) => {
    if (confirm('Are you sure you want to cancel this trip?')) {
      cancelTripMutation.mutate(id);
    }
  };

  // Filter trips based on global context search & filter
  const filteredTrips = trips?.filter(t => {
    const matchesGlobalStatus = filters.status === 'all' || t.status === filters.status;
    const matchesSearch = t.source.toLowerCase().includes(filters.searchQuery.toLowerCase()) || 
                          t.destination.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
                          t.vehicle?.registration_number.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
                          t.driver?.full_name.toLowerCase().includes(filters.searchQuery.toLowerCase());
    return matchesGlobalStatus && matchesSearch;
  });

  const simResults = runSimulation();

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-display">Trips & Dispatch</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Create, monitor, and dispatch trips across your fleet.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-white dark:bg-darkCard hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-darkBorder transition-all"
          >
            <Calculator className="w-4 h-4 text-brand-500" />
            Cost Simulator
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Plan Trip
          </button>
        </div>
      </div>

      {/* Unique Feature 2: Route Cost Simulator Dashboard Panel */}
      {showSimulator && (
        <div className="glass-panel p-5 border-l-4 border-l-brand-500 animate-slide-up space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-darkBorder pb-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
              <Calculator className="w-5 h-5 text-brand-500" />
              Pre-Trip Route Cost Simulator (Live Fuel: ₹{liveFuelPrice}/L)
            </h3>
            <span className="text-xs text-slate-400">Compare efficiency models before dispatching</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <LocationAutocomplete 
                label="From"
                value={simForm.source}
                onChange={(val, lat, lon) => setSimForm({ ...simForm, source: val, source_lat: lat, source_lon: lon })}
              />
            </div>
            <div>
              <LocationAutocomplete 
                label="To"
                value={simForm.destination}
                onChange={(val, lat, lon) => setSimForm({ ...simForm, destination: val, dest_lat: lat, dest_lon: lon })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Distance (KM)</label>
              <input 
                type="number" 
                value={simForm.distance}
                onChange={e => setSimForm({ ...simForm, distance: e.target.value })}
                className="w-full text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Cargo Weight (KG)</label>
              <input 
                type="number" 
                value={simForm.weight}
                onChange={e => setSimForm({ ...simForm, weight: e.target.value })}
                className="w-full text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
            {simResults.slice(0, 3).map((res, i) => (
              <div 
                key={res.vehicle.id} 
                className={`p-4 rounded-xl border relative flex flex-col justify-between ${
                  !res.capacityOk 
                    ? 'bg-slate-100/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-60'
                    : i === 0 
                      ? 'bg-brand-500/5 dark:bg-brand-500/10 border-brand-500/40 shadow-sm'
                      : 'bg-white dark:bg-darkCard border-slate-200 dark:border-darkBorder/60'
                }`}
              >
                {i === 0 && res.capacityOk && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-500 text-white rounded text-[10px] font-bold">
                    Most Efficient
                  </span>
                )}
                
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Truck className="w-4 h-4 text-slate-400" />
                    <span className="font-bold text-xs uppercase text-slate-500 dark:text-slate-400">
                      {res.vehicle.registration_number}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{res.vehicle.name_model}</h4>
                  <span className="text-[11px] text-slate-400 block mt-1">{res.vehicle.type} (Cap: {res.vehicle.max_load_capacity_kg.toLocaleString()} kg)</span>
                </div>

                <div className="mt-4 border-t border-slate-100 dark:border-darkBorder/40 pt-3">
                  {!res.capacityOk ? (
                    <span className="text-rose-500 text-xs font-semibold flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Exceeds vehicle load capacity
                    </span>
                  ) : (
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-400">Est. Total Cost:</span>
                      <span className="text-lg font-extrabold text-slate-800 dark:text-slate-200">₹{res.totalCost}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main split grid (Trips Table + Timeline Audit drawer) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trips Table */}
        <div className="glass-panel p-5 lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Active Trips Logs</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-darkBorder/60 text-xs text-slate-400 uppercase font-semibold">
                  <th className="pb-3 font-medium">Route / Cargo</th>
                  <th className="pb-3 font-medium">Vehicle / Driver</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-darkBorder/40 text-sm">
                {filteredTrips && filteredTrips.length > 0 ? (
                  filteredTrips.map(trip => {
                    const statusColor = TRIP_STATUS_COLORS[trip.status] || TRIP_STATUS_COLORS.Draft;
                    return (
                      <tr 
                        key={trip.id} 
                        className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition cursor-pointer ${
                          selectedTripId === trip.id ? 'bg-brand-500/5 dark:bg-brand-500/10' : ''
                        }`}
                        onClick={() => setSelectedTripId(trip.id)}
                      >
                        <td className="py-4 pr-3">
                          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-100 font-bold">
                            <span>{trip.source}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                            <span>{trip.destination}</span>
                          </div>
                          <span className="text-xs text-slate-400 block mt-1">Cargo: {trip.cargo_weight_kg.toLocaleString()} kg | Dist: {trip.planned_distance_km} km</span>
                        </td>
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium text-xs">
                            <Truck className="w-3.5 h-3.5" /> {trip.vehicle?.registration_number}
                          </div>
                          <div className="flex items-center gap-1 text-slate-400 text-[11px] mt-1">
                            <UserIcon className="w-3.5 h-3.5" /> {trip.driver?.full_name}
                          </div>
                        </td>
                        <td className="py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${statusColor.dot}`} />
                            {trip.status}
                          </span>
                        </td>
                        <td className="py-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {trip.status === 'Draft' && (
                              <>
                                <button
                                  onClick={() => handleDispatchTrip(trip.id)}
                                  className="px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition"
                                >
                                  Dispatch
                                </button>
                                <button
                                  onClick={() => handleCancelTrip(trip.id)}
                                  className="px-2.5 py-1 text-xs font-bold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-600 dark:text-slate-300 transition"
                                >
                                  Cancel
                                </button>
                              </>
                            )}

                            {trip.status === 'Dispatched' && (
                              <>
                                <button
                                  onClick={() => setShowCompleteModalId(trip.id)}
                                  className="px-2.5 py-1 text-xs font-bold rounded-md bg-brand-500 hover:bg-brand-600 text-white shadow-sm transition"
                                >
                                  Complete
                                </button>
                                <button
                                  onClick={() => handleCancelTrip(trip.id)}
                                  className="px-2.5 py-1 text-xs font-bold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-600 dark:text-slate-300 transition"
                                >
                                  Cancel
                                </button>
                              </>
                            )}

                            {trip.status === 'Completed' && (
                              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Archived
                              </span>
                            )}

                            {trip.status === 'Cancelled' && (
                              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5 text-rose-500" /> Cancelled
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      <Navigation className="w-12 h-12 mx-auto stroke-[1.5] mb-2" />
                      <p className="font-semibold">No planned trips found</p>
                      <p className="text-xs">Create a new planned trip using the "Plan Trip" button.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Unique Feature 5: One-Click Audit Trail / Trip Timeline Drawer */}
        <div className="glass-panel p-5 space-y-4 flex flex-col">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-500" />
              Timeline Audit Trail
            </h3>
            <p className="text-xs text-slate-400">Trip progression steps & state logs</p>
          </div>

          {selectedTrip ? (
            <div className="flex-1 space-y-6 pt-4 relative border-l-2 border-slate-200 dark:border-darkBorder ml-3.5">
              
              {/* Step 1: Draft Creation (Always occurs first) */}
              <div className="relative pl-6">
                <span className="absolute -left-1.5 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-slate-400 bg-white dark:bg-darkBg" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Trip Planned (Draft)</h4>
                  <span className="text-[10px] text-slate-400 font-semibold block">
                    <Clock className="w-3 h-3 inline mr-1" /> Initializing payload state
                  </span>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-darkBorder/40 text-[11px] text-slate-500">
                    Planned path: {selectedTrip.source} to {selectedTrip.destination}. Assigned vehicle {selectedTrip.vehicle?.registration_number} and driver {selectedTrip.driver?.full_name}.
                  </div>
                </div>
              </div>

              {/* Step 2: Dispatched */}
              {selectedTrip.dispatched_at && (
                <div className="relative pl-6">
                  <span className="absolute -left-1.5 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-blue-500 bg-white dark:bg-darkBg" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400">Dispatched Operation</h4>
                    <span className="text-[10px] text-slate-400 font-semibold block">
                      <Clock className="w-3 h-3 inline mr-1" /> {new Date(selectedTrip.dispatched_at).toLocaleString()}
                    </span>
                    <div className="p-2 rounded-lg bg-blue-500/5 border border-blue-500/10 text-[11px] text-slate-500">
                      State machine trigger: vehicle set to "On Trip", driver set to "On Trip". Idempotency checks passed.
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Complete / Cancel */}
              {selectedTrip.status === 'Completed' && selectedTrip.completed_at && (
                <div className="relative pl-6">
                  <span className="absolute -left-1.5 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-emerald-500 bg-white dark:bg-darkBg" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Trip Completed</h4>
                    <span className="text-[10px] text-slate-400 font-semibold block">
                      <Clock className="w-3 h-3 inline mr-1" /> {new Date(selectedTrip.completed_at).toLocaleString()}
                    </span>
                    <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-[11px] text-slate-500 space-y-1.5">
                      <p>Final status updates applied successfully. Vehicle & Driver returned to Available.</p>
                      <div className="grid grid-cols-2 gap-2 border-t border-emerald-500/10 pt-2 text-[10px]">
                        <div>
                          <span className="text-slate-400">Actual Odometer:</span>
                          <span className="block font-bold text-slate-700 dark:text-slate-200">{selectedTrip.final_odometer} km</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Fuel Consumed:</span>
                          <span className="block font-bold text-slate-700 dark:text-slate-200">{selectedTrip.fuel_consumed_liters} L</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedTrip.status === 'Cancelled' && (
                <div className="relative pl-6">
                  <span className="absolute -left-1.5 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-rose-500 bg-white dark:bg-darkBg" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-rose-500">Operation Cancelled</h4>
                    <span className="text-[10px] text-slate-400 font-semibold block">
                      <Clock className="w-3 h-3 inline mr-1 text-rose-500" /> Cancelled state
                    </span>
                    <div className="p-2 rounded-lg bg-rose-500/5 border border-rose-500/10 text-[11px] text-slate-500">
                      Vehicle & driver allocations reset back to available state successfully.
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-12">
              <Clock className="w-10 h-10 mb-2 stroke-[1.5]" />
              <p className="text-sm font-semibold">No trip selected</p>
              <p className="text-xs text-center">Click on any trip in the table list to see its step timeline.</p>
            </div>
          )}
        </div>

      </div>

      {/* Complete Trip Modal */}
      {showCompleteModalId !== null && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-darkCard rounded-2xl border border-slate-200 dark:border-darkBorder shadow-xl max-w-md w-full p-6 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-darkBorder/40 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Record Completion Metrics</h3>
              <button 
                onClick={() => setShowCompleteModalId(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCompleteTripSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Actual Distance Covered (KM)</label>
                <input 
                  type="number"
                  required
                  value={actualDistance}
                  onChange={e => setActualDistance(e.target.value)}
                  placeholder="e.g. 355"
                  className="w-full text-sm p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Final Odometer Reading (KM)</label>
                <input 
                  type="number"
                  required
                  value={finalOdometer}
                  onChange={e => setFinalOdometer(e.target.value)}
                  placeholder="e.g. 124855"
                  className="w-full text-sm p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Fuel Consumed (Liters)</label>
                <input 
                  type="number"
                  required
                  value={fuelConsumed}
                  onChange={e => setFuelConsumed(e.target.value)}
                  placeholder="e.g. 125"
                  className="w-full text-sm p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCompleteModalId(null)}
                  className="flex-1 py-2 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-sm font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition"
                >
                  Record & Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plan Trip Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-darkCard rounded-2xl border border-slate-200 dark:border-darkBorder shadow-xl max-w-lg w-full p-6 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-darkBorder/40 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Plan New Fleet Trip</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateTrip} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <LocationAutocomplete 
                    label="Origin Hub"
                    value={tripForm.source}
                    onChange={(val) => setTripForm({ ...tripForm, source: val })}
                  />
                </div>
                <div>
                  <LocationAutocomplete 
                    label="Destination Hub"
                    value={tripForm.destination}
                    onChange={(val) => setTripForm({ ...tripForm, destination: val })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cargo Weight (KG)</label>
                  <input 
                    type="number" required
                    value={tripForm.cargo_weight_kg}
                    onChange={e => setTripForm({ ...tripForm, cargo_weight_kg: e.target.value })}
                    placeholder="e.g. 5000"
                    className="w-full text-sm p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Planned Distance (KM)</label>
                  <input 
                    type="number" required
                    value={tripForm.planned_distance_km}
                    onChange={e => setTripForm({ ...tripForm, planned_distance_km: e.target.value })}
                    placeholder="e.g. 350"
                    className="w-full text-sm p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Assign Vehicle</label>
                  <select 
                    required
                    value={tripForm.vehicle_id}
                    onChange={e => setTripForm({ ...tripForm, vehicle_id: e.target.value })}
                    className="w-full text-sm p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="">Select Vehicle...</option>
                    {availableVehicles?.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.registration_number} — {v.name_model} (Cap: {v.max_load_capacity_kg} kg)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Assign Driver</label>
                  <select 
                    required
                    value={tripForm.driver_id}
                    onChange={e => setTripForm({ ...tripForm, driver_id: e.target.value })}
                    className="w-full text-sm p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="">Select Driver...</option>
                    {availableDrivers?.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.full_name} — CDL: {d.license_number}
                      </option>
                    ))}
                  </select>
                </div>
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
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-sm transition"
                >
                  Plan Draft Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
