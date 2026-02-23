import React, { Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StoreProvider } from './context/StoreContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/toast';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Loader from './components/common/Loader';
import ErrorBoundary from './components/common/ErrorBoundary';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Transactions = lazy(() => import('./pages/Transactions'));
const SmartPrediction = lazy(() => import('./pages/SmartPrediction'));
const Calendar = lazy(() => import('./pages/CalendarImproved'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

// Configure QueryClient with optimal caching defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
      gcTime: 30 * 60 * 1000, // Cache garbage collected after 30 minutes
      refetchOnWindowFocus: true, // Refetch when user returns to tab
      retry: 1, // Retry failed requests once
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StoreProvider>
          <ToastProvider>
            <ErrorBoundary>
              <Router>
                <Suspense fallback={<Loader fullScreen />}>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                      path="/*"
                      element={
                        <div className="flex h-screen bg-slate-950 text-slate-200">
                          <Sidebar />
                          <div className="flex flex-1 flex-col overflow-hidden">
                            <Header />
                            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                              <Routes>
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/inventory" element={<Inventory />} />
                                <Route path="/transactions" element={<Transactions />} />
                                <Route path="/prediction" element={<SmartPrediction />} />
                                <Route path="/calendar" element={<Calendar />} />
                                <Route path="/settings" element={<Settings />} />
                                <Route path="*" element={<Navigate to="/" replace />} />
                              </Routes>
                            </main>
                          </div>
                        </div>
                      }
                    />
                  </Routes>
                </Suspense>
              </Router>
            </ErrorBoundary>
          </ToastProvider>
        </StoreProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
