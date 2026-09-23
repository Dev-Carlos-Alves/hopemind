import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { MatchesPage } from './pages/MatchesPage';
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

const PatientOnly: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user } = useAuth();
  return user?.userType === 'PSYCHOLOGIST' ? <Navigate to="/inicio" replace /> : children;
};

export const AppRoutes: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <BootScreen />;

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/inicio" replace /> : <LoginPage />} />
      <Route path="/registro" element={isAuthenticated ? <Navigate to="/inicio" replace /> : <RegisterPage />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/inicio" element={<HomePage />} />
        <Route path="/matches" element={<PatientOnly><MatchesPage /></PatientOnly>} />
        <Route path="/triagem" element={<TriagePage />} />
        {/* Old addresses from before the Home/Matches split. */}
        <Route path="/dashboard" element={<Navigate to="/inicio" replace />} />
        <Route path="/consultas" element={<AppointmentsPage />} />
        <Route path="/configuracoes" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to={isAuthenticated ? '/inicio' : '/login'} replace />} />
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
