import React, { useEffect, useRef, useState } from 'react';
import { Vehicle } from '../../lib/api';

interface FleetMapProps {
  vehicles: Vehicle[];
}

const REGION_COORDS: Record<string, [number, number]> = {
  'Mumbai': [19.0760, 72.8777],
  'Delhi-NCR': [28.7041, 77.1025],
  'Bangalore': [12.9716, 77.5946],
  'Chennai': [13.0827, 80.2707],
  'Ahmedabad': [23.0225, 72.5714],
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Available': return '#10b981'; // Emerald
    case 'On Trip': return '#3b82f6'; // Blue
    case 'In Shop': return '#f59e0b'; // Amber
    case 'Suspended': return '#f43f5e'; // Rose
    default: return '#94a3b8'; // Slate
  }
};

export const FleetMap: React.FC<FleetMapProps> = ({ vehicles }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const mapInstance = useRef<any>(null);
  const markersLayer = useRef<any>(null);

  useEffect(() => {
    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    const cssId = 'leaflet-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const scriptId = 'leaflet-js';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setLeafletLoaded(true);
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (!leafletLoaded || !mapRef.current) return;
    const L = (window as any).L;

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([22.0, 79.0], 5);
      
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      }).addTo(mapInstance.current);

      markersLayer.current = L.layerGroup().addTo(mapInstance.current);
    }

    if (markersLayer.current) {
      markersLayer.current.clearLayers();
      
      vehicles.forEach((vehicle) => {
        const baseCoords = REGION_COORDS[vehicle.region];
        if (baseCoords) {
          const lat = baseCoords[0] + (Math.sin(vehicle.id * 10) * 0.05);
          const lng = baseCoords[1] + (Math.cos(vehicle.id * 10) * 0.05);
          
          const color = getStatusColor(vehicle.status);
          
          const iconHtml = `
            <div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>
          `;
          
          const icon = L.divIcon({
            html: iconHtml,
            className: 'custom-leaflet-icon',
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });
          
          const marker = L.marker([lat, lng], { icon });
          marker.bindPopup(`
            <div class="p-1">
              <strong class="block text-sm">${vehicle.registration_number}</strong>
              <span class="block text-xs text-slate-500">${vehicle.name_model}</span>
              <span class="block text-xs mt-1 font-bold" style="color: ${color}">${vehicle.status}</span>
            </div>
          `);
          markersLayer.current.addLayer(marker);
        }
      });
      
      if (vehicles.length > 0 && markersLayer.current.getLayers().length > 0) {
        const group = L.featureGroup(markersLayer.current.getLayers());
        mapInstance.current.fitBounds(group.getBounds().pad(0.5));
      }
    }
  }, [leafletLoaded, vehicles]);

  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-full min-h-[300px] rounded-xl overflow-hidden border border-slate-200/50 dark:border-darkBorder/40 shadow-sm relative z-0 flex-1">
      {!leafletLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900/40">
          <span className="text-sm font-semibold text-slate-400 animate-pulse">Loading map...</span>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full z-0" style={{ height: '100%', minHeight: '400px' }} />
    </div>
  );
};
