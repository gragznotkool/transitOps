import React, { useState } from 'react';
import { X, Plus, Truck } from 'lucide-react';
import { api } from '../../lib/api';
import { useQueryClient } from '@tanstack/react-query';

export const AddVehicleModal = ({ onClose }: { onClose: () => void }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    registration_number: '',
    name_model: '',
    type: 'Heavy Duty',
    max_load_capacity_kg: 5000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api._fetch('/api/v1/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...api.getAuthHeaders()
        },
        body: JSON.stringify(form)
      });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to add vehicle');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up border border-slate-200 dark:border-darkBorder">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-darkBorder bg-slate-50 dark:bg-slate-800/50">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Truck className="w-5 h-5 text-brand-500" />
            Add New Vehicle
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Registration No.</label>
            <input type="text" required value={form.registration_number} onChange={e => setForm({...form, registration_number: e.target.value})} className="w-full text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500" placeholder="e.g. MH-01-AB-1234"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Model Name</label>
            <input type="text" required value={form.name_model} onChange={e => setForm({...form, name_model: e.target.value})} className="w-full text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500" placeholder="e.g. Tata Prima"/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Type</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500">
                <option>Heavy Duty</option>
                <option>Medium Duty</option>
                <option>Light Duty</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Capacity (KG)</label>
              <input type="number" required value={form.max_load_capacity_kg} onChange={e => setForm({...form, max_load_capacity_kg: Number(e.target.value)})} className="w-full text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"/>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-darkBorder mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-lg flex items-center gap-2 shadow-lg shadow-brand-500/20"><Plus className="w-4 h-4"/> Add Vehicle</button>
          </div>
        </form>
      </div>
    </div>
  );
};
