import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SolicitudesProvider } from './context/SolicitudesContext';
import { NotificacionesProvider } from './context/NotificacionesContext';
import { Toaster } from 'sonner';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import NuevaSolicitud from './pages/NuevaSolicitud';
import Servicios from './pages/Servicios';
import Solicitudes from './pages/Solicitudes';
import Seguimiento from './pages/Seguimiento';
import Scaner from './pages/Scaner';
import Catalogos from './pages/Catalogos';
import Reportes from './pages/Reportes';
import { CatalogosProvider } from './context/CatalogosContext';
import FeatureGuard from './components/FeatureGuard';

function ProtectedLayout() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Layout />;
}

// El mecánico no tiene dashboard — va directo a solicitudes
function HomeRoute() {
  const { esMecanico } = useAuth();
  if (esMecanico) return <Navigate to="/solicitudes" replace />;
  return <Home />;
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
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<FeatureGuard path="/"><HomeRoute /></FeatureGuard>} />
        <Route path="/solicitudes" element={<FeatureGuard path="/solicitudes"><Solicitudes /></FeatureGuard>} />
        <Route path="/nueva-solicitud" element={<FeatureGuard path="/nueva-solicitud"><NuevaSolicitud /></FeatureGuard>} />
        <Route path="/servicios" element={<FeatureGuard path="/servicios"><Servicios /></FeatureGuard>} />
        <Route path="/catalogos" element={<FeatureGuard path="/catalogos"><Catalogos /></FeatureGuard>} />
        <Route path="/reportes" element={<FeatureGuard path="/reportes"><Reportes /></FeatureGuard>} />
        <Route path="/seguimiento" element={<FeatureGuard path="/seguimiento"><Seguimiento /></FeatureGuard>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SolicitudesProvider>
        <CatalogosProvider>
          <NotificacionesProvider>
            <Router>
              <AppRoutes />
            </Router>
            <Toaster position="top-right" richColors closeButton theme="light" toastOptions={{ className: 'text-sm' }} />
          </NotificacionesProvider>
        </CatalogosProvider>
      </SolicitudesProvider>
    </AuthProvider>
  );
}
