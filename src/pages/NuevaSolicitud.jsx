import { useState, useRef, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { api } from '../services/sheetsApi';
import logo from '../imagenes/logoMecanica.png';
import { formatQ, CategoryIcon } from '../data/servicios';
import { useCatalogos } from '../context/CatalogosContext';
import { useSolicitudes } from '../context/SolicitudesContext';
import { usePagos } from '../context/PagosContext';
import { isFeatureEnabled } from '../config/rbac';
import { useLockedModal } from '../hooks/useLockedModal';
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
  cliente_id: '',
  vehiculo_id: '', // id del vehículo existente seleccionado; '' = vehículo nuevo
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
  fotos: [],
  preciosManuales: {},
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
function Combobox({ id, value, onChange, options, placeholder, error, disabled, allowFreeText }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const filtered = query.trim()
    ? options.filter(o => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        // Al perder foco: si allowFreeText y hay texto escrito, confirmar como valor
        if (allowFreeText && query.trim()) {
          onChange(query.trim());
          setQuery('');
        }
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [allowFreeText, query, onChange]);

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
        onKeyDown={e => {
          if (e.key === 'Enter' && allowFreeText && query.trim()) {
            onChange(query.trim()); setQuery(''); setOpen(false); e.preventDefault();
          }
        }}
        className={inputCls2}
      />
      {/* chevron */}
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </span>
      {open && (filtered.length > 0 || (allowFreeText && query.trim())) && (
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
          {allowFreeText && query.trim() && !filtered.some(o => o.toLowerCase() === query.trim().toLowerCase()) && (
            <li
              onMouseDown={() => select(query.trim())}
              className="flex items-center gap-2 px-3 py-2.5 text-sm cursor-pointer border-t border-gray-100 text-accent hover:bg-red-50 font-medium"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Usar "{query.trim()}"
            </li>
          )}
        </ul>
      )}
      {open && filtered.length === 0 && !allowFreeText && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm text-gray-400 italic">
          Sin resultados
        </div>
      )}
    </div>
  );
}

// ── StepIndicator ───────────────────────────────────────────────────────────
function StepIndicator({ current }) {
  const pct = ((current - 1) / (STEPS.length - 1)) * 100;
  return (
    <div className="mb-8">
      {/* Barra de progreso */}
      <div className="h-1 bg-gray-200 rounded-full mb-5 mx-4">
        <div
          className="h-full bg-accent rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {/* Círculos de paso */}
      <div className="flex items-center justify-center">
        {STEPS.map((s, i) => {
          const idx = i + 1;
          const done = current > idx;
          const active = current === idx;
          return (
            <div key={s.label} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    done    ? 'bg-primary text-white'
                    : active ? 'bg-accent text-white shadow-lg ring-4 ring-accent/20 scale-110'
                             : 'border-2 border-gray-300 text-gray-400 bg-white'
                  }`}
                >
                  {done ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : idx}
                </div>
                <span className={`text-xs font-medium hidden sm:block transition-colors ${active ? 'text-accent font-bold' : done ? 'text-primary' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-7 sm:w-12 mx-1 sm:mx-2 mb-4 transition-all duration-500 ${current > idx ? 'bg-primary' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>
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
function OrdenTrabajo({ form, ordenNum, tiposDano, onPrecioChange }) {
  const fecha = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const horaEntrada = new Date().toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', hour12: true });
  const serviciosNombres = [form.tipoServicio, ...form.adicionales].filter(Boolean);
  const serviciosConPrecio = serviciosNombres.map((n) => ({ nombre: n, precio: form.preciosManuales[n] || 0 }));
  const subtotal = serviciosConPrecio.reduce((sum, s) => sum + s.precio, 0);
  const total = subtotal;
  const danos = Object.entries(form.inspeccion).filter(([, v]) => v);

  // Construir config de tipos de daño desde catálogo
  const EC = {};
  (tiposDano || []).forEach(t => { EC[t.clave] = { fill: t.fill, stroke: t.stroke, dot: t.dot, label: t.label }; });
  if (Object.keys(EC).length === 0) Object.assign(EC, ESTADO_CONFIG_DEFAULT);

  return (
    <div className="bg-white border border-gray-300 rounded-none select-none text-sm w-full" style={{ fontFamily: "'Courier New', monospace", maxWidth: '480px' }}>

      {/* ── Encabezado ── */}
      <div className="thermal-header border-b border-gray-400 px-2 py-1.5 flex items-center justify-between gap-2">
        <img src={logo} alt="AUTO+" className="thermal-logo h-8 object-contain" />
        <div className="text-right leading-tight">
          <p className="thermal-label text-xs print:text-[8px] text-gray-500 uppercase tracking-wider">Orden de Trabajo</p>
          <p className="thermal-orden-num text-accent font-black text-2xl print:text-lg tracking-wide">No. {ordenNum}</p>
          <p className="thermal-label text-gray-500 text-xs print:text-[8px]">{fecha} · {horaEntrada}</p>
        </div>
      </div>

      {/* ── Cliente ── */}
      <div className="thermal-section border-b border-dashed border-gray-300 px-2 py-1">
        <p className="thermal-section-title text-primary font-bold uppercase tracking-widest text-xs print:text-[8px] mb-1">Cliente</p>
        <div className="space-y-1">
          <div>
            <span className="thermal-label text-gray-400 uppercase text-[11px] print:text-[7px]">Nombre: </span>
            <span className="thermal-value font-semibold text-gray-800 text-sm print:text-[10px]">{form.nombre}</span>
          </div>
          <div>
            <span className="thermal-label text-gray-400 uppercase text-[11px] print:text-[7px]">Tel: </span>
            <span className="thermal-value font-semibold text-gray-800 text-sm print:text-[10px]">{form.telefono}</span>
          </div>
          {form.mecanico && (
            <div>
              <span className="thermal-label text-gray-400 uppercase text-[11px] print:text-[7px]">Técnico: </span>
              <span className="thermal-value font-semibold text-gray-800 text-sm print:text-[10px]">{form.mecanico}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Vehículo ── */}
      <div className="thermal-section border-b border-dashed border-gray-300 px-2 py-1">
        <p className="thermal-section-title text-primary font-bold uppercase tracking-widest text-xs print:text-[8px] mb-1">Vehículo</p>
        <div className="thermal-grid-3 grid grid-cols-2 gap-x-3 gap-y-1">
          <div>
            <span className="thermal-label text-gray-400 uppercase text-[11px] print:text-[7px]">Marca: </span>
            <span className="thermal-value font-semibold text-gray-800 text-sm print:text-[10px]">{form.marca}</span>
          </div>
          <div>
            <span className="thermal-label text-gray-400 uppercase text-[11px] print:text-[7px]">Modelo: </span>
            <span className="thermal-value font-semibold text-gray-800 text-sm print:text-[10px]">{form.modelo}</span>
          </div>
          <div>
            <span className="thermal-label text-gray-400 uppercase text-[11px] print:text-[7px]">Año: </span>
            <span className="thermal-value font-semibold text-gray-800 text-sm print:text-[10px]">{form.anio}</span>
          </div>
          <div>
            <span className="thermal-label text-gray-400 uppercase text-[11px] print:text-[7px]">Placa: </span>
            <span className="thermal-value font-semibold text-gray-800 text-sm print:text-[10px]">{form.placa || '—'}</span>
          </div>
          {form.kilometraje && (
            <div className="col-span-2">
              <span className="thermal-label text-gray-400 uppercase text-[11px] print:text-[7px]">Km: </span>
              <span className="thermal-value font-semibold text-gray-800 text-sm print:text-[10px]">{Number(form.kilometraje).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Condición al ingreso (solo si hay daños) ── */}
      {danos.length > 0 && (
        <div className="thermal-section border-b border-dashed border-gray-300 px-2 py-1">
          <p className="thermal-section-title text-primary font-bold uppercase tracking-widest text-xs print:text-[8px] mb-1">Condición al ingreso</p>
          <div className="thermal-grid space-y-1">
            {danos.map(([k, v]) => {
              const [vid, ...zParts] = k.split('::');
              const zid = zParts.join('::');
              const vistaLabel = VISTAS.find(vv => vv.id === vid)?.label || vid;
              return (
                <div key={k} className="flex items-center gap-1.5 text-xs print:text-[8px]">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: EC[v]?.dot || '#999' }} />
                  <span className="text-gray-500">{vistaLabel} — {ZONA_LABELS[zid] || zid}</span>
                  <span className="font-bold ml-auto" style={{ color: EC[v]?.dot || '#999' }}>{EC[v]?.label || v}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Trabajos ── */}
      <div className="thermal-section border-b border-dashed border-gray-300">
        <div className="thermal-table-head flex justify-between bg-primary text-white text-xs print:text-[7px] uppercase font-bold px-2 py-1.5 print:py-1">
          <span>Descripción</span>
          <span>Precio</span>
        </div>
        {serviciosConPrecio.map((s, i) => (
          <div key={i} className="thermal-serv-row flex items-center justify-between px-2 py-1.5 print:py-1 border-b border-dotted border-gray-200">
            <span className="text-gray-800 font-medium text-sm print:text-[9px] flex-1 pr-1">{s.nombre}</span>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <span className="text-gray-400 text-xs print:text-[8px]">Q</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={s.precio || ''}
                onChange={(e) => onPrecioChange(s.nombre, parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-20 print:w-16 text-right font-bold text-gray-700 bg-transparent border-b border-dashed border-gray-400 focus:border-accent focus:outline-none py-0 text-sm print:text-[9px] print:border-none"
              />
            </div>
          </div>
        ))}
        {/* Total */}
        <div className="px-2 py-1.5 print:py-1 border-t border-gray-400">
          <div className="flex justify-between text-sm print:text-[9px] text-gray-600 mb-0.5">
            <span className="font-semibold uppercase">Subtotal:</span>
            <span className="font-bold">{formatQ(subtotal)}</span>
          </div>
          <div className="flex justify-between text-base print:text-[11px] font-black text-primary border-t border-dashed border-gray-300 pt-0.5">
            <span className="uppercase">TOTAL:</span>
            <span className="text-accent">{formatQ(total)}</span>
          </div>
        </div>
      </div>

      {/* ── Observaciones ── */}
      {form.observaciones && (
        <div className="px-2 py-1 border-b border-dashed border-gray-300">
          <span className="thermal-label text-gray-400 uppercase text-[11px] print:text-[7px]">Obs.: </span>
          <span className="text-gray-800 text-xs print:text-[8px]">{form.observaciones}</span>
        </div>
      )}

      {/* ── Firma ── */}
      <div className="thermal-firma px-2 py-2 space-y-3">
        <div>
          <span className="thermal-label text-gray-400 uppercase text-[11px] print:text-[7px]">Firma / Aceptación:</span>
          <div className="thermal-firma-line border-b border-gray-400 mt-6 print:mt-4 w-full" />
        </div>
        <div>
          <span className="thermal-label text-gray-400 uppercase text-[11px] print:text-[7px]">Nombre:</span>
          <div className="thermal-firma-line border-b border-gray-400 mt-4 w-full" />
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
    const parsed = JSON.parse(raw);
    // Merge con initialState para asegurar campos nuevos en borradores viejos
    if (parsed?.form) {
      parsed.form = { ...initialState, ...parsed.form };
      // Limpiar entradas null/undefined de inspeccion para evitar zonas fantasma
      if (parsed.form.inspeccion && typeof parsed.form.inspeccion === 'object') {
        parsed.form.inspeccion = Object.fromEntries(
          Object.entries(parsed.form.inspeccion).filter(([, v]) => v != null)
        );
      }
    }
    return parsed;
  } catch { return null; }
}

// ── FotoUploader ─────────────────────────────────────────────────────────────
function FotoUploader({ fotos = [], onChange }) {
  const fotosEnabled = isFeatureEnabled('fotos');
  const { showLocked, LockedModal } = useLockedModal();

  const [subiendo, setSubiendo] = useState({});
  const inputGaleriaRef = useRef(null);
  const inputCamaraRef  = useRef(null);

  const handleFiles = useCallback(async (files) => {
    const nuevas = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!nuevas.length) return;
    const disponibles = 10 - fotos.length;
    if (disponibles <= 0) {
      toast.error('Límite máximo de 10 fotos alcanzado');
      return;
    }
    const aSubir = nuevas.slice(0, disponibles);
    if (nuevas.length > disponibles) {
      toast.error(`Solo se subirán ${disponibles} foto(s). Límite máximo: 10`);
    }
    for (const file of aSubir) {
      const key = `${file.name}_${file.size}`;
      setSubiendo(p => ({ ...p, [key]: true }));
      try {
        const { url } = await api.subirFoto(file);
        onChange(prev => [...prev, { nombre: file.name, url }]);
      } catch (err) {
        toast.error(`No se pudo subir ${file.name}: ${err.message}`);
      } finally {
        setSubiendo(p => { const n = { ...p }; delete n[key]; return n; });
      }
    }
  }, [onChange]);

  const eliminar = (url) => onChange(prev => prev.filter(f => f.url !== url));

  const haySubiendo = Object.keys(subiendo).length > 0;

  if (!fotosEnabled) {
    return (
      <>
        <LockedModal />
        <button
          type="button"
          onClick={() => showLocked('Fotos de solicitud')}
          className="w-full flex items-center justify-center gap-3 border-2 border-dashed border-gray-200 rounded-xl py-5 text-gray-400 hover:border-accent hover:text-accent transition bg-gray-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <span className="text-sm font-medium">Fotos de solicitud — función premium</span>
        </button>
      </>
    );
  }

  return (
    <div className="space-y-3">
      {/* Contador de fotos */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">Fotos adjuntas (opcional)</span>
        <span className={`text-xs font-semibold tabular-nums ${fotos.length >= 10 ? 'text-red-500' : 'text-slate-400'}`}>
          {fotos.length}/10
        </span>
      </div>
      {/* Botones de acción */}
      <div className="grid grid-cols-2 gap-2">
        {/* Tomar foto con cámara */}
        <button
          type="button"
          onClick={() => inputCamaraRef.current?.click()}
          disabled={haySubiendo}
          className="flex items-center justify-center gap-2 border border-gray-200 bg-slate-50 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:border-accent hover:bg-red-50 hover:text-accent transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
          Tomar foto
        </button>

        {/* Seleccionar de galería */}
        <button
          type="button"
          onClick={() => inputGaleriaRef.current?.click()}
          disabled={haySubiendo}
          className="flex items-center justify-center gap-2 border border-gray-200 bg-slate-50 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:border-accent hover:bg-red-50 hover:text-accent transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          Galería / Archivo
        </button>
      </div>

      {/* Inputs ocultos */}
      <input ref={inputCamaraRef}  type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />
      <input ref={inputGaleriaRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />

      {/* Estado de subida */}
      {haySubiendo && (
        <p className="text-xs text-accent font-semibold animate-pulse text-center">
          Subiendo {Object.keys(subiendo).length} foto{Object.keys(subiendo).length > 1 ? 's' : ''}…
        </p>
      )}

      {/* Miniaturas */}
      {fotos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {fotos.map((f) => (
            <div key={f.url} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-slate-100 flex-shrink-0">
              <img src={f.url} alt={f.nombre} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => eliminar(f.url)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ClienteCombobox ──────────────────────────────────────────────────────────
function ClienteCombobox({ clientes, onSelect, onCrear }) {
  const [query, setQuery]       = useState('');
  const [open, setOpen]         = useState(false);
  const [creando, setCreando]   = useState(false);
  const [nuevo, setNuevo]       = useState({ nombre: '', telefono: '', email: '' });
  const [guardando, setGuardando] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query.trim()
    ? clientes.filter(c =>
        c.nombre.toLowerCase().includes(query.toLowerCase()) ||
        String(c.telefono).includes(query)
      )
    : clientes;

  const select = (c) => { onSelect(c); setQuery(''); setOpen(false); setCreando(false); };

  const abrirNuevo = () => {
    setNuevo({ nombre: query.trim(), telefono: '', email: '' });
    setCreando(true);
    setOpen(false);
  };

  const guardarNuevo = async () => {
    if (!nuevo.nombre.trim()) return;
    setGuardando(true);
    try {
      const creado = await onCrear({ nombre: nuevo.nombre.trim(), telefono: nuevo.telefono.trim(), email: nuevo.email.trim() });
      select(creado);
      setCreando(false);
      setNuevo({ nombre: '', telefono: '', email: '' });
    } catch { /* toast handled upstream */ }
    finally { setGuardando(false); }
  };

  return (
    <div ref={ref} className="relative">
      {/* ── Mini-form de nuevo cliente ── */}
      {creando ? (
        <div className="rounded-xl border border-accent/30 bg-red-50 p-4 space-y-3">
          <p className="text-xs font-semibold text-accent uppercase tracking-wide">Nuevo cliente</p>
          <input
            autoFocus
            type="text"
            placeholder="Nombre completo *"
            value={nuevo.nombre}
            onChange={e => setNuevo(p => ({ ...p, nombre: e.target.value }))}
            className="w-full rounded-lg px-3 py-2 text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            type="tel"
            placeholder="Teléfono"
            value={nuevo.telefono}
            onChange={e => setNuevo(p => ({ ...p, telefono: e.target.value }))}
            className="w-full rounded-lg px-3 py-2 text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            type="email"
            placeholder="Email (opcional)"
            value={nuevo.email}
            onChange={e => setNuevo(p => ({ ...p, email: e.target.value }))}
            className="w-full rounded-lg px-3 py-2 text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onMouseDown={guardarNuevo}
              disabled={!nuevo.nombre.trim() || guardando}
              className="flex-1 rounded-lg bg-accent py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition"
            >
              {guardando ? 'Guardando…' : 'Guardar cliente'}
            </button>
            <button
              type="button"
              onMouseDown={() => setCreando(false)}
              className="px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-500 hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
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
              {filtered.map(c => (
                <li
                  key={c.id}
                  onMouseDown={() => select(c)}
                  className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-slate-100"
                >
                  <span className="font-medium text-gray-800">{c.nombre}</span>
                  <span className="text-xs text-gray-400 ml-2">{c.telefono}</span>
                </li>
              ))}
              {/* Siempre al final: opción de crear nuevo */}
              <li
                onMouseDown={abrirNuevo}
                className="flex items-center gap-2 px-3 py-2.5 text-sm cursor-pointer border-t border-gray-100 text-accent hover:bg-red-50 font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {query.trim() ? `Agregar "${query.trim()}" como nuevo cliente` : 'Agregar nuevo cliente'}
              </li>
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default function NuevaSolicitud() {
  const { marcas: MARCAS, servicios: CATEGORIAS_SERVICIOS, preciosMap: PRECIOS, tiposDano, mecanicos, clientes, agregarCliente, vehiculosPorCliente, agregarVehiculo, agregarServicio, agregarCategoria } = useCatalogos();
  const { agregarSolicitud } = useSolicitudes();
  const { agregarPago } = usePagos();
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
      if (form.placa.trim()) {
        const placaNorm = form.placa.trim().replace(/[\s-]/g, '').toUpperCase();
        if (!/^[A-Z]{1,3}\d{3,6}$/.test(placaNorm)) {
          e.placa = 'Placa no válida — ej: ABC123 o ABC-1234';
        }
      }
      if (form.kilometraje && (isNaN(form.kilometraje) || +form.kilometraje < 0)) {
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

    // Paso 3 → 4: guardar vehículo nuevo vinculado al cliente (con confirmación)
    if (step === 3 && form.cliente_id && !form.vehiculo_id) {
      const placaNorm = form.placa.trim().replace(/[\s-]/g, '').toUpperCase();
      toast((t) => (
        <div className="flex flex-col gap-3" style={{ minWidth: 240 }}>
          <div>
            <p className="font-bold text-slate-800 text-sm">¿Guardar vehículo en el catálogo?</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {form.marca} {form.modelo} {form.anio}{placaNorm ? ` · ${placaNorm}` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onMouseDown={async () => {
                toast.dismiss(t.id);
                try {
                  const vid = await agregarVehiculo({
                    cliente_id: form.cliente_id,
                    marca:      form.marca,
                    modelo:     form.modelo,
                    anio:       form.anio,
                    placa:      placaNorm,
                    km:         form.kilometraje || 0,
                  });
                  setForm(p => ({ ...p, vehiculo_id: vid, placa: placaNorm }));
                  toast.success('Vehículo guardado en el catálogo');
                } catch { toast.error('No se pudo guardar el vehículo'); }
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
                  agregarCliente({ nombre: form.nombre.trim(), telefono: form.telefono.trim(), activo: true });
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
  const [nuevoServForm, setNuevoServForm] = useState({ open: false, nombre: '', categoria: '', precio: '' });

  const handleWhatsApp = async () => {
    const el = document.getElementById('print-area');
    if (!el) return;

    // Construir mensaje de resumen
    const serviciosList = [form.tipoServicio, ...form.adicionales].filter(Boolean);
    const total = serviciosList.reduce((sum, n) => sum + (form.preciosManuales[n] || 0), 0);
    const moneda = 'Q';
    const mensaje = [
      `*AUTO+ — Orden de Trabajo No. ${ordenNum}*`,
      `Cliente: ${form.nombre}`,
      `Vehículo: ${form.marca} ${form.modelo} ${form.anio} — Placa: ${form.placa || 'S/P'}`,
      ``,
      `*Servicios:*`,
      ...serviciosList.map(s => `• ${s}${form.preciosManuales[s] ? ` — ${moneda}${Number(form.preciosManuales[s]).toFixed(2)}` : ''}`),
      ``,
      `*Total: ${moneda}${total.toFixed(2)}*`,
      ``,
      `_Gracias por preferirnos._`,
    ].join('\n');

    const toastId = toast.loading('Generando PDF...');
    let pdfBlob;
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ unit: 'mm', format: [150, (canvas.height * 150) / canvas.width] });
      pdf.addImage(imgData, 'PNG', 0, 0, 150, (canvas.height * 150) / canvas.width);
      pdfBlob = pdf.output('blob');
      toast.dismiss(toastId);
    } catch {
      toast.dismiss(toastId);
      toast.error('No se pudo generar el PDF');
      return;
    }

    const fileName = `Orden-${ordenNum}-${form.nombre.trim() || 'cliente'}.pdf`;
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

    // Opción B: Web Share API (móvil) — comparte el PDF directamente
    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      try {
        await navigator.share({ files: [pdfFile], text: mensaje });
      } catch (err) {
        // El usuario canceló el diálogo — no mostrar error
        if (err.name !== 'AbortError') toast.error('No se pudo compartir');
      }
      return;
    }

    // Fallback desktop: descargar PDF + abrir WhatsApp Web con mensaje
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('PDF descargado — adjúntalo en WhatsApp');

    const tel = String(form.telefono ?? '').replace(/\D/g, '');
    const waUrl = tel
      ? `https://wa.me/502${tel}?text=${encodeURIComponent(mensaje)}`
      : `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    setTimeout(() => window.open(waUrl, '_blank'), 800);
  };

  const handleSubmit = async () => {
    if (guardando) return;
    setGuardando(true);
    try {
      const placaNorm = form.placa.trim().replace(/[\s-]/g, '').toUpperCase();

      // Guardar vehículo: solo crear si es nuevo (sin vehiculo_id)
      if (form.cliente_id && !form.vehiculo_id) {
        await agregarVehiculo({
          cliente_id: form.cliente_id,
          marca:      form.marca,
          modelo:     form.modelo,
          anio:       form.anio,
          placa:      placaNorm,
          km:         form.kilometraje || 0,
        });
      }

      const servicioFinal = [form.tipoServicio, ...form.adicionales].filter(Boolean).join(', ');
      const lc = (s) => (s || '').toLowerCase();
      const totalOrden = [form.tipoServicio, ...form.adicionales]
        .filter(Boolean)
        .reduce((sum, n) => sum + (form.preciosManuales[n] || 0), 0);
      const ahora = new Date();
      const horaEntrada = ahora.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', hour12: true });
      const datos = {
        fecha:       ahora.toISOString().slice(0, 10),
        horaEntrada,
        cliente:     lc(form.nombre),
        telefono:    form.telefono,
        cliente_id:  form.cliente_id || '',
        vehiculo:    lc(`${form.marca} ${form.modelo} ${form.anio}`),
        placa:       placaNorm,
        kilometraje: form.kilometraje || 0,
        servicio:    lc(servicioFinal),
        estado:      'Pendiente',
        notas:       lc(form.observaciones || ''),
        precio:      totalOrden,
        mecanico:    null,
        fotos:       form.fotos.map(f => f.url).join(','),
      };
      const solicitudId = await agregarSolicitud(datos);
      // Registrar pago vinculado a la solicitud
      await agregarPago({
        solicitud_id: solicitudId,
        cliente:      lc(form.nombre),
        monto:        totalOrden,
        metodo:       '',
        fecha:        ahora.toISOString().slice(0, 10),
        estado:       'Pendiente',
      });
      localStorage.removeItem(DRAFT_KEY);
      setForm(initialState);
      setOrdenNum(genOrden());
      setStep(1);
      setClienteSeleccionado(false);
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

              {/* Búsqueda / creación de cliente */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Buscar o crear cliente
                </label>
                <ClienteCombobox
                  clientes={clientes.filter(c => c.activo)}
                  onSelect={(c) => {
                    setForm(p => ({
                      ...p,
                      nombre:      c.nombre ?? '',
                      telefono:    String(c.telefono ?? '').replace(/\D/g, '').slice(0, 8),
                      cliente_id:  c.id ?? '',
                      vehiculo_id: '', // limpiar vehículo al cambiar cliente
                    }));
                    setClienteSeleccionado(true);
                    setErrores({});
                  }}
                  onCrear={async (datos) => {
                    const id = await agregarCliente(datos);
                    const creado = { ...datos, id };
                    setForm(p => ({
                      ...p,
                      nombre:      creado.nombre,
                      telefono:    String(creado.telefono ?? '').replace(/\D/g, '').slice(0, 8),
                      cliente_id:  id,
                      vehiculo_id: '',
                    }));
                    setClienteSeleccionado(true);
                    setErrores({});
                    return creado;
                  }}
                />
                {clienteSeleccionado && (
                  <p className="mt-1.5 text-xs text-green-600 font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Cliente seleccionado
                  </p>
                )}
              </div>

              {/* Separador */}
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-slate-200" />
                <span className="text-xs text-slate-400 whitespace-nowrap">o ingresa manualmente</span>
                <div className="flex-1 border-t border-slate-200" />
              </div>

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

              {/* Picker de vehículos anteriores del cliente */}
              {form.cliente_id && vehiculosPorCliente(form.cliente_id).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Vehículos registrados del cliente
                  </label>
                  <div className="flex flex-col gap-2">
                    {vehiculosPorCliente(form.cliente_id).map((v) => {
                      const seleccionado = form.vehiculo_id === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setForm(p => ({
                            ...p,
                            vehiculo_id: v.id,
                            marca:       v.marca  ?? '',
                            modelo:      v.modelo ?? '',
                            anio:        v.anio   ? String(v.anio) : '',
                            placa:       v.placa  ?? '',
                            kilometraje: v.km     ? String(v.km)   : '',
                          }))}
                          className={`flex items-center justify-between w-full rounded-lg border px-4 py-2.5 text-sm transition text-left ${
                            seleccionado
                              ? 'border-accent bg-red-50 ring-1 ring-accent'
                              : 'border-gray-200 bg-slate-50 hover:border-accent hover:bg-red-50'
                          }`}
                        >
                          <span className="font-medium text-gray-800">{v.marca} {v.modelo} {v.anio}</span>
                          <div className="flex items-center gap-2 ml-2">
                            <span className="text-xs text-gray-400">{v.placa}</span>
                            {seleccionado && (
                              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex-1 border-t border-slate-200" />
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, vehiculo_id: '', marca: '', modelo: '', anio: '', placa: '', kilometraje: '' }))}
                      className="text-xs text-slate-400 whitespace-nowrap hover:text-accent transition"
                    >
                      + Usar otro vehículo
                    </button>
                    <div className="flex-1 border-t border-slate-200" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Marca — combobox + escritura libre */}
                <div>
                  <label htmlFor="marca" className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                  <Combobox
                    id="marca"
                    value={form.marca}
                    options={Object.keys(MARCAS)}
                    placeholder="Buscar o escribir marca…"
                    error={errores.marca}
                    allowFreeText
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
                    id="anio" name="anio" type="number" inputMode="numeric"
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
                {/* 3. Modelo — combobox con opciones filtradas o escritura libre */}
                {(() => {
                  const anioNum = +form.anio;
                  const anioValido = form.anio && /^\d{4}$/.test(form.anio) && anioNum >= 1900 && anioNum <= new Date().getFullYear() + 1;
                  const modelosDisponibles = form.marca && anioValido && MARCAS[form.marca]
                    ? Object.entries(MARCAS[form.marca] || {})
                        .filter(([, { desde, hasta }]) => anioNum >= desde && anioNum <= (hasta ?? new Date().getFullYear() + 1))
                        .map(([nombre]) => nombre)
                    : [];
                  return (
                    <div>
                      <label htmlFor="modelo" className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
                      <Combobox
                        id="modelo"
                        value={form.modelo}
                        options={modelosDisponibles}
                        placeholder="Buscar o escribir modelo…"
                        error={errores.modelo}
                        allowFreeText
                        onChange={v => {
                          setForm(p => ({ ...p, modelo: v }));
                          if (errores.modelo) setErrores(p => ({ ...p, modelo: '' }));
                        }}
                      />
                      {errores.modelo
                        ? <p className="mt-1 text-xs text-red-500">{errores.modelo}</p>
                        : modelosDisponibles.length === 0 && form.marca && anioValido
                          ? <p className="mt-1 text-xs text-slate-400 italic">No hay modelos en catálogo — escríbelo manualmente</p>
                          : null
                      }
                    </div>
                  );
                })()}
                <div>
                  <label htmlFor="placa" className="block text-sm font-medium text-slate-700 mb-1">Placa <span className="text-slate-400 font-normal">(opcional)</span></label>
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
                  <label htmlFor="kilometraje" className="block text-sm font-medium text-slate-700 mb-1">Kilometraje <span className="text-slate-400 font-normal">(opcional)</span></label>
                  <input id="kilometraje" name="kilometraje" type="number" min="0" value={form.kilometraje} onChange={handleChange} placeholder="45000" className={inputCls(errores.kilometraje)} />
                  {errores.kilometraje && <p className="mt-1 text-xs text-red-500">{errores.kilometraje}</p>}
                </div>
              </div>

              {/* Fotos del vehículo (opcional) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Fotos del vehículo <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <FotoUploader
                  fotos={form.fotos}
                  onChange={(updater) => setForm(p => ({ ...p, fotos: typeof updater === 'function' ? updater(p.fotos) : updater }))}
                />
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
                      {cat.servicios.map((s) => <option key={s.nombre} value={s.nombre}>{s.nombre}</option>)}
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
                            </label>
                          ))}
                        </div>
                      </details>
                    );
                  })}
                </div>

                {/* Mini-form: agregar servicio nuevo al catálogo */}
                {nuevoServForm.open ? (
                  <div className="mt-3 rounded-xl border border-accent/30 bg-red-50 p-4 space-y-3">
                    <p className="text-xs font-semibold text-accent uppercase tracking-wide">Agregar nuevo servicio al catálogo</p>
                    <input
                      autoFocus
                      type="text"
                      placeholder="Nombre del servicio *"
                      value={nuevoServForm.nombre}
                      onChange={e => setNuevoServForm(p => ({ ...p, nombre: e.target.value }))}
                      className="w-full rounded-lg px-3 py-2 text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <select
                          value={nuevoServForm.categoria}
                          onChange={e => setNuevoServForm(p => ({ ...p, categoria: e.target.value }))}
                          className="w-full rounded-lg px-3 py-2 text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                          <option value="">Categoría…</option>
                          {CATEGORIAS_SERVICIOS.map(c => (
                            <option key={c.categoria} value={c.categoria}>{c.categoria}</option>
                          ))}
                          <option value="__nueva__">+ Nueva categoría</option>
                        </select>
                        {nuevoServForm.categoria === '__nueva__' && (
                          <input
                            autoFocus
                            type="text"
                            placeholder="Nombre de categoría *"
                            value={nuevoServForm.categoriaCustom || ''}
                            onChange={e => setNuevoServForm(p => ({ ...p, categoriaCustom: e.target.value }))}
                            className="mt-2 w-full rounded-lg px-3 py-2 text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
                          />
                        )}
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Precio (Q)"
                        value={nuevoServForm.precio}
                        onChange={e => setNuevoServForm(p => ({ ...p, precio: e.target.value }))}
                        className="w-full rounded-lg px-3 py-2 text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={!nuevoServForm.nombre.trim() || (!nuevoServForm.categoria || (nuevoServForm.categoria === '__nueva__' && !nuevoServForm.categoriaCustom?.trim()))}
                        onMouseDown={async () => {
                          const nombre = nuevoServForm.nombre.trim();
                          const precio = parseFloat(nuevoServForm.precio) || 0;
                          const catFinal = nuevoServForm.categoria === '__nueva__'
                            ? nuevoServForm.categoriaCustom?.trim()
                            : nuevoServForm.categoria;
                          // Crear categoría nueva si no existe
                          const catExiste = CATEGORIAS_SERVICIOS.some(c => c.categoria === catFinal);
                          if (!catExiste) agregarCategoria({ nombre: catFinal });
                          await agregarServicio(catFinal, { nombre, precio });
                          // Seleccionarlo como servicio principal si no hay uno aún
                          setForm(p => ({
                            ...p,
                            tipoServicio: p.tipoServicio || nombre,
                            preciosManuales: { ...p.preciosManuales, [nombre]: precio },
                          }));
                          setNuevoServForm({ open: false, nombre: '', categoria: '', precio: '' });
                          toast.success(`Servicio "${nombre}" agregado al catálogo`);
                          if (errores.tipoServicio) setErrores(p => ({ ...p, tipoServicio: '' }));
                        }}
                        className="flex-1 rounded-lg bg-accent py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition"
                      >
                        Guardar y usar
                      </button>
                      <button
                        type="button"
                        onMouseDown={() => setNuevoServForm({ open: false, nombre: '', categoria: '', precio: '' })}
                        className="px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-500 hover:bg-slate-100 transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setNuevoServForm(p => ({ ...p, open: true }))}
                    className="mt-3 flex items-center gap-1.5 text-xs text-accent font-semibold hover:underline"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    El servicio no está en la lista, agregarlo al catálogo
                  </button>
                )}
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


            </div>
          )}

          {/* ── PASO 5: Resumen ── */}
          {step === 5 && (
            <div className="print-wrapper flex justify-center my-4 px-4 sm:px-8">
              <style>{`
                @media print {
                  @page {
                    size: 72mm auto;
                    margin: 0;
                  }

                  body * { visibility: hidden !important; }
                  #print-area, #print-area * { visibility: visible !important; }

                  /* Todo negro puro y negrita */
                  #print-area, #print-area * {
                    color: #000 !important;
                    -webkit-text-fill-color: #000 !important;
                    background: transparent !important;
                    font-weight: 900 !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }

                  #print-area {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 72mm !important;
                    font-family: 'Courier New', monospace !important;
                    font-size: 10pt !important;
                    line-height: 1.4 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    box-sizing: border-box !important;
                  }

                  /* Quitar estilos de pantalla del OrdenTrabajo */
                  #print-area > div {
                    width: 72mm !important;
                    max-width: 72mm !important;
                    border: none !important;
                    border-radius: 0 !important;
                    padding: 2mm 3mm !important;
                    margin: 0 !important;
                    box-sizing: border-box !important;
                  }

                  /* Encabezado */
                  #print-area .thermal-header {
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: flex-start !important;
                    border-bottom: 2px solid #000 !important;
                    padding-bottom: 2mm !important;
                    margin-bottom: 2mm !important;
                  }
                  #print-area .thermal-logo {
                    height: 24px !important;
                    filter: grayscale(100%) contrast(500%) brightness(0%) !important;
                  }
                  #print-area .thermal-orden-num {
                    font-size: 14pt !important;
                    line-height: 1.1 !important;
                  }

                  /* Secciones */
                  #print-area .thermal-section {
                    border-bottom: 1.5px dashed #000 !important;
                    padding: 1.5mm 0 !important;
                    margin-bottom: 1mm !important;
                  }
                  #print-area .thermal-section-title {
                    font-size: 10pt !important;
                    text-transform: uppercase !important;
                    margin-bottom: 1mm !important;
                    display: block !important;
                  }

                  /* Etiquetas y valores — en bloque para que no se corte */
                  #print-area .thermal-label {
                    font-size: 9pt !important;
                    text-transform: uppercase !important;
                    display: inline !important;
                  }
                  #print-area .thermal-value {
                    font-size: 10pt !important;
                    word-break: break-all !important;
                    display: inline !important;
                  }

                  /* Grid vehículo — 1 columna para no cortar texto */
                  #print-area .thermal-grid,
                  #print-area .thermal-grid-3 {
                    display: block !important;
                  }
                  #print-area .thermal-grid-3 > div {
                    display: block !important;
                    width: 100% !important;
                  }

                  /* Cabecera tabla servicios */
                  #print-area .thermal-table-head {
                    border-top: 2px solid #000 !important;
                    border-bottom: 2px solid #000 !important;
                    font-size: 10pt !important;
                    padding: 1mm 0 !important;
                    display: flex !important;
                    justify-content: space-between !important;
                  }

                  /* Filas servicios */
                  #print-area .thermal-serv-row {
                    display: flex !important;
                    justify-content: space-between !important;
                    font-size: 10pt !important;
                    border-bottom: 1.5px dotted #000 !important;
                    padding: 1mm 0 !important;
                  }

                  #print-area .thermal-row-even,
                  #print-area .thermal-row-odd { background: transparent !important; }

                  /* Firma */
                  #print-area .thermal-firma {
                    display: block !important;
                    padding-top: 3mm !important;
                    font-size: 9pt !important;
                  }
                  #print-area .thermal-firma-line {
                    border-bottom: 2px solid #000 !important;
                    width: 100% !important;
                    margin-top: 8mm !important;
                    display: block !important;
                  }
                }
              `}</style>
              <div id="print-area">
                <OrdenTrabajo form={form} ordenNum={ordenNum} tiposDano={tiposDano} onPrecioChange={(nombre, precio) => setForm(prev => ({ ...prev, preciosManuales: { ...prev.preciosManuales, [nombre]: precio } }))} />
              </div>
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
                onClick={handleWhatsApp}
                className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-400 font-medium text-sm transition shadow-sm min-h-[44px]"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Enviar por WhatsApp
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
