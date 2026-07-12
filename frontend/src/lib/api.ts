// API client for backend communication with localStorage-backed mock fallbacks.

export interface Vehicle {
  id: number;
  registration_number: string;
  name_model: string;
  type: string;
  max_load_capacity_kg: number;
  acquisition_cost: number;
  region: string;
  status: string;
  odometer_km: number;
}

export interface Driver {
  id: number;
  full_name: string;
  license_number: string;
  license_category: string;
  license_expiry_date: string;
  contact_number: string;
  status: string;
  safety_score?: number; // Unique Feature 3: Driver Leaderboard
  harsh_braking_events?: number;
  speeding_events?: number;
}

export interface Trip {
  id: number;
  source: string;
  destination: string;
  vehicle_id: number;
  driver_id: number;
  cargo_weight_kg: number;
  planned_distance_km: number;
  actual_distance_km: number | null;
  final_odometer: number | null;
  fuel_consumed_liters: number | null;
  status: string;
  dispatched_at: string | null;
  completed_at: string | null;
  // Populated in client queries
  vehicle?: Vehicle;
  driver?: Driver;
}

export interface MaintenanceLog {
  id: number;
  vehicle_id: number;
  service_type: string;
  cost: number;
  description: string;
  status: string;
  created_at: string;
  closed_at: string | null;
  vehicle?: Vehicle;
}

export interface FuelLog {
  id: number;
  vehicle_id: number;
  trip_id: number | null;
  liters: number;
  cost: number;
  logged_date: string;
  vehicle?: Vehicle;
}

export interface Expense {
  id: number;
  vehicle_id: number;
  category: string;
  amount: number;
  expense_date: string;
  notes: string | null;
  vehicle?: Vehicle;
}

export interface KPIs {
  active_vehicles: number;
  available_vehicles: number;
  in_maintenance: number;
  active_trips: number;
  pending_trips: number;
  drivers_on_duty: number;
  fleet_utilization_pct: number;
}

// --- Local Storage Database Mocking ---
const INITIAL_VEHICLES: Vehicle[] = [
  { id: 1, registration_number: 'TRK-001', name_model: 'Volvo VNL 860', type: 'Heavy Duty', max_load_capacity_kg: 22000, acquisition_cost: 145000, region: 'North', status: 'Available', odometer_km: 124500 },
  { id: 2, registration_number: 'VAN-005', name_model: 'Ford Transit 350', type: 'Light Duty', max_load_capacity_kg: 1800, acquisition_cost: 48000, region: 'North', status: 'Available', odometer_km: 34200 },
  { id: 3, registration_number: 'TRK-002', name_model: 'Freightliner Cascadia', type: 'Heavy Duty', max_load_capacity_kg: 24000, acquisition_cost: 155000, region: 'South', status: 'On Trip', odometer_km: 89000 },
  { id: 4, registration_number: 'TRK-003', name_model: 'Kenworth T680', type: 'Heavy Duty', max_load_capacity_kg: 23000, acquisition_cost: 160000, region: 'East', status: 'In Shop', odometer_km: 198000 },
  { id: 5, registration_number: 'VAN-004', name_model: 'Mercedes Sprinter', type: 'Light Duty', max_load_capacity_kg: 2200, acquisition_cost: 52000, region: 'West', status: 'Available', odometer_km: 67100 },
];

const INITIAL_DRIVERS: Driver[] = [
  { id: 1, full_name: 'Alice Johnson', license_number: 'DL-12345', license_category: 'CDL-A', license_expiry_date: '2027-08-15', contact_number: '555-0100', status: 'Available', safety_score: 96, harsh_braking_events: 1, speeding_events: 0 },
  { id: 2, full_name: 'Michael Smith', license_number: 'DL-67890', license_category: 'CDL-A', license_expiry_date: '2026-11-20', contact_number: '555-0101', status: 'On Trip', safety_score: 84, harsh_braking_events: 4, speeding_events: 2 },
  { id: 3, full_name: 'Sarah Connor', license_number: 'DL-45612', license_category: 'CDL-B', license_expiry_date: '2028-02-10', contact_number: '555-0102', status: 'Available', safety_score: 98, harsh_braking_events: 0, speeding_events: 0 },
  { id: 4, full_name: 'David Miller', license_number: 'DL-89012', license_category: 'Class D', license_expiry_date: '2025-05-18', contact_number: '555-0103', status: 'Suspended', safety_score: 62, harsh_braking_events: 12, speeding_events: 8 },
  { id: 5, full_name: 'Robert Chen', license_number: 'DL-34567', license_category: 'CDL-A', license_expiry_date: '2027-04-30', contact_number: '555-0104', status: 'Off Duty', safety_score: 91, harsh_braking_events: 2, speeding_events: 1 },
];

const INITIAL_TRIPS: Trip[] = [
  { id: 1, source: 'Chicago Depot', destination: 'Detroit Logistics Center', vehicle_id: 3, driver_id: 2, cargo_weight_kg: 18500, planned_distance_km: 450, actual_distance_km: null, final_odometer: null, fuel_consumed_liters: null, status: 'Dispatched', dispatched_at: new Date(Date.now() - 3600000 * 4).toISOString(), completed_at: null },
  { id: 2, source: 'Dallas Port', destination: 'Houston Hub', vehicle_id: 1, driver_id: 1, cargo_weight_kg: 12000, planned_distance_km: 380, actual_distance_km: 382, final_odometer: 124500, fuel_consumed_liters: 120, status: 'Completed', dispatched_at: new Date(Date.now() - 86400000 * 2).toISOString(), completed_at: new Date(Date.now() - 86400000 * 2 + 3600000 * 5).toISOString() },
  { id: 3, source: 'Seattle Yard', destination: 'Portland Warehouse', vehicle_id: 2, driver_id: 3, cargo_weight_kg: 1200, planned_distance_km: 280, actual_distance_km: 279, final_odometer: 34200, fuel_consumed_liters: 35, status: 'Completed', dispatched_at: new Date(Date.now() - 86400000 * 5).toISOString(), completed_at: new Date(Date.now() - 86400000 * 5 + 3600000 * 3.5).toISOString() },
  { id: 4, source: 'Atlanta Terminal', destination: 'Miami Hub', vehicle_id: 5, driver_id: 5, cargo_weight_kg: 950, planned_distance_km: 1060, actual_distance_km: null, final_odometer: null, fuel_consumed_liters: null, status: 'Draft', dispatched_at: null, completed_at: null },
];

const INITIAL_MAINTENANCE: MaintenanceLog[] = [
  { id: 1, vehicle_id: 4, service_type: 'Brake Replacement', cost: 1250, description: 'Replaced front and rear brake pads and rotors due to wear.', status: 'Open', created_at: new Date(Date.now() - 86400000 * 3).toISOString(), closed_at: null },
  { id: 2, vehicle_id: 1, service_type: 'Routine Oil Service', cost: 240, description: 'Engine oil change and lube service. Standard 15,000 km check.', status: 'Closed', created_at: new Date(Date.now() - 86400000 * 15).toISOString(), closed_at: new Date(Date.now() - 86400000 * 15 + 3600000 * 4).toISOString() },
];

const INITIAL_FUEL: FuelLog[] = [
  { id: 1, vehicle_id: 1, trip_id: 2, liters: 120, cost: 216, logged_date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0] },
  { id: 2, vehicle_id: 2, trip_id: 3, liters: 35, cost: 63, logged_date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0] },
  { id: 3, vehicle_id: 3, trip_id: 1, liters: 140, cost: 252, logged_date: new Date().toISOString().split('T')[0] },
];

const INITIAL_EXPENSES: Expense[] = [
  { id: 1, vehicle_id: 4, category: 'Tolls', amount: 85, expense_date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], notes: 'Highway toll charges across states' },
  { id: 2, vehicle_id: 2, category: 'Insurance', amount: 450, expense_date: new Date(Date.now() - 86400000 * 10).toISOString().split('T')[0], notes: 'Monthly fleet vehicle insurance' },
];

// Initialize localStorage databases if not present
const initStorage = () => {
  if (!localStorage.getItem('to_vehicles')) localStorage.setItem('to_vehicles', JSON.stringify(INITIAL_VEHICLES));
  if (!localStorage.getItem('to_drivers')) localStorage.setItem('to_drivers', JSON.stringify(INITIAL_DRIVERS));
  if (!localStorage.getItem('to_trips')) localStorage.setItem('to_trips', JSON.stringify(INITIAL_TRIPS));
  if (!localStorage.getItem('to_maintenance')) localStorage.setItem('to_maintenance', JSON.stringify(INITIAL_MAINTENANCE));
  if (!localStorage.getItem('to_fuel')) localStorage.setItem('to_fuel', JSON.stringify(INITIAL_FUEL));
  if (!localStorage.getItem('to_expenses')) localStorage.setItem('to_expenses', JSON.stringify(INITIAL_EXPENSES));
};

initStorage();

const getStorageData = <T>(key: string): T[] => {
  initStorage();
  return JSON.parse(localStorage.getItem(key) || '[]');
};

const setStorageData = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// --- API Implementation ---
export const api = {
  async ensureAuthenticated(): Promise<void> {
    const token = localStorage.getItem('token');
    if (token) return;

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@transitops.local',
          password: 'password123',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('currentUser', JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.full_name,
          role: 'Fleet Manager',
          company_id: data.user.company_id,
        }));
      }
    } catch (err) {
      console.error('Programmatic authentication failed:', err);
    }
  },

  // Base fetch config
  getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('token');
    if (token) {
      return { 'Authorization': `Bearer ${token}` };
    }
    return {};
  },

  // KPI aggregates
  async getKPIs(demo: boolean = true): Promise<KPIs> {
    if (demo) {
      const vehicles = getStorageData<Vehicle>('to_vehicles');
      const trips = getStorageData<Trip>('to_trips');
      const drivers = getStorageData<Driver>('to_drivers');

      const activeVehicles = vehicles.filter(v => v.status !== 'Retired').length;
      const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
      const inMaintenance = vehicles.filter(v => v.status === 'In Shop').length;
      const activeTrips = trips.filter(t => t.status === 'Dispatched').length;
      const pendingTrips = trips.filter(t => t.status === 'Draft').length;
      const driversOnDuty = drivers.filter(d => d.status === 'On Trip').length;

      const fleetUtilizationPct = activeVehicles > 0 ? Math.round((activeTrips / activeVehicles) * 100) : 0;

      return {
        active_vehicles: activeVehicles,
        available_vehicles: availableVehicles,
        in_maintenance: inMaintenance,
        active_trips: activeTrips,
        pending_trips: pendingTrips,
        drivers_on_duty: driversOnDuty,
        fleet_utilization_pct: fleetUtilizationPct,
      };
    } else {
      await this.ensureAuthenticated();
      const res = await fetch('/api/v1/dashboard/kpis', { headers: this.getAuthHeaders() });
      if (!res.ok) throw new Error('API Error');
      return res.json();
    }
  },

  // Trips CRUD & status transitions
  async getTrips(demo: boolean = true): Promise<Trip[]> {
    if (demo) {
      const trips = getStorageData<Trip>('to_trips');
      const vehicles = getStorageData<Vehicle>('to_vehicles');
      const drivers = getStorageData<Driver>('to_drivers');

      return trips.map(trip => ({
        ...trip,
        vehicle: vehicles.find(v => v.id === trip.vehicle_id),
        driver: drivers.find(d => d.id === trip.driver_id),
      }));
    } else {
      await this.ensureAuthenticated();
      const res = await fetch('/api/v1/trips', { headers: this.getAuthHeaders() });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      const trips = Array.isArray(data) ? data : (data.items || []);
      const vehicles = await this.getVehicles(false);
      const drivers = await this.getDrivers(false);
      return trips.map((trip: any) => ({
        ...trip,
        vehicle: vehicles.find(v => v.id === trip.vehicle_id),
        driver: drivers.find(d => d.id === trip.driver_id),
      }));
    }
  },

  async createTrip(tripData: Partial<Trip>, demo: boolean = true): Promise<Trip> {
    if (demo) {
      const trips = getStorageData<Trip>('to_trips');
      const nextId = trips.reduce((max, t) => t.id > max ? t.id : max, 0) + 1;
      const newTrip: Trip = {
        id: nextId,
        source: tripData.source || '',
        destination: tripData.destination || '',
        vehicle_id: Number(tripData.vehicle_id),
        driver_id: Number(tripData.driver_id),
        cargo_weight_kg: Number(tripData.cargo_weight_kg),
        planned_distance_km: Number(tripData.planned_distance_km),
        actual_distance_km: null,
        final_odometer: null,
        fuel_consumed_liters: null,
        status: 'Draft',
        dispatched_at: null,
        completed_at: null,
      };
      setStorageData('to_trips', [...trips, newTrip]);
      return newTrip;
    } else {
      await this.ensureAuthenticated();
      const res = await fetch('/api/v1/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
        body: JSON.stringify(tripData),
      });
      if (!res.ok) throw new Error('API Error');
      return res.json();
    }
  },

  async dispatchTrip(id: number, demo: boolean = true): Promise<Trip> {
    if (demo) {
      const trips = getStorageData<Trip>('to_trips');
      const vehicles = getStorageData<Vehicle>('to_vehicles');
      const drivers = getStorageData<Driver>('to_drivers');

      const tripIndex = trips.findIndex(t => t.id === id);
      if (tripIndex === -1) throw new Error('Trip not found');

      const trip = trips[tripIndex];
      
      // Update statuses (simulate db trigger)
      const updatedVehicles = vehicles.map(v => v.id === trip.vehicle_id ? { ...v, status: 'On Trip' } : v);
      const updatedDrivers = drivers.map(d => d.id === trip.driver_id ? { ...d, status: 'On Trip' } : d);
      
      const updatedTrip = {
        ...trip,
        status: 'Dispatched',
        dispatched_at: new Date().toISOString(),
      };
      trips[tripIndex] = updatedTrip;

      setStorageData('to_trips', trips);
      setStorageData('to_vehicles', updatedVehicles);
      setStorageData('to_drivers', updatedDrivers);

      return updatedTrip;
    } else {
      await this.ensureAuthenticated();
      const res = await fetch(`/api/v1/trips/${id}/dispatch`, {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID(), ...this.getAuthHeaders() },
      });
      if (!res.ok) throw new Error('API Error');
      return res.json();
    }
  },

  async completeTrip(id: number, metrics: { actual_distance_km: number; final_odometer: number; fuel_consumed_liters: number }, demo: boolean = true): Promise<Trip> {
    if (demo) {
      const trips = getStorageData<Trip>('to_trips');
      const vehicles = getStorageData<Vehicle>('to_vehicles');
      const drivers = getStorageData<Driver>('to_drivers');
      const fuelLogs = getStorageData<FuelLog>('to_fuel');

      const tripIndex = trips.findIndex(t => t.id === id);
      if (tripIndex === -1) throw new Error('Trip not found');

      const trip = trips[tripIndex];

      // Update statuses back to Available (simulate db trigger)
      const updatedVehicles = vehicles.map(v => v.id === trip.vehicle_id ? { ...v, status: 'Available', odometer_km: metrics.final_odometer } : v);
      const updatedDrivers = drivers.map(d => d.id === trip.driver_id ? { ...d, status: 'Available' } : d);

      const updatedTrip = {
        ...trip,
        status: 'Completed',
        completed_at: new Date().toISOString(),
        actual_distance_km: metrics.actual_distance_km,
        final_odometer: metrics.final_odometer,
        fuel_consumed_liters: metrics.fuel_consumed_liters,
      };
      trips[tripIndex] = updatedTrip;

      // Automatically log fuel (simulate trigger)
      const nextFuelId = fuelLogs.reduce((max, f) => f.id > max ? f.id : max, 0) + 1;
      const newFuelLog: FuelLog = {
        id: nextFuelId,
        vehicle_id: trip.vehicle_id,
        trip_id: id,
        liters: metrics.fuel_consumed_liters,
        cost: Math.round(metrics.fuel_consumed_liters * 1.8), // $1.8 per liter estimate
        logged_date: new Date().toISOString().split('T')[0],
      };

      setStorageData('to_trips', trips);
      setStorageData('to_vehicles', updatedVehicles);
      setStorageData('to_drivers', updatedDrivers);
      setStorageData('to_fuel', [...fuelLogs, newFuelLog]);

      return updatedTrip;
    } else {
      await this.ensureAuthenticated();
      const res = await fetch(`/api/v1/trips/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
        body: JSON.stringify(metrics),
      });
      if (!res.ok) throw new Error('API Error');
      return res.json();
    }
  },

  async cancelTrip(id: number, demo: boolean = true): Promise<Trip> {
    if (demo) {
      const trips = getStorageData<Trip>('to_trips');
      const vehicles = getStorageData<Vehicle>('to_vehicles');
      const drivers = getStorageData<Driver>('to_drivers');

      const tripIndex = trips.findIndex(t => t.id === id);
      if (tripIndex === -1) throw new Error('Trip not found');

      const trip = trips[tripIndex];

      // Reset vehicle and driver if they were active
      const updatedVehicles = vehicles.map(v => (v.id === trip.vehicle_id && trip.status === 'Dispatched') ? { ...v, status: 'Available' } : v);
      const updatedDrivers = drivers.map(d => (d.id === trip.driver_id && trip.status === 'Dispatched') ? { ...d, status: 'Available' } : d);

      const updatedTrip = {
        ...trip,
        status: 'Cancelled',
      };
      trips[tripIndex] = updatedTrip;

      setStorageData('to_trips', trips);
      setStorageData('to_vehicles', updatedVehicles);
      setStorageData('to_drivers', updatedDrivers);

      return updatedTrip;
    } else {
      await this.ensureAuthenticated();
      const res = await fetch(`/api/v1/trips/${id}/cancel`, { method: 'POST', headers: this.getAuthHeaders() });
      if (!res.ok) throw new Error('API Error');
      return res.json();
    }
  },

  // Vehicles
  async getVehicles(demo: boolean = true): Promise<Vehicle[]> {
    if (demo) {
      return getStorageData<Vehicle>('to_vehicles');
    } else {
      await this.ensureAuthenticated();
      const res = await fetch('/api/v1/vehicles', { headers: this.getAuthHeaders() });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      return data.items || data;
    }
  },

  // Drivers
  async getDrivers(demo: boolean = true): Promise<Driver[]> {
    if (demo) {
      return getStorageData<Driver>('to_drivers');
    } else {
      await this.ensureAuthenticated();
      const res = await fetch('/api/v1/drivers', { headers: this.getAuthHeaders() });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      return data.items || data;
    }
  },

  // Maintenance
  async getMaintenanceLogs(demo: boolean = true): Promise<MaintenanceLog[]> {
    if (demo) {
      const logs = getStorageData<MaintenanceLog>('to_maintenance');
      const vehicles = getStorageData<Vehicle>('to_vehicles');
      return logs.map(log => ({
        ...log,
        vehicle: vehicles.find(v => v.id === log.vehicle_id),
      }));
    } else {
      await this.ensureAuthenticated();
      const res = await fetch('/api/v1/maintenance', { headers: this.getAuthHeaders() });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      const logs = Array.isArray(data) ? data : (data.items || []);
      const vehicles = await this.getVehicles(false);
      return logs.map((log: any) => ({
        ...log,
        vehicle: vehicles.find(v => v.id === log.vehicle_id),
      }));
    }
  },

  async createMaintenanceLog(data: Partial<MaintenanceLog>, demo: boolean = true): Promise<MaintenanceLog> {
    if (demo) {
      const logs = getStorageData<MaintenanceLog>('to_maintenance');
      const vehicles = getStorageData<Vehicle>('to_vehicles');
      const nextId = logs.reduce((max, l) => l.id > max ? l.id : max, 0) + 1;

      const newLog: MaintenanceLog = {
        id: nextId,
        vehicle_id: Number(data.vehicle_id),
        service_type: data.service_type || 'General Service',
        cost: Number(data.cost) || 0,
        description: data.description || '',
        status: 'Open',
        created_at: new Date().toISOString(),
        closed_at: null,
      };

      // Set vehicle to In Shop (simulate trigger)
      const updatedVehicles = vehicles.map(v => v.id === newLog.vehicle_id ? { ...v, status: 'In Shop' } : v);

      setStorageData('to_maintenance', [...logs, newLog]);
      setStorageData('to_vehicles', updatedVehicles);
      return newLog;
    } else {
      await this.ensureAuthenticated();
      const res = await fetch('/api/v1/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('API Error');
      return res.json();
    }
  },

  async closeMaintenanceLog(id: number, demo: boolean = true): Promise<MaintenanceLog> {
    if (demo) {
      const logs = getStorageData<MaintenanceLog>('to_maintenance');
      const vehicles = getStorageData<Vehicle>('to_vehicles');

      const logIndex = logs.findIndex(l => l.id === id);
      if (logIndex === -1) throw new Error('Log not found');

      const log = logs[logIndex];
      const updatedLog = {
        ...log,
        status: 'Closed',
        closed_at: new Date().toISOString(),
      };
      logs[logIndex] = updatedLog;

      // Return vehicle to Available (simulate trigger)
      const updatedVehicles = vehicles.map(v => v.id === log.vehicle_id ? { ...v, status: 'Available' } : v);

      setStorageData('to_maintenance', logs);
      setStorageData('to_vehicles', updatedVehicles);

      return updatedLog;
    } else {
      await this.ensureAuthenticated();
      const res = await fetch(`/api/v1/maintenance/${id}/close`, { method: 'POST', headers: this.getAuthHeaders() });
      if (!res.ok) throw new Error('API Error');
      return res.json();
    }
  },

  // Finance logs (Fuel & Expenses)
  async getFuelLogs(demo: boolean = true): Promise<FuelLog[]> {
    if (demo) {
      const fuel = getStorageData<FuelLog>('to_fuel');
      const vehicles = getStorageData<Vehicle>('to_vehicles');
      return fuel.map(f => ({
        ...f,
        vehicle: vehicles.find(v => v.id === f.vehicle_id),
      }));
    } else {
      await this.ensureAuthenticated();
      const res = await fetch('/api/v1/fuel-logs', { headers: this.getAuthHeaders() });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      const logs = Array.isArray(data) ? data : (data.items || []);
      const vehicles = await this.getVehicles(false);
      return logs.map((f: any) => ({
        ...f,
        vehicle: vehicles.find(v => v.id === f.vehicle_id),
      }));
    }
  },

  async getExpenses(demo: boolean = true): Promise<Expense[]> {
    if (demo) {
      const expenses = getStorageData<Expense>('to_expenses');
      const vehicles = getStorageData<Vehicle>('to_vehicles');
      return expenses.map(e => ({
        ...e,
        vehicle: vehicles.find(v => v.id === e.vehicle_id),
      }));
    } else {
      await this.ensureAuthenticated();
      const res = await fetch('/api/v1/expenses', { headers: this.getAuthHeaders() });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      const expenses = Array.isArray(data) ? data : (data.items || []);
      const vehicles = await this.getVehicles(false);
      return expenses.map((e: any) => ({
        ...e,
        vehicle: vehicles.find(v => v.id === e.vehicle_id),
      }));
    }
  },

  async createFuelLog(data: Partial<FuelLog>, demo: boolean = true): Promise<FuelLog> {
    if (demo) {
      const logs = getStorageData<FuelLog>('to_fuel');
      const nextId = logs.reduce((max, f) => f.id > max ? f.id : max, 0) + 1;
      const newLog: FuelLog = {
        id: nextId,
        vehicle_id: Number(data.vehicle_id),
        trip_id: data.trip_id ? Number(data.trip_id) : null,
        liters: Number(data.liters) || 0,
        cost: Number(data.cost) || 0,
        logged_date: data.logged_date || new Date().toISOString().split('T')[0],
      };
      setStorageData('to_fuel', [...logs, newLog]);
      return newLog;
    } else {
      await this.ensureAuthenticated();
      const res = await fetch('/api/v1/fuel-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('API Error');
      return res.json();
    }
  },

  async createExpense(data: Partial<Expense>, demo: boolean = true): Promise<Expense> {
    if (demo) {
      const expenses = getStorageData<Expense>('to_expenses');
      const nextId = expenses.reduce((max, e) => e.id > max ? e.id : max, 0) + 1;
      const newExpense: Expense = {
        id: nextId,
        vehicle_id: Number(data.vehicle_id),
        category: data.category || 'Other',
        amount: Number(data.amount) || 0,
        expense_date: data.expense_date || new Date().toISOString().split('T')[0],
        notes: data.notes || null,
      };
      setStorageData('to_expenses', [...expenses, newExpense]);
      return newExpense;
    } else {
      await this.ensureAuthenticated();
      const res = await fetch('/api/v1/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('API Error');
      return res.json();
    }
  },

  // --- Reports & Analytics ---
  async getFleetUtilizationReport(demo: boolean = true) {
    if (demo) {
      // Mock data representing historical daily fleet utilization %
      return [
        { date: '07-06', utilization_pct: 68 },
        { date: '07-07', utilization_pct: 72 },
        { date: '07-08', utilization_pct: 75 },
        { date: '07-09', utilization_pct: 70 },
        { date: '07-10', utilization_pct: 82 },
        { date: '07-11', utilization_pct: 85 },
        { date: '07-12', utilization_pct: 80 },
      ];
    } else {
      await this.ensureAuthenticated();
      const res = await fetch('/api/v1/reports/fleet-utilization', { headers: this.getAuthHeaders() });
      if (!res.ok) throw new Error('API Error');
      return res.json();
    }
  },

  async getFuelEfficiencyReport(demo: boolean = true) {
    if (demo) {
      // Fuel efficiency km per liter by vehicle type
      return [
        { type: 'Heavy Duty', km_per_liter: 3.8 },
        { type: 'Medium Duty', km_per_liter: 5.5 },
        { type: 'Light Duty', km_per_liter: 8.2 },
      ];
    } else {
      await this.ensureAuthenticated();
      const res = await fetch('/api/v1/reports/fuel-efficiency', { headers: this.getAuthHeaders() });
      if (!res.ok) throw new Error('API Error');
      return res.json();
    }
  },

  async getCostTrendsReport(demo: boolean = true) {
    if (demo) {
      // Historical costs by category
      return [
        { month: 'Feb', Fuel: 4500, Maintenance: 1200, Tolls: 400, Insurance: 1800 },
        { month: 'Mar', Fuel: 5200, Maintenance: 1800, Tolls: 500, Insurance: 1800 },
        { month: 'Apr', Fuel: 4800, Maintenance: 2400, Tolls: 450, Insurance: 1800 },
        { month: 'May', Fuel: 6100, Maintenance: 1500, Tolls: 600, Insurance: 1800 },
        { month: 'Jun', Fuel: 6800, Maintenance: 3200, Tolls: 750, Insurance: 1800 },
        { month: 'Jul', Fuel: 5900, Maintenance: 2100, Tolls: 680, Insurance: 1800 },
      ];
    } else {
      await this.ensureAuthenticated();
      const res = await fetch('/api/v1/reports/vehicle-roi', { headers: this.getAuthHeaders() });
      if (!res.ok) return [];
      return res.json();
    }
  }
};
