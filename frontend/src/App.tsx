import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { TriagePage } from './pages/TriagePage';
import { PatientDashboardPage } from './pages/PatientDashboardPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { SettingsPage } from './pages/SettingsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div style={{ padding: '20px', fontSize: '13px' }}>Carregando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const HomeRoute: React.FC = () => {
  const { user } = useAuth();
  if (user?.userType === 'PSYCHOLOGIST') return <Navigate to="/consultas" replace />;
  return <PatientDashboardPage />;
};

export const AppRoutes: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div style={{ padding: '20px', fontSize: '13px' }}>Carregando HopeMind...</div>;

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/registro" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />

      <Route
        path="/triagem"
        element={
          <ProtectedRoute>
            <TriagePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <HomeRoute />
          </ProtectedRoute>
        }
      />
      <Route
        path="/consultas"
        element={
          <ProtectedRoute>
            <AppointmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracoes"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
