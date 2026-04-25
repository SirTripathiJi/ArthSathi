import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

// Providers & Layout
import { AppLayout } from './components/Layout/AppLayout';
import { ErrorBoundary } from './components/UI/ErrorBoundary';
import { ToastProvider } from './components/UI/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';

// Lazy-loaded pages
const LandingPage = lazy(() =>
  import('./pages/LandingPage').then((module) => ({ default: module.LandingPage }))
);
const AuthPage = lazy(() =>
  import('./pages/AuthPage').then((module) => ({ default: module.AuthPage }))
);
const Dashboard = lazy(() =>
  import('./pages/Dashboard').then((module) => ({ default: module.Dashboard }))
);
const Inventory = lazy(() =>
  import('./pages/Inventory').then((module) => ({ default: module.Inventory }))
);
const Sales = lazy(() => import('./pages/Sales').then((module) => ({ default: module.Sales })));
const Analytics = lazy(() =>
  import('./pages/Analytics').then((module) => ({ default: module.Analytics }))
);
const Settings = lazy(() =>
  import('./pages/Settings').then((module) => ({ default: module.Settings }))
);

// Global Skeleton Loader for Suspense Fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
    <div className="w-10 h-10 border-4 border-[var(--border-color)] border-t-[var(--color-primary)] rounded-full animate-spin" />
  </div>
);

function AppContent() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />

          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
            <Route path="/inventory" element={<ErrorBoundary><Inventory /></ErrorBoundary>} />
            <Route path="/sales" element={<ErrorBoundary><Sales /></ErrorBoundary>} />
            <Route path="/analytics" element={<ErrorBoundary><Analytics /></ErrorBoundary>} />
            <Route path="/settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </Suspense>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <ToastProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </ToastProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
