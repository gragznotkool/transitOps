import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, Trip, MaintenanceLog, FuelLog, Expense } from './api';

// --- Queries ---

export const useKPIs = (demo: boolean) => {
  return useQuery({
    queryKey: ['kpis', demo],
    queryFn: () => api.getKPIs(demo),
  });
};

export const useTrips = (demo: boolean) => {
  return useQuery({
    queryKey: ['trips', demo],
    queryFn: () => api.getTrips(demo),
  });
};

export const useVehicles = (demo: boolean) => {
  return useQuery({
    queryKey: ['vehicles', demo],
    queryFn: () => api.getVehicles(demo),
  });
};

export const useDrivers = (demo: boolean) => {
  return useQuery({
    queryKey: ['drivers', demo],
    queryFn: () => api.getDrivers(demo),
  });
};

export const useMaintenanceLogs = (demo: boolean) => {
  return useQuery({
    queryKey: ['maintenance', demo],
    queryFn: () => api.getMaintenanceLogs(demo),
  });
};

export const useFuelLogs = (demo: boolean) => {
  return useQuery({
    queryKey: ['fuel', demo],
    queryFn: () => api.getFuelLogs(demo),
  });
};

export const useExpenses = (demo: boolean) => {
  return useQuery({
    queryKey: ['expenses', demo],
    queryFn: () => api.getExpenses(demo),
  });
};

export const useFleetUtilization = (demo: boolean) => {
  return useQuery({
    queryKey: ['report-utilization', demo],
    queryFn: () => api.getFleetUtilizationReport(demo),
  });
};

export const useFuelEfficiency = (demo: boolean) => {
  return useQuery({
    queryKey: ['report-efficiency', demo],
    queryFn: () => api.getFuelEfficiencyReport(demo),
  });
};

export const useCostTrends = (demo: boolean) => {
  return useQuery({
    queryKey: ['report-cost-trends', demo],
    queryFn: () => api.getCostTrendsReport(demo),
  });
};

// --- Mutations (with automatic cache invalidation) ---

export const useCreateTripMutation = (demo: boolean) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tripData: Partial<Trip>) => api.createTrip(tripData, demo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips', demo] });
      queryClient.invalidateQueries({ queryKey: ['kpis', demo] });
    },
  });
};

export const useDispatchTripMutation = (demo: boolean) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.dispatchTrip(id, demo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips', demo] });
      queryClient.invalidateQueries({ queryKey: ['vehicles', demo] });
      queryClient.invalidateQueries({ queryKey: ['drivers', demo] });
      queryClient.invalidateQueries({ queryKey: ['kpis', demo] });
    },
  });
};

export const useCompleteTripMutation = (demo: boolean) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, metrics }: { id: number; metrics: { actual_distance_km: number; final_odometer: number; fuel_consumed_liters: number } }) =>
      api.completeTrip(id, metrics, demo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips', demo] });
      queryClient.invalidateQueries({ queryKey: ['vehicles', demo] });
      queryClient.invalidateQueries({ queryKey: ['drivers', demo] });
      queryClient.invalidateQueries({ queryKey: ['fuel', demo] });
      queryClient.invalidateQueries({ queryKey: ['kpis', demo] });
    },
  });
};

export const useCancelTripMutation = (demo: boolean) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.cancelTrip(id, demo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips', demo] });
      queryClient.invalidateQueries({ queryKey: ['vehicles', demo] });
      queryClient.invalidateQueries({ queryKey: ['drivers', demo] });
      queryClient.invalidateQueries({ queryKey: ['kpis', demo] });
    },
  });
};

export const useCreateMaintenanceMutation = (demo: boolean) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MaintenanceLog>) => api.createMaintenanceLog(data, demo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance', demo] });
      queryClient.invalidateQueries({ queryKey: ['vehicles', demo] });
      queryClient.invalidateQueries({ queryKey: ['kpis', demo] });
    },
  });
};

export const useCloseMaintenanceMutation = (demo: boolean) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.closeMaintenanceLog(id, demo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance', demo] });
      queryClient.invalidateQueries({ queryKey: ['vehicles', demo] });
      queryClient.invalidateQueries({ queryKey: ['kpis', demo] });
    },
  });
};

export const useCreateFuelLogMutation = (demo: boolean) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FuelLog>) => api.createFuelLog(data, demo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel', demo] });
      queryClient.invalidateQueries({ queryKey: ['kpis', demo] });
    },
  });
};

export const useCreateExpenseMutation = (demo: boolean) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Expense>) => api.createExpense(data, demo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', demo] });
      queryClient.invalidateQueries({ queryKey: ['kpis', demo] });
    },
  });
};
