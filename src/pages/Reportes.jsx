import { useMemo, useState } from 'react';
import { useSolicitudes } from '../context/SolicitudesContext';
import { useCatalogos } from '../context/CatalogosContext';
import { APP_SCRIPT_URL } from '../services/sheetsApi';

const Icon = ({ path, className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

function exportCsv(filename, headers, rows) {
  if (!rows.length) return;
  const escape = (value) => {
    if (value == null) return '';
    const str = String(value);
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csv = [
    headers.map((h) => escape(h.label)).join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h.key])).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const TABS = [
  { key: 'ordenes', label: 'Listado de órdenes' },
  { key: 'finanzas', label: 'Resumen financiero' },
  { key: 'servicios', label: 'Servicios vendidos' },
  { key: 'documentos', label: 'Documentos imprimibles' },
];

export default function Reportes() {
  const { solicitudes } = useSolicitudes();
  const { mecanicos, estados, preciosMap, configNegocio } = useCatalogos();

  const hoy = new Date().toISOString().slice(0, 10);
  const inicioMes = `${hoy.slice(0, 7)}-01`;

  const [tab, setTab] = useState('ordenes');
  const [desde, setDesde] = useState(inicioMes);
  const [hasta, setHasta] = useState(hoy);
  const [estadoFiltro, setEstadoFiltro] = useState('Todos');
  const [mecanicoFiltro, setMecanicoFiltro] = useState('Todos');

  const calcularTotal = (s) => {
    if (s.precio && Number(s.precio) > 0) return Number(s.precio);
    return (s.servicio || '')
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean)
      .reduce((sum, n) => sum + (preciosMap[n] || 0), 0);
  };

  const solicitudesFiltradas = useMemo(() => {
    return solicitudes.filter((s) => {
      const f = s.fecha || '';
      if (desde && f < desde) return false;
      if (hasta && f > hasta) return false;
      if (estadoFiltro !== 'Todos' && s.estado !== estadoFiltro) return false;
      if (mecanicoFiltro !== 'Todos') {
        if (!s.mecanico || String(s.mecanico.id) !== String(mecanicoFiltro)) return false;
      }
      return true;
    });
  }, [solicitudes, desde, hasta, estadoFiltro, mecanicoFiltro]);

  const resumenFinanciero = useMemo(() => {
    const porDia = {};
    let totalFacturado = 0;
    let totalPorCobrar = 0;

    solicitudesFiltradas.forEach((s) => {
      const fecha = s.fecha || 'Sin fecha';
      const monto = calcularTotal(s);
      if (!porDia[fecha]) {
        porDia[fecha] = { fecha, total: 0, completadas: 0, pendientes: 0, monto: 0 };
      }
      const d = porDia[fecha];
      d.total += 1;
      d.monto += monto;
      if (s.estado === 'Completada') {
        d.completadas += 1;
        totalFacturado += monto;
      } else if (s.estado === 'Pendiente' || s.estado === 'En proceso') {
        d.pendientes += 1;
        totalPorCobrar += monto;
      }
    });

    const filas = Object.values(porDia).sort((a, b) => (a.fecha > b.fecha ? 1 : -1));
    return { filas, totalFacturado, totalPorCobrar };
  }, [solicitudesFiltradas]);

  const serviciosVendidos = useMemo(() => {
    const mapa = {};
    solicitudesFiltradas.forEach((s) => {
      (s.servicio || '')
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean)
        .forEach((nombre) => {
          if (!mapa[nombre]) {
            mapa[nombre] = { servicio: nombre, cantidad: 0, ingresos: 0 };
          }
          mapa[nombre].cantidad += 1;
          mapa[nombre].ingresos += preciosMap[nombre] || 0;
        });
    });
    return Object.values(mapa).sort((a, b) => b.cantidad - a.cantidad);
  }, [solicitudesFiltradas, preciosMap]);

  const [idSeleccionado, setIdSeleccionado] = useState('');
  const solicitudSeleccionada = useMemo(
    () => solicitudes.find((s) => String(s.id) === String(idSeleccionado)) || null,
    [solicitudes, idSeleccionado],
  );

  const totalSeleccionada = solicitudSeleccionada ? calcularTotal(solicitudSeleccionada) : 0;

  const exportarOrdenes = () => {
    const headers = [
      { key: 'id', label: 'ID' },
      { key: 'fecha', label: 'Fecha' },
      { key: 'cliente', label: 'Cliente' },
      { key: 'vehiculo', label: 'Vehículo' },
      { key: 'placa', label: 'Placa' },
      { key: 'servicio', label: 'Servicio(s)' },
      { key: 'mecanico', label: 'Mecánico' },
      { key: 'estado', label: 'Estado' },
      { key: 'total', label: 'Total (Q)' },
    ];
    const rows = solicitudesFiltradas.map((s) => ({
      id: s.id,
      fecha: s.fecha,
      cliente: s.cliente,
      vehiculo: s.vehiculo,
      placa: s.placa,
      servicio: s.servicio,
      mecanico: s.mecanico?.name || s.mecanico?.nombre || '',
      estado: s.estado,
      total: calcularTotal(s).toFixed(2),
    }));
    exportCsv('ordenes.csv', headers, rows);
  };

  const exportarFinanzas = () => {
    const headers = [
      { key: 'fecha', label: 'Fecha' },
      { key: 'total', label: '# Órdenes' },
      { key: 'completadas', label: 'Completadas' },
      { key: 'pendientes', label: 'Pendientes / En proceso' },
      { key: 'monto', label: 'Monto total (Q)' },
    ];
    const rows = resumenFinanciero.filas.map((f) => ({
      fecha: f.fecha,
      total: f.total,
      completadas: f.completadas,
      pendientes: f.pendientes,
      monto: f.monto.toFixed(2),
    }));
    exportCsv('finanzas.csv', headers, rows);
  };

  const exportarServicios = () => {
    const headers = [
      { key: 'servicio', label: 'Servicio' },
      { key: 'cantidad', label: 'Cantidad' },
      { key: 'ingresos', label: 'Ingresos estimados (Q)' },
    ];
    const rows = serviciosVendidos.map((s) => ({
      servicio: s.servicio,
      cantidad: s.cantidad,
      ingresos: s.ingresos.toFixed(2),
    }));
    exportCsv('servicios.csv', headers, rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-primary">Centro de reportes e impresión</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Filtra órdenes por rango de fechas y genera listados para Excel o impresión.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.open(APP_SCRIPT_URL, '_blank')}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs sm:text-sm font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
        >
          <Icon path="M4 4h16v4H4V4zm0 6h10v4H4v-4zm0 6h7v4H4v-4zm12 0h4v4h-4v-4z" />
          Imprimir libro Excel
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Desde
            </label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Hasta
            </label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Estado
            </label>
            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-700 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              <option value="Todos">Todos</option>
              {estados.map((e) => (
                <option key={e.id} value={e.nombre}>
                  {e.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Mecánico
            </label>
            <select
              value={mecanicoFiltro}
              onChange={(e) => setMecanicoFiltro(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-700 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              <option value="Todos">Todos</option>
              {mecanicos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          {solicitudesFiltradas.length} de {solicitudes.length} órdenes dentro del rango seleccionado.
        </p>
      </div>

      <div className="border-b border-slate-200">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap flex items-center gap-2 ${
                tab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'ordenes' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-primary">Listado detallado de órdenes</h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={exportarOrdenes}
                disabled={solicitudesFiltradas.length === 0}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold border transition ${
                  solicitudesFiltradas.length === 0
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon path="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-8 0V5a2 2 0 012-2h4a2 2 0 012 2v2M9 12h6m-6 4h3" />
                Exportar a Excel
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold bg-primary text-white hover:bg-primary/90"
              >
                <Icon path="M6 9V4a2 2 0 012-2h8a2 2 0 012 2v5m-2 4h2a2 2 0 002-2v-1a2 2 0 00-2-2H4a2 2 0 00-2 2v1a2 2 0 002 2h2m0 0v3a2 2 0 002 2h8a2 2 0 002-2v-3m-12 0h12" />
                Imprimir listado
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
            {solicitudesFiltradas.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-10">No hay órdenes en el rango seleccionado.</p>
            ) : (
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="text-left px-3 sm:px-4 py-3">ID</th>
                    <th className="text-left px-3 sm:px-4 py-3">Fecha</th>
                    <th className="text-left px-3 sm:px-4 py-3">Cliente</th>
                    <th className="text-left px-3 sm:px-4 py-3">Vehículo</th>
                    <th className="text-left px-3 sm:px-4 py-3">Servicio(s)</th>
                    <th className="text-left px-3 sm:px-4 py-3">Mecánico</th>
                    <th className="text-left px-3 sm:px-4 py-3">Estado</th>
                    <th className="text-right px-3 sm:px-4 py-3">Total (Q)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {solicitudesFiltradas.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-3 sm:px-4 py-2 text-xs font-mono text-slate-500">#{s.id}</td>
                      <td className="px-3 sm:px-4 py-2 text-xs text-slate-600">{s.fecha}</td>
                      <td className="px-3 sm:px-4 py-2 text-xs text-slate-800 uppercase">{s.cliente}</td>
                      <td className="px-3 sm:px-4 py-2 text-xs text-slate-600 uppercase">{s.vehiculo}</td>
                      <td className="px-3 sm:px-4 py-2 text-xs text-slate-600">{s.servicio}</td>
                      <td className="px-3 sm:px-4 py-2 text-xs text-slate-600">
                        {s.mecanico?.name || s.mecanico?.nombre || '—'}
                      </td>
                      <td className="px-3 sm:px-4 py-2 text-xs text-slate-700">{s.estado}</td>
                      <td className="px-3 sm:px-4 py-2 text-xs text-right font-semibold text-slate-800">
                        {calcularTotal(s).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === 'finanzas' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-primary">Resumen financiero por día</h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={exportarFinanzas}
                disabled={resumenFinanciero.filas.length === 0}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold border transition ${
                  resumenFinanciero.filas.length === 0
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon path="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-8 0V5a2 2 0 012-2h4a2 2 0 012 2v2M9 12h6m-6 4h3" />
                Exportar a Excel
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold bg-primary text-white hover:bg-primary/90"
              >
                <Icon path="M6 9V4a2 2 0 012-2h8a2 2 0 012 2v5m-2 4h2a2 2 0 002-2v-1a2 2 0 00-2-2H4a2 2 0 00-2 2v1a2 2 0 002 2h2m0 0v3a2 2 0 002 2h8a2 2 0 002-2v-3m-12 0h12" />
                Imprimir resumen
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-1">Total facturado</p>
              <p className="text-lg font-black text-primary">
                Q {resumenFinanciero.totalFacturado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-1">Por cobrar</p>
              <p className="text-lg font-black text-amber-600">
                Q {resumenFinanciero.totalPorCobrar.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-1">Órdenes en rango</p>
              <p className="text-lg font-black text-slate-800">{solicitudesFiltradas.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
            {resumenFinanciero.filas.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-10">No hay datos financieros en el rango seleccionado.</p>
            ) : (
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="text-left px-3 sm:px-4 py-3">Fecha</th>
                    <th className="text-center px-3 sm:px-4 py-3">Órdenes</th>
                    <th className="text-center px-3 sm:px-4 py-3">Completadas</th>
                    <th className="text-center px-3 sm:px-4 py-3">Pendientes / En proceso</th>
                    <th className="text-right px-3 sm:px-4 py-3">Monto total (Q)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {resumenFinanciero.filas.map((f) => (
                    <tr key={f.fecha} className="hover:bg-slate-50">
                      <td className="px-3 sm:px-4 py-2 text-xs text-slate-700">{f.fecha}</td>
                      <td className="px-3 sm:px-4 py-2 text-xs text-center text-slate-700 font-semibold">{f.total}</td>
                      <td className="px-3 sm:px-4 py-2 text-xs text-center text-green-600 font-semibold">{f.completadas}</td>
                      <td className="px-3 sm:px-4 py-2 text-xs text-center text-amber-600 font-semibold">{f.pendientes}</td>
                      <td className="px-3 sm:px-4 py-2 text-xs text-right text-slate-800 font-semibold">
                        {f.monto.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === 'servicios' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-primary">Servicios vendidos en el rango</h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={exportarServicios}
                disabled={serviciosVendidos.length === 0}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold border transition ${
                  serviciosVendidos.length === 0
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon path="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-8 0V5a2 2 0 012-2h4a2 2 0 012 2v2M9 12h6m-6 4h3" />
                Exportar a Excel
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
            {serviciosVendidos.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-10">No hay servicios registrados en el rango seleccionado.</p>
            ) : (
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="text-left px-3 sm:px-4 py-3">Servicio</th>
                    <th className="text-center px-3 sm:px-4 py-3">Cantidad</th>
                    <th className="text-right px-3 sm:px-4 py-3">Ingresos estimados (Q)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {serviciosVendidos.map((s) => (
                    <tr key={s.servicio} className="hover:bg-slate-50">
                      <td className="px-3 sm:px-4 py-2 text-xs text-slate-800">{s.servicio}</td>
                      <td className="px-3 sm:px-4 py-2 text-xs text-center text-slate-700 font-semibold">
                        {s.cantidad}
                      </td>
                      <td className="px-3 sm:px-4 py-2 text-xs text-right text-slate-800 font-semibold">
                        {s.ingresos.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === 'documentos' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5 space-y-4">
            <h3 className="text-sm font-semibold text-primary">Impresión de recibo / orden de trabajo</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  Seleccionar orden
                </label>
                <select
                  value={idSeleccionado}
                  onChange={(e) => setIdSeleccionado(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-700 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                >
                  <option value="">Buscar por ID…</option>
                  {solicitudes
                    .slice()
                    .sort((a, b) => (b.id > a.id ? 1 : -1))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        #{s.id} · {s.cliente} · {s.vehiculo}
                      </option>
                    ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                {solicitudSeleccionada ? (
                  <div id="print-recibo" className="border border-slate-200 rounded-lg p-4 bg-white">
                    <style>{`
                      @media print {
                        @page { size: 80mm auto; margin: 5mm; }
                        body * { visibility: hidden !important; }
                        #print-recibo, #print-recibo * { visibility: visible !important; }
                        #print-recibo {
                          position: fixed; inset: 0;
                          max-width: 80mm; margin: 0 auto;
                          font-family: 'Courier New', monospace;
                          font-size: 10px; color: #000;
                        }
                      }
                    `}</style>
                    <div className="text-center mb-2">
                      <p className="font-bold text-xs uppercase">
                        {configNegocio?.nombre || 'Nombre del negocio'}
                      </p>
                      {configNegocio?.slogan && (
                        <p className="text-[10px] text-slate-500">{configNegocio.slogan}</p>
                      )}
                      {configNegocio?.direccion && (
                        <p className="text-[9px] text-slate-400">{configNegocio.direccion}</p>
                      )}
                      {(configNegocio?.telefono || configNegocio?.nit) && (
                        <p className="text-[9px] text-slate-400">
                          {configNegocio.telefono && `Tel: ${configNegocio.telefono}`}{' '}
                          {configNegocio.nit && `· NIT: ${configNegocio.nit}`}
                        </p>
                      )}
                    </div>

                    <div className="border-t border-b border-dashed border-slate-400 py-1 my-1">
                      <p className="text-center text-[11px] font-bold tracking-wide">
                        RECIBO / FACTURA #{solicitudSeleccionada.id}
                      </p>
                      <p className="text-[10px] text-slate-600 flex justify-between">
                        <span>Fecha:</span>
                        <span>{solicitudSeleccionada.fecha}</span>
                      </p>
                    </div>

                    <div className="mt-1 space-y-1 text-[10px]">
                      <p className="flex justify-between">
                        <span className="text-slate-500">Cliente:</span>
                        <span className="font-semibold text-slate-800 ml-2">
                          {solicitudSeleccionada.cliente}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-500">Vehículo:</span>
                        <span className="font-semibold text-slate-800 ml-2">
                          {solicitudSeleccionada.vehiculo}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-500">Placa:</span>
                        <span className="font-semibold text-slate-800 ml-2">
                          {solicitudSeleccionada.placa}
                        </span>
                      </p>
                    </div>

                    <div className="mt-3 border-t border-b border-slate-300 py-1">
                      <p className="text-[10px] font-semibold text-slate-600 mb-1">
                        Detalle de servicios
                      </p>
                      <table className="w-full text-[10px]">
                        <tbody>
                          {(solicitudSeleccionada.servicio || '')
                            .split(',')
                            .map((n) => n.trim())
                            .filter(Boolean)
                            .map((nombre) => (
                              <tr key={nombre}>
                                <td className="pr-1 text-slate-700">{nombre}</td>
                                <td className="text-right font-semibold text-slate-800">
                                  {preciosMap[nombre]
                                    ? `Q ${preciosMap[nombre].toFixed(2)}`
                                    : ''}
                                </td>
                              </tr>
                            ))}
                          <tr>
                            <td className="pt-1 border-t border-dashed border-slate-400 font-bold text-slate-700">
                              TOTAL
                            </td>
                            <td className="pt-1 border-t border-dashed border-slate-400 text-right font-black text-slate-900">
                              Q {totalSeleccionada.toFixed(2)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 text-[9px] text-slate-600 min-h-[24px]">
                      {solicitudSeleccionada.notas && (
                        <>
                          <p className="font-semibold uppercase">Observaciones:</p>
                          <p>{solicitudSeleccionada.notas}</p>
                        </>
                      )}
                    </div>

                    <div className="mt-4 flex justify-between text-[9px] text-slate-600">
                      <div className="flex-1 mr-4">
                        <div className="border-t border-slate-400 mt-6 pt-1 text-center">
                          Firma del cliente
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="border-t border-slate-400 mt-6 pt-1 text-center">
                          Autorizado por
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-2">
                    Selecciona una orden para preparar el documento de impresión.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                disabled={!solicitudSeleccionada}
                onClick={() => {
                  if (!solicitudSeleccionada) return;
                  const prev = document.title;
                  document.title = `Recibo-${solicitudSeleccionada.id}`;
                  window.print();
                  document.title = prev;
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold border transition ${
                  !solicitudSeleccionada
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon path="M6 9V4a2 2 0 012-2h8a2 2 0 012 2v5m-2 4h2a2 2 0 002-2v-1a2 2 0 00-2-2H4a2 2 0 00-2 2v1a2 2 0 002 2h2m0 0v3a2 2 0 002 2h8a2 2 0 002-2v-3m-12 0h12" />
                Imprimir recibo
              </button>
              <button
                type="button"
                disabled={!solicitudSeleccionada}
                onClick={() => {
                  if (!solicitudSeleccionada) return;
                  const prev = document.title;
                  document.title = `Orden-${solicitudSeleccionada.id}`;
                  window.print();
                  document.title = prev;
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold bg-primary text-white ${
                  !solicitudSeleccionada ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/90'
                }`}
              >
                <Icon path="M9 12h6m-9 4h6M9 8h3m-1-6H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V8.828a2 2 0 00-.586-1.414l-4.828-4.828A2 2 0 0012.172 2H11z" />
                Imprimir orden de trabajo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
