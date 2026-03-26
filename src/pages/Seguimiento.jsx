import { useState, useMemo } from 'react';
import { useSolicitudes } from '../context/SolicitudesContext';
import { useCatalogos } from '../context/CatalogosContext';
import SpinnerBolitas from '../components/SpinnerBolitas';

/* ── Icono SVG inline ──────────────────────────────────────────────────────── */
const I = ({ d, className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);
const icons = {
  box:     'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  search:  'M21 21l-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
  trend:   'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  user:    'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  list:    'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  money:   'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  star:    'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  chevron: 'M19 9l-7 7-7-7',
};

const formatQ = (n) =>
  `Q ${Number(n).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/* ── KPI card ──────────────────────────────────────────────────────────────── */
function KpiCard({ label, value, sub, iconPath, color, bg }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
        <I d={iconPath} className={`w-5 h-5 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-black text-primary leading-none">{value}</p>
        <p className="text-[11px] font-semibold text-slate-600 mt-0.5 truncate">{label}</p>
        {sub && <p className="text-[10px] text-slate-400 truncate">{sub}</p>}
      </div>
    </div>
  );
}

/* ── Barra horizontal de progreso ─────────────────────────────────────────── */
function BarHoriz({ pct, color = 'bg-primary' }) {
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
      <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
   ════════════════════════════════════════════════════════════════════════════ */
export default function Inventario() {
  const { solicitudes, cargando } = useSolicitudes();
  const { repuestos } = useCatalogos();

  const [tab, setTab]       = useState('ranking');   // 'ranking' | 'historial' | 'clientes'
  const [busqueda, setBusqueda] = useState('');

  /* ── Parsear todos los repuestos vendidos desde el campo marca ── */
  const ventas = useMemo(() => {
    const lista = [];
    solicitudes.forEach((s) => {
      if (typeof s.marca !== 'string' || !s.marca.includes('R:')) return;
      s.marca.split('|').forEach((parte) => {
        if (!parte.startsWith('R:')) return;
        const segs = parte.split(':');
        // formato: R:id:descripcion:precio
        lista.push({
          repuesto_id: segs[1] || '',
          descripcion: segs[2] || '(sin nombre)',
          precio:      Number(segs[3]) || 0,
          cliente:     s.cliente  || '—',
          fecha:       s.fecha    || '',
          orden_id:    s.id       || '',
        });
      });
    });
    return lista;
  }, [solicitudes]);

  /* ── KPIs ── */
  const kpis = useMemo(() => {
    const totalFacturado  = ventas.reduce((s, v) => s + v.precio, 0);
    const unidades        = ventas.length;
    const clientesUnicos  = new Set(ventas.map((v) => v.cliente)).size;
    // repuesto más vendido (por veces)
    const conteo = {};
    ventas.forEach((v) => { conteo[v.descripcion] = (conteo[v.descripcion] || 0) + 1; });
    const masVendido = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
    return { totalFacturado, unidades, clientesUnicos, masVendido };
  }, [ventas]);

  /* ── Ranking de repuestos ── */
  const ranking = useMemo(() => {
    const map = {};
    ventas.forEach((v) => {
      if (!map[v.descripcion]) map[v.descripcion] = { descripcion: v.descripcion, id: v.repuesto_id, veces: 0, total: 0, clientes: new Set() };
      map[v.descripcion].veces   += 1;
      map[v.descripcion].total   += v.precio;
      map[v.descripcion].clientes.add(v.cliente);
    });
    return Object.values(map)
      .map((r) => ({ ...r, clientes: r.clientes.size }))
      .sort((a, b) => b.veces - a.veces);
  }, [ventas]);

  /* ── Por cliente ── */
  const porCliente = useMemo(() => {
    const map = {};
    ventas.forEach((v) => {
      if (!map[v.cliente]) map[v.cliente] = { cliente: v.cliente, items: [], total: 0 };
      map[v.cliente].items.push(v);
      map[v.cliente].total += v.precio;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [ventas]);

  /* ── Historial (todas las ventas) ── */
  const historial = useMemo(
    () => [...ventas].sort((a, b) => (b.fecha > a.fecha ? 1 : -1)),
    [ventas]
  );

  /* ── Filtrado por búsqueda ── */
  const rankingFiltrado = useMemo(
    () => ranking.filter((r) => r.descripcion.toLowerCase().includes(busqueda.toLowerCase())),
    [ranking, busqueda]
  );
  const clientesFiltrado = useMemo(
    () => porCliente.filter((c) => c.cliente.toLowerCase().includes(busqueda.toLowerCase())),
    [porCliente, busqueda]
  );
  const historialFiltrado = useMemo(
    () => historial.filter((v) =>
      v.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.orden_id.includes(busqueda)
    ),
    [historial, busqueda]
  );

  const maxVeces = ranking[0]?.veces || 1;

  if (cargando) return <SpinnerBolitas texto="Cargando inventario..." />;

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div>
        <p className="text-slate-500 text-sm mt-0.5">Analítica de ventas de repuestos y refacciones</p>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Total facturado"   value={formatQ(kpis.totalFacturado)} iconPath={icons.money}  color="text-green-600"  bg="bg-green-50"  />
        <KpiCard label="Unidades vendidas" value={kpis.unidades}                iconPath={icons.box}    color="text-primary"   bg="bg-blue-50"   />
        <KpiCard label="Clientes con repuestos" value={kpis.clientesUnicos}     iconPath={icons.user}   color="text-violet-600" bg="bg-violet-50" />
        <KpiCard label="Más vendido"       value={kpis.masVendido}              sub="por frecuencia"    iconPath={icons.star}   color="text-amber-500"  bg="bg-amber-50"  />
      </div>

      {/* ── Búsqueda + Tabs ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

        <div className="px-4 pt-4 pb-0 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <I d={icons.search} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 text-[13px] text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
              placeholder="Buscar repuesto, cliente u orden…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 mt-3">
          <nav className="flex -mb-px px-4 gap-1">
            {[
              { key: 'ranking',   label: 'Ranking',   icon: icons.trend },
              { key: 'clientes',  label: 'Por cliente', icon: icons.user  },
              { key: 'historial', label: 'Historial', icon: icons.list  },
            ].map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-semibold border-b-2 transition-colors ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'}`}>
                <I d={t.icon} className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* ── TAB: RANKING ── */}
        {tab === 'ranking' && (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider w-8">#</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider">Repuesto</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider w-24">Veces</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider w-32">Total (Q)</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider w-24 hidden sm:table-cell">Clientes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rankingFiltrado.map((r, i) => (
                  <tr key={r.descripcion} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{r.descripcion}</p>
                      <BarHoriz pct={(r.veces / maxVeces) * 100} color={i === 0 ? 'bg-amber-400' : 'bg-primary/40'} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-primary tabular-nums">{r.veces}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700 tabular-nums">{formatQ(r.total)}</td>
                    <td className="px-4 py-3 text-center text-slate-500 hidden sm:table-cell">{r.clientes}</td>
                  </tr>
                ))}
                {rankingFiltrado.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-12 text-slate-400 text-sm">Sin ventas registradas aún</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── TAB: POR CLIENTE ── */}
        {tab === 'clientes' && (
          <div className="divide-y divide-slate-100">
            {clientesFiltrado.map((c) => (
              <ClienteRow key={c.cliente} data={c} />
            ))}
            {clientesFiltrado.length === 0 && (
              <p className="text-center py-12 text-slate-400 text-sm">Sin resultados</p>
            )}
          </div>
        )}

        {/* ── TAB: HISTORIAL ── */}
        {tab === 'historial' && (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider hidden sm:table-cell">Fecha</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider">Repuesto</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider hidden md:table-cell">Cliente</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider w-28">Precio</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider w-24 hidden lg:table-cell">Orden</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historialFiltrado.map((v, i) => (
                  <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-2.5 text-slate-400 tabular-nums text-[11px] hidden sm:table-cell">{v.fecha}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">
                      {v.descripcion}
                      <span className="md:hidden block text-[11px] text-slate-400 capitalize">{v.cliente}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 capitalize hidden md:table-cell">{v.cliente}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-700 tabular-nums">{formatQ(v.precio)}</td>
                    <td className="px-4 py-2.5 text-center font-mono text-[11px] text-slate-400 hidden lg:table-cell">#{v.orden_id}</td>
                  </tr>
                ))}
                {historialFiltrado.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-12 text-slate-400 text-sm">Sin ventas registradas aún</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Stock actual del catálogo */}
        {tab === 'ranking' && repuestos.length > 0 && (
          <div className="border-t border-slate-100 px-4 py-3">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Stock actual en catálogo</p>
            <div className="flex flex-wrap gap-2">
              {repuestos.map((r) => (
                <span key={r.id} className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border ${Number(r.stock) <= 2 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  {r.nombre}
                  <span className="font-bold">{r.stock ?? 0}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Fila colapsable por cliente ─────────────────────────────────────────── */
function ClienteRow({ data }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50/70 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <I d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-slate-800 capitalize">{data.cliente}</p>
            <p className="text-[11px] text-slate-400">{data.items.length} repuesto(s)</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-bold text-primary tabular-nums">
            Q {Number(data.total).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
          </span>
          <I d='M19 9l-7 7-7-7' className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {open && (
        <div className="bg-slate-50/50 border-t border-slate-100 px-4 py-2">
          <table className="w-full text-[12px]">
            <tbody className="divide-y divide-slate-100">
              {data.items.map((v, i) => (
                <tr key={i}>
                  <td className="py-1.5 text-slate-500 w-24 hidden sm:table-cell">{v.fecha}</td>
                  <td className="py-1.5 font-medium text-slate-700">{v.descripcion}</td>
                  <td className="py-1.5 text-right font-semibold text-slate-700 tabular-nums">Q {v.precio.toFixed(2)}</td>
                  <td className="py-1.5 text-right font-mono text-[11px] text-slate-400 hidden md:table-cell">#{v.orden_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
