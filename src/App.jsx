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
      <Route path="/seguimiento" element={<Seguimiento />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/solicitudes" element={<Solicitudes />} />
        <Route path="/nueva-solicitud" element={<NuevaSolicitud />} />
        <Route path="/servicios" element={<Servicios />} />
        <Route path="/catalogos" element={<Catalogos />} />
        <Route path="/reportes" element={<Reportes />} />
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
