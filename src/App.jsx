import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SolicitudesProvider } from './context/SolicitudesContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import NuevaSolicitud from './pages/NuevaSolicitud';
import Servicios from './pages/Servicios';
import Solicitudes from './pages/Solicitudes';
import Seguimiento from './pages/Seguimiento';
import Scaner from './pages/Scaner';

function ProtectedLayout() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Layout />;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      {/* Ruta pública — sin autenticación */}
      <Route path="/scaner" element={<Scaner />} />
      <Route path="/seguimiento" element={<Seguimiento />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/solicitudes" element={<Solicitudes />} />
        <Route path="/nueva-solicitud" element={<NuevaSolicitud />} />
        <Route path="/servicios" element={<Servicios />} />
        <Route path="/reportes" element={<div className="text-center py-20 text-slate-400 text-lg">Módulo en desarrollo...</div>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SolicitudesProvider>
        <Router>
          <AppRoutes />
        </Router>
      </SolicitudesProvider>
    </AuthProvider>
  );
}
