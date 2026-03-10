import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

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

export default function Sidebar({ open, onToggle, isOverlay }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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
    ? `fixed top-0 left-0 h-full w-72 bg-primary flex flex-col z-40 shadow-2xl transition-transform duration-300 ${
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
