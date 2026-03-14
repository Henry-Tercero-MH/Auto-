import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { useSolicitudes } from '../context/SolicitudesContext';
import { useCatalogos } from '../context/CatalogosContext';
import { usePagos } from '../context/PagosContext';
import logo from '../imagenes/logoMecanica.png';
import { APP_SCRIPT_URL } from '../services/sheetsApi';

const Icon = ({ path, className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

function exportXlsx(filename, headers, rows) {
  if (!rows.length) return;
  const wsData = [
    headers.map((h) => h.label),
    ...rows.map((row) => headers.map((h) => row[h.key] ?? '')),
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  // Ancho de columnas automático
  ws['!cols'] = headers.map((h) => ({ wch: Math.max(h.label.length, 14) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
  XLSX.writeFile(wb, filename);
}

const TABS = [
  { key: 'ordenes',    label: 'Listado de órdenes',    short: 'Órdenes'    },
  { key: 'servicios',  label: 'Servicios vendidos',     short: 'Servicios'  },
  { key: 'documentos', label: 'Documentos imprimibles', short: 'Documentos' },
];

export default function Reportes() {
  const { solicitudes } = useSolicitudes();
  const { mecanicos, estados, configNegocio, clientes } = useCatalogos();
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

  // Teléfono del cliente (busca en catálogo por cliente_id o nombre)
  const telefonoCliente = useMemo(() => {
    if (!solicitudSeleccionada) return '';
    const c = clientes.find(
      (cl) => cl.id === solicitudSeleccionada.cliente_id ||
              (cl.nombre || '').toLowerCase() === (solicitudSeleccionada.cliente || '').toLowerCase()
    );
    return String(c?.telefono ?? '').replace(/\D/g, '');
  }, [solicitudSeleccionada, clientes]);

  // Mensaje WhatsApp con resumen del comprobante
  const mensajeWhatsApp = useMemo(() => {
    if (!solicitudSeleccionada) return '';
    const s = solicitudSeleccionada;
    const numF = `F-${String(s.id).replace(/\D/g, '').padStart(4, '0')}`;
    const nombres = (s.servicio || '').split(',').map((n) => n.trim()).filter(Boolean);
    const porServicio = nombres.length > 0 ? totalSeleccionada / nombres.length : 0;
    const lineas = nombres.map((n) =>
      `• ${n.toUpperCase()}${porServicio > 0 ? `: Q ${porServicio.toFixed(2)}` : ''}`
    ).join('\n');
    return [
      `🔧 *${configNegocio?.nombre || 'AUTO+'}*`,
      `📋 Comprobante *${numF}*`,
      `📅 Fecha: ${s.fecha}`,
      ``,
      `👤 *${(s.cliente || '').toUpperCase()}*`,
      `🚗 ${(s.vehiculo || '').toUpperCase()}${s.placa ? ` · ${s.placa}` : ''}`,
      ``,
      `*Servicios:*`,
      lineas,
      ``,
      `💰 *TOTAL: Q ${totalSeleccionada.toFixed(2)}*`,
      s.notas ? `📝 ${s.notas}` : null,
      ``,
      `_Gracias por preferirnos — ${configNegocio?.direccion || ''}_`,
    ].filter(Boolean).join('\n');
  }, [solicitudSeleccionada, totalSeleccionada, configNegocio]);

  const exportarOrdenes = () => {
    const headers = [
      { key: 'id', label: 'ID' }, { key: 'fecha', label: 'Fecha' },
      { key: 'cliente', label: 'Cliente' }, { key: 'vehiculo', label: 'Vehículo' },
      { key: 'placa', label: 'Placa' }, { key: 'servicio', label: 'Servicio(s)' },
      { key: 'mecanico', label: 'Mecánico' }, { key: 'estado', label: 'Estado' },
      { key: 'total', label: 'Total (Q)' },
    ];
    exportXlsx('ordenes.xlsx', headers, solicitudesFiltradas.map((s) => ({
      ...s, mecanico: s.mecanico?.name || s.mecanico?.nombre || '', total: calcularTotal(s).toFixed(2),
    })));
  };

  const exportarServicios = () => {
    exportXlsx('servicios.xlsx',
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
                {/* ── Factura profesional ── */}
                <div id="print-recibo" className="bg-white rounded-2xl shadow-lg border border-slate-200 max-w-lg mx-auto overflow-hidden">
                  <style>{`
                    @media print {
                      @page { size: 80mm auto; margin: 4mm; }
                      body * { visibility: hidden; }
                      #print-recibo { visibility: visible; position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border-radius: 0 !important; border: none !important; font-family: 'Courier New', monospace !important; }
                      #print-recibo * { visibility: visible; }
                      #print-recibo .print-header { border-top: 3px solid #000 !important; }
                      #print-recibo .print-band { background: #f1f5f9 !important; border-top: 1px solid #e2e8f0 !important; border-bottom: 1px solid #e2e8f0 !important; }
                      #print-recibo .print-band * { color: #000 !important; }
                      #print-recibo .print-th { background: #1e293b !important; }
                      #print-recibo .print-th * { color: #fff !important; }
                      #print-recibo .print-total { background: #1e293b !important; }
                      #print-recibo .print-total * { color: #fff !important; }
                      #print-recibo img { filter: grayscale(100%) !important; }
                      .no-print { display: none !important; }
                    }
                  `}</style>

                  {/* Header limpio */}
                  <div className="print-header border-t-4 border-primary px-5 py-4 flex items-center justify-between gap-4 bg-white border-b border-slate-100">
                    <img src={logo} alt="logo" className="h-11 object-contain" />
                    <div className="text-right">
                      <p className="text-primary font-black text-base tracking-wide">
                        {configNegocio?.nombre || 'AUTO+'}
                      </p>
                      {configNegocio?.slogan && (
                        <p className="text-slate-400 text-[10px]">{configNegocio.slogan}</p>
                      )}
                      {configNegocio?.direccion && (
                        <p className="text-slate-400 text-[10px]">{configNegocio.direccion}</p>
                      )}
                      {configNegocio?.telefono && (
                        <p className="text-slate-400 text-[10px]">Tel: {configNegocio.telefono}</p>
                      )}
                    </div>
                  </div>

                  {/* Banda de número de comprobante */}
                  <div className="print-band bg-slate-50 border-b border-slate-100 px-5 py-2 flex items-center justify-between">
                    <span className="text-slate-500 text-xs font-semibold uppercase tracking-widest">Comprobante</span>
                    <span className="text-primary font-black text-base tracking-wide">
                      F-{String(solicitudSeleccionada.id).replace(/\D/g, '').padStart(4, '0')}
                    </span>
                  </div>

                  <div className="px-5 py-4 space-y-4">

                    {/* Fecha y estado */}
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <span>Fecha: <strong className="text-slate-700">{solicitudSeleccionada.fecha}</strong></span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${solicitudSeleccionada.estado === 'Completada' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {solicitudSeleccionada.estado}
                      </span>
                    </div>

                    {/* Datos cliente / vehículo */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="border border-slate-100 rounded-xl p-3">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cliente</p>
                        <p className="font-bold text-slate-800 text-sm uppercase leading-tight">
                          {solicitudSeleccionada.cliente}
                        </p>
                        {solicitudSeleccionada.telefono && (
                          <p className="text-[10px] text-slate-500 mt-0.5">{solicitudSeleccionada.telefono}</p>
                        )}
                      </div>
                      <div className="border border-slate-100 rounded-xl p-3">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Vehículo</p>
                        <p className="font-bold text-slate-800 text-sm uppercase leading-tight">
                          {solicitudSeleccionada.vehiculo}
                        </p>
                        {solicitudSeleccionada.placa && (
                          <p className="text-[10px] text-slate-500 mt-0.5">Placa: {solicitudSeleccionada.placa}</p>
                        )}
                      </div>
                    </div>

                    {/* Tabla de servicios */}
                    <div className="rounded-xl overflow-hidden border border-slate-100">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="print-th bg-slate-700 text-white text-xs">
                            <th className="text-left px-3 py-2 font-semibold">Servicio</th>
                            <th className="text-right px-3 py-2 font-semibold">Precio</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const nombres = (solicitudSeleccionada.servicio || '').split(',').map((n) => n.trim()).filter(Boolean);
                            const porServicio = nombres.length > 0 ? totalSeleccionada / nombres.length : 0;
                            return nombres.map((nombre, i) => (
                              <tr key={nombre} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                <td className="px-3 py-2 text-slate-700 uppercase text-xs">{nombre}</td>
                                <td className="px-3 py-2 text-right font-semibold text-slate-800 text-xs">
                                  {porServicio > 0 ? `Q ${porServicio.toFixed(2)}` : '—'}
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>

                      {/* Total */}
                      <div className="print-total bg-slate-700 px-3 py-2.5 flex justify-between items-center">
                        <span className="text-white font-bold text-sm uppercase tracking-wide">Total</span>
                        <span className="text-white font-black text-lg">Q {totalSeleccionada.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Observaciones */}
                    {solicitudSeleccionada.notas && (
                      <div className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600">
                        <span className="font-bold uppercase text-slate-500">Observaciones: </span>
                        <span className="uppercase">{solicitudSeleccionada.notas}</span>
                      </div>
                    )}

                    {/* Mecánico */}
                    {solicitudSeleccionada.mecanico && (
                      <p className="text-[10px] text-slate-400 text-center">
                        Atendido por: <strong className="text-slate-600">{solicitudSeleccionada.mecanico?.name || solicitudSeleccionada.mecanico?.nombre}</strong>
                      </p>
                    )}

                    {/* Firmas */}
                    <div className="flex justify-between gap-8 pt-2 pb-1">
                      <div className="flex-1 text-center">
                        <div className="border-t-2 border-slate-200 mt-8 pt-1 text-[10px] text-slate-400 uppercase tracking-wide">Firma del cliente</div>
                      </div>
                      <div className="flex-1 text-center">
                        <div className="border-t-2 border-slate-200 mt-8 pt-1 text-[10px] text-slate-400 uppercase tracking-wide">Autorizado por</div>
                      </div>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-[9px] text-slate-300 uppercase tracking-widest">
                      {configNegocio?.nombre || 'AUTO+'} · {configNegocio?.nit ? `NIT: ${configNegocio.nit}` : 'Gracias por su preferencia'}
                    </p>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex flex-col sm:flex-row gap-2 sm:justify-end no-print">
                  {/* WhatsApp */}
                  {telefonoCliente ? (
                    <a
                      href={`https://wa.me/502${telefonoCliente}?text=${encodeURIComponent(mensajeWhatsApp)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.534 5.858L.057 23.5l5.797-1.516A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.877 9.877 0 01-5.031-1.378l-.361-.214-3.741.979 1.001-3.648-.235-.374A9.865 9.865 0 012.106 12C2.106 6.58 6.58 2.106 12 2.106S21.894 6.58 21.894 12 17.42 21.894 12 21.894z"/>
                      </svg>
                      Enviar por WhatsApp
                    </a>
                  ) : (
                    <span className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 text-slate-400 font-semibold px-4 py-2 rounded-xl text-sm cursor-not-allowed" title="Sin número de teléfono registrado">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.534 5.858L.057 23.5l5.797-1.516A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.877 9.877 0 01-5.031-1.378l-.361-.214-3.741.979 1.001-3.648-.235-.374A9.865 9.865 0 012.106 12C2.106 6.58 6.58 2.106 12 2.106S21.894 6.58 21.894 12 17.42 21.894 12 21.894z"/>
                      </svg>
                      Sin teléfono
                    </span>
                  )}
                  {/* Imprimir (térmica B&W) */}
                  <button type="button" onClick={() => imprimirDoc('Orden')} className={`w-full sm:w-auto ${btnPrimario}`}>
                    <Icon path="M6 9V4a2 2 0 012-2h8a2 2 0 012 2v5m-2 4h2a2 2 0 002-2v-1a2 2 0 00-2-2H4a2 2 0 00-2 2v1a2 2 0 002 2h2m0 0v3a2 2 0 002 2h8a2 2 0 002-2v-3m-12 0h12" />
                    Imprimir comprobante
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
