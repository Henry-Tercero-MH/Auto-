import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { useSolicitudes } from '../context/SolicitudesContext';
import { useCatalogos } from '../context/CatalogosContext';
import SpinnerBolitas from '../components/SpinnerBolitas';
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
  const { solicitudes, cargando } = useSolicitudes();
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

  const parseDate = (str) => {
    if (!str) return null;
    const d = new Date(str + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
  };

  const solicitudesFiltradas = useMemo(() => {
    const fechaDesde = parseDate(desde);
    const fechaHasta = parseDate(hasta);
    return solicitudes.filter((s) => {
      const fechaSol = parseDate(s.fecha);
      if (fechaDesde && fechaSol && fechaSol < fechaDesde) return false;
      if (fechaHasta && fechaSol && fechaSol > fechaHasta) return false;
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
    // Inyectar estilos de impresión solo mientras se imprime
    // Los estilos de impresión ya están incrustados en el componente #print-recibo
    window.print();
    document.title = prev;
  };

  /* ── Estilos compartidos ── */
  const btnSecundario = 'inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition';
  const btnPrimario   = 'inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition';

  if (cargando) return <SpinnerBolitas texto="Cargando reportes..." />;

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
            <input type="date" value={desde}
              onChange={(e) => {
                const val = e.target.value;
                if (hasta && val > hasta) {
                  toast.error('La fecha "desde" no puede ser posterior a "hasta"');
                  return;
                }
                setDesde(val);
              }}
              className="w-full min-w-0 block border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none box-border" />
          </div>
          <div className="min-w-0">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Hasta</label>
            <input type="date" value={hasta}
              onChange={(e) => {
                const val = e.target.value;
                if (desde && val < desde) {
                  toast.error('La fecha "hasta" no puede ser anterior a "desde"');
                  return;
                }
                setHasta(val);
              }}
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
                {/* ── Ticket térmico 80mm ── */}
                <div className="print-wrapper flex justify-center px-4 sm:px-8">
                <div id="print-recibo" className="bg-white border border-gray-300 rounded-none select-none text-sm w-full" style={{ fontFamily: "'Courier New', monospace", maxWidth: '272px' }}>
                  <style>{`
                    @media print {
                      @page {
                        size: 72mm auto;
                        margin: 0;
                      }
                      body * { visibility: hidden !important; }
                      #print-recibo, #print-recibo * { visibility: visible !important; }

                      /* Todo negro puro y negrita */
                      #print-recibo, #print-recibo * {
                        color: #000 !important;
                        -webkit-text-fill-color: #000 !important;
                        background: transparent !important;
                        font-weight: 900 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                      }

                      #print-recibo {
                        position: fixed !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 72mm !important;
                        max-width: 72mm !important;
                        font-family: 'Courier New', monospace !important;
                        font-size: 10pt !important;
                        line-height: 1.4 !important;
                        margin: 0 !important;
                        padding: 2mm 3mm !important;
                        box-sizing: border-box !important;
                        border: none !important;
                        border-radius: 0 !important;
                      }
                      #print-recibo > * {
                        width: 100% !important;
                        max-width: 100% !important;
                        box-sizing: border-box !important;
                      }

                      #print-recibo .r-header { display: flex !important; justify-content: space-between !important; align-items: flex-start !important; border-bottom: 2px solid #000 !important; padding-bottom: 2mm !important; margin-bottom: 2mm !important; }
                      #print-recibo .r-logo { height: 24px !important; filter: grayscale(100%) contrast(500%) brightness(0%) !important; }
                      #print-recibo .r-orden-num { font-size: 14pt !important; line-height: 1.1 !important; }
                      #print-recibo .r-section { border-bottom: 1.5px dashed #000 !important; padding: 1.5mm 0 !important; margin-bottom: 1mm !important; }
                      #print-recibo .r-section-title { font-size: 10pt !important; text-transform: uppercase !important; margin-bottom: 1mm !important; display: block !important; }
                      #print-recibo .r-label { font-size: 9pt !important; text-transform: uppercase !important; display: inline !important; }
                      #print-recibo .r-value { font-size: 10pt !important; word-break: break-all !important; display: inline !important; }
                      #print-recibo .r-grid { display: block !important; }
                      #print-recibo .r-grid > div { display: block !important; width: 100% !important; }
                      #print-recibo .r-table-head { border-top: 2px solid #000 !important; border-bottom: 2px solid #000 !important; font-size: 10pt !important; padding: 1mm 0 !important; display: flex !important; justify-content: space-between !important; }
                      #print-recibo .r-serv-row { display: flex !important; justify-content: space-between !important; font-size: 10pt !important; border-bottom: 1.5px dotted #000 !important; padding: 1mm 0 !important; }
                      #print-recibo .r-firma { display: block !important; padding-top: 3mm !important; font-size: 9pt !important; padding-bottom: 15mm !important; }
                      #print-recibo .r-firma-line { border-bottom: 2px solid #000 !important; width: 100% !important; margin-top: 8mm !important; display: block !important; }
                      .no-print { display: none !important; }
                    }
                  `}</style>

                  {/* Encabezado */}
                  <div className="r-header border-b border-gray-400 px-2 py-1.5 flex items-center justify-between gap-2">
                    <img src={logo} alt="AUTO+" className="r-logo h-8 object-contain" />
                    <div className="text-right leading-tight">
                      <p className="r-label text-xs print:text-[8px] text-gray-500 uppercase tracking-wider">Orden de Trabajo</p>
                      <p className="r-orden-num text-accent font-black text-2xl print:text-lg tracking-wide">
                        No. {String(solicitudSeleccionada.id).replace(/\D/g, '').padStart(5, '0')}
                      </p>
                      <p className="r-label text-gray-500 text-xs print:text-[8px]">{solicitudSeleccionada.fecha}</p>
                    </div>
                  </div>

                  {/* Cliente */}
                  <div className="r-section border-b border-dashed border-gray-300 px-2 py-1">
                    <p className="r-section-title text-primary font-bold uppercase tracking-widest text-xs print:text-[8px] mb-1">Cliente</p>
                    <div className="space-y-1">
                      <div>
                        <span className="r-label text-gray-400 uppercase text-[11px] print:text-[7px]">Nombre: </span>
                        <span className="r-value font-semibold text-gray-800 text-sm print:text-[10px] uppercase">{solicitudSeleccionada.cliente}</span>
                      </div>
                      {solicitudSeleccionada.telefono && (
                        <div>
                          <span className="r-label text-gray-400 uppercase text-[11px] print:text-[7px]">Tel: </span>
                          <span className="r-value font-semibold text-gray-800 text-sm print:text-[10px]">{solicitudSeleccionada.telefono}</span>
                        </div>
                      )}
                      {solicitudSeleccionada.mecanico && (
                        <div>
                          <span className="r-label text-gray-400 uppercase text-[11px] print:text-[7px]">Técnico: </span>
                          <span className="r-value font-semibold text-gray-800 text-sm print:text-[10px]">{solicitudSeleccionada.mecanico?.name || solicitudSeleccionada.mecanico?.nombre || solicitudSeleccionada.mecanico}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vehículo */}
                  <div className="r-section border-b border-dashed border-gray-300 px-2 py-1">
                    <p className="r-section-title text-primary font-bold uppercase tracking-widest text-xs print:text-[8px] mb-1">Vehículo</p>
                    <div className="r-grid grid grid-cols-2 gap-x-3 gap-y-1">
                      <div className="col-span-2">
                        <span className="r-label text-gray-400 uppercase text-[11px] print:text-[7px]">Vehículo: </span>
                        <span className="r-value font-semibold text-gray-800 text-sm print:text-[10px] uppercase">{solicitudSeleccionada.vehiculo}</span>
                      </div>
                      {solicitudSeleccionada.placa && (
                        <div>
                          <span className="r-label text-gray-400 uppercase text-[11px] print:text-[7px]">Placa: </span>
                          <span className="r-value font-semibold text-gray-800 text-sm print:text-[10px]">{solicitudSeleccionada.placa}</span>
                        </div>
                      )}
                      <div>
                        <span className="r-label text-gray-400 uppercase text-[11px] print:text-[7px]">Estado: </span>
                        <span className="r-value font-semibold text-gray-800 text-sm print:text-[10px]">{solicitudSeleccionada.estado}</span>
                      </div>
                    </div>
                  </div>

                  {/* Trabajos */}
                  <div className="r-section border-b border-dashed border-gray-300">
                    <div className="r-table-head flex justify-between bg-primary text-white text-xs print:text-[7px] uppercase font-bold px-2 py-1.5 print:py-1">
                      <span>Descripción</span>
                      <span>Precio</span>
                    </div>
                    {(() => {
                      const nombres = (solicitudSeleccionada.servicio || '').split(',').map(n => n.trim()).filter(Boolean);
                      const porServicio = nombres.length > 0 ? totalSeleccionada / nombres.length : 0;
                      return nombres.map((nombre) => (
                        <div key={nombre} className="r-serv-row flex items-center justify-between px-2 py-1.5 print:py-1 border-b border-dotted border-gray-200">
                          <span className="text-gray-800 font-medium text-sm print:text-[9px] flex-1 pr-1 uppercase">{nombre}</span>
                          <span className="font-bold text-gray-700 text-sm print:text-[9px]">
                            {porServicio > 0 ? `Q ${porServicio.toFixed(2)}` : '—'}
                          </span>
                        </div>
                      ));
                    })()}
                    {/* Total */}
                    <div className="px-2 py-1.5 print:py-1 border-t border-gray-400">
                      <div className="flex justify-between text-base print:text-[11px] font-black text-primary">
                        <span className="uppercase">TOTAL:</span>
                        <span className="text-accent">Q {totalSeleccionada.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Observaciones */}
                  {solicitudSeleccionada.notas && (
                    <div className="px-2 py-1 border-b border-dashed border-gray-300">
                      <span className="r-label text-gray-400 uppercase text-[11px] print:text-[7px]">Obs.: </span>
                      <span className="text-gray-800 text-xs print:text-[8px] uppercase">{solicitudSeleccionada.notas}</span>
                    </div>
                  )}

                  {/* Firmas */}
                  <div className="r-firma px-2 py-2 space-y-3">
                    <div>
                      <span className="r-label text-gray-400 uppercase text-[11px] print:text-[7px]">Firma / Aceptación:</span>
                      <div className="r-firma-line border-b border-gray-400 mt-6 print:mt-4 w-full" />
                    </div>
                    <div>
                      <span className="r-label text-gray-400 uppercase text-[11px] print:text-[7px]">Nombre:</span>
                      <div className="r-firma-line border-b border-gray-400 mt-6 print:mt-4 w-full" />
                    </div>
                  </div>
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
