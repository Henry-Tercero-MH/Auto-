import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSolicitudes } from '../context/SolicitudesContext';

const estadoConfig = {
  Completada:   { cls: 'bg-green-100 text-green-700 ring-green-400',   dot: 'bg-green-500',  label: 'Completada'  },
  'En proceso': { cls: 'bg-orange-100 text-orange-700 ring-orange-400',dot: 'bg-orange-500', label: 'En proceso'  },
  Pendiente:    { cls: 'bg-amber-100 text-amber-700 ring-amber-400',   dot: 'bg-amber-500',  label: 'Pendiente'   },
};

const ESTADOS = ['Pendiente', 'En proceso', 'Completada'];
const FILTROS = ['Todos', 'Pendiente', 'En proceso', 'Completada'];

export default function Solicitudes() {
  const { solicitudes, cambiarEstado } = useSolicitudes();
  const [filtro, setFiltro] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [expandido, setExpandido] = useState(null);

  const datos = solicitudes.filter((s) => {
    const matchFiltro = filtro === 'Todos' || s.estado === filtro;
    const q = busqueda.toLowerCase();
    const matchBusqueda =
      !q ||
      s.cliente.toLowerCase().includes(q) ||
      s.vehiculo.toLowerCase().includes(q) ||
      s.placa.toLowerCase().includes(q) ||
      s.servicio.toLowerCase().includes(q) ||
      s.id.includes(q);
    return matchFiltro && matchBusqueda;
  });

  const conteo = {
    Todos: solicitudes.length,
    Pendiente: solicitudes.filter((s) => s.estado === 'Pendiente').length,
    'En proceso': solicitudes.filter((s) => s.estado === 'En proceso').length,
    Completada: solicitudes.filter((s) => s.estado === 'Completada').length,
  };

  const handleCambiarEstado = (id, nuevoEstado) => {
    cambiarEstado(id, nuevoEstado);
    toast.success(`Estado actualizado a "${nuevoEstado}"`);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-slate-500 text-sm mt-0.5">Gestión de órdenes de servicio</p>
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

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filtro === f
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white border border-gray-200 text-slate-600 hover:border-primary hover:text-primary'
            }`}
          >
            {f}
            <span className={`ml-1.5 text-xs font-bold ${filtro === f ? 'text-white/80' : 'text-slate-400'}`}>
              {conteo[f]}
            </span>
          </button>
        ))}
      </div>

      {/* Buscador */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
        </svg>
        <input
          type="text"
          placeholder="Buscar por cliente, vehículo, placa, servicio o ticket..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
        />
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {datos.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-medium">Sin resultados</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {datos.map((s) => {
              const cfg = estadoConfig[s.estado];
              const abierto = expandido === s.id;
              return (
                <div key={s.id}>
                  {/* Fila */}
                  <button
                    onClick={() => setExpandido(abierto ? null : s.id)}
                    className="w-full text-left px-4 sm:px-6 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                        <div>
                          <p className="font-semibold text-slate-800 text-sm truncate">{s.cliente}</p>
                          <p className="text-xs text-slate-400 font-mono">#{s.id}</p>
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-sm text-slate-600 truncate">{s.vehiculo}</p>
                          <p className="text-xs text-slate-400">{s.placa}</p>
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-sm text-slate-600 truncate">{s.servicio}</p>
                          <p className="text-xs text-slate-400">{s.fecha}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${cfg.cls}`}>
                        {s.estado}
                      </span>
                      <svg
                        className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${abierto ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Detalle expandido */}
                  {abierto && (
                    <div className="border-t border-slate-100 bg-slate-50 px-4 sm:px-6 py-5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

                        {/* Info */}
                        <div className="sm:col-span-2 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Cliente</p>
                            <p className="font-semibold text-slate-800">{s.cliente}</p>
                            <p className="text-slate-500">{s.tel}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Vehículo</p>
                            <p className="font-semibold text-slate-800">{s.vehiculo}</p>
                            <p className="text-slate-500">Placa: {s.placa}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Servicio</p>
                            <p className="font-semibold text-slate-800">{s.servicio}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Fecha ingreso</p>
                            <p className="font-semibold text-slate-800">{s.fecha}</p>
                          </div>
                        </div>

                        {/* Cambiar estado */}
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">Cambiar estado</p>
                          <div className="flex flex-col gap-2">
                            {ESTADOS.map((e) => {
                              const activo = s.estado === e;
                              const eCfg = estadoConfig[e];
                              return (
                                <button
                                  key={e}
                                  onClick={() => !activo && handleCambiarEstado(s.id, e)}
                                  disabled={activo}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                                    activo
                                      ? `${eCfg.cls} ring-2 cursor-default`
                                      : 'bg-white border-gray-200 text-slate-500 hover:border-gray-400 hover:text-slate-700'
                                  }`}
                                >
                                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${eCfg.dot}`} />
                                  {e}
                                  {activo && (
                                    <svg className="w-3.5 h-3.5 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 text-right">
        Mostrando {datos.length} de {solicitudes.length} solicitudes
      </p>
    </div>
  );
}
