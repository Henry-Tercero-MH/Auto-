import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import logo from '../imagenes/logoMecanica.png';
import { formatQ, CategoryIcon } from '../data/servicios';
import { useCatalogos } from '../context/CatalogosContext';
import { useSolicitudes } from '../context/SolicitudesContext';
import imgSuperior from '../imagenes/vista superior.png';
import imgFrontal  from '../imagenes/carfrente.png';
import imgTrasera  from '../imagenes/carTrasero.png';
import imgLatIzq   from '../imagenes/carlateralizquierda.png';
import imgLatDer   from '../imagenes/carlateralderecho.png';

// ── Inspección config (fallback si no hay contexto cargado) ─────────────────
const ESTADO_CICLO_DEFAULT = [null, 'rayon', 'golpe', 'rotura'];
const ESTADO_CONFIG_DEFAULT = {
  rayon:  { fill: '#fef9c3', stroke: '#ca8a04', dot: '#ca8a04', label: 'Rayón'  },
  golpe:  { fill: '#ffedd5', stroke: '#ea580c', dot: '#ea580c', label: 'Golpe'  },
  rotura: { fill: '#fee2e2', stroke: '#dc2626', dot: '#dc2626', label: 'Rotura' },
};

// Estas se construyen dinámicamente desde el catálogo en el componente principal
// y se pasan como props a InspeccionVehiculo → ZonaRect

const ZONA_LABELS = {
  bumper_front:    'Bumper Delantero',
  bumper_rear:     'Bumper Trasero',
  capot:           'Capot',
  cajuela:         'Cajuela',
  cristal_front:   'Cristal Delantero',
  cristal_rear:    'Cristal Trasero',
  techo:           'Techo',
  faro_izq:        'Faro Izquierdo',
  faro_der:        'Faro Derecho',
  calavera_izq:    'Calavera Izquierda',
  calavera_der:    'Calavera Derecha',
  mascara:         'Máscara / Grille',
  salp_del_izq:    'Salpicadera Del. Izq',
  salp_del_der:    'Salpicadera Del. Der',
  salp_tras_izq:   'Salpicadera Tras. Izq',
  salp_tras_der:   'Salpicadera Tras. Der',
  puerta_del_izq:  'Puerta Del. Izquierda',
  puerta_del_der:  'Puerta Del. Derecha',
  puerta_tras_izq: 'Puerta Tras. Izquierda',
  puerta_tras_der: 'Puerta Tras. Derecha',
  espejo_izq:      'Espejo Izquierdo',
  espejo_der:      'Espejo Derecho',
};

// Vistas del vehículo con zonas clickeables
const VISTAS = [
  {
    id: 'superior', label: 'Superior',
    img: imgSuperior,
    viewBox: '0 0 220 380',
    bg: { x: 2, y: 4, w: 216, h: 372, rx: 22 },
    zonas: [
      { id: 'techo', label: 'Techo', x: 50, y: 147, w: 120, h: 78 },
    ],
  },
  {
    id: 'frontal', label: 'Frontal',
    img: imgFrontal,
    viewBox: '0 0 280 210',
    bg: { x: 5, y: 5, w: 270, h: 200, rx: 10 },
    zonas: [
      { id: 'cristal_front', label: 'Parabrisas',  x: 68,  y: 10,  w: 144, h: 55 },
      { id: 'capot',         label: 'Capot',        x: 48,  y: 65,  w: 184, h: 58 },
      { id: 'faro_izq',      label: 'Faro\nIzq',   x: 5,   y: 68,  w: 53,  h: 55 },
      { id: 'faro_der',      label: 'Faro\nDer',   x: 222, y: 68,  w: 53,  h: 55 },
      { id: 'mascara',       label: 'Máscara',      x: 98,  y: 123, w: 84,  h: 28 },
      { id: 'bumper_front',  label: 'Bumper Del.',  x: 15,  y: 151, w: 250, h: 45 },
    ],
  },
  {
    id: 'trasera', label: 'Trasera',
    img: imgTrasera,
    viewBox: '0 0 280 210',
    bg: { x: 5, y: 5, w: 270, h: 200, rx: 10 },
    zonas: [
      { id: 'cristal_rear',  label: 'Cristal\nTrasero', x: 68,  y: 10,  w: 144, h: 55 },
      { id: 'cajuela',       label: 'Cajuela',           x: 48,  y: 65,  w: 184, h: 58 },
      { id: 'calavera_izq',  label: 'Calavera\nIzq',    x: 5,   y: 68,  w: 53,  h: 55 },
      { id: 'calavera_der',  label: 'Calavera\nDer',    x: 222, y: 68,  w: 53,  h: 55 },
      { id: 'bumper_rear',   label: 'Bumper Tras.',      x: 15,  y: 151, w: 250, h: 45 },
    ],
  },
  {
    id: 'lat_izq', label: 'Lat. Izq',
    img: imgLatIzq,
    viewBox: '0 0 400 170',
    bg: { x: 3, y: 5, w: 394, h: 155, rx: 12 },
    zonas: [
      { id: 'espejo_izq',      label: 'Espejo',          x: 95,  y: 25,  w: 30,  h: 22 },
      { id: 'salp_del_izq',    label: 'Salp. Del Izq',   x: 8,   y: 50,  w: 92,  h: 108 },
      { id: 'puerta_del_izq',  label: 'Puerta Del Izq',  x: 100, y: 50,  w: 104, h: 108 },
      { id: 'puerta_tras_izq', label: 'Puerta Tras Izq', x: 204, y: 50,  w: 104, h: 108 },
      { id: 'salp_tras_izq',   label: 'Salp. Tras Izq',  x: 308, y: 50,  w: 84,  h: 108 },
    ],
  },
  {
    id: 'lat_der', label: 'Lat. Der',
    img: imgLatDer,
    viewBox: '0 0 400 170',
    bg: { x: 3, y: 5, w: 394, h: 155, rx: 12 },
    zonas: [
      { id: 'espejo_der',      label: 'Espejo',          x: 275, y: 25,  w: 30,  h: 22 },
      { id: 'salp_del_der',    label: 'Salp. Del Der',   x: 300, y: 50,  w: 92,  h: 108 },
      { id: 'puerta_del_der',  label: 'Puerta Del Der',  x: 196, y: 50,  w: 104, h: 108 },
      { id: 'puerta_tras_der', label: 'Puerta Tras Der', x: 92,  y: 50,  w: 104, h: 108 },
      { id: 'salp_tras_der',   label: 'Salp. Tras Der',  x: 8,   y: 50,  w: 84,  h: 108 },
    ],
  },
];

// ── Initial state ───────────────────────────────────────────────────────────
const initialState = {
  nombre: '',
  telefono: '',
  marca: '',
  modelo: '',
  anio: '',
  placa: '',
  kilometraje: '',
  tipoServicio: '',
  adicionales: [],
  observaciones: '',
  inspeccion: {},
  mecanico: '',
};

// Las marcas y servicios ahora vienen del CatalogosContext

const STEPS = [
  { label: 'Inspección' },
  { label: 'Cliente'    },
  { label: 'Vehículo'   },
  { label: 'Servicio'   },
  { label: 'Resumen'    },
];

// ── Combobox ─────────────────────────────────────────────────────────────────
function Combobox({ id, value, onChange, options, placeholder, error, disabled }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const filtered = query.trim()
    ? options.filter(o => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (opt) => { onChange(opt); setQuery(''); setOpen(false); };

  const inputCls2 = `w-full rounded-lg px-3 py-2.5 bg-slate-50 border text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition ${
    error ? 'border-red-400 focus:ring-red-300 bg-red-50' : 'border-gray-200 focus:ring-accent focus:border-accent'
  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

  return (
    <div ref={ref} className="relative">
      <input
        id={id}
        type="text"
        autoComplete="off"
        disabled={disabled}
        placeholder={value || placeholder}
        value={open ? query : value}
        onFocus={() => { if (!disabled) { setQuery(''); setOpen(true); } }}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        className={inputCls2}
      />
      {/* chevron */}
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </span>
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {filtered.map(opt => (
            <li
              key={opt}
              onMouseDown={() => select(opt)}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-slate-100 ${opt === value ? 'font-semibold text-accent' : 'text-gray-800'}`}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
      {open && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm text-gray-400 italic">
          Sin resultados
        </div>
      )}
    </div>
  );
}

// ── StepIndicator ───────────────────────────────────────────────────────────
function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((s, i) => {
        const idx = i + 1;
        const done = current > idx;
        const active = current === idx;
        return (
          <div key={s.label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  done    ? 'bg-primary text-white'
                  : active ? 'bg-accent text-white shadow-md'
                           : 'border-2 border-gray-300 text-gray-400 bg-white'
                }`}
              >
                {done ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : idx}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${active ? 'text-accent' : done ? 'text-primary' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-7 sm:w-12 mx-1 sm:mx-2 mb-4 transition-all ${current > idx ? 'bg-primary' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const inputCls = (err) =>
  `w-full rounded-lg px-3 py-2.5 bg-slate-50 border text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition ${
    err ? 'border-red-400 focus:ring-red-300 bg-red-50' : 'border-gray-200 focus:ring-accent focus:border-accent'
  }`;

function genOrden() {
  const next = parseInt(localStorage.getItem('drivebot_next_orden') || '1', 10);
  return String(next).padStart(5, '0');
}

// ── ZonaRect ─────────────────────────────────────────────────────────────────
function ZonaRect({ zona, estado, onClick, ESTADO_CONFIG }) {
  const { x, y, w, h, label } = zona;

  // Sin daño: borde blanco sutil, casi invisible
  // Con daño: borde coloreado + fill muy tenue para no tapar la foto
  const cfg = ESTADO_CONFIG || ESTADO_CONFIG_DEFAULT;
  const strokeColor = estado ? cfg[estado]?.stroke || '#999' : 'rgba(255,255,255,0.45)';
  const strokeW     = estado ? 2.5 : 1;
  const fillColor   = 'transparent';
  const strokeDash  = estado ? 'none' : '3,2';

  const cx = x + w / 2;
  const cy = y + h / 2;
  const lines = label.split('\n');
  const fs = Math.min(w, h) < 30 ? 7 : 8;
  const lineH = fs + 3;
  const padX = 4;
  const padY = 2;
  const bgW = Math.max(...lines.map(l => l.length)) * fs * 0.6 + padX * 2;
  const bgH = lines.length * lineH + padY * 2;

  // Badge de estado en esquina superior derecha
  const badgeR = 7;
  const bx = x + w - badgeR - 2;
  const by = y + badgeR + 2;

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* Zona */}
      <rect
        x={x} y={y} width={w} height={h} rx={3}
        fill={fillColor}
        stroke={strokeColor} strokeWidth={strokeW}
        strokeDasharray={strokeDash}
      />

      {/* Label con fondo blanco */}
      <rect
        x={cx - bgW / 2} y={cy - bgH / 2}
        width={bgW} height={bgH} rx={2}
        fill="rgba(255,255,255,0.85)"
        style={{ pointerEvents: 'none' }}
      />
      {lines.map((line, i) => (
        <text
          key={i}
          x={cx}
          y={cy + (i - (lines.length - 1) / 2) * lineH}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={fs}
          fill="#111827"
          fontWeight="700"
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          {line}
        </text>
      ))}

      {/* Badge de daño en esquina superior derecha */}
      {estado && cfg[estado] && (
        <g style={{ pointerEvents: 'none' }}>
          <circle cx={bx} cy={by} r={badgeR} fill={cfg[estado].dot} />
          <text
            x={bx} y={by}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={6} fill="white" fontWeight="800"
          >
            {cfg[estado].label[0]}
          </text>
        </g>
      )}
    </g>
  );
}

// ── InspeccionVehiculo ────────────────────────────────────────────────────────
function InspeccionVehiculo({ inspeccion, onChange, tiposDano }) {
  const [vistaId, setVistaId] = useState('superior');
  const vista = VISTAS.find(v => v.id === vistaId);
  const damaged = Object.entries(inspeccion).filter(([, v]) => v);

  // Construir ciclo y config dinámicamente desde catálogo
  const ESTADO_CICLO = [null, ...(tiposDano || []).map(t => t.clave)];
  const ESTADO_CONFIG = {};
  (tiposDano || []).forEach(t => {
    ESTADO_CONFIG[t.clave] = { fill: t.fill, stroke: t.stroke, dot: t.dot, label: t.label };
  });
  // fallback si no hay catálogo cargado
  if (ESTADO_CICLO.length === 1) {
    ESTADO_CICLO_DEFAULT.forEach(c => { if (c && !ESTADO_CICLO.includes(c)) ESTADO_CICLO.push(c); });
    Object.assign(ESTADO_CONFIG, ESTADO_CONFIG_DEFAULT);
  }

  const handleClick = (zonaId) => {
    const key = `${vistaId}::${zonaId}`;
    const cur = inspeccion[key] || null;
    const next = ESTADO_CICLO[(ESTADO_CICLO.indexOf(cur) + 1) % ESTADO_CICLO.length];
    onChange(key, next);
  };

  return (
    <div className="px-5 sm:px-8 py-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-accent">
          Inspección visual del vehículo
        </h3>
        {damaged.length > 0 ? (
          <span className="text-xs bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded-full font-semibold">
            {damaged.length} zona{damaged.length > 1 ? 's' : ''} marcada{damaged.length > 1 ? 's' : ''}
          </span>
        ) : (
          <span className="text-xs text-slate-400 italic">(opcional — puede saltarse)</span>
        )}
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">
        Toca cada zona para marcar su estado. Cicla entre:{' '}
        <span className="font-medium text-slate-500">Sin daño</span>
        {Object.values(ESTADO_CONFIG).map((cfg, i) => (
          <span key={i}> → <span className="font-medium" style={{ color: cfg.dot }}>{cfg.label}</span></span>
        ))}
      </p>

      {/* Tabs de vista */}
      <div className="flex gap-1.5 flex-wrap">
        {VISTAS.map(v => (
          <button
            key={v.id}
            onClick={() => setVistaId(v.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              vistaId === v.id
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Diagrama SVG */}
      {(() => {
        const isPortrait = vista.id === 'superior';
        const svgViewBox  = isPortrait ? '0 0 380 220' : vista.viewBox;
        const groupTransform = isPortrait ? 'translate(380,0) rotate(90)' : undefined;
        const imgW = isPortrait ? 220 : '100%';
        const imgH = isPortrait ? 380 : '100%';
        return (
          <div className="bg-slate-100 rounded-xl border border-slate-200 overflow-hidden">
            <svg viewBox={svgViewBox} className="w-full" style={{ display: 'block', maxHeight: '260px' }}>
              <g transform={groupTransform}>
                <image href={vista.img} x={0} y={0} width={imgW} height={imgH} preserveAspectRatio="xMidYMid meet" />
                {vista.zonas.map(zona => (
                  <ZonaRect
                    key={`${vistaId}-${zona.id}`}
                    zona={zona}
                    estado={inspeccion[`${vistaId}::${zona.id}`] || null}
                    onClick={() => handleClick(zona.id)}
                    ESTADO_CONFIG={ESTADO_CONFIG}
                  />
                ))}
              </g>
            </svg>
          </div>
        );
      })()}

      {/* Leyenda */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Estado:</span>
        <span className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className="w-4 h-4 rounded border border-slate-300 bg-slate-100 inline-block" />
          Sin daño
        </span>
        {Object.entries(ESTADO_CONFIG).map(([k, cfg]) => (
          <span key={k} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="w-4 h-4 rounded inline-block" style={{ backgroundColor: cfg.fill, border: `1.5px solid ${cfg.stroke}` }} />
            {cfg.label}
          </span>
        ))}
      </div>

      {/* Lista de daños */}
      {damaged.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-2">
            Daños registrados
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4">
            {damaged.map(([k, v]) => {
              const [vid, ...zParts] = k.split('::');
              const zid = zParts.join('::');
              const vistaLabel = VISTAS.find(vv => vv.id === vid)?.label || vid;
              return (
                <div key={k} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ESTADO_CONFIG[v]?.dot || '#999' }} />
                  <span className="text-slate-700">
                    <span className="text-slate-400">{vistaLabel} — </span>
                    {ZONA_LABELS[zid] || zid}
                  </span>
                  <span className="font-semibold ml-auto" style={{ color: ESTADO_CONFIG[v]?.dot || '#999' }}>
                    {ESTADO_CONFIG[v]?.label || v}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── OrdenTrabajo ─────────────────────────────────────────────────────────────
function OrdenTrabajo({ form, ordenNum, preciosMap, tiposDano }) {
  const fecha = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const serviciosNombres = [form.tipoServicio, ...form.adicionales].filter(Boolean);
  const serviciosConPrecio = serviciosNombres.map((n) => ({ nombre: n, precio: preciosMap[n] || 0 }));
  const subtotal = serviciosConPrecio.reduce((sum, s) => sum + s.precio, 0);
  const total = subtotal;
  const danos = Object.entries(form.inspeccion).filter(([, v]) => v);

  // Construir config de tipos de daño desde catálogo
  const EC = {};
  (tiposDano || []).forEach(t => { EC[t.clave] = { fill: t.fill, stroke: t.stroke, dot: t.dot, label: t.label }; });
  if (Object.keys(EC).length === 0) Object.assign(EC, ESTADO_CONFIG_DEFAULT);

  return (
    <div className="bg-white border-2 border-gray-300 rounded-none font-mono text-xs sm:text-sm select-none" style={{ fontFamily: "'Courier New', monospace" }}>

      {/* ── Encabezado ── */}
      <div className="thermal-header border-b-2 border-gray-300 px-4 py-2.5 flex items-center justify-between gap-4">
        <img src={logo} alt="AUTO+" className="thermal-logo h-12 object-contain" />
        <div className="text-right">
          <p className="thermal-label text-[10px] text-gray-500 uppercase tracking-wider">Orden de Trabajo</p>
          <p className="thermal-orden-num text-accent font-black text-2xl tracking-wide leading-tight">No. {ordenNum}</p>
          <p className="thermal-label text-gray-500 text-[10px]">Fecha: {fecha}</p>
        </div>
      </div>

      {/* ── Cliente + Vehículo en una sola sección compacta ── */}
      <div className="thermal-section border-b border-dashed border-gray-300 px-4 py-2">
        <p className="thermal-section-title text-primary font-bold uppercase tracking-widest text-[10px] mb-1.5">Cliente</p>
        {/* Nombre | Tel en una fila */}
        <div className="grid grid-cols-3 gap-x-4 gap-y-1">
          <div className="col-span-2">
            <span className="thermal-label text-gray-400 uppercase text-[9px]">Nombre:</span>
            <p className="thermal-value font-semibold text-gray-800 border-b border-dotted border-gray-300 leading-tight">{form.nombre}</p>
          </div>
          <div>
            <span className="thermal-label text-gray-400 uppercase text-[9px]">Tel:</span>
            <p className="thermal-value font-semibold text-gray-800 border-b border-dotted border-gray-300 leading-tight">{form.telefono}</p>
          </div>
          {form.mecanico && (
            <div className="col-span-3 mt-0.5">
              <span className="thermal-label text-gray-400 uppercase text-[9px]">Técnico asignado:</span>
              <p className="thermal-value font-semibold text-gray-800 border-b border-dotted border-gray-300 leading-tight">{form.mecanico}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Vehículo ── */}
      <div className="thermal-section border-b border-dashed border-gray-300 px-4 py-2">
        <p className="thermal-section-title text-primary font-bold uppercase tracking-widest text-[10px] mb-1.5">Vehículo</p>
        <div className="thermal-grid-3 grid grid-cols-5 gap-x-3 gap-y-1">
          <div>
            <span className="thermal-label text-gray-400 uppercase text-[9px]">Marca:</span>
            <p className="thermal-value font-semibold text-gray-800 border-b border-dotted border-gray-300 leading-tight">{form.marca}</p>
          </div>
          <div>
            <span className="thermal-label text-gray-400 uppercase text-[9px]">Modelo:</span>
            <p className="thermal-value font-semibold text-gray-800 border-b border-dotted border-gray-300 leading-tight">{form.modelo}</p>
          </div>
          <div>
            <span className="thermal-label text-gray-400 uppercase text-[9px]">Año:</span>
            <p className="thermal-value font-semibold text-gray-800 border-b border-dotted border-gray-300 leading-tight">{form.anio}</p>
          </div>
          <div>
            <span className="thermal-label text-gray-400 uppercase text-[9px]">Placas:</span>
            <p className="thermal-value font-semibold text-gray-800 border-b border-dotted border-gray-300 leading-tight">{form.placa}</p>
          </div>
          <div>
            <span className="thermal-label text-gray-400 uppercase text-[9px]">Km:</span>
            <p className="thermal-value font-semibold text-gray-800 border-b border-dotted border-gray-300 leading-tight">
              {Number(form.kilometraje).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* ── Condición al ingreso (solo si hay daños) ── */}
      {danos.length > 0 && (
        <div className="thermal-section border-b border-dashed border-gray-300 px-4 py-2">
          <p className="thermal-section-title text-primary font-bold uppercase tracking-widest text-[10px] mb-1.5">Condición al ingreso</p>
          <div className="thermal-grid grid grid-cols-2 gap-x-4 gap-y-0.5">
            {danos.map(([k, v]) => {
              const [vid, ...zParts] = k.split('::');
              const zid = zParts.join('::');
              const vistaLabel = VISTAS.find(vv => vv.id === vid)?.label || vid;
              return (
                <div key={k} className="flex items-center gap-1.5 text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: EC[v]?.dot || '#999' }} />
                  <span className="text-gray-500">{vistaLabel} —</span>
                  <span className="text-gray-700">{ZONA_LABELS[zid] || zid}</span>
                  <span className="font-bold ml-auto" style={{ color: EC[v]?.dot || '#999' }}>{EC[v]?.label || v}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Trabajos a ordenar ── */}
      <div className="thermal-section border-b border-dashed border-gray-300">
        <div className="thermal-table-head grid grid-cols-12 bg-primary text-white text-[10px] uppercase tracking-widest font-bold px-4 py-1.5">
          <div className="col-span-1 text-center">Cant.</div>
          <div className="col-span-8 pl-2">Descripción del trabajo</div>
          <div className="col-span-3 text-right pr-1">Precio</div>
        </div>
        {serviciosConPrecio.map((s, i) => (
          <div
            key={i}
            className={`grid grid-cols-12 px-4 py-1.5 border-b border-dotted border-gray-200 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
          >
            <div className="col-span-1 text-center font-bold text-gray-700">1</div>
            <div className="col-span-8 pl-2 text-gray-800 font-medium">{s.nombre}</div>
            <div className="col-span-3 text-right pr-1 font-bold text-gray-700">{formatQ(s.precio)}</div>
          </div>
        ))}
        {Array.from({ length: Math.max(0, 3 - serviciosConPrecio.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="grid grid-cols-12 px-4 py-1.5 border-b border-dotted border-gray-200">
            <div className="col-span-1 text-center text-gray-200">—</div>
            <div className="col-span-8" />
            <div className="col-span-3" />
          </div>
        ))}
        {/* ── Subtotal / Total ── */}
        <div className="px-4 py-1.5 border-t border-gray-300">
          <div className="flex justify-between text-[11px] text-gray-600">
            <span className="font-semibold uppercase tracking-wider">Subtotal:</span>
            <span className="font-bold">{formatQ(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-primary mt-1 pt-1 border-t border-dashed border-gray-300">
            <span className="font-black uppercase tracking-widest">TOTAL:</span>
            <span className="font-black text-accent text-base">{formatQ(total)}</span>
          </div>
        </div>
      </div>

      {/* ── Observaciones + Firma en una fila ── */}
      <div className="px-4 py-2 grid grid-cols-2 gap-x-6">
        <div>
          <span className="thermal-label text-gray-400 uppercase text-[9px]">Observaciones:</span>
          <p className="thermal-value text-gray-800 border-b border-dotted border-gray-300 leading-tight min-h-[14px] mt-0.5">
            {form.observaciones || ''}
          </p>
          <div className="border-b border-dotted border-gray-200 mt-1 min-h-[14px]" />
        </div>
        <div className="thermal-firma flex flex-col justify-end gap-2">
          <div>
            <span className="thermal-label text-gray-400 uppercase text-[9px]">Aceptación cliente (F):</span>
            <div className="thermal-firma-line border-b border-gray-400 mt-2" />
          </div>
          <div>
            <span className="thermal-label text-gray-400 uppercase text-[9px]">Nombre:</span>
            <div className="thermal-firma-line border-b border-gray-400 mt-2" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const DRAFT_KEY = 'drivebot_draft';

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

// ── ClienteCombobox ──────────────────────────────────────────────────────────
function ClienteCombobox({ clientes, onSelect }) {
  const [query, setQuery] = useState('');
  const [open, setOpen]   = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query.trim()
    ? clientes.filter(c =>
        c.nombre.toLowerCase().includes(query.toLowerCase()) ||
        c.telefono.includes(query)
      )
    : clientes;

  const select = (c) => {
    onSelect(c);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          autoComplete="off"
          placeholder="Buscar por nombre o teléfono…"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          className="w-full rounded-lg pl-9 pr-3 py-2.5 bg-slate-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
        />
      </div>
      {open && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-400 italic">Sin resultados</li>
          ) : (
            filtered.map(c => (
              <li
                key={c.id}
                onMouseDown={() => select(c)}
                className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-slate-100"
              >
                <span className="font-medium text-gray-800">{c.nombre}</span>
                <span className="text-xs text-gray-400 ml-2">{c.telefono}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default function NuevaSolicitud() {
  const { marcas: MARCAS, servicios: CATEGORIAS_SERVICIOS, preciosMap: PRECIOS, tiposDano, mecanicos, clientes, agregarCliente } = useCatalogos();
  const { agregarSolicitud } = useSolicitudes();
  const draft = loadDraft();
  const [step, setStep] = useState(() => draft?.step ?? 1);
  const [form, setForm] = useState(() => draft?.form ?? initialState);
  const [errores, setErrores] = useState({});
  const [ordenNum, setOrdenNum] = useState(() => draft?.ordenNum ?? genOrden());
  const [clienteSeleccionado, setClienteSeleccionado] = useState(false);

  // Persistir borrador en cada cambio
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step, ordenNum }));
  }, [form, step, ordenNum]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setForm((prev) => ({
        ...prev,
        adicionales: checked
          ? [...prev.adicionales, value]
          : prev.adicionales.filter((v) => v !== value),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
        ...(name === 'marca' ? { modelo: '' } : {}),
      }));
      if (errores[name]) setErrores((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleInspeccion = (zonaId, estado) => {
    setForm((prev) => ({
      ...prev,
      inspeccion: { ...prev.inspeccion, [zonaId]: estado },
    }));
  };

  const validarPaso = (paso) => {
    const e = {};
    if (paso === 2) {
      if (!form.nombre.trim()) e.nombre = 'Nombre requerido';
      const tel = String(form.telefono ?? '').replace(/\D/g, '');
      if (!tel) {
        e.telefono = 'Teléfono requerido';
      } else if (tel.length !== 8) {
        e.telefono = 'El teléfono debe tener exactamente 8 dígitos';
      }
    }
    if (paso === 3) {
      if (!form.marca) e.marca = 'Marca requerida';
      if (!form.anio) {
        e.anio = 'Año requerido';
      } else if (!/^\d{4}$/.test(form.anio) || +form.anio < 1900 || +form.anio > new Date().getFullYear() + 1) {
        e.anio = 'Año no válido';
      }
      if (!form.modelo) e.modelo = 'Modelo requerido';
      if (!form.placa.trim()) {
        e.placa = 'Placa requerida';
      } else {
        // Normalizar: quitar guiones, espacios y pasar a mayúsculas
        const placaNorm = form.placa.trim().replace(/[\s-]/g, '').toUpperCase();
        // Formatos válidos Guatemala:
        //   Estándar civil:   3 letras + 3 dígitos  → ABC123
        //   Con año:         3 letras + 4 dígitos   → ABC1234
        //   Moto / especial: 1–2 letras + 3–6 díg  → P123456, M1234
        if (!/^[A-Z]{1,3}\d{3,6}$/.test(placaNorm)) {
          e.placa = 'Placa no válida — ej: ABC123 o ABC-1234';
        }
      }
      if (!form.kilometraje) {
        e.kilometraje = 'Kilometraje requerido';
      } else if (isNaN(form.kilometraje) || +form.kilometraje < 0) {
        e.kilometraje = 'Kilometraje no válido';
      }
    }
    if (paso === 4) {
      if (!form.tipoServicio) e.tipoServicio = 'Selecciona un tipo de servicio';
    }
    return e;
  };

  const handleNext = () => {
    const e = validarPaso(step);
    if (Object.keys(e).length > 0) { setErrores(e); return; }
    setErrores({});

    if (step === 2 && !clienteSeleccionado) {
      const existe = clientes.some(
        c => c.nombre.trim().toLowerCase() === form.nombre.trim().toLowerCase()
      );
      if (!existe) {
        toast((t) => (
          <div className="flex flex-col gap-3" style={{ minWidth: 240 }}>
            <div>
              <p className="font-bold text-slate-800 text-sm">¿Guardar como nuevo cliente?</p>
              <p className="text-xs text-slate-500 mt-0.5">{form.nombre.trim()} · {form.telefono.trim()}</p>
            </div>
            <div className="flex gap-2">
              <button
                onMouseDown={() => {
                  agregarCliente({ nombre: form.nombre.trim(), telefono: form.telefono.trim() });
                  toast.dismiss(t.id);
                  toast.success('Cliente guardado en el catálogo');
                  setClienteSeleccionado(true);
                  setStep(s => s + 1);
                }}
                className="flex-1 bg-primary text-white text-xs font-semibold py-1.5 px-3 rounded-lg hover:bg-[#162048] transition"
              >
                Sí, guardar
              </button>
              <button
                onMouseDown={() => { toast.dismiss(t.id); setStep(s => s + 1); }}
                className="flex-1 border border-gray-200 text-slate-600 text-xs font-semibold py-1.5 px-3 rounded-lg hover:bg-slate-50 transition"
              >
                Solo esta vez
              </button>
            </div>
          </div>
        ), { duration: Infinity });
        return;
      }
    }

    setStep((s) => s + 1);
  };

  const handleBack = () => { setErrores({}); setStep((s) => s - 1); };

  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async () => {
    if (guardando) return;
    setGuardando(true);
    try {
      const servicioFinal = [form.tipoServicio, ...form.adicionales].filter(Boolean).join(', ');
      const lc = (s) => (s || '').toLowerCase();
      const datos = {
        fecha:    new Date().toISOString().slice(0, 10),
        cliente:  lc(form.nombre),
        vehiculo: lc(`${form.marca} ${form.modelo} ${form.anio}`),
        placa:    form.placa.trim().replace(/[\s-]/g, '').toUpperCase(),
        servicio: lc(servicioFinal),
        estado:   'Pendiente',
        notas:    lc(form.observaciones || ''),
        precio:   0,
        mecanico: null,
      };
      console.log('[NuevaSolicitud] enviando:', datos);
      await agregarSolicitud(datos);
      localStorage.removeItem(DRAFT_KEY);
      setForm(initialState);
      setOrdenNum(genOrden());
      setStep(1);
      toast.success('¡Solicitud registrada exitosamente!');
    } catch (err) {
      console.error('[NuevaSolicitud] error:', err);
      toast.error(`Error: ${err.message || 'No se pudo guardar la solicitud'}`);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="flex items-start justify-center px-2 sm:px-4 py-4 sm:py-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-4 sm:mb-6 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-primary">Nueva Solicitud</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Paso {step} de {STEPS.length} — {STEPS[step - 1].label}
          </p>
        </div>

        <StepIndicator current={step} />

        <div className={step === 5 ? '' : 'bg-white rounded-2xl shadow-sm border border-slate-100'}>

          {/* ── PASO 1: Inspección ── */}
          {step === 1 && (
            <InspeccionVehiculo inspeccion={form.inspeccion} onChange={handleInspeccion} tiposDano={tiposDano} />
          )}

          {/* ── PASO 2: Cliente ── */}
          {step === 2 && (
            <div className="px-6 sm:px-8 py-7 space-y-5">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-accent">Datos del cliente</h3>

              {/* Búsqueda de cliente existente */}
              {clientes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Buscar cliente existente
                  </label>
                  <ClienteCombobox
                    clientes={clientes}
                    onSelect={(c) => {
                      setForm(p => ({
                        ...p,
                        nombre:   c.nombre ?? '',
                        telefono: String(c.telefono ?? '').replace(/\D/g, '').slice(0, 8),
                      }));
                      setClienteSeleccionado(true);
                      setErrores({});
                    }}
                  />
                  {clienteSeleccionado && (
                    <p className="mt-1.5 text-xs text-green-600 font-medium flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Cliente cargado del catálogo
                    </p>
                  )}
                </div>
              )}

              {/* Separador */}
              {clientes.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-slate-200" />
                  <span className="text-xs text-slate-400 whitespace-nowrap">o ingresa manualmente</span>
                  <div className="flex-1 border-t border-slate-200" />
                </div>
              )}

              {/* Campos manuales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="nombre" className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
                  <input
                    id="nombre" name="nombre" type="text"
                    value={form.nombre}
                    onChange={e => { handleChange(e); setClienteSeleccionado(false); }}
                    placeholder="Juan García"
                    className={inputCls(errores.nombre)}
                  />
                  {errores.nombre && <p className="mt-1 text-xs text-red-500">{errores.nombre}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="telefono" className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                  <input
                    id="telefono" name="telefono" type="number"
                    value={form.telefono}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                      setForm(p => ({ ...p, telefono: val }));
                      setClienteSeleccionado(false);
                      if (errores.telefono) setErrores(p => ({ ...p, telefono: '' }));
                    }}
                    placeholder="12345678"
                    className={inputCls(errores.telefono)}
                  />
                  {errores.telefono
                    ? <p className="mt-1 text-xs text-red-500">{errores.telefono}</p>
                    : <p className="mt-1 text-xs text-slate-400">8 dígitos sin espacios ni guiones</p>
                  }
                </div>
              </div>
            </div>
          )}

          {/* ── PASO 3: Vehículo ── */}
          {step === 3 && (
            <div className="px-6 sm:px-8 py-7 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">Datos del vehículo</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Marca */}
                <div>
                  <label htmlFor="marca" className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                  <Combobox
                    id="marca"
                    value={form.marca}
                    options={Object.keys(MARCAS)}
                    placeholder="Buscar marca…"
                    error={errores.marca}
                    onChange={v => {
                      setForm(p => ({ ...p, marca: v, modelo: '' }));
                      if (errores.marca) setErrores(p => ({ ...p, marca: '' }));
                    }}
                  />
                  {errores.marca && <p className="mt-1 text-xs text-red-500">{errores.marca}</p>}
                </div>
                {/* 2. Año */}
                <div>
                  <label htmlFor="anio" className="block text-sm font-medium text-slate-700 mb-1">Año</label>
                  <input
                    id="anio" name="anio" type="number"
                    min="1900" max={new Date().getFullYear() + 1}
                    value={form.anio}
                    onChange={e => {
                      const v = e.target.value;
                      setForm(p => ({ ...p, anio: v, modelo: '' }));
                      if (errores.anio) setErrores(p => ({ ...p, anio: '' }));
                    }}
                    placeholder="2020"
                    className={inputCls(errores.anio)}
                  />
                  {errores.anio && <p className="mt-1 text-xs text-red-500">{errores.anio}</p>}
                </div>
                {/* 3. Modelo — filtrado por marca + año */}
                {(() => {
                  const anioNum = +form.anio;
                  const anioValido = form.anio && /^\d{4}$/.test(form.anio) && anioNum >= 1900 && anioNum <= new Date().getFullYear() + 1;
                  const modelosDisponibles = form.marca && anioValido
                    ? Object.entries(MARCAS[form.marca] || {})
                        .filter(([, { desde, hasta }]) => anioNum >= desde && anioNum <= (hasta ?? new Date().getFullYear() + 1))
                        .map(([nombre]) => nombre)
                    : [];
                  const disabledModelo = !form.marca || !anioValido;
                  const hintModelo = !form.marca
                    ? 'Selecciona una marca primero'
                    : !anioValido
                      ? 'Ingresa el año primero'
                      : modelosDisponibles.length === 0
                        ? 'Sin modelos para ese año'
                        : null;
                  return (
                    <div>
                      <label htmlFor="modelo" className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
                      <Combobox
                        id="modelo"
                        value={form.modelo}
                        options={modelosDisponibles}
                        placeholder="Buscar modelo…"
                        error={errores.modelo}
                        disabled={disabledModelo || modelosDisponibles.length === 0}
                        onChange={v => {
                          setForm(p => ({ ...p, modelo: v }));
                          if (errores.modelo) setErrores(p => ({ ...p, modelo: '' }));
                        }}
                      />
                      {errores.modelo
                        ? <p className="mt-1 text-xs text-red-500">{errores.modelo}</p>
                        : hintModelo && <p className="mt-1 text-xs text-slate-400 italic">{hintModelo}</p>
                      }
                    </div>
                  );
                })()}
                <div>
                  <label htmlFor="placa" className="block text-sm font-medium text-slate-700 mb-1">Placa</label>
                  <input
                    id="placa" name="placa" type="text"
                    value={form.placa}
                    onChange={e => {
                      const v = e.target.value.toUpperCase();
                      setForm(p => ({ ...p, placa: v }));
                      if (errores.placa) setErrores(p => ({ ...p, placa: '' }));
                    }}
                    placeholder="ABC-1234"
                    className={inputCls(errores.placa)}
                  />
                  {errores.placa && <p className="mt-1 text-xs text-red-500">{errores.placa}</p>}
                </div>
                <div>
                  <label htmlFor="kilometraje" className="block text-sm font-medium text-slate-700 mb-1">Kilometraje</label>
                  <input id="kilometraje" name="kilometraje" type="number" min="0" value={form.kilometraje} onChange={handleChange} placeholder="45000" className={inputCls(errores.kilometraje)} />
                  {errores.kilometraje && <p className="mt-1 text-xs text-red-500">{errores.kilometraje}</p>}
                </div>
              </div>
            </div>
          )}

          {/* ── PASO 4: Servicio ── */}
          {step === 4 && (
            <div className="px-6 sm:px-8 py-7 space-y-5">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">Servicio</h3>
              <div>
                <label htmlFor="tipoServicio" className="block text-sm font-medium text-slate-700 mb-1">Tipo de servicio principal</label>
                <select id="tipoServicio" name="tipoServicio" value={form.tipoServicio} onChange={handleChange} className={inputCls(errores.tipoServicio)}>
                  <option value="">Selecciona una opción</option>
                  {CATEGORIAS_SERVICIOS.map((cat) => (
                    <optgroup key={cat.categoria} label={cat.categoria}>
                      {cat.servicios.map((s) => <option key={s.nombre} value={s.nombre}>{s.nombre} — {formatQ(s.precio)}</option>)}
                    </optgroup>
                  ))}
                </select>
                {errores.tipoServicio && <p className="mt-1 text-xs text-red-500">{errores.tipoServicio}</p>}
              </div>
              <div>
                <p className="block text-sm font-medium text-slate-700 mb-2">
                  Servicios adicionales <span className="text-gray-400 font-normal">(opcional)</span>
                </p>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {CATEGORIAS_SERVICIOS.map((cat) => {
                    const selCount = cat.servicios.filter(s => form.adicionales.includes(s.nombre)).length;
                    return (
                      <details key={cat.categoria} className="group">
                        <summary className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-primary select-none py-1.5 px-2 rounded-lg hover:bg-slate-100 transition">
                          <CategoryIcon name={cat.icon} className="w-4 h-4" />
                          <span>{cat.categoria}</span>
                          <span className="ml-auto text-xs text-slate-400 group-open:hidden">{selCount > 0 ? `${selCount} sel.` : ''}</span>
                          <svg className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </summary>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1.5 pl-2">
                          {cat.servicios.map((serv) => (
                            <label key={serv.nombre} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition text-xs ${form.adicionales.includes(serv.nombre) ? 'border-accent bg-red-50 text-red-700' : 'border-gray-200 bg-slate-50 text-gray-600 hover:border-red-300'}`}>
                              <input type="checkbox" name="adicionales" value={serv.nombre} checked={form.adicionales.includes(serv.nombre)} onChange={handleChange} className="w-3.5 h-3.5 accent-red-600 flex-shrink-0" />
                              <span className="font-medium leading-tight flex-1">{serv.nombre}</span>
                              <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{formatQ(serv.precio)}</span>
                            </label>
                          ))}
                        </div>
                      </details>
                    );
                  })}
                </div>
              </div>
              <div>
                <label htmlFor="mecanico" className="block text-sm font-medium text-slate-700 mb-1">Mecánico asignado <span className="text-gray-400 font-normal">(opcional)</span></label>
                <select id="mecanico" name="mecanico" value={form.mecanico} onChange={handleChange} className={inputCls()}>
                  <option value="">Sin asignar</option>
                  {mecanicos.filter(m => m.activo).map((m) => (
                    <option key={m.id} value={m.nombre}>{m.nombre} — {m.especialidad}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="observaciones" className="block text-sm font-medium text-slate-700 mb-1">
                  Observaciones <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea id="observaciones" name="observaciones" value={form.observaciones} onChange={handleChange} rows={3} placeholder="Describe cualquier detalle adicional..." className="w-full rounded-lg px-3 py-2.5 bg-slate-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition resize-none" />
              </div>

              {/* ── Resumen de precio en vivo ── */}
              {(() => {
                const selNombres = [form.tipoServicio, ...form.adicionales].filter(Boolean);
                if (selNombres.length === 0) return null;
                const items = selNombres.map((n) => ({ nombre: n, precio: PRECIOS[n] || 0 }));
                const sub = items.reduce((s, i) => s + i.precio, 0);
                return (
                  <div className="bg-slate-50 border border-gray-200 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Resumen de servicios</p>
                    <div className="space-y-1">
                      {items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-slate-600 truncate mr-2">{it.nombre}</span>
                          <span className="font-semibold text-slate-700 whitespace-nowrap">{formatQ(it.precio)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-300 text-sm">
                      <span className="font-bold text-primary uppercase">Total estimado:</span>
                      <span className="font-black text-accent text-lg">{formatQ(sub)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── PASO 5: Resumen ── */}
          {step === 5 && (
            <div id="print-area" className="mx-4 sm:mx-8 my-4">
              <style>{`
                @media print {
                  @page { size: 150mm auto; margin: 8mm 10mm; }

                  body * { visibility: hidden !important; }
                  #print-area, #print-area * { visibility: visible !important; }

                  #print-area {
                    position: fixed; inset: 0;
                    width: 138mm; background: white;
                    font-family: 'Courier New', monospace;
                    font-size: 9.5pt; color: #000;
                  }

                  /* Encabezado */
                  #print-area .thermal-header {
                    display: flex; justify-content: space-between;
                    align-items: flex-start; border-bottom: 1.5px solid #000;
                    padding-bottom: 5px; margin-bottom: 5px;
                  }
                  #print-area .thermal-logo { height: 38px !important; }

                  /* Eliminar fondos de color — tabla de servicios */
                  #print-area .thermal-table-head {
                    background: white !important; color: black !important;
                    border-top: 1.5px solid #000; border-bottom: 1.5px solid #000;
                    font-weight: bold; font-size: 8pt;
                  }

                  /* Secciones */
                  #print-area .thermal-section {
                    border-bottom: 1px dashed #666;
                    padding: 4px 0; margin-bottom: 3px;
                  }
                  #print-area .thermal-section-title {
                    font-size: 8pt; font-weight: bold;
                    text-transform: uppercase; letter-spacing: 0.5px;
                    margin-bottom: 3px; color: #000;
                  }

                  /* Grids de datos */
                  #print-area .thermal-grid {
                    display: grid; grid-template-columns: 1fr 1fr; gap: 2px 10px;
                  }
                  #print-area .thermal-grid-3 {
                    display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2px 8px;
                  }
                  #print-area .thermal-label {
                    font-size: 7.5pt; text-transform: uppercase; color: #444;
                  }
                  #print-area .thermal-value {
                    font-size: 9.5pt; font-weight: bold;
                    border-bottom: 1px dotted #999; min-height: 13px;
                  }

                  /* Filas de servicios sin color */
                  #print-area .thermal-row-even { background: white !important; }
                  #print-area .thermal-row-odd  { background: white !important; }

                  /* Número de orden */
                  #print-area .thermal-orden-num {
                    font-size: 14pt; font-weight: 900;
                  }

                  /* Firma */
                  #print-area .thermal-firma {
                    display: flex; justify-content: space-between;
                    padding-top: 6px; font-size: 8pt;
                  }
                  #print-area .thermal-firma-line {
                    border-bottom: 1px solid #000; width: 50mm; margin-top: 10px;
                  }
                }
              `}</style>
              <OrdenTrabajo form={form} ordenNum={ordenNum} preciosMap={PRECIOS} tiposDano={tiposDano} />
            </div>
          )}
        </div>

        {/* ── Navegación ── */}
        <div className={`mt-4 flex ${step > 1 ? 'justify-between' : 'justify-end'} gap-2`}>
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 font-medium text-sm transition shadow-sm min-h-[44px]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Anterior
            </button>
          )}

          {step < 5 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 sm:gap-2 bg-accent hover:bg-red-700 active:bg-red-800 text-white font-semibold px-5 sm:px-6 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all duration-150 min-h-[44px]"
            >
              Siguiente
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button
                onClick={() => {
                  const prev = document.title;
                  document.title = `Orden-${ordenNum} ${form.nombre}`.trim();
                  window.print();
                  document.title = prev;
                }}
                className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 font-medium text-sm transition shadow-sm min-h-[44px]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" />
                </svg>
                Imprimir
              </button>
              <button
                onClick={handleSubmit}
                disabled={guardando}
                className="flex items-center gap-2 bg-primary hover:bg-[#162048] text-white font-semibold px-5 sm:px-6 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
              >
                {guardando ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Guardando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Confirmar registro
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
