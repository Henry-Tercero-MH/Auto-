import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSolicitudes } from '../context/SolicitudesContext';
import { useCatalogos } from '../context/CatalogosContext';
import { useAuth } from '../context/AuthContext';
import { isFeatureEnabled } from '../config/rbac';

// Extrae el FILE_ID de una URL de Google Drive y devuelve URL de thumbnail
function driveThumb(url = '', size = 200) {
  const m = url.match(/\/file\/d\/([^/]+)/);
  if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w${size}`;
  const m2 = url.match(/[?&]id=([^&]+)/);
  if (m2) return `https://drive.google.com/thumbnail?id=${m2[1]}&sz=w${size}`;
  return url;
}

const fotosEnabled = isFeatureEnabled('fotos');

// ── Modal carrusel de fotos ──────────────────────────────────────────────────
function CarruselModal({ urls, inicial = 0, onClose }) {
  const [idx, setIdx] = useState(inicial);
  const prev = useCallback(() => setIdx((i) => (i - 1 + urls.length) % urls.length), [urls.length]);
  const next = useCallback(() => setIdx((i) => (i + 1) % urls.length), [urls.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape')     onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Cerrar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white transition"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Contador */}
      <p className="absolute top-5 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium">
        {idx + 1} / {urls.length}
      </p>

      {/* Imagen */}
      <div className="relative flex items-center justify-center w-full max-w-3xl px-14">
        {urls.length > 1 && (
          <button
            onClick={prev}
            className="absolute left-2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <img
          key={idx}
          src={driveThumb(urls[idx], 1200)}
          alt={`Foto ${idx + 1}`}
          className="max-h-[75vh] max-w-full rounded-xl object-contain shadow-2xl"
          onError={(e) => { e.currentTarget.src = driveThumb(urls[idx], 400); }}
        />

        {urls.length > 1 && (
          <button
            onClick={next}
            className="absolute right-2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Miniaturas */}
      {urls.length > 1 && (
        <div className="flex gap-2 mt-5 overflow-x-auto max-w-full px-4">
          {urls.map((url, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition ${i === idx ? 'border-white' : 'border-transparent opacity-50 hover:opacity-80'}`}
            >
              <img src={driveThumb(url, 100)} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Abrir en Drive */}
      <a
        href={urls[idx]}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 text-xs text-white/40 hover:text-white/70 transition underline"
      >
        Abrir en Google Drive
      </a>
    </div>
  );
}

export default function Solicitudes() {
  const { solicitudes, cambiarEstado, tomarSolicitud } = useSolicitudes();
  const { estados } = useCatalogos();
  const { user, esAdmin, esMecanico } = useAuth();
  const [carrusel, setCarrusel] = useState(null); // { urls, idx }

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
        (s.cliente || '').toLowerCase().includes(q) ||
        (s.vehiculo || '').toLowerCase().includes(q) ||
        String(s.placa || '').toLowerCase().includes(q) ||
        (s.servicio || '').toLowerCase().includes(q) ||
        (s.id || '').includes(q);
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

  const cargaPorMecanico = useMemo(() => {
    if (!esAdmin) return [];
    const mapa = {};
    solicitudes.forEach((s) => {
      const nombre = s.mecanico?.name ?? s.mecanico?.nombre;
      if (!nombre) return;
      if (!mapa[nombre]) mapa[nombre] = { nombre, total: 0 };
      mapa[nombre].total += 1;
    });
    return Object.values(mapa)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [solicitudes, esAdmin]);

  const actividadDia = useMemo(() => {
    const hoy = new Date().toISOString().slice(0, 10);
    const creadasHoy = solicitudes.filter((s) => s.fecha === hoy).length;
    const completadasHoy = solicitudes.filter((s) => s.fecha === hoy && s.estado === 'Completada').length;
    return { creadasHoy, completadasHoy };
  }, [solicitudes]);

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
          <h2 className="text-lg font-semibold text-primary">Órdenes de servicio</h2>
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
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-150"
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
            className={`px-3 sm:px-4 py-2 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all min-h-[36px] ${
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
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
        />
      </div>

      {/* Layout principal: lista + panel lateral */}
      <div className="grid grid-cols-1 lg:grid-cols-[2.5fr_1fr] gap-4 items-start">
        {/* Lista */}
        <div>
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
                        className={`w-full text-left px-4 sm:px-6 py-4 hover:bg-slate-50 transition-colors ${
                          disponibleParaTomar ? 'border-l-4 border-blue-400' : esMiaSolicitud ? 'border-l-4 border-primary' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                          <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-4 gap-1 sm:gap-4">
                            <div>
                              <p className="font-semibold text-slate-800 text-sm truncate uppercase">{s.cliente}</p>
                              <p className="text-xs text-slate-400 font-mono">#{s.id}</p>
                            </div>
                            <div className="hidden sm:block">
                              <p className="text-sm text-slate-600 truncate uppercase">{s.vehiculo}</p>
                              <p className="text-xs text-slate-400 uppercase">{s.placa}</p>
                            </div>
                            <div className="hidden sm:block">
                              <p className="text-sm text-slate-600 truncate">{s.servicio}</p>
                              <p className="text-xs text-slate-400">{s.fecha}</p>
                            </div>
                            <div className="hidden lg:flex items-center gap-1 text-xs text-slate-500">
                              {s.mecanico ? (
                                <>
                                  <svg className="w-3.5 h-3.5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  <span className="truncate">
                                    {s.mecanico?.name ?? s.mecanico?.nombre ?? 'Asignado'}
                                  </span>
                                </>
                              ) : (
                                <span className="text-amber-500 font-medium">Sin asignar</span>
                              )}
                            </div>
                          </div>

                          {/* Badge "disponible" para mecánico */}
                          {disponibleParaTomar && (
                            <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-1 rounded-full flex-shrink-0 hidden xs:inline-flex sm:inline-flex">
                              Disponible
                            </span>
                          )}

                          <span className={`px-2 py-1 sm:px-2.5 rounded-full text-xs font-semibold flex-shrink-0 ${cfg.cls}`}>
                            <span className="hidden sm:inline">{s.estado}</span>
                            <span className="sm:hidden">{s.estado.substring(0, 3)}</span>
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
                        <div className="sm:col-span-2 grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4 text-sm">
                          <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Cliente</p>
                            <p className="font-semibold text-slate-800 uppercase">{s.cliente}</p>
                            <p className="text-slate-500">{s.tel}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Vehículo</p>
                            <p className="font-semibold text-slate-800 uppercase">{s.vehiculo}</p>
                            <p className="text-slate-500 uppercase">Placa: {s.placa}</p>
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
                                  {(s.mecanico?.name ?? s.mecanico?.nombre ?? '?').charAt(0)}
                                </div>
                                <p className="font-semibold text-slate-800">{s.mecanico?.name ?? s.mecanico?.nombre ?? 'Sin nombre'}</p>
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

                          {/* ── Fotos ── */}
                          {fotosEnabled && s.fotos && s.fotos.trim() !== '' && (() => {
                            const urls = s.fotos.split(',').map((u) => u.trim()).filter(Boolean);
                            return urls.length > 0 ? (
                              <div className="mt-5 pt-4 border-t border-slate-200">
                                <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">
                                  Fotos ({urls.length})
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {urls.map((url, i) => (
                                    <button
                                      key={i}
                                      onClick={() => setCarrusel({ urls, idx: i })}
                                      className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-slate-100 flex-shrink-0 hover:opacity-80 hover:scale-105 transition-all"
                                      title="Ver foto"
                                    >
                                      <img
                                        src={driveThumb(url, 200)}
                                        alt={`Foto ${i + 1}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                      <span className="absolute bottom-0 right-0 bg-black/40 text-white text-[9px] px-1 py-0.5 rounded-tl">
                                        #{i + 1}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 text-right mt-3">
            Mostrando {datosFiltrados.length} de {solicitudes.length} solicitudes
          </p>
        </div>

        {/* Panel lateral de resumen */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-primary">Resumen operativo</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Visión rápida del estado actual de las órdenes.
            </p>
          </div>

          {/* Resumen por estado */}
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Por estado
            </p>
            <div className="space-y-1.5">
              {FILTROS.filter((f) => f !== 'Todos').map((f) => {
                const totalBase = conteo.Todos || 1;
                const val = conteo[f] || 0;
                const pct = Math.round((val / totalBase) * 100);
                return (
                  <div key={f} className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 flex-1 truncate">{f}</span>
                    <span className="text-xs font-semibold text-slate-700 tabular-nums w-8 text-right">
                      {val}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-primary/70"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Carga por mecánico (solo admin) */}
          {esAdmin && cargaPorMecanico.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Carga por mecánico
              </p>
              <div className="space-y-1.5">
                {cargaPorMecanico.map((m) => (
                  <div key={m.nombre} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary flex-shrink-0">
                      {m.nombre.charAt(0)}
                    </div>
                    <span className="flex-1 text-xs text-slate-600 truncate">{m.nombre}</span>
                    <span className="text-xs font-semibold text-slate-700 tabular-nums">
                      {m.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actividad del día */}
          <div className="border-t border-slate-100 pt-3">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Actividad de hoy
            </p>
            <div className="space-y-1">
              <p className="text-xs text-slate-600">
                <span className="font-semibold">{actividadDia.creadasHoy}</span> nuevas solicitudes creadas.
              </p>
              <p className="text-xs text-slate-600">
                <span className="font-semibold">{actividadDia.completadasHoy}</span> solicitudes completadas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Carrusel modal ── */}
      {carrusel && (
        <CarruselModal
          urls={carrusel.urls}
          inicial={carrusel.idx}
          onClose={() => setCarrusel(null)}
        />
      )}
    </div>
  );
}
