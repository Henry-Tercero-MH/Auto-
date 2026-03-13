import { useMemo, useState } from 'react';
import { useSolicitudes } from '../context/SolicitudesContext';
import { useCatalogos } from '../context/CatalogosContext';
import { usePagos } from '../context/PagosContext';
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
  { key: 'ordenes',    label: 'Listado de órdenes',    short: 'Órdenes'    },
  { key: 'servicios',  label: 'Servicios vendidos',     short: 'Servicios'  },
  { key: 'documentos', label: 'Documentos imprimibles', short: 'Documentos' },
];

export default function Reportes() {
  const { solicitudes } = useSolicitudes();
  const { mecanicos, estados, configNegocio } = useCatalogos();
  const { pagos } = usePagos();

  const hoy = new Date().toISOString().slice(0, 10);
  const inicioMes = `${hoy.slice(0, 7)}-01`;

  const [tab, setTab]                     = useState('ordenes');
  const [desde, setDesde]                 = useState(inicioMes);
  const [hasta, setHasta]                 = useState(hoy);
  const [estadoFiltro, setEstadoFiltro]   = useState('Todos');
  const [mecanicoFiltro, setMecanicoFiltro] = useState('Todos');

  // Mapa solicitud_id → monto real del pago
  const pagosMap = useMemo(() => {
    const m = {};
    pagos.forEach((p) => { m[p.solicitud_id] = Number(p.monto) || 0; });
    return m;
  }, [pagos]);

  const calcularTotal = (s) => pagosMap[s.id] ?? 0;

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


  const serviciosVendidos = useMemo(() => {
    const mapa = {};
    solicitudesFiltradas.forEach((s) => {
      const nombres = (s.servicio || '').split(',').map((n) => n.trim()).filter(Boolean);
      const montoPorServicio = nombres.length > 0 ? (pagosMap[s.id] || 0) / nombres.length : 0;
      nombres.forEach((nombre) => {
        if (!mapa[nombre]) mapa[nombre] = { servicio: nombre, cantidad: 0, ingresos: 0 };
        mapa[nombre].cantidad += 1;
        mapa[nombre].ingresos += montoPorServicio;
      });
    });
    return Object.values(mapa).sort((a, b) => b.cantidad - a.cantidad);
  }, [solicitudesFiltradas, pagosMap]);

  const [idSeleccionado, setIdSeleccionado] = useState('');
  const solicitudSeleccionada = useMemo(
    () => solicitudes.find((s) => String(s.id) === String(idSeleccionado)) || null,
    [solicitudes, idSeleccionado],
  );
  const totalSeleccionada = solicitudSeleccionada ? calcularTotal(solicitudSeleccionada) : 0;

  const exportarOrdenes = () => {
    const headers = [
      { key: 'id', label: 'ID' }, { key: 'fecha', label: 'Fecha' },
      { key: 'cliente', label: 'Cliente' }, { key: 'vehiculo', label: 'Vehículo' },
      { key: 'placa', label: 'Placa' }, { key: 'servicio', label: 'Servicio(s)' },
      { key: 'mecanico', label: 'Mecánico' }, { key: 'estado', label: 'Estado' },
      { key: 'total', label: 'Total (Q)' },
    ];
    exportCsv('ordenes.csv', headers, solicitudesFiltradas.map((s) => ({
      ...s, mecanico: s.mecanico?.name || s.mecanico?.nombre || '', total: calcularTotal(s).toFixed(2),
    })));
  };


  const exportarServicios = () => {
    exportCsv('servicios.csv',
      [{ key: 'servicio', label: 'Servicio' }, { key: 'cantidad', label: 'Cantidad' },
       { key: 'ingresos', label: 'Ingresos estimados (Q)' }],
      serviciosVendidos.map((s) => ({ ...s, ingresos: s.ingresos.toFixed(2) })),
    );
  };

  const imprimirDoc = (prefijo) => {
    if (!solicitudSeleccionada) return;
    const prev = document.title;
    document.title = `${prefijo}-${solicitudSeleccionada.id}`;
    window.print();
    document.title = prev;
  };

  /* ── Estilos compartidos ── */
  const btnSecundario = 'inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition';
  const btnPrimario   = 'inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition';

  return (
    <div className="space-y-5">

      {/* ── Encabezado ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">Centro de reportes e impresión</h2>
          <p className="text-slate-500 text-sm mt-0.5">Filtra órdenes por rango de fechas y genera listados.</p>
        </div>
        <button type="button" onClick={() => window.open(APP_SCRIPT_URL, '_blank')} className={btnSecundario}>
          <Icon path="M4 4h16v4H4V4zm0 6h10v4H4v-4zm0 6h7v4H4v-4zm12 0h4v4h-4v-4z" />
          Ver libro Excel
        </button>
      </div>

      {/* ── Filtros ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3 overflow-hidden">
        {/* Fechas — fila propia, full width en móvil */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="min-w-0">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Desde</label>
            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
              className="w-full min-w-0 block border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none box-border" />
          </div>
          <div className="min-w-0">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Hasta</label>
            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
              className="w-full min-w-0 block border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none box-border" />
          </div>
        </div>
        {/* Selects — 2 columnas en móvil */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Estado</label>
            <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-700 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
              <option value="Todos">Todos</option>
              {estados.map((e) => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Mecánico</label>
            <select value={mecanicoFiltro} onChange={(e) => setMecanicoFiltro(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-700 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
              <option value="Todos">Todos</option>
              {mecanicos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          {solicitudesFiltradas.length} de {solicitudes.length} órdenes en el rango seleccionado.
        </p>
      </div>

      {/* ── Tabs ── */}
      <div className="border-b border-slate-200">
        <nav className="flex -mb-px overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap ${
                tab === t.key ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-300'
              }`}>
              <span className="sm:hidden">{t.short}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* ══════════════════════════════════════════
          TAB: ÓRDENES
      ══════════════════════════════════════════ */}
      {tab === 'ordenes' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-primary">Listado de órdenes</h3>
            <div className="flex gap-2">
              <button type="button" onClick={exportarOrdenes} disabled={!solicitudesFiltradas.length}
                className={solicitudesFiltradas.length ? btnSecundario : `${btnSecundario} opacity-40 cursor-not-allowed`}>
                <Icon path="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-8 0V5a2 2 0 012-2h4a2 2 0 012 2v2M9 12h6m-6 4h3" />
                <span className="hidden sm:inline">Exportar a Excel</span>
                <span className="sm:hidden">Excel</span>
              </button>
              <button type="button" onClick={() => window.print()} className={btnPrimario}>
                <Icon path="M6 9V4a2 2 0 012-2h8a2 2 0 012 2v5m-2 4h2a2 2 0 002-2v-1a2 2 0 00-2-2H4a2 2 0 00-2 2v1a2 2 0 002 2h2m0 0v3a2 2 0 002 2h8a2 2 0 002-2v-3m-12 0h12" />
                <span className="hidden sm:inline">Imprimir listado</span>
                <span className="sm:hidden">Imprimir</span>
              </button>
            </div>
          </div>

          {solicitudesFiltradas.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-10 bg-white rounded-xl border border-gray-100">
              No hay órdenes en el rango seleccionado.
            </p>
          ) : (
            <>
              {/* Tarjetas móvil */}
              <div className="sm:hidden space-y-2">
                {solicitudesFiltradas.map((s) => (
                  <div key={s.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-slate-400">#{s.id}</span>
                      <span className="text-[11px] text-slate-400">{s.fecha}</span>
                    </div>
                    <p className="font-semibold text-sm text-slate-800 uppercase">{s.cliente}</p>
                    <p className="text-xs text-slate-500 uppercase">{s.vehiculo}</p>
                    <p className="text-xs text-slate-500 line-clamp-2 uppercase">{s.servicio}</p>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="text-xs text-slate-500">{s.estado}</span>
                      <span className="text-sm font-bold text-slate-800">Q {calcularTotal(s).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabla desktop */}
              <div className="hidden sm:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="text-left px-4 py-3">ID</th>
                      <th className="text-left px-4 py-3">Fecha</th>
                      <th className="text-left px-4 py-3">Cliente</th>
                      <th className="text-left px-4 py-3">Vehículo</th>
                      <th className="text-left px-4 py-3">Servicio(s)</th>
                      <th className="text-left px-4 py-3">Mecánico</th>
                      <th className="text-left px-4 py-3">Estado</th>
                      <th className="text-right px-4 py-3">Total (Q)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {solicitudesFiltradas.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2 text-xs font-mono text-slate-500">#{s.id}</td>
                        <td className="px-4 py-2 text-xs text-slate-600">{s.fecha}</td>
                        <td className="px-4 py-2 text-xs text-slate-800 uppercase">{s.cliente}</td>
                        <td className="px-4 py-2 text-xs text-slate-600 uppercase">{s.vehiculo}</td>
                        <td className="px-4 py-2 text-xs text-slate-600 uppercase">{s.servicio}</td>
                        <td className="px-4 py-2 text-xs text-slate-600">{s.mecanico?.name || s.mecanico?.nombre || '—'}</td>
                        <td className="px-4 py-2 text-xs text-slate-700">{s.estado}</td>
                        <td className="px-4 py-2 text-xs text-right font-semibold text-slate-800">{calcularTotal(s).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB: SERVICIOS
      ══════════════════════════════════════════ */}
      {tab === 'servicios' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-primary">Servicios vendidos en el rango</h3>
            <button type="button" onClick={exportarServicios} disabled={!serviciosVendidos.length}
              className={serviciosVendidos.length ? btnSecundario : `${btnSecundario} opacity-40 cursor-not-allowed`}>
              <Icon path="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-8 0V5a2 2 0 012-2h4a2 2 0 012 2v2M9 12h6m-6 4h3" />
              <span className="hidden sm:inline">Exportar a Excel</span>
              <span className="sm:hidden">Excel</span>
            </button>
          </div>

          {serviciosVendidos.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-10 bg-white rounded-xl border border-gray-100">
              No hay servicios registrados en el rango seleccionado.
            </p>
          ) : (
            <>
              {/* Tarjetas móvil */}
              <div className="sm:hidden space-y-2">
                {serviciosVendidos.map((s) => (
                  <div key={s.servicio} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 uppercase">{s.servicio}</p>
                      <p className="text-xs text-slate-400">{s.cantidad} {s.cantidad === 1 ? 'vez' : 'veces'}</p>
                    </div>
                    <p className="text-sm font-bold text-primary">Q {s.ingresos.toFixed(2)}</p>
                  </div>
                ))}
              </div>

              {/* Tabla desktop */}
              <div className="hidden sm:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="text-left px-4 py-3">Servicio</th>
                      <th className="text-center px-4 py-3">Cantidad</th>
                      <th className="text-right px-4 py-3">Ingresos estimados (Q)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {serviciosVendidos.map((s) => (
                      <tr key={s.servicio} className="hover:bg-slate-50">
                        <td className="px-4 py-2 text-xs text-slate-800 uppercase">{s.servicio}</td>
                        <td className="px-4 py-2 text-xs text-center text-slate-700 font-semibold">{s.cantidad}</td>
                        <td className="px-4 py-2 text-xs text-right text-slate-800 font-semibold">{s.ingresos.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB: DOCUMENTOS
      ══════════════════════════════════════════ */}
      {tab === 'documentos' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5 space-y-4">
            <h3 className="text-sm font-semibold text-primary">Impresión de recibo / orden de trabajo</h3>

            {/* Selector de orden */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Seleccionar orden
              </label>
              <select value={idSeleccionado} onChange={(e) => setIdSeleccionado(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-700 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                <option value="">Buscar por ID…</option>
                {solicitudes.slice().sort((a, b) => (b.id > a.id ? 1 : -1)).map((s) => (
                  <option key={s.id} value={s.id}>
                    #{s.id} · {(s.cliente || '').toUpperCase()} · {(s.vehiculo || '').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Vista previa del documento */}
            {solicitudSeleccionada ? (
              <>
                <div id="print-recibo" className="border border-slate-200 rounded-lg p-4 bg-white max-w-sm mx-auto">
                  <style>{`
                    @media print {
                      @page { size: 80mm auto; margin: 4mm; }
                      body > * { display: none !important; }
                      #print-recibo { display: block !important; position: static !important;
                        width: 100%; max-width: 80mm; margin: 0 auto;
                        font-family: 'Courier New', monospace; font-size: 10px; color: #000; }
                      #print-recibo * { visibility: visible !important; }
                    }
                  `}</style>

                  {/* Cabecera negocio */}
                  <div className="text-center mb-2">
                    <p className="font-bold text-xs uppercase tracking-wide">
                      {configNegocio?.nombre || 'AUTO+'}
                    </p>
                    {configNegocio?.slogan && (
                      <p className="text-[10px] text-slate-500">{configNegocio.slogan}</p>
                    )}
                    {configNegocio?.direccion && (
                      <p className="text-[9px] text-slate-400">{configNegocio.direccion}</p>
                    )}
                    {(configNegocio?.telefono || configNegocio?.nit) && (
                      <p className="text-[9px] text-slate-400">
                        {configNegocio.telefono && `Tel: ${configNegocio.telefono}`}
                        {configNegocio.nit && ` · NIT: ${configNegocio.nit}`}
                      </p>
                    )}
                  </div>

                  {/* Número y fecha */}
                  <div className="border-t border-b border-dashed border-slate-400 py-1 my-1">
                    <p className="text-center text-[11px] font-bold tracking-wide uppercase">
                      Orden de Trabajo #{solicitudSeleccionada.id}
                    </p>
                    <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
                      <span>Fecha:</span>
                      <span>{solicitudSeleccionada.fecha}</span>
                    </div>
                  </div>

                  {/* Datos cliente/vehículo */}
                  <div className="mt-1.5 space-y-0.5 text-[10px]">
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500 flex-shrink-0">Cliente:</span>
                      <span className="font-semibold text-slate-800 uppercase text-right">
                        {solicitudSeleccionada.cliente}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500 flex-shrink-0">Vehículo:</span>
                      <span className="font-semibold text-slate-800 uppercase text-right">
                        {solicitudSeleccionada.vehiculo}
                      </span>
                    </div>
                    {solicitudSeleccionada.placa && (
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500 flex-shrink-0">Placa:</span>
                        <span className="font-semibold text-slate-800 uppercase text-right">
                          {solicitudSeleccionada.placa}
                        </span>
                      </div>
                    )}
                    {solicitudSeleccionada.mecanico && (
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500 flex-shrink-0">Mecánico:</span>
                        <span className="font-semibold text-slate-800 uppercase text-right">
                          {solicitudSeleccionada.mecanico?.name || solicitudSeleccionada.mecanico?.nombre || '—'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Servicios */}
                  <div className="mt-2 border-t border-b border-slate-300 py-1.5">
                    <p className="text-[10px] font-semibold text-slate-600 mb-1 uppercase">Detalle de servicios</p>
                    <table className="w-full text-[10px]">
                      <tbody>
                        {(() => {
                          const nombres = (solicitudSeleccionada.servicio || '').split(',').map((n) => n.trim()).filter(Boolean);
                          const porServicio = nombres.length > 0 ? totalSeleccionada / nombres.length : 0;
                          return nombres.map((nombre) => (
                            <tr key={nombre}>
                              <td className="pr-1 text-slate-700 uppercase">{nombre}</td>
                              <td className="text-right font-semibold text-slate-800">
                                {porServicio > 0 ? `Q ${porServicio.toFixed(2)}` : ''}
                              </td>
                            </tr>
                          ));
                        })()}
                        <tr>
                          <td className="pt-1.5 border-t border-dashed border-slate-400 font-bold text-slate-700 uppercase">Total</td>
                          <td className="pt-1.5 border-t border-dashed border-slate-400 text-right font-black text-slate-900">
                            Q {totalSeleccionada.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Observaciones */}
                  {solicitudSeleccionada.notas && (
                    <div className="mt-2 text-[9px] text-slate-600">
                      <p className="font-semibold uppercase">Observaciones:</p>
                      <p className="uppercase">{solicitudSeleccionada.notas}</p>
                    </div>
                  )}

                  {/* Firmas */}
                  <div className="mt-4 flex justify-between gap-4 text-[9px] text-slate-600">
                    <div className="flex-1 text-center">
                      <div className="border-t border-slate-400 mt-6 pt-1">Firma del cliente</div>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="border-t border-slate-400 mt-6 pt-1">Autorizado por</div>
                    </div>
                  </div>
                </div>

                {/* Botones de impresión */}
                <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                  <button type="button" onClick={() => imprimirDoc('Recibo')} className={`w-full sm:w-auto ${btnSecundario}`}>
                    <Icon path="M6 9V4a2 2 0 012-2h8a2 2 0 012 2v5m-2 4h2a2 2 0 002-2v-1a2 2 0 00-2-2H4a2 2 0 00-2 2v1a2 2 0 002 2h2m0 0v3a2 2 0 002 2h8a2 2 0 002-2v-3m-12 0h12" />
                    Imprimir recibo
                  </button>
                  <button type="button" onClick={() => imprimirDoc('Orden')} className={`w-full sm:w-auto ${btnPrimario}`}>
                    <Icon path="M9 12h6m-9 4h6M9 8h3m-1-6H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V8.828a2 2 0 00-.586-1.414l-4.828-4.828A2 2 0 0012.172 2H11z" />
                    Imprimir orden de trabajo
                  </button>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">
                Selecciona una orden para ver el documento de impresión.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
