import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCatalogos } from '../context/CatalogosContext';
import { useSolicitudes } from '../context/SolicitudesContext';

const formatQ = (n) => `Q ${Number(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;


const Icon = ({ path, className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

function KpiCard({ label, value, sub, color, icon }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 lg:p-5 flex items-center gap-3">
      <div className={`w-9 h-9 sm:w-11 sm:h-11 ${color} rounded-xl flex items-center justify-center shrink-0`}>
        <Icon path={icon} className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xl sm:text-2xl font-black text-primary">{value}</p>
        <p className="text-xs font-semibold text-slate-700 truncate">{label}</p>
        <p className="text-xs text-slate-400 truncate hidden sm:block">{sub}</p>
      </div>
    </div>
  );
}

function QuickLink({ to, iconBg, iconColor, icon, title, sub }) {
  return (
    <Link to={to} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-accent hover:shadow-md transition-all group">
      <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center mb-3`}>
        <Icon path={icon} className={`w-5 h-5 ${iconColor}`} />
      </div>
      <p className="font-semibold text-slate-800 group-hover:text-accent transition-colors">{title}</p>
      <p className="text-slate-500 text-xs mt-1">{sub}</p>
    </Link>
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

  // ── KPIs operativos del día ───────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total       = solicitudes.length;
    const pendientes  = solicitudes.filter((s) => s.estado === 'Pendiente').length;
    const enProceso   = solicitudes.filter((s) => s.estado === 'En proceso').length;
    const completadas = solicitudes.filter((s) => s.estado === 'Completada').length;
    const sinAsignar  = solicitudes.filter((s) => !s.mecanico && s.estado === 'Pendiente').length;
    const hoyTotal    = solicitudes.filter((s) => s.fecha === hoy).length;
    return { total, pendientes, enProceso, completadas, sinAsignar, hoyTotal };
  }, [solicitudes, hoy]);

  // ── KPIs financieros ──────────────────────────────────────────────────────
  const finanzas = useMemo(() => {
    const mes = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
    const precio = (s) => {
      if (s.precio && Number(s.precio) > 0) return Number(s.precio);
      return (s.servicio || '').split(',').map((n) => n.trim())
        .reduce((sum, n) => sum + (preciosMap[n] || 0), 0);
    };
    const completadas  = solicitudes.filter((s) => s.estado === 'Completada');
    const porCobrar    = solicitudes.filter((s) => s.estado === 'Pendiente' || s.estado === 'En proceso');
    const hoyFact      = solicitudes.filter((s) => s.fecha === hoy);
    const mesFact      = solicitudes.filter((s) => (s.fecha || '').startsWith(mes));
    const sum = (arr) => arr.reduce((t, s) => t + precio(s), 0);
    return {
      totalCompletado: sum(completadas),
      porCobrar:       sum(porCobrar),
      hoy:             sum(hoyFact),
      mes:             sum(mesFact),
    };
  }, [solicitudes, preciosMap, hoy]);

  // ── Últimas 6 solicitudes ─────────────────────────────────────────────────
  const recientes = solicitudes.slice(0, 6);

  const estadoStyles = useMemo(() => {
    const m = {};
    estados.forEach((e) => { m[e.nombre] = e.bgClass; });
    return m;
  }, [estados]);

  return (
    <div className="space-y-6">

      {/* ── Bienvenida ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">Bienvenido, {user?.name}</h2>
          <p className="text-slate-500 text-sm mt-0.5 capitalize">{today}</p>
        </div>
        <Link
          to="/nueva-solicitud"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          <Icon path="M12 4v16m8-8H4" className="w-4 h-4" />
          Nueva Solicitud
        </Link>
      </div>

      {/* ── KPIs principales del día ── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Hoy"         value={kpis.hoyTotal}    sub="órdenes que ingresaron hoy"   color="bg-blue-500"   icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        <KpiCard label="Pendientes"  value={kpis.pendientes}  sub="por atender"                  color="bg-amber-500"  icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        <KpiCard label="En proceso"  value={kpis.enProceso}   sub="en taller"                    color="bg-orange-500" icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <KpiCard label="Completadas" value={kpis.completadas} sub="finalizadas"                  color="bg-green-500"  icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </div>

      {/* ── KPIs secundarios ── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
        <KpiCard label="Total"       value={kpis.total}       sub="todas las órdenes registradas" color="bg-primary"    icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        <KpiCard label="Sin asignar" value={kpis.sinAsignar}  sub="pendientes sin mecánico"       color="bg-slate-500"  icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </div>

      {/* ── Alerta sin asignar ── */}
      {kpis.sinAsignar > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 sm:px-5 py-3 flex items-center gap-3">
          <Icon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-bold">{kpis.sinAsignar}</span> {kpis.sinAsignar === 1 ? 'solicitud pendiente sin mecánico asignado' : 'solicitudes pendientes sin mecánico asignado'}
          </p>
          <Link to="/solicitudes" className="ml-auto text-xs font-semibold text-amber-700 hover:text-amber-900 underline flex-shrink-0">
            Ver solicitudes
          </Link>
        </div>
      )}

      {/* ── Bloque principal: Operación del día ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">
        {/* Solicitudes recientes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100">
            <div>
              <h3 className="font-semibold text-primary text-sm sm:text-base">Solicitudes recientes</h3>
              <p className="text-xs text-slate-400 mt-0.5">Las últimas {recientes.length || 0} órdenes registradas</p>
            </div>
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

        {/* Finanzas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Icon path="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-primary text-sm sm:text-base">Resumen financiero</h3>
            </div>
            <p className="text-[11px] text-slate-400 hidden lg:block">Cifras en tiempo real del taller</p>
          </div>
          <div className="grid grid-cols-2 divide-x divide-y lg:divide-y-0 divide-gray-100 h-full">
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
      </div>

      {/* ── Accesos rápidos ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <QuickLink to="/solicitudes"    iconBg="bg-blue-100"   iconColor="text-blue-600"
          icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          title="Solicitudes" sub="Gestionar órdenes de servicio" />
        <QuickLink to="/catalogos"      iconBg="bg-orange-100" iconColor="text-orange-500"
          icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          title="Catálogos" sub="Clientes, mecánicos y servicios" />
        <QuickLink to="/reportes"       iconBg="bg-green-100"  iconColor="text-green-600"
          icon="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          title="Reportes" sub="Análisis histórico del taller" />
      </div>

    </div>
  );
}
