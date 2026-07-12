import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from './lib/context';
import { Layout } from './components/Layout';
import { DashboardScreen } from './features/dashboard/DashboardScreen';
import { TripsScreen } from './features/trips/TripsScreen';
import { MaintenanceScreen } from './features/maintenance/MaintenanceScreen';
import { FinanceScreen } from './features/finance/FinanceScreen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<DashboardScreen />} />
              <Route path="/trips" element={<TripsScreen />} />
              <Route path="/maintenance" element={<MaintenanceScreen />} />
              <Route path="/finance" element={<FinanceScreen />} />
            </Routes>
          </Layout>
        </Router>
      </AppProvider>
    </QueryClientProvider>
  );
};

export default App;
