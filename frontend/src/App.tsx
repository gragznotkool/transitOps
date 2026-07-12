import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider, useApp } from './lib/context';
import { Layout } from './components/Layout';
import { DashboardScreen } from './features/dashboard/DashboardScreen';
import { TripsScreen } from './features/trips/TripsScreen';
import { MaintenanceScreen } from './features/maintenance/MaintenanceScreen';
import { FinanceScreen } from './features/finance/FinanceScreen';
import { LoginScreen } from './features/auth/LoginScreen';

import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const AppRoutes = () => {
  const { currentUser } = useApp();

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardScreen />} />
        <Route path="/trips" element={<TripsScreen />} />
        <Route path="/maintenance" element={<MaintenanceScreen />} />
        <Route path="/finance" element={<FinanceScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <Router>
          <Toaster position="top-right" />
          <AppRoutes />
        </Router>
      </AppProvider>
    </QueryClientProvider>
  );
};

export default App;
