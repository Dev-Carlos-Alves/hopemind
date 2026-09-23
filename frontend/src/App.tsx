import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { LoginPage } from './pages/LoginPage';
import { PatientDashboardPage } from './pages/PatientDashboardPage';
import { RegisterPage } from './pages/RegisterPage';
import { SettingsPage } from './pages/SettingsPage';
import { TriagePage } from './pages/TriagePage';

const BootScreen: React.FC = () => (
  <div className="boot" role="status" aria-label="Carregando HopeMind">
    <img src="/images/emblema.png" alt="" />
  </div>
);

const ProtectedLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AppShell />;
};

const HomeRoute: React.FC = () => {
  const { user } = useAuth();
  if (user?.userType === 'PSYCHOLOGIST') return <Navigate to="/consultas" replace />;
  return <PatientDashboardPage />;
};

export const AppRoutes: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <BootScreen />;

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/registro" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<HomeRoute />} />
        <Route path="/triagem" element={<TriagePage />} />
        <Route path="/consultas" element={<AppointmentsPage />} />
        <Route path="/configuracoes" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
};

export const App: React.FC = () => (
  <ToastProvider>
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  </ToastProvider>
);

export default App;
