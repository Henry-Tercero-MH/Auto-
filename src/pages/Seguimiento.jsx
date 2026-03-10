import { useState, useMemo } from 'react';
import logo from '../imagenes/logoMecanica.png';
import { useSolicitudes } from '../context/SolicitudesContext';
import { useCatalogos } from '../context/CatalogosContext';

export default function Seguimiento() {
  const { solicitudes } = useSolicitudes();
  const { estados } = useCatalogos();

  // Construir TIMELINE y helpers a partir del catálogo
  const TIMELINE = useMemo(
    () => estados.map((e) => ({ key: e.nombre, label: e.timelineLabel || e.nombre, desc: e.timelineDesc || '' })),
    [estados]
  );

  const estadoColor = useMemo(() => {
    const m = {};
    estados.forEach((e) => { m[e.nombre] = e.bgClass; });
    return m;
  }, [estados]);

  const getStepIndex = (estado) => {
    const idx = estados.findIndex((e) => e.nombre === estado);
    return idx >= 0 ? idx : 0;
  };
  const [ticket, setTicket] = useState('');
  const [resultado, setResultado] = useState(null);
  const [buscado, setBuscado] = useState(false);

  const buscar = () => {
    const clean = ticket.replace('#', '').trim();
    const found = solicitudes.find((s) => s.id === clean);
    setResultado(found || null);
    setBuscado(true);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') buscar();
  };

  const stepIdx = resultado ? getStepIndex(resultado.estado) : -1;

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-start px-3 py-6 sm:px-4 sm:py-8">
      <div className="w-full max-w-lg">

        {/* Logo + título */}
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="AUTO+" className="h-14 sm:h-20 object-contain mb-3 sm:mb-4" />
          <h2 className="text-lg sm:text-xl font-bold text-primary text-center">Consulta tu orden de servicio</h2>
          <p className="text-slate-500 text-sm mt-1 text-center">
            Ingresa tu número de ticket para ver el estado de tu vehículo
          </p>
        </div>

        {/* Input de búsqueda */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-4 sm:mb-5">
          <label className="block text-sm font-medium text-slate-700 mb-2">Número de ticket</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-sm">#</span>
              <input
                type="text"
                value={ticket}
                onChange={(e) => {
                  setTicket(e.target.value);
                  setBuscado(false);
                  setResultado(null);
                }}
                onKeyDown={handleKey}
                placeholder="0128"
                maxLength={10}
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 text-slate-800 font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
              />
            </div>
            <button
              onClick={buscar}
              disabled={!ticket.trim()}
              className="bg-accent hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 rounded-xl transition-all shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* No encontrado */}
        {buscado && !resultado && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3 text-red-700">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-sm">Ticket no encontrado</p>
              <p className="text-xs mt-0.5 text-red-500">Verifica el número e intenta de nuevo.</p>
            </div>
          </div>
        )}

        {/* Resultado encontrado */}
        {resultado && (
          <div className="space-y-4">

            {/* Estado actual destacado */}
            <div className={`rounded-2xl border p-4 flex items-center gap-4 ${estadoColor[resultado.estado] || 'bg-slate-100 text-slate-700'}`} style={{ borderColor: estados.find(e => e.nombre === resultado.estado)?.color || '#cbd5e1' }}>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-0.5">Estado actual</p>
                <p className="text-xl font-black">{resultado.estado}</p>
                <p className="text-xs mt-0.5 opacity-70">Ticket #{resultado.id} · {resultado.fecha}</p>
              </div>
              {resultado.estado === 'Completada' && (
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              {resultado.estado === 'En proceso' && (
                <div className="w-12 h-12 rounded-full bg-orange-400 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
              {resultado.estado === 'Pendiente' && (
                <div className="w-12 h-12 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4 sm:mb-5">Progreso</p>
              <div className="relative">
                {/* Línea de fondo */}
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-200" />
                {/* Línea de progreso */}
                <div
                  className="absolute left-4 top-4 w-0.5 bg-primary transition-all duration-500"
                  style={{ height: stepIdx <= 0 ? '0%' : `${(stepIdx / (TIMELINE.length - 1)) * 100}%` }}
                />
                <div className="space-y-6">
                  {TIMELINE.map((step, i) => {
                    const done = i <= stepIdx;
                    const current = i === stepIdx;
                    return (
                      <div key={step.key} className="relative flex items-start gap-4 pl-2">
                        {/* Círculo */}
                        <div
                          className={`relative z-10 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                            done
                              ? 'bg-primary border-primary'
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          {done && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        {/* Texto */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${done ? 'text-primary' : 'text-slate-400'}`}>
                            {step.label}
                            {current && (
                              <span className="ml-2 text-xs bg-accent text-white px-2 py-0.5 rounded-full font-medium">
                                Actual
                              </span>
                            )}
                          </p>
                          <p className={`text-xs mt-0.5 ${done ? 'text-slate-500' : 'text-slate-300'}`}>{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Info vehículo y servicio */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Detalle de tu orden</p>
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                <div>
                  <p className="text-slate-400 text-xs">Propietario</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{resultado.cliente}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Teléfono</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{resultado.tel}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Vehículo</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{resultado.vehiculo}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Placa</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{resultado.placa}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-400 text-xs">Servicio solicitado</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{resultado.servicio}</p>
                </div>
              </div>
            </div>

            {resultado.estado === 'Completada' && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3 text-green-700">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold text-sm">¡Tu vehículo está listo!</p>
                  <p className="text-xs mt-0.5 text-green-600">Puedes pasar a recogerlo al taller. Gracias por tu preferencia.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
