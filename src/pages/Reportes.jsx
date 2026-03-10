import { useMemo, useState } from 'react';
import { useSolicitudes } from '../context/SolicitudesContext';
import { useCatalogos } from '../context/CatalogosContext';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const Icon = ({ path, className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

// ── Barra horizontal con label ────────────────────────────────────────────────
function BarraH({ label, valor, max, color = 'bg-accent', suffix = '' }) {
  const pct = max > 0 ? Math.round((valor / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-500 w-32 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-slate-700 w-8 text-right flex-shrink-0">{valor}{suffix}</span>
    </div>
  );
}

// ── Gráfica de barras vertical simple (sin librería) ──────────────────────────
function GraficaBarras({ datos, colorBarra = '#e53935', alto = 120 }) {
  const max = Math.max(...datos.map((d) => d.valor), 1);
  return (
    <div className="flex items-end gap-1 sm:gap-2" style={{ height: alto + 24 }}>
      {datos.map((d) => {
        const h = Math.round((d.valor / max) * alto);
        return (
          <div key={d.label} className="flex flex-col items-center flex-1 min-w-0">
            <span className="text-xs font-bold text-slate-600 mb-1">{d.valor || ''}</span>
            <div
              className="w-full rounded-t-md transition-all duration-500"
              style={{ height: h || 2, backgroundColor: d.valor ? colorBarra : '#e5e7eb', minHeight: 2 }}
              title={`${d.label}: ${d.valor}`}
            />
            <span className="text-xs text-slate-400 mt-1 truncate w-full text-center">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Tarjeta KPI ───────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, color = 'bg-primary' }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center shrink-0`}>
        <Icon path={icon} className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-black text-primary">{value}</p>
        <p className="text-xs font-semibold text-slate-700">{label}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function Reportes() {
  const { solicitudes } = useSolicitudes();
  const { mecanicos, estados } = useCatalogos();

  const añoActual = new Date().getFullYear();
  const [añoFiltro, setAñoFiltro] = useState(añoActual);

  // Años disponibles en los datos
  const añosDisponibles = useMemo(() => {
    const set = new Set(solicitudes.map((s) => s.fecha?.slice(0, 4)).filter(Boolean));
    return [...set].sort((a, b) => b - a);
  }, [solicitudes]);

  const solicitudesFiltradas = useMemo(
    () => solicitudes.filter((s) => s.fecha?.startsWith(String(añoFiltro))),
    [solicitudes, añoFiltro]
  );

  // ── KPIs globales del año ─────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total       = solicitudesFiltradas.length;
    const completadas = solicitudesFiltradas.filter((s) => s.estado === 'Completada').length;
    const enProceso   = solicitudesFiltradas.filter((s) => s.estado === 'En proceso').length;
    const pendientes  = solicitudesFiltradas.filter((s) => s.estado === 'Pendiente').length;
    const tasaCompl   = total > 0 ? Math.round((completadas / total) * 100) : 0;
    const sinAsignar  = solicitudesFiltradas.filter((s) => !s.mecanico).length;
    return { total, completadas, enProceso, pendientes, tasaCompl, sinAsignar };
  }, [solicitudesFiltradas]);

  // ── Solicitudes por mes ───────────────────────────────────────────────────
  const porMes = useMemo(() => {
    const conteo = Array(12).fill(0);
    solicitudesFiltradas.forEach((s) => {
      const mes = parseInt(s.fecha?.slice(5, 7), 10) - 1;
      if (mes >= 0 && mes < 12) conteo[mes]++;
    });
    return MESES.map((label, i) => ({ label, valor: conteo[i] }));
  }, [solicitudesFiltradas]);

  // ── Completadas vs Pendientes por mes ────────────────────────────────────
  const porMesEstado = useMemo(() => {
    const comp = Array(12).fill(0);
    const pend = Array(12).fill(0);
    solicitudesFiltradas.forEach((s) => {
      const mes = parseInt(s.fecha?.slice(5, 7), 10) - 1;
      if (mes >= 0 && mes < 12) {
        if (s.estado === 'Completada') comp[mes]++;
        else pend[mes]++;
      }
    });
    return MESES.map((label, i) => ({ label, completadas: comp[i], pendientes: pend[i] }));
  }, [solicitudesFiltradas]);

  // ── Servicios más solicitados ─────────────────────────────────────────────
  const topServicios = useMemo(() => {
    const conteo = {};
    solicitudesFiltradas.forEach((s) => {
      conteo[s.servicio] = (conteo[s.servicio] || 0) + 1;
    });
    return Object.entries(conteo)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([nombre, count]) => ({ label: nombre, valor: count }));
  }, [solicitudesFiltradas]);

  // ── Productividad por mecánico ────────────────────────────────────────────
  const prodMecanicos = useMemo(() => {
    return mecanicos
      .filter((m) => m.activo)
      .map((m) => {
        const asignadas    = solicitudesFiltradas.filter((s) => s.mecanico?.id === m.id);
        const completadas  = asignadas.filter((s) => s.estado === 'Completada').length;
        const enProceso    = asignadas.filter((s) => s.estado === 'En proceso').length;
        const tasa         = asignadas.length > 0 ? Math.round((completadas / asignadas.length) * 100) : 0;
        return { id: m.id, nombre: m.nombre, especialidad: m.especialidad, total: asignadas.length, completadas, enProceso, tasa };
      })
      .sort((a, b) => b.completadas - a.completadas);
  }, [solicitudesFiltradas, mecanicos]);

  const maxComp = prodMecanicos[0]?.completadas || 1;

  // ── Estado breakdown ──────────────────────────────────────────────────────
  const estadoBreakdown = useMemo(() => {
    return estados.map((e) => ({
      nombre: e.nombre,
      count: solicitudesFiltradas.filter((s) => s.estado === e.nombre).length,
      cls: e.bgClass,
      dot: e.dotClass,
    }));
  }, [solicitudesFiltradas, estados]);

  // ── Mes pico ──────────────────────────────────────────────────────────────
  const mesPico = useMemo(() => {
    const max = Math.max(...porMes.map((m) => m.valor));
    const idx = porMes.findIndex((m) => m.valor === max);
    return max > 0 ? `${MESES[idx]} (${max} órdenes)` : '—';
  }, [porMes]);

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-slate-500 text-sm mt-0.5">Análisis de rendimiento del taller</p>
        </div>
        {/* Selector de año */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-500">Año:</label>
          <select
            value={añoFiltro}
            onChange={(e) => setAñoFiltro(Number(e.target.value))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {añosDisponibles.length > 0
              ? añosDisponibles.map((a) => <option key={a} value={a}>{a}</option>)
              : <option value={añoActual}>{añoActual}</option>
            }
          </select>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard label="Total órdenes"   value={kpis.total}       sub={`año ${añoFiltro}`}        color="bg-primary"    icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        <KpiCard label="Completadas"     value={kpis.completadas} sub="finalizadas"               color="bg-green-500"  icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        <KpiCard label="En proceso"      value={kpis.enProceso}   sub="actualmente"               color="bg-orange-500" icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        <KpiCard label="Pendientes"      value={kpis.pendientes}  sub="por atender"               color="bg-amber-500"  icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        <KpiCard label="Tasa compl."     value={`${kpis.tasaCompl}%`} sub="órdenes completadas"  color="bg-blue-500"   icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </div>

      {/* ── Tarjetas resumen extra ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Mes con más actividad</p>
          <p className="text-lg font-black text-primary">{mesPico}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Sin asignar a mecánico</p>
          <p className="text-lg font-black text-amber-600">{kpis.sinAsignar} <span className="text-sm font-normal text-slate-400">órdenes</span></p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Servicio #1</p>
          <p className="text-lg font-black text-primary truncate">{topServicios[0]?.label || '—'}</p>
          {topServicios[0] && <p className="text-xs text-slate-400">{topServicios[0].valor} solicitudes</p>}
        </div>
      </div>

      {/* ── Solicitudes por mes (gráfica de barras) ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-primary mb-5 text-sm uppercase tracking-wide">Órdenes por mes — {añoFiltro}</h3>
        {kpis.total === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">Sin datos para este año</p>
        ) : (
          <GraficaBarras datos={porMes} alto={130} colorBarra="#1e3a5f" />
        )}
      </div>

      {/* ── Fila: Servicios más solicitados + Estado breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Servicios top */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-primary mb-5 text-sm uppercase tracking-wide">Servicios más solicitados</h3>
          {topServicios.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {topServicios.map((s, i) => (
                <BarraH
                  key={s.label}
                  label={s.label}
                  valor={s.valor}
                  max={topServicios[0].valor}
                  color={i === 0 ? 'bg-accent' : i === 1 ? 'bg-orange-400' : 'bg-primary'}
                />
              ))}
            </div>
          )}
        </div>

        {/* Breakdown por estado */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-primary mb-5 text-sm uppercase tracking-wide">Distribución por estado</h3>
          {kpis.total === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">Sin datos</p>
          ) : (
            <div className="space-y-4">
              {estadoBreakdown.map((e) => (
                <div key={e.nombre}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${e.dot}`} />
                      <span className="text-sm text-slate-700">{e.nombre}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${e.cls}`}>{e.count}</span>
                      <span className="text-xs text-slate-400">
                        {kpis.total > 0 ? Math.round((e.count / kpis.total) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: kpis.total > 0 ? `${Math.round((e.count / kpis.total) * 100)}%` : '0%',
                        backgroundColor: estados.find((s) => s.nombre === e.nombre)?.color || '#94a3b8',
                      }}
                    />
                  </div>
                </div>
              ))}

              {/* Dona visual simple */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-4 flex-wrap">
                {estadoBreakdown.map((e) => (
                  <div key={e.nombre} className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className={`w-2 h-2 rounded-full ${e.dot}`} />
                    {e.nombre}: {kpis.total > 0 ? Math.round((e.count / kpis.total) * 100) : 0}%
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Productividad por mecánico ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-primary mb-5 text-sm uppercase tracking-wide">Productividad por mecánico — {añoFiltro}</h3>
        {prodMecanicos.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">Sin mecánicos registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Mecánico</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Especialidad</th>
                  <th className="text-center px-4 py-3">Total</th>
                  <th className="text-center px-4 py-3">Completadas</th>
                  <th className="text-center px-4 py-3">En proceso</th>
                  <th className="text-left px-4 py-3">Tasa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {prodMecanicos.map((m, i) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        {i === 0 && m.completadas > 0 && (
                          <span className="text-amber-400 text-sm">🏆</span>
                        )}
                        <span className="font-semibold text-slate-800 text-sm">{m.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 text-xs hidden sm:table-cell">{m.especialidad}</td>
                    <td className="px-4 py-3.5 text-center font-bold text-slate-700">{m.total}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-bold text-green-600">{m.completadas}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-bold text-orange-500">{m.enProceso}</span>
                    </td>
                    <td className="px-4 py-3.5 min-w-[100px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${m.tasa}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-600 w-8">{m.tasa}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
