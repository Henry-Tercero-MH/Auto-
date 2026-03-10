import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useNotificaciones } from '../context/NotificacionesContext';

const pageTitles = {
  '/': 'Dashboard',
  '/solicitudes': 'Solicitudes',
  '/nueva-solicitud': 'Nueva Solicitud',
  '/seguimiento': 'Seguimiento de Vehículo',
  '/servicios': 'Servicios',
  '/catalogos': 'Catálogos',
  '/reportes': 'Reportes',
};

function formatFecha(iso) {
  try {
    const d = new Date(iso);
    const ahora = new Date();
    const diff = Math.floor((ahora - d) / 1000);
    if (diff < 60) return 'Ahora';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
    return d.toLocaleDateString('es-GT', { day: '2-digit', month: 'short' });
  } catch {
    return '';
  }
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [campanaPanelOpen, setCampanaPanelOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas, eliminarNotificacion } = useNotificaciones();
  const campanaRef = useRef(null);

  const title = pageTitles[location.pathname] ?? 'DriveBot';

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
    };
    const w = window.innerWidth;
    setIsMobile(w < 768);
    setSidebarOpen(w >= 1024);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Cerrar sidebar al cambiar de página en tablet/móvil
  useEffect(() => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, [location.pathname]);

  // Cerrar panel de campana al hacer clic fuera
  useEffect(() => {
    if (!campanaPanelOpen) return;
    const handler = (e) => {
      if (campanaRef.current && !campanaRef.current.contains(e.target)) {
        setCampanaPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [campanaPanelOpen]);

  const isOverlay = isMobile || window.innerWidth < 1024;

  return (
    <div className="flex min-h-screen bg-background">

      {/* Backdrop para móvil/tablet */}
      {sidebarOpen && isOverlay && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        isOverlay={isOverlay}
      />

      {/* Área principal */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          !isOverlay && sidebarOpen ? 'ml-64' : !isOverlay ? 'ml-16' : 'ml-0'
        }`}
      >
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-slate-500 hover:text-primary hover:bg-slate-100 transition-colors lg:hidden"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-base md:text-lg font-semibold text-primary">{title}</h1>
          </div>

          <div className="flex items-center gap-2 md:gap-3">

            {/* Campana con panel */}
            <div className="relative" ref={campanaRef}>
              <button
                onClick={() => setCampanaPanelOpen((v) => !v)}
                className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {noLeidas > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {noLeidas > 99 ? '99+' : noLeidas}
                  </span>
                )}
              </button>

              {/* Panel desplegable */}
              {campanaPanelOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                  {/* Header panel */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="text-sm font-semibold text-slate-800">
                      Notificaciones {noLeidas > 0 && <span className="ml-1 text-xs bg-accent text-white px-1.5 py-0.5 rounded-full">{noLeidas}</span>}
                    </span>
                    {noLeidas > 0 && (
                      <button
                        onClick={marcarTodasLeidas}
                        className="text-xs text-primary hover:underline"
                      >
                        Marcar todas como leídas
                      </button>
                    )}
                  </div>

                  {/* Lista */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                    {notificaciones.length === 0 ? (
                      <div className="py-10 text-center text-slate-400 text-sm">
                        Sin notificaciones
                      </div>
                    ) : (
                      notificaciones.map((n) => (
                        <div
                          key={n.id}
                          className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${!n.leida ? 'bg-blue-50/60' : ''}`}
                        >
                          <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${!n.leida ? 'bg-accent' : 'bg-slate-200'}`} />
                          <div className="flex-1 min-w-0" onClick={() => marcarLeida(n.id)} role="button" tabIndex={0}>
                            <p className="text-xs font-semibold text-slate-800 truncate">{n.titulo}</p>
                            <p className="text-xs text-slate-500 truncate">{n.mensaje}</p>
                            {n.detalle && <p className="text-xs text-slate-400 truncate">{n.detalle}</p>}
                            <p className="text-[10px] text-slate-400 mt-0.5">{formatFecha(n.fecha)}</p>
                          </div>
                          <button
                            onClick={() => eliminarNotificacion(n.id)}
                            className="text-slate-300 hover:text-slate-500 flex-shrink-0 mt-0.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar */}
            {user && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {user.name.charAt(0)}
                </div>
                <span className="text-sm font-medium text-slate-700 hidden sm:block">{user.name}</span>
              </div>
            )}
          </div>
        </header>

        {/* Contenido */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: { fontFamily: 'Inter, Segoe UI, Arial, sans-serif', fontSize: '14px' },
          success: { iconTheme: { primary: '#2563eb', secondary: '#fff' } },
        }}
      />
    </div>
  );
}
