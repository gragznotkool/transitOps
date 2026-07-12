import React, { useState, useEffect } from 'react';
import { INDIAN_CITIES } from '../../lib/constants';

interface LocationAutocompleteProps {
  label: string;
  value: string;
  onChange: (val: string, lat?: number, lon?: number) => void;
}

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({ label, value, onChange }) => {
  const [isOther, setIsOther] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Sync internal state with external value if it matches a predefined city
  useEffect(() => {
    if (!value) return;
    const predefined = INDIAN_CITIES.find(c => c.name.toLowerCase() === value.toLowerCase());
    if (!predefined && value !== 'Other') {
      setIsOther(true);
      setCustomValue(value);
    } else if (predefined) {
      setIsOther(false);
    }
  }, [value]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === 'Other') {
      setIsOther(true);
      onChange(''); // clear until they type and geocode
    } else {
      setIsOther(false);
      const city = INDIAN_CITIES.find(c => c.name === selected);
      if (city) {
        onChange(city.name, city.lat, city.lon);
      }
    }
  };

  const handleCustomBlur = async () => {
    if (!customValue.trim()) return;
    setIsGeocoding(true);
    try {
      // Nominatim API
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(customValue + ', India')}&format=json&limit=1`, {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
        }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        onChange(customValue, parseFloat(data[0].lat), parseFloat(data[0].lon));
      } else {
        // fallback
        onChange(customValue);
      }
    } catch (err) {
      console.error('Geocoding failed', err);
      onChange(customValue);
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</label>
      
      {!isOther ? (
        <select 
          value={value}
          onChange={handleSelectChange}
          className="w-full text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="" disabled>Select {label}</option>
          {INDIAN_CITIES.map(city => (
            <option key={city.name} value={city.name}>{city.name}</option>
          ))}
          <option value="Other">Other (Search...)</option>
        </select>
      ) : (
        <div className="relative">
          <input 
            type="text" 
            placeholder={`Type ${label} and click outside...`}
            value={customValue}
            onChange={e => setCustomValue(e.target.value)}
            onBlur={handleCustomBlur}
            className="w-full text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-darkBorder text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500 pr-10"
          />
          {isGeocoding && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-xs text-brand-500 animate-pulse">...</span>
            </div>
          )}
          <button 
            type="button"
            onClick={() => { setIsOther(false); onChange(''); setCustomValue(''); }}
            className="text-[10px] text-slate-400 mt-1 hover:text-slate-600 dark:hover:text-slate-300"
          >
            ← Back to predefined list
          </button>
        </div>
      )}
    </div>
  );
};
