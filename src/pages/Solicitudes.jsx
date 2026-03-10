import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSolicitudes } from '../context/SolicitudesContext';
import { useCatalogos } from '../context/CatalogosContext';
import { useAuth } from '../context/AuthContext';

export default function Solicitudes() {
  const { solicitudes, cambiarEstado, tomarSolicitud } = useSolicitudes();
  const { estados } = useCatalogos();
  const { user, esAdmin, esMecanico } = useAuth();

  // Config de estados dinámicos
  const estadoConfig = useMemo(() => {
    const cfg = {};
    estados.forEach((e) => { cfg[e.nombre] = { cls: e.bgClass, dot: e.dotClass, label: e.nombre }; });
    return cfg;
  }, [estados]);

  const ESTADOS = useMemo(() => estados.map((e) => e.nombre), [estados]);
  const FILTROS = useMemo(() => ['Todos', ...ESTADOS], [ESTADOS]);

  const [filtro, setFiltro] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [expandido, setExpandido] = useState(null);

  // El mecánico solo ve sus solicitudes + las Pendientes sin asignar
  const datosFiltrados = useMemo(() => {
    return solicitudes.filter((s) => {
      if (esMecanico) {
        const esMia = s.mecanico?.id === user?.id;
        const disponible = !s.mecanico && s.estado === 'Pendiente';
        if (!esMia && !disponible) return false;
      }
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
  }, [solicitudes, filtro, busqueda, esMecanico, user]);

  const conteo = useMemo(() => {
    const base = esMecanico
      ? solicitudes.filter((s) => s.mecanico?.id === user?.id || (!s.mecanico && s.estado === 'Pendiente'))
      : solicitudes;
    const c = { Todos: base.length };
    ESTADOS.forEach((e) => { c[e] = base.filter((s) => s.estado === e).length; });
    return c;
  }, [solicitudes, ESTADOS, esMecanico, user]);

  const handleCambiarEstado = (id, nuevoEstado) => {
    cambiarEstado(id, nuevoEstado);
    toast.success(`Estado actualizado a "${nuevoEstado}"`);
  };

  const handleTomarSolicitud = (s) => {
    tomarSolicitud(s.id, { id: user.id, name: user.name });
    toast.success(`Tomaste la solicitud #${s.id}`);
    setExpandido(s.id);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {esMecanico ? (
            <p className="text-slate-500 text-sm mt-0.5">
              Tus órdenes asignadas y las disponibles para tomar
            </p>
          ) : (
            <p className="text-slate-500 text-sm mt-0.5">Gestión de órdenes de servicio</p>
          )}
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

      {/* Banner mecánico — solicitudes disponibles para tomar */}
      {esMecanico && (() => {
        const disponibles = solicitudes.filter((s) => !s.mecanico && s.estado === 'Pendiente').length;
        return disponibles > 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3 text-blue-700">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium">
              Hay <span className="font-bold">{disponibles}</span> {disponibles === 1 ? 'solicitud disponible' : 'solicitudes disponibles'} para tomar
            </p>
          </div>
        ) : null;
      })()}

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
        {datosFiltrados.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-medium">Sin resultados</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {datosFiltrados.map((s) => {
              const cfg = estadoConfig[s.estado] || { cls: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400', label: s.estado };
              const abierto = expandido === s.id;

              // ¿Es una solicitud disponible para que el mecánico la tome?
              const disponibleParaTomar = esMecanico && !s.mecanico && s.estado === 'Pendiente';
              // ¿Es mía (mecánico asignado)?
              const esMiaSolicitud = esMecanico && s.mecanico?.id === user?.id;

              return (
                <div key={s.id}>
                  {/* Fila */}
                  <button
                    onClick={() => setExpandido(abierto ? null : s.id)}
                    className={`w-full text-left px-4 sm:px-6 py-4 hover:bg-slate-50 transition-colors ${disponibleParaTomar ? 'border-l-4 border-blue-400' : esMiaSolicitud ? 'border-l-4 border-primary' : ''}`}
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

                      {/* Badge mecánico asignado (solo admin) */}
                      {esAdmin && (
                        <span className="hidden sm:flex items-center gap-1 text-xs text-slate-500 flex-shrink-0 min-w-0 max-w-[130px]">
                          {s.mecanico ? (
                            <>
                              <svg className="w-3.5 h-3.5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span className="truncate">{s.mecanico.name}</span>
                            </>
                          ) : (
                            <span className="text-amber-500 font-medium">Sin asignar</span>
                          )}
                        </span>
                      )}

                      {/* Badge "disponible" para mecánico */}
                      {disponibleParaTomar && (
                        <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-1 rounded-full flex-shrink-0">
                          Disponible
                        </span>
                      )}

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

                      {/* ── Vista mecánico: disponible para tomar ── */}
                      {disponibleParaTomar && (
                        <div className="mb-5 bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-blue-800">Solicitud disponible</p>
                            <p className="text-xs text-blue-600 mt-0.5">Nadie ha tomado esta orden aún. ¿La tomas tú?</p>
                          </div>
                          <button
                            onClick={() => handleTomarSolicitud(s)}
                            className="inline-flex items-center gap-2 bg-primary hover:bg-slate-800 text-white font-semibold px-5 py-2.5 rounded-xl shadow transition-all text-sm flex-shrink-0"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Tomar solicitud
                          </button>
                        </div>
                      )}

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
                          {/* Mecánico asignado */}
                          <div className="col-span-2">
                            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Mecánico asignado</p>
                            {s.mecanico ? (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                  {s.mecanico.name.charAt(0)}
                                </div>
                                <p className="font-semibold text-slate-800">{s.mecanico.name}</p>
                              </div>
                            ) : (
                              <p className="text-amber-600 font-medium text-sm">Sin asignar</p>
                            )}
                          </div>
                        </div>

                        {/* Cambiar estado — mecánico solo puede si la solicitud es suya */}
                        {(esAdmin || esMiaSolicitud) && (
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
                        )}
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
        Mostrando {datosFiltrados.length} de {solicitudes.length} solicitudes
      </p>
    </div>
  );
}
