import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCatalogos } from '../context/CatalogosContext';
import { useSolicitudes } from '../context/SolicitudesContext';

const formatQ = (n) =>
  `Q ${Number(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Icon = ({ path, className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

// ── Gráfico de barras SVG ─────────────────────────────────────────────────────
function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const h = 80;
  const w = 40;
  const gap = 12;
  const totalW = data.length * (w + gap) - gap;

  return (
    <svg viewBox={`0 0 ${totalW} ${h + 24}`} className="w-full" style={{ maxHeight: 130 }}>
      {data.map((d, i) => {
        const barH = Math.max((d.value / max) * h, 2);
        const x = i * (w + gap);
        const y = h - barH;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={w} height={barH} rx={5} fill={d.color} opacity={0.9} />
            <text x={x + w / 2} y={h + 13} textAnchor="middle" fontSize={9} fill="#94a3b8">{d.label}</text>
            <text x={x + w / 2} y={y - 4} textAnchor="middle" fontSize={10} fontWeight="700" fill={d.color}>{d.value}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Gráfico donut SVG ─────────────────────────────────────────────────────────
function DonutChart({ data, total }) {
  const r = 38;
  const cx = 50;
  const cy = 50;
  const circ = 2 * Math.PI * r;

  let offset = 0;
  const slices = data.filter((d) => d.value > 0).map((d) => {
    const pct = d.value / Math.max(total, 1);
    const dash = pct * circ;
    const slice = { ...d, dash, offset, pct };
    offset += dash;
    return slice;
  });

  return (
    <div className="relative flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={14} />
        {slices.map((s) => (
          <circle
            key={s.label}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={14}
            strokeDasharray={`${s.dash} ${circ - s.dash}`}
            strokeDashoffset={-s.offset}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-black text-primary">{total}</span>
        <span className="text-[10px] text-slate-400 font-medium">Total</span>
      </div>
    </div>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, bg, icon, border }) {
  return (
    <div className={`bg-white rounded-2xl border ${border || 'border-gray-100'} shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow`}>
      <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
        <Icon path={icon} className={`w-5 h-5 ${color}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-black text-primary leading-none">{value}</p>
        <p className="text-xs font-semibold text-slate-600 mt-0.5">{label}</p>
        <p className="text-[11px] text-slate-400 truncate">{sub}</p>
      </div>
    </div>
  );
}

// ── Finance card ──────────────────────────────────────────────────────────────
function FinanceCard({ label, value, sub, color, bg, icon }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 ${bg} rounded-lg flex items-center justify-center`}>
          <Icon path={icon} className={`w-3.5 h-3.5 ${color}`} />
        </div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
      </div>
      <p className={`text-xl font-black ${color}`}>{value}</p>
      <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { estados, preciosMap } = useCatalogos();
  const { solicitudes } = useSolicitudes();

  const today = new Date().toLocaleDateString('es-GT', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const hoy = new Date().toISOString().slice(0, 10);

  const kpis = useMemo(() => {
    const total       = solicitudes.length;
    const pendientes  = solicitudes.filter((s) => s.estado === 'Pendiente').length;
    const enProceso   = solicitudes.filter((s) => s.estado === 'En proceso').length;
    const completadas = solicitudes.filter((s) => s.estado === 'Completada').length;
    const sinAsignar  = solicitudes.filter((s) => !s.mecanico && s.estado === 'Pendiente').length;
    const hoyTotal    = solicitudes.filter((s) => s.fecha === hoy).length;
    return { total, pendientes, enProceso, completadas, sinAsignar, hoyTotal };
  }, [solicitudes, hoy]);

  const finanzas = useMemo(() => {
    const mes = new Date().toISOString().slice(0, 7);
    const precio = (s) => {
      if (s.precio && Number(s.precio) > 0) return Number(s.precio);
      return (s.servicio || '').split(',').map((n) => n.trim())
        .reduce((sum, n) => sum + (preciosMap[n] || 0), 0);
    };
    const completadasArr = solicitudes.filter((s) => s.estado === 'Completada');
    const porCobrarArr   = solicitudes.filter((s) => s.estado === 'Pendiente' || s.estado === 'En proceso');
    const hoyFact        = solicitudes.filter((s) => s.fecha === hoy);
    const mesFact        = solicitudes.filter((s) => (s.fecha || '').startsWith(mes));
    const sum = (arr) => arr.reduce((t, s) => t + precio(s), 0);
    return {
      totalCompletado: sum(completadasArr),
      porCobrar:       sum(porCobrarArr),
      hoy:             sum(hoyFact),
      mes:             sum(mesFact),
    };
  }, [solicitudes, preciosMap, hoy]);

  const recientes = solicitudes.slice(0, 8);

  const estadoStyles = useMemo(() => {
    const m = {};
    estados.forEach((e) => { m[e.nombre] = e.bgClass; });
    return m;
  }, [estados]);

  const barData = [
    { label: 'Pendiente',   value: kpis.pendientes,  color: '#f43f5e' },
    { label: 'En proceso',  value: kpis.enProceso,   color: '#8b5cf6' },
    { label: 'Completada',  value: kpis.completadas, color: '#10b981' },
    { label: 'Sin asignar', value: kpis.sinAsignar,  color: '#06b6d4' },
  ];

  const donutData = [
    { label: 'Pendiente',   value: kpis.pendientes,  color: '#f43f5e' },
    { label: 'En proceso',  value: kpis.enProceso,   color: '#8b5cf6' },
    { label: 'Completada',  value: kpis.completadas, color: '#10b981' },
    { label: 'Sin asignar', value: kpis.sinAsignar,  color: '#06b6d4' },
  ];

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-primary">Bienvenido, {user?.name}</h1>
          <p className="text-slate-400 text-xs mt-0.5 capitalize">{today}</p>
        </div>
        <Link
          to="/nueva-solicitud"
          className="inline-flex items-center gap-2 bg-accent hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          <Icon path="M12 4v16m8-8H4" className="w-4 h-4" />
          Nueva Solicitud
        </Link>
      </div>

      {/* ── KPIs operativos ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <KpiCard label="Total"       value={kpis.total}       sub="todas las órdenes"  color="bg-primary"    icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        <KpiCard label="Hoy"         value={kpis.hoyTotal}    sub="ingresaron hoy"     color="bg-blue-500"   icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        <KpiCard label="Pendientes"  value={kpis.pendientes}  sub="por atender"        color="bg-amber-500"  icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        <KpiCard label="En proceso"  value={kpis.enProceso}   sub="en taller"          color="bg-orange-500" icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <KpiCard label="Completadas" value={kpis.completadas} sub="finalizadas"        color="bg-green-500"  icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        <KpiCard label="Sin asignar" value={kpis.sinAsignar}  sub="sin mecánico"       color="bg-slate-500"  icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </div>

      {/* ── Alerta sin asignar ── */}
      {kpis.sinAsignar > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
            <Icon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-sm text-amber-800 flex-1">
            <span className="font-bold">{kpis.sinAsignar}</span> {kpis.sinAsignar === 1 ? 'solicitud pendiente sin mecánico asignado' : 'solicitudes pendientes sin mecánico asignado'}
          </p>
          <Link to="/solicitudes" className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline shrink-0">
            Ver solicitudes
          </Link>
        </div>
      )}

      {/* ── Solicitudes recientes ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-primary text-sm sm:text-base">Solicitudes recientes</h3>
          <Link to="/solicitudes" className="text-xs sm:text-sm text-accent hover:underline font-medium">Ver todas</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[300px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="text-left px-3 sm:px-6 py-3">ID</th>
                <th className="text-left px-3 sm:px-6 py-3">Cliente</th>
                <th className="text-left px-3 sm:px-6 py-3 hidden md:table-cell">Vehículo</th>
                <th className="text-left px-3 sm:px-6 py-3 hidden sm:table-cell">Servicio</th>
                <th className="text-left px-3 sm:px-6 py-3 hidden lg:table-cell">Mecánico</th>
                <th className="text-left px-3 sm:px-6 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recientes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">No hay solicitudes registradas</td>
                </tr>
              ) : recientes.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 sm:px-6 py-3 font-mono text-slate-500 text-xs">#{s.id}</td>
                  <td className="px-3 sm:px-6 py-3 font-medium text-slate-800 text-xs sm:text-sm">{s.cliente}</td>
                  <td className="px-3 sm:px-6 py-3 text-slate-500 hidden md:table-cell text-xs">{s.vehiculo}</td>
                  <td className="px-3 sm:px-6 py-3 text-slate-500 hidden sm:table-cell text-xs">{s.servicio}</td>
                  <td className="px-3 sm:px-6 py-3 hidden lg:table-cell">
                    {s.mecanico
                      ? <span className="text-xs text-slate-600">{s.mecanico.name}</span>
                      : <span className="text-xs text-amber-500 font-medium">Sin asignar</span>}
                  </td>
                  <td className="px-3 sm:px-6 py-3">
                    <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-semibold ${estadoStyles[s.estado] || 'bg-slate-100 text-slate-600'}`}>
                      {s.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Finanzas ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Icon path="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="font-semibold text-primary text-sm sm:text-base">Finanzas</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-gray-100">
          <div className="p-4 sm:p-5">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Hoy facturado</p>
            <p className="text-xl font-black text-primary">{formatQ(finanzas.hoy)}</p>
            <p className="text-xs text-slate-400 mt-0.5">órdenes de hoy</p>
          </div>
          <div className="p-4 sm:p-5">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Este mes</p>
            <p className="text-xl font-black text-primary">{formatQ(finanzas.mes)}</p>
            <p className="text-xs text-slate-400 mt-0.5">todas las órdenes del mes</p>
          </div>
          <div className="p-4 sm:p-5">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Completado</p>
            <p className="text-xl font-black text-emerald-600">{formatQ(finanzas.totalCompletado)}</p>
            <p className="text-xs text-slate-400 mt-0.5">órdenes finalizadas</p>
          </div>
          <div className="p-4 sm:p-5">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Por cobrar</p>
            <p className="text-xl font-black text-amber-500">{formatQ(finanzas.porCobrar)}</p>
            <p className="text-xs text-slate-400 mt-0.5">pendientes + en proceso</p>
          </div>
        </div>
      </div>

      {/* ── Finanzas ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
            <Icon path="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <h3 className="font-bold text-primary text-sm">Resumen financiero</h3>
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <FinanceCard label="Hoy facturado"   value={formatQ(finanzas.hoy)}             sub="órdenes de hoy"            bg="bg-blue-50"    color="text-blue-600"   icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          <FinanceCard label="Este mes"         value={formatQ(finanzas.mes)}             sub="todas las órdenes del mes" bg="bg-violet-50"  color="text-violet-600" icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          <FinanceCard label="Total completado" value={formatQ(finanzas.totalCompletado)} sub="órdenes finalizadas"        bg="bg-emerald-50" color="text-emerald-600" icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          <FinanceCard label="Por cobrar"       value={formatQ(finanzas.porCobrar)}       sub="pendientes + en proceso"   bg="bg-amber-50"   color="text-amber-600"  icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </div>
      </div>

      {/* ── Accesos rápidos ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
            <Icon path="M13 10V3L4 14h7v7l9-11h-7z" className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <h3 className="font-bold text-primary text-sm">Accesos rápidos</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link to="/solicitudes" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-blue-200 hover:shadow-md transition-all group flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
              <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">Solicitudes</p>
              <p className="text-slate-400 text-xs">Gestionar órdenes de servicio</p>
            </div>
            <Icon path="M9 5l7 7-7 7" className="w-4 h-4 text-slate-300 ml-auto group-hover:text-blue-400 transition-colors" />
          </Link>
          <Link to="/catalogos" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-orange-200 hover:shadow-md transition-all group flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-orange-100 transition-colors">
              <Icon path="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm group-hover:text-orange-500 transition-colors">Catálogos</p>
              <p className="text-slate-400 text-xs">Clientes, mecánicos y servicios</p>
            </div>
            <Icon path="M9 5l7 7-7 7" className="w-4 h-4 text-slate-300 ml-auto group-hover:text-orange-400 transition-colors" />
          </Link>
          <Link to="/reportes" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-green-200 hover:shadow-md transition-all group flex items-center gap-4">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-green-100 transition-colors">
              <Icon path="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm group-hover:text-green-600 transition-colors">Reportes</p>
              <p className="text-slate-400 text-xs">Análisis histórico del taller</p>
            </div>
            <Icon path="M9 5l7 7-7 7" className="w-4 h-4 text-slate-300 ml-auto group-hover:text-green-400 transition-colors" />
          </Link>
        </div>
      </div>

    </div>
  );
}
