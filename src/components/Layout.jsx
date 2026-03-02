import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

const pageTitles = {
  '/': 'Dashboard',
  '/solicitudes': 'Solicitudes',
  '/nueva-solicitud': 'Nueva Solicitud',
  '/seguimiento': 'Seguimiento de Vehículo',
  '/servicios': 'Servicios',
  '/reportes': 'Reportes',
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const title = pageTitles[location.pathname] ?? 'DriveBot';

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
    };
    // Estado inicial según tamaño de pantalla
    const w = window.innerWidth;
    setIsMobile(w < 768);
    setSidebarOpen(w >= 1024); // abierto solo en desktop
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // En tablet/móvil: cerrar sidebar al cambiar de página
  useEffect(() => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, [location.pathname]);

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
            {/* Hamburger — visible en tablet/móvil */}
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
            {/* Campana */}
            <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

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
