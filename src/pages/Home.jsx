import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCatalogos } from '../context/CatalogosContext';
import { useSolicitudes } from '../context/SolicitudesContext';

const estadoIcons = {
  Total: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
};

const Icon = ({ path }) => (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

export default function Home() {
  const { user } = useAuth();
  const { servicios: CATEGORIAS_SERVICIOS, estados } = useCatalogos();
  const { solicitudes } = useSolicitudes();
  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Stats calculados dinámicamente desde los datos reales
  const stats = [
    { label: 'Total Solicitudes', value: solicitudes.length, color: 'bg-primary', icon: estadoIcons.Total },
    ...estados.map((e) => ({
      label: e.nombre,
      value: solicitudes.filter((s) => s.estado === e.nombre).length,
      color: e.dotClass ? e.dotClass.replace('bg-', 'bg-') : 'bg-slate-500',
      icon: estadoIcons.Total,
    })),
  ];

  // Solicitudes recientes (últimas 5) desde el contexto real
  const recentSolicitudes = solicitudes.slice(0, 5);

  // Estilos de estado desde el catálogo
  const estadoStyles = {};
  estados.forEach((e) => { estadoStyles[e.nombre] = e.bgClass; });



  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">
            Bienvenido, {user?.name} 👋
          </h2>
          <p className="text-slate-500 text-sm mt-0.5 capitalize">{today}</p>
        </div>
        <Link
          to="/nueva-solicitud"
          className="inline-flex items-center gap-2 bg-accent hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-150"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva Solicitud
        </Link>
      </div>

      {/* Stats KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
            <div className={`w-11 h-11 ${s.color} rounded-xl flex items-center justify-center shrink-0`}>
              <Icon path={s.icon} />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{s.value}</p>
              <p className="text-xs text-slate-500 leading-tight">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Nuestros servicios */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-primary">Nuestros servicios</h3>
            <p className="text-slate-500 text-sm mt-1">10 categorías · Atención especializada para tu vehículo</p>
          </div>
          <Link to="/servicios" className="text-sm text-accent hover:underline font-medium">
            Ver todos
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {CATEGORIAS_SERVICIOS.map((cat) => (
            <Link
              key={cat.categoria}
              to="/servicios"
              className={`bg-white rounded-xl border-2 ${cat.color} shadow-sm p-4 flex flex-col items-center gap-2 text-center hover:shadow-md transition-all group`}
            >
              <span className="text-3xl">{cat.icon}</span>
              <h4 className="font-semibold text-sm text-primary group-hover:text-accent transition-colors leading-tight">{cat.categoria}</h4>
              <span className="text-xs text-slate-400">{cat.servicios.length} servicios</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent solicitudes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-primary">Solicitudes recientes</h3>
          <Link to="/nueva-solicitud" className="text-sm text-accent hover:underline font-medium">
            Ver todas
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="text-left px-6 py-3">ID</th>
                <th className="text-left px-6 py-3">Cliente</th>
                <th className="text-left px-6 py-3 hidden md:table-cell">Vehículo</th>
                <th className="text-left px-6 py-3 hidden sm:table-cell">Servicio</th>
                <th className="text-left px-6 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentSolicitudes.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-sm">No hay solicitudes registradas</td></tr>
              ) : recentSolicitudes.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3.5 font-mono text-slate-500">#{s.id}</td>
                  <td className="px-6 py-3.5 font-medium text-slate-800">{s.cliente}</td>
                  <td className="px-6 py-3.5 text-slate-500 hidden md:table-cell">{s.vehiculo}</td>
                  <td className="px-6 py-3.5 text-slate-500 hidden sm:table-cell">{s.servicio}</td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${estadoStyles[s.estado] || 'bg-slate-100 text-slate-600'}`}>
                      {s.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/nueva-solicitud" className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-accent hover:shadow-md transition-all group">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p className="font-semibold text-slate-800 group-hover:text-accent transition-colors">Nueva Solicitud</p>
          <p className="text-slate-500 text-xs mt-1">Registrar un nuevo servicio</p>
        </Link>

        <Link to="/servicios" className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-accent hover:shadow-md transition-all group">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <p className="font-semibold text-slate-800 group-hover:text-accent transition-colors">Catálogo de Servicios</p>
          <p className="text-slate-500 text-xs mt-1">Ver servicios disponibles</p>
        </Link>

        <Link to="/reportes" className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-accent hover:shadow-md transition-all group">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="font-semibold text-slate-800 group-hover:text-accent transition-colors">Reportes</p>
          <p className="text-slate-500 text-xs mt-1">Estadísticas del taller</p>
        </Link>
      </div>
    </div>
  );
}
