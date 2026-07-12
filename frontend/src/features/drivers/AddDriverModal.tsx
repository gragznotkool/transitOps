import React, { useState } from 'react';
import { X, Plus, User as UserIcon } from 'lucide-react';
import { api } from '../../lib/api';
import { useQueryClient } from '@tanstack/react-query';

export const AddDriverModal = ({ onClose }: { onClose: () => void }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    full_name: '',
    license_number: '',
    license_category: 'Heavy Commercial Vehicle (HCV)',
    contact_number: '',
    license_expiry_date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api._fetch('/api/v1/drivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...api.getAuthHeaders()
        },
        body: JSON.stringify(form)
      });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to add driver');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up border border-slate-200 dark:border-darkBorder">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-darkBorder bg-slate-50 dark:bg-slate-800/50">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-brand-500" />
            Add New Driver
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
            <input type="text" required value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="w-full text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500" placeholder="e.g. Ramesh Kumar"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">License Number</label>
            <input type="text" required value={form.license_number} onChange={e => setForm({...form, license_number: e.target.value})} className="w-full text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500" placeholder="e.g. DL-1420230123456"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">License Category</label>
            <select value={form.license_category} onChange={e => setForm({...form, license_category: e.target.value})} className="w-full text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500">
              <option>Heavy Commercial Vehicle (HCV)</option>
              <option>Light Motor Vehicle (LMV)</option>
              <option>Medium Passenger Vehicle</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Contact Number</label>
              <input type="text" required value={form.contact_number} onChange={e => setForm({...form, contact_number: e.target.value})} className="w-full text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500" placeholder="+91..."/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Expiry Date</label>
              <input type="date" required value={form.license_expiry_date} onChange={e => setForm({...form, license_expiry_date: e.target.value})} className="w-full text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"/>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-darkBorder mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-lg flex items-center gap-2 shadow-lg shadow-brand-500/20"><Plus className="w-4 h-4"/> Add Driver</button>
          </div>
        </form>
      </div>
    </div>
  );
};
