import React, { createContext, useContext, useState, useEffect } from 'react';

// --- Types ---
export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string; // "Admin" | "Fleet Manager" | "Dispatcher" | "Safety Officer" | "Financial Analyst"
  company_id: number;
}

export interface GlobalFilters {
  vehicleType: string;
  status: string;
  region: string;
  searchQuery: string;
}

interface AppContextType {
  // Theme (Dark Mode)
  darkMode: boolean;
  toggleDarkMode: () => void;

  // Global Filters
  filters: GlobalFilters;
  setFilters: React.Dispatch<React.SetStateAction<GlobalFilters>>;
  resetFilters: () => void;

  // Auth State (with mockup capability)
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  logout: () => void;

  // Demo mode
  demoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
}

// --- Context ---
const AppContext = createContext<AppContextType | undefined>(undefined);

// --- Provider ---
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true; // Default to dark mode for visual appeal
  });

  // Global Filters state
  const [filters, setFilters] = useState<GlobalFilters>({
    vehicleType: 'all',
    status: 'all',
    region: 'all',
    searchQuery: '',
  });

  // Demo mode state (starts disabled so it connects directly to the backend database, can toggle to demo mode manually)
  const [demoMode, setDemoMode] = useState<boolean>(false);

  // Auth user state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) return JSON.parse(saved);
    return null;
  });

  // Synchronize Dark Mode Class
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Synchronize User session
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const resetFilters = () => {
    setFilters({
      vehicleType: 'all',
      status: 'all',
      region: 'all',
      searchQuery: '',
    });
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  };

  return (
    <AppContext.Provider
      value={{
        darkMode,
        toggleDarkMode,
        filters,
        setFilters,
        resetFilters,
        currentUser,
        setCurrentUser,
        logout,
        demoMode,
        setDemoMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// --- Hook ---
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
