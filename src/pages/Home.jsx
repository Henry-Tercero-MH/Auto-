import { useMemo } from 'react';
import SpinnerBolitas from '../components/SpinnerBolitas';
import { Link } from 'react-router-dom';
import {
  Plus, ClipboardList, CalendarDays, Clock, Wrench, CheckCircle2,
  UserMinus, AlertTriangle, Zap, ChevronRight, Database, BarChart3,
  TrendingUp, CalendarCheck, BadgeCheck, Receipt, Package,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCatalogos } from '../context/CatalogosContext';
import { useSolicitudes } from '../context/SolicitudesContext';
import { usePagos } from '../context/PagosContext';

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

  const slices = data.filter((d) => d.value > 0).reduce((acc, d) => {
    const pct = d.value / Math.max(total, 1);
    const dash = pct * circ;
    const offset = acc.reduce((s, x) => s + x.dash, 0);
    return [...acc, { ...d, dash, offset, pct }];
  }, []);

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
function KpiCard({ label, value, sub, color, bg, Icon: IconComp, border }) {
  return (
    <div className={`bg-white rounded-2xl border ${border || 'border-gray-100'} shadow-sm p-3 sm:p-4 flex items-center gap-3 hover:shadow-md transition-shadow`}>
      <div className={`w-10 h-10 sm:w-12 sm:h-12 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
        <IconComp className={`w-4 h-4 sm:w-5 sm:h-5 ${color}`} strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xl sm:text-2xl font-black text-primary leading-none">{value}</p>
        <p className="text-[11px] sm:text-xs font-semibold text-slate-600 mt-0.5 truncate">{label}</p>
        <p className="text-[10px] text-slate-400 truncate hidden sm:block">{sub}</p>
      </div>
    </div>
  );
}


const formatQ = (n) => `Q ${Number(n).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Home() {

  const { user } = useAuth();
  const { estados } = useCatalogos();
  const { solicitudes, cargando } = useSolicitudes();
  const { pagos } = usePagos();

  // Log temporal para depuración: mostrar el campo 'marca' de todas las solicitudes
  console.log('Solicitudes (campo marca):', solicitudes.map(s => ({ id: s.id, marca: s.marca })));

  const today = new Date().toLocaleDateString('es-GT', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const hoy = new Date().toISOString().slice(0, 10);

  const kpis = useMemo(() => {
    const mes     = new Date().toISOString().slice(0, 7);
    const solMes  = solicitudes.filter((s) => (s.fecha || '').startsWith(mes));
    const total       = solMes.length;
    const pendientes  = solicitudes.filter((s) => s.estado === 'Pendiente').length;
    const enProceso   = solicitudes.filter((s) => s.estado === 'En proceso').length;
    const completadas = solMes.filter((s) => s.estado === 'Completada').length;
    const sinAsignar  = solicitudes.filter((s) => !s.mecanico && s.estado === 'Pendiente').length;
    const hoyTotal    = solicitudes.filter((s) => s.fecha === hoy).length;
    return { total, pendientes, enProceso, completadas, sinAsignar, hoyTotal };
  }, [solicitudes, hoy]);

  const finanzas = useMemo(() => {
    const mes = new Date().toISOString().slice(0, 7);
    const estadoSol = {};
    solicitudes.forEach((s) => { estadoSol[s.id] = s.estado; });
    const monto = (p) => Number(p.monto) || 0;
    const sum   = (arr) => arr.reduce((t, p) => t + monto(p), 0);

    const pagosMes = pagos.filter((p) => (p.fecha || '').startsWith(mes));

    // Mapa solicitud_id → monto del mes (para repuestos/manoObra)
    const montoSol = {};
    pagosMes.forEach((p) => {
      montoSol[p.solicitud_id] = (montoSol[p.solicitud_id] || 0) + (Number(p.monto) || 0);
    });

    // Repuestos y mano de obra solo del mes actual
    const solMes = solicitudes.filter((s) => (s.fecha || '').startsWith(mes));
    let totalRepuestos = 0;
    let totalManoObra  = 0;
    solMes.forEach((s) => {
      let repEnEsta = 0;
      if (typeof s.marca === 'string' && s.marca.includes(':')) {
        s.marca.split('|').forEach((parte) => {
          if (parte.startsWith('R:')) {
            const precio = Number(parte.split(':')[3]) || 0;
            totalRepuestos += precio;
            repEnEsta      += precio;
          }
        });
      }
      const totalOrden = montoSol[s.id] || Number(s.precio) || 0;
      totalManoObra += Math.max(0, totalOrden - repEnEsta);
    });

    return {
      porCobrar:       sum(pagosMes.filter((p) => { const st = estadoSol[p.solicitud_id]; return st === 'Pendiente' || st === 'En proceso'; })),
      totalCompletado: sum(pagosMes.filter((p) => estadoSol[p.solicitud_id] === 'Completada')),
      hoy:             sum(pagos.filter((p) => (p.fecha || '').slice(0, 10) === hoy)),
      mes:             sum(pagosMes),
      totalRepuestos,
      totalManoObra,
    };
  }, [solicitudes, pagos, hoy]);

  const recientes = solicitudes
    .filter((s) => (s.fecha || '').startsWith(new Date().toISOString().slice(0, 7)))
    .sort((a, b) => {
      const byFecha = (b.fecha || '').localeCompare(a.fecha || '');
      if (byFecha !== 0) return byFecha;
      return Number(b.id) - Number(a.id);
    })
    .slice(0, 8);

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

  if (cargando) return <SpinnerBolitas texto="Cargando dashboard..." />;

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
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Nueva Solicitud
        </Link>
      </div>

      {/* ── KPIs operativos ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <KpiCard label="Total"       value={kpis.total}       sub="órdenes este mes"  Icon={ClipboardList}  color="text-primary"     bg="bg-blue-50"    />
        <KpiCard label="Hoy"         value={kpis.hoyTotal}    sub="ingresaron hoy"    Icon={CalendarDays}   color="text-blue-500"    bg="bg-blue-50"    />
        <KpiCard label="Pendientes"  value={kpis.pendientes}  sub="por atender"       Icon={Clock}          color="text-amber-500"   bg="bg-amber-50"   />
        <KpiCard label="En proceso"  value={kpis.enProceso}   sub="en taller"         Icon={Wrench}         color="text-orange-500"  bg="bg-orange-50"  />
        <KpiCard label="Completadas" value={kpis.completadas} sub="este mes"          Icon={CheckCircle2}   color="text-green-500"   bg="bg-green-50"   />
        <KpiCard label="Sin asignar" value={kpis.sinAsignar}  sub="sin mecánico"      Icon={UserMinus}      color="text-slate-500"   bg="bg-slate-100"  />
      </div>

      {/* ── Resumen financiero ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Hoy',        value: formatQ(finanzas.hoy),             color: 'text-blue-600',   bg: 'bg-blue-50',   iconColor: 'text-blue-400',   icon: TrendingUp    },
          { label: 'Este mes',   value: formatQ(finanzas.mes),             color: 'text-violet-600', bg: 'bg-violet-50', iconColor: 'text-violet-400', icon: CalendarCheck },
          { label: 'Completado', value: formatQ(finanzas.totalCompletado), color: 'text-green-600',  bg: 'bg-green-50',  iconColor: 'text-green-400',  icon: BadgeCheck    },
          { label: 'Por cobrar', value: formatQ(finanzas.porCobrar),       color: 'text-accent',     bg: 'bg-red-50',    iconColor: 'text-red-300',    icon: Receipt       },
          { label: 'Repuestos vendidos', value: formatQ(finanzas.totalRepuestos), color: 'text-orange-600', bg: 'bg-orange-50', iconColor: 'text-orange-400', icon: Package },
          { label: 'Mano de obra',       value: formatQ(finanzas.totalManoObra),  color: 'text-amber-600', bg: 'bg-amber-50',  iconColor: 'text-amber-400',  icon: Wrench  },
        ].map(({ label, value, color, bg, iconColor, icon }) => {
          const FinIcon = icon;
          return (
            <div key={label} className={`${bg} rounded-xl p-4 flex flex-col gap-2`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
                <FinIcon className={`w-4 h-4 ${iconColor}`} strokeWidth={1.8} />
              </div>
              <span className={`text-lg font-black ${color} leading-none`}>{value}</span>
            </div>
          );
        })}
      </div>

      {/* ── Alerta sin asignar ── */}
      {kpis.sinAsignar > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-600" strokeWidth={1.8} />
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
          <h3 className="font-semibold text-primary text-sm sm:text-base">Solicitudes del mes</h3>
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
                  <td className="px-3 sm:px-6 py-3 font-medium text-slate-800 text-xs sm:text-sm uppercase">{s.cliente}</td>
                  <td className="px-3 sm:px-6 py-3 text-slate-500 hidden md:table-cell text-xs uppercase">{s.vehiculo}</td>
                  <td className="px-3 sm:px-6 py-3 text-slate-500 hidden sm:table-cell text-xs">{s.servicio}</td>
                  <td className="px-3 sm:px-6 py-3 hidden lg:table-cell">
                    {s.mecanico
                      ? <span className="text-xs text-slate-600">{s.mecanico?.name ?? s.mecanico?.nombre ?? 'Asignado'}</span>
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

      {/* ── Accesos rápidos ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.8} />
          </div>
          <h3 className="font-bold text-primary text-sm">Accesos rápidos</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link to="/solicitudes" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-blue-200 hover:shadow-md transition-all group flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
              <ClipboardList className="w-5 h-5 text-blue-600" strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">Solicitudes</p>
              <p className="text-slate-400 text-xs">Gestionar órdenes de servicio</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-blue-400 transition-colors" strokeWidth={2} />
          </Link>
          <Link to="/catalogos" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-orange-200 hover:shadow-md transition-all group flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-orange-100 transition-colors">
              <Database className="w-5 h-5 text-orange-500" strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm group-hover:text-orange-500 transition-colors">Catálogos</p>
              <p className="text-slate-400 text-xs">Clientes, mecánicos y servicios</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-orange-400 transition-colors" strokeWidth={2} />
          </Link>
          <Link to="/reportes" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-green-200 hover:shadow-md transition-all group flex items-center gap-4">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-green-100 transition-colors">
              <BarChart3 className="w-5 h-5 text-green-600" strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm group-hover:text-green-600 transition-colors">Reportes</p>
              <p className="text-slate-400 text-xs">Análisis histórico del taller</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-green-400 transition-colors" strokeWidth={2} />
          </Link>
        </div>
      </div>

    </div>
  );
}
