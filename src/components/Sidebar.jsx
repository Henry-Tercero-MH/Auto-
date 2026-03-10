import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNotificaciones } from '../context/NotificacionesContext';

const Icon = ({ path, className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

// roles: ['admin'] | ['mecanico'] | ['admin','mecanico'] (ambos)
const NAV_ITEMS = [
  {
    name: 'Dashboard',
    path: '/',
    roles: ['admin'],
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    name: 'Solicitudes',
    path: '/solicitudes',
    roles: ['admin', 'mecanico'],
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  },
  {
    name: 'Nueva Solicitud',
    path: '/nueva-solicitud',
    roles: ['admin', 'mecanico'],
    icon: 'M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    name: 'Servicios',
    path: '/servicios',
    roles: ['admin'],
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    name: 'Seguimiento',
    path: '/seguimiento',
    roles: ['admin', 'mecanico'],
    icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
  },
  {
    name: 'Catálogos',
    path: '/catalogos',
    roles: ['admin'],
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  },
  {
    name: 'Reportes',
    path: '/reportes',
    roles: ['admin'],
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
];

// ── Panel de notificaciones ─────────────────────────────────────────────────
function NotifPanel({ notificaciones, noLeidas, toggleLeida, marcarTodasLeidas, marcarTodasNoLeidas, eliminarNotificacion, limpiarNotificaciones, onClose, onGoTo }) {
  const panelRef = useRef(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const totalLeidas = notificaciones.filter((n) => n.leida).length;

  return (
    <div ref={panelRef} className="absolute left-full top-0 ml-2 w-[340px] max-h-[75vh] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800">Notificaciones</span>
          {noLeidas > 0 && (
            <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full bg-accent text-white text-[10px] font-bold px-1.5">
              {noLeidas}
            </span>
          )}
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-slate-200 transition">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Actions bar */}
      {notificaciones.length > 0 && (
        <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 bg-gray-50/50">
          {noLeidas > 0 ? (
            <button onClick={marcarTodasLeidas} className="text-[11px] text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition">
              ✓ Marcar todas leídas
            </button>
          ) : (
            <button onClick={marcarTodasNoLeidas} className="text-[11px] text-slate-500 hover:text-slate-700 font-medium px-2 py-1 rounded hover:bg-slate-100 transition">
              ○ Marcar todas no leídas
            </button>
          )}
          <span className="text-slate-300">·</span>
          <button onClick={() => { limpiarNotificaciones(); onClose(); }} className="text-[11px] text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition">
            Limpiar todo
          </button>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {notificaciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <svg className="w-12 h-12 mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            <span className="text-sm font-medium">Sin notificaciones</span>
            <span className="text-xs text-slate-300 mt-1">Las nuevas solicitudes aparecerán aquí</span>
          </div>
        ) : (
          notificaciones.map((n) => (
            <div
              key={n.id}
              className={`group flex items-start gap-2 px-4 py-3 border-b border-gray-50 hover:bg-slate-50/80 transition ${
                !n.leida ? 'bg-blue-50/40' : ''
              }`}
            >
              {/* Dot indicador */}
              <button
                onClick={() => toggleLeida(n.id)}
                title={n.leida ? 'Marcar como no leída' : 'Marcar como leída'}
                className="mt-1 flex-shrink-0 p-0.5"
              >
                <span className={`block w-2.5 h-2.5 rounded-full border-2 transition ${
                  !n.leida
                    ? 'bg-accent border-accent'
                    : 'bg-transparent border-slate-300 group-hover:border-slate-400'
                }`} />
              </button>

              {/* Content — click to navigate */}
              <button
                onClick={() => onGoTo(n.solicitudId)}
                className="flex-1 min-w-0 text-left"
              >
                <p className={`text-xs font-semibold truncate ${
                  !n.leida ? 'text-slate-800' : 'text-slate-500'
                }`}>{n.titulo}</p>
                <p className="text-xs text-slate-500 truncate">{n.mensaje}</p>
                {n.detalle && <p className="text-[10px] text-slate-400 truncate mt-0.5">{n.detalle}</p>}
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {new Date(n.fecha).toLocaleString('es-GT', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </button>

              {/* Delete */}
              <button
                onClick={() => eliminarNotificacion(n.id)}
                title="Eliminar"
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition flex-shrink-0 mt-0.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notificaciones.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100 bg-slate-50">
          <p className="text-[10px] text-slate-400 text-center">
            {notificaciones.length} notificación{notificaciones.length !== 1 ? 'es' : ''} · {totalLeidas} leída{totalLeidas !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ open, onToggle, isOverlay }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, esAdmin } = useAuth();
  const { notificaciones, noLeidas, toggleLeida, marcarTodasLeidas, marcarTodasNoLeidas, eliminarNotificacion, limpiarNotificaciones } = useNotificaciones();
  const [showNotif, setShowNotif] = useState(false);

  const rol = user?.rol ?? 'admin';

  // Filtrar items según rol
  const navItems = NAV_ITEMS.filter((item) => item.roles.includes(rol));

  const handleLogout = () => {
    toast.success('Sesión cerrada correctamente');
    setTimeout(() => {
      logout();
      navigate('/login');
    }, 800);
  };

  const sidebarClass = isOverlay
    ? `fixed top-0 left-0 h-full w-full max-w-[280px] sm:w-72 bg-primary flex flex-col z-40 shadow-2xl transition-transform duration-300 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`
    : `fixed top-0 left-0 h-full bg-primary flex flex-col z-40 shadow-xl transition-all duration-300 ${
        open ? 'w-64' : 'w-16'
      }`;

  // Badge de rol visible en el perfil
  const rolBadge = rol === 'admin'
    ? { label: 'Admin', cls: 'bg-accent/20 text-accent' }
    : { label: 'Mecánico', cls: 'bg-blue-500/20 text-blue-300' };

  return (
    <aside className={sidebarClass}>
      {/* Header / Logo */}
      <div className="flex items-center h-16 px-3 border-b border-slate-700 flex-shrink-0">
        {!isOverlay && (
          <button
            onClick={onToggle}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors flex-shrink-0"
            title={open ? 'Colapsar menú' : 'Expandir menú'}
          >
            <Icon path="M4 6h16M4 12h16M4 18h16" className="w-5 h-5" />
          </button>
        )}

        {(open || isOverlay) && (
          <span className={`${!isOverlay ? 'ml-3' : 'ml-2'} text-xl font-black tracking-tight whitespace-nowrap`}>
            <span className="text-white">AUTO</span><span className="text-accent">+</span>
          </span>
        )}

        {isOverlay && (
          <button
            onClick={onToggle}
            className="ml-auto p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <Icon path="M6 18L18 6M6 6l12 12" className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Notification bell — solo admin */}
      {esAdmin && (open || isOverlay) && (
        <div className="relative px-2 pt-3">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors relative"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="text-sm font-medium">Notificaciones</span>
            {noLeidas > 0 && (
              <span className="absolute top-1.5 left-8 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-accent text-white text-[10px] font-bold px-1 animate-pulse">
                {noLeidas > 9 ? '9+' : noLeidas}
              </span>
            )}
          </button>
          {showNotif && (
            <NotifPanel
              notificaciones={notificaciones}
              noLeidas={noLeidas}
              toggleLeida={toggleLeida}
              marcarTodasLeidas={marcarTodasLeidas}
              marcarTodasNoLeidas={marcarTodasNoLeidas}
              eliminarNotificacion={eliminarNotificacion}
              limpiarNotificaciones={limpiarNotificaciones}
              onClose={() => setShowNotif(false)}
              onGoTo={(id) => { setShowNotif(false); navigate('/solicitudes'); }}
            />
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={!open && !isOverlay ? item.name : undefined}
              className={`flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-accent text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon path={item.icon} className="w-5 h-5 flex-shrink-0" />
              {(open || isOverlay) && (
                <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-slate-700 p-2 space-y-1 flex-shrink-0">
        {(open || isOverlay) && user && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user.name}</p>
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${rolBadge.cls}`}>
                {rolBadge.label}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          title={!open && !isOverlay ? 'Cerrar sesión' : undefined}
          className="w-full flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-slate-300 hover:bg-red-500 hover:text-white transition-colors"
        >
          <Icon
            path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            className="w-5 h-5 flex-shrink-0"
          />
          {(open || isOverlay) && <span className="text-sm font-medium">Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
