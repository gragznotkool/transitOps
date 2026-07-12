import React, { useState } from 'react';
import { useApp } from '../../lib/context';
import { 
  useFuelLogs, 
  useExpenses, 
  useVehicles, 
  useTrips, 
  useCreateFuelLogMutation, 
  useCreateExpenseMutation 
} from '../../lib/queries';
import { 
  Plus, 
  Fuel, 
  DollarSign, 
  CreditCard, 
  Truck, 
  Percent
} from 'lucide-react';

export const FinanceScreen: React.FC = () => {
  const { demoMode } = useApp();
  
  // Queries
  const { data: fuelLogs } = useFuelLogs(demoMode);
  const { data: expenses } = useExpenses(demoMode);
  const { data: vehicles } = useVehicles(demoMode);
  const { data: trips } = useTrips(demoMode);

  // Mutations
  const createFuelLogMutation = useCreateFuelLogMutation(demoMode);
  const createExpenseMutation = useCreateExpenseMutation(demoMode);

  // UI States
  const [showFuelModal, setShowFuelModal] = useState<boolean>(false);
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);

  // Form States
  const [fuelForm, setFuelForm] = useState({
    vehicle_id: '',
    trip_id: '',
    liters: '',
    cost: '',
    logged_date: new Date().toISOString().split('T')[0],
  });

  const [expenseForm, setExpenseForm] = useState({
    vehicle_id: '',
    category: 'Tolls',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const handleCreateFuelLog = (e: React.FormEvent) => {
    e.preventDefault();
    createFuelLogMutation.mutate(
      {
        vehicle_id: Number(fuelForm.vehicle_id),
        trip_id: fuelForm.trip_id ? Number(fuelForm.trip_id) : null,
        liters: Number(fuelForm.liters),
        cost: Number(fuelForm.cost),
        logged_date: fuelForm.logged_date,
      },
      {
        onSuccess: () => {
          setShowFuelModal(false);
          setFuelForm({ vehicle_id: '', trip_id: '', liters: '', cost: '', logged_date: new Date().toISOString().split('T')[0] });
        },
      }
    );
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    createExpenseMutation.mutate(
      {
        vehicle_id: Number(expenseForm.vehicle_id),
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        expense_date: expenseForm.expense_date,
        notes: expenseForm.notes || null,
      },
      {
        onSuccess: () => {
          setShowExpenseModal(false);
          setExpenseForm({ vehicle_id: '', category: 'Tolls', amount: '', expense_date: new Date().toISOString().split('T')[0], notes: '' });
        },
      }
    );
  };

  // Summaries Calculations
  const calculateSummaries = () => {
    const totalFuel = fuelLogs?.reduce((sum, f) => sum + f.cost, 0) || 0;
    const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
    const totalFuelLiters = fuelLogs?.reduce((sum, f) => sum + f.liters, 0) || 0;
    
    const avgLiterCost = totalFuelLiters > 0 ? (totalFuel / totalFuelLiters).toFixed(2) : '0.00';
    const grandTotal = totalFuel + totalExpenses;

    return {
      totalFuel,
      totalExpenses,
      grandTotal,
      avgLiterCost,
    };
  };

  const metrics = calculateSummaries();

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-display">Finance & Expenses</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage fuel logs, toll expenses, and fleet operational costs.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFuelModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-white dark:bg-darkCard hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-darkBorder transition-all"
          >
            <Fuel className="w-4 h-4 text-brand-500" />
            Log Fuel Purchase
          </button>
          <button
            onClick={() => setShowExpenseModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Fleet Expense
          </button>
        </div>
      </div>

      {/* Aggregated Summaries Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Card 1: Fuel Overhead */}
        <div className="glass-panel p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Fuel Costs</span>
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-500">
              <Fuel className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold font-display text-slate-900 dark:text-white">
              ${metrics.totalFuel.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 block mt-1">Average: ${metrics.avgLiterCost}/L</span>
          </div>
        </div>

        {/* Card 2: Miscellaneous Expenses */}
        <div className="glass-panel p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Operational Expenses</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold font-display text-slate-900 dark:text-white">
              ${metrics.totalExpenses.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 block mt-1">Tolls, insurance, and fees</span>
          </div>
        </div>

        {/* Card 3: Grand Total operating cost */}
        <div className="glass-panel p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Net Operating Costs</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold font-display text-slate-900 dark:text-white">
              ${metrics.grandTotal.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">Accumulated fleet overhead</span>
          </div>
        </div>

        {/* Card 4: Fuel Cost Efficiency ratio */}
        <div className="glass-panel p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Fuel Expenditure Ratio</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold font-display text-slate-900 dark:text-white">
              {metrics.grandTotal > 0 ? Math.round((metrics.totalFuel / metrics.grandTotal) * 100) : 0}%
            </span>
            <span className="text-xs text-slate-400 block mt-1">Percentage of total costs</span>
          </div>
        </div>

      </div>

      {/* Tables Row split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Fuel Purchases Logs */}
        <div className="glass-panel p-5 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Fuel Purchase Logs</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-darkBorder/60 text-xs text-slate-400 uppercase font-semibold">
                  <th className="pb-3 font-medium">Vehicle / Trip</th>
                  <th className="pb-3 font-medium">Volume (L)</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-darkBorder/40 text-sm text-slate-700 dark:text-slate-350">
                {fuelLogs && fuelLogs.length > 0 ? (
                  fuelLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition">
                      <td className="py-4">
                        <span className="font-bold text-slate-800 dark:text-slate-100 uppercase text-xs flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                          {log.vehicle?.registration_number}
                        </span>
                        {log.trip_id && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">Trip Ref: #{log.trip_id}</span>
                        )}
                      </td>
                      <td className="py-4 font-semibold">{log.liters} Liters</td>
                      <td className="py-4 text-xs">{new Date(log.logged_date).toLocaleDateString()}</td>
                      <td className="py-4 text-right font-bold text-slate-800 dark:text-slate-150">${log.cost.toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      <Fuel className="w-12 h-12 mx-auto stroke-[1.5] mb-2" />
                      <p className="font-semibold">No fuel logs found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fleet Miscellaneous Expense logs */}
        <div className="glass-panel p-5 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">General Fleet Expenses</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-darkBorder/60 text-xs text-slate-400 uppercase font-semibold">
                  <th className="pb-3 font-medium">Vehicle / Category</th>
                  <th className="pb-3 font-medium">Notes</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-darkBorder/40 text-sm text-slate-700 dark:text-slate-350">
                {expenses && expenses.length > 0 ? (
                  expenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition">
                      <td className="py-4">
                        <span className="font-bold text-slate-800 dark:text-slate-100 uppercase text-xs flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                          {exp.vehicle?.registration_number}
                        </span>
                        <span className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 block mt-0.5">{exp.category}</span>
                      </td>
                      <td className="py-4 max-w-[200px] truncate text-xs text-slate-500 dark:text-slate-450">{exp.notes || '—'}</td>
                      <td className="py-4 text-xs">{new Date(exp.expense_date).toLocaleDateString()}</td>
                      <td className="py-4 text-right font-bold text-slate-800 dark:text-slate-150">${exp.amount.toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      <CreditCard className="w-12 h-12 mx-auto stroke-[1.5] mb-2" />
                      <p className="font-semibold">No miscellaneous expenses found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Log Fuel Modal */}
      {showFuelModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-darkCard rounded-2xl border border-slate-200 dark:border-darkBorder shadow-xl max-w-md w-full p-6 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-darkBorder/40 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Record Fuel Purchase</h3>
              <button 
                onClick={() => setShowFuelModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateFuelLog} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Select Fleet Vehicle</label>
                <select 
                  required
                  value={fuelForm.vehicle_id}
                  onChange={e => setFuelForm({ ...fuelForm, vehicle_id: e.target.value })}
                  className="w-full text-sm p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">Choose vehicle...</option>
                  {vehicles?.filter(v => v.status !== 'Retired').map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registration_number} — {v.name_model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Reference Trip ID (Optional)</label>
                <select 
                  value={fuelForm.trip_id}
                  onChange={e => setFuelForm({ ...fuelForm, trip_id: e.target.value })}
                  className="w-full text-sm p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">Select trip reference...</option>
                  {trips?.map(t => (
                    <option key={t.id} value={t.id}>
                      #{t.id} — {t.source} to {t.destination} ({t.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Liters Purchased</label>
                  <input 
                    type="number" step="any" required
                    value={fuelForm.liters}
                    onChange={e => setFuelForm({ ...fuelForm, liters: e.target.value })}
                    placeholder="e.g. 140"
                    className="w-full text-sm p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Cost ($)</label>
                  <input 
                    type="number" step="any" required
                    value={fuelForm.cost}
                    onChange={e => setFuelForm({ ...fuelForm, cost: e.target.value })}
                    placeholder="e.g. 250"
                    className="w-full text-sm p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date Logged</label>
                <input 
                  type="date" required
                  value={fuelForm.logged_date}
                  onChange={e => setFuelForm({ ...fuelForm, logged_date: e.target.value })}
                  className="w-full text-sm p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowFuelModal(false)}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-sm transition"
                >
                  Record Fuel Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-darkCard rounded-2xl border border-slate-200 dark:border-darkBorder shadow-xl max-w-md w-full p-6 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-darkBorder/40 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Log Operational Expense</h3>
              <button 
                onClick={() => setShowExpenseModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Select Fleet Vehicle</label>
                <select 
                  required
                  value={expenseForm.vehicle_id}
                  onChange={e => setExpenseForm({ ...expenseForm, vehicle_id: e.target.value })}
                  className="w-full text-sm p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">Choose vehicle...</option>
                  {vehicles?.filter(v => v.status !== 'Retired').map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registration_number} — {v.name_model}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                  <select 
                    required
                    value={expenseForm.category}
                    onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full text-sm p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="Tolls">Tolls</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Permit Fees">Permit Fees</option>
                    <option value="Maintenance Extra">Maintenance Extra</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Amount ($)</label>
                  <input 
                    type="number" required
                    value={expenseForm.amount}
                    onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    placeholder="e.g. 150"
                    className="w-full text-sm p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Expense Date</label>
                <input 
                  type="date" required
                  value={expenseForm.expense_date}
                  onChange={e => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                  className="w-full text-sm p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Notes / Explanation</label>
                <textarea 
                  value={expenseForm.notes}
                  onChange={e => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  placeholder="Record description of operational costs..."
                  rows={2}
                  className="w-full text-sm p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-sm transition"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
