import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const stats = [
  { label: 'Total Solicitudes', value: '128', change: '+12%', color: 'bg-primary', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { label: 'Pendientes', value: '24', change: '+3', color: 'bg-amber-500', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { label: 'En Proceso', value: '18', change: '-2', color: 'bg-orange-500', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
  { label: 'Completadas', value: '86', change: '+8%', color: 'bg-green-500', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
];

const recentSolicitudes = [
  { id: '#0128', cliente: 'Carlos Medina', vehiculo: 'Toyota Corolla 2021', servicio: 'Cambio de aceite', estado: 'Completada' },
  { id: '#0127', cliente: 'María López', vehiculo: 'Honda Civic 2019', servicio: 'Revisión de frenos', estado: 'En proceso' },
  { id: '#0126', cliente: 'Roberto García', vehiculo: 'Nissan Sentra 2020', servicio: 'Diagnóstico', estado: 'En proceso' },
  { id: '#0125', cliente: 'Ana Torres', vehiculo: 'Chevrolet Spark 2022', servicio: 'Alineación y balanceo', estado: 'Pendiente' },
  { id: '#0124', cliente: 'Luis Ramírez', vehiculo: 'Ford Focus 2018', servicio: 'Suspensión', estado: 'Completada' },
];

const estadoStyles = {
  Completada: 'bg-green-100 text-green-700',
  'En proceso': 'bg-orange-100 text-orange-700',
  Pendiente: 'bg-amber-100 text-amber-700',
};

const Icon = ({ path }) => (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

export default function Home() {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

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

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
            <div className={`${stat.color} p-3 rounded-xl flex-shrink-0`}>
              <Icon path={stat.icon} />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-primary">{stat.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{stat.change} este mes</p>
            </div>
          </div>
        ))}
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
              {recentSolicitudes.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3.5 font-mono text-slate-500">{s.id}</td>
                  <td className="px-6 py-3.5 font-medium text-slate-800">{s.cliente}</td>
                  <td className="px-6 py-3.5 text-slate-500 hidden md:table-cell">{s.vehiculo}</td>
                  <td className="px-6 py-3.5 text-slate-500 hidden sm:table-cell">{s.servicio}</td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${estadoStyles[s.estado]}`}>
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
