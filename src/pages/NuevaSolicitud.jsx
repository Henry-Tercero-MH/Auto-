import { useState } from 'react';
import toast from 'react-hot-toast';
import logo from '../imagenes/logoMecanica.png';

const initialState = {
  nombre: '',
  telefono: '',
  email: '',
  marca: '',
  modelo: '',
  anio: '',
  placa: '',
  kilometraje: '',
  tipoServicio: '',
  adicionales: [],
  observaciones: '',
};

const tiposServicio = [
  'Scaner',
  'Servicio motor',
  'Servicio completo',
  'Servicio frenos',
  'Ruido delantero',
  'Ruido trasero',
  'Suspensión',
];

const STEPS = [
  { label: 'Cliente' },
  { label: 'Vehículo' },
  { label: 'Servicio' },
  { label: 'Resumen' },
];

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
                  done
                    ? 'bg-primary text-white'
                    : active
                    ? 'bg-accent text-white shadow-md'
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
              <div className={`h-0.5 w-12 sm:w-20 mx-1 sm:mx-2 mb-4 transition-all ${current > idx ? 'bg-primary' : 'bg-gray-200'}`} />
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

// Genera número de orden único por sesión
function genOrden() {
  return String(Math.floor(Math.random() * 90000) + 10000);
}

function OrdenTrabajo({ form, ordenNum }) {
  const fecha = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const servicios = [form.tipoServicio, ...form.adicionales];

  return (
    <div className="bg-white border-2 border-gray-300 rounded-none font-mono text-xs sm:text-sm select-none" style={{ fontFamily: "'Courier New', monospace" }}>

      {/* ── Encabezado ── */}
      <div className="border-b-2 border-gray-300 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          {/* Logo */}
          <div>
            <img src={logo} alt="AUTO+" className="h-14 sm:h-16 object-contain" />
          </div>
          {/* No. orden */}
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Orden de Trabajo</p>
            <p className="text-accent font-black text-xl sm:text-2xl tracking-wide">No. {ordenNum}</p>
            <p className="text-gray-500 text-xs mt-0.5">Fecha: {fecha}</p>
          </div>
        </div>
      </div>

      {/* ── Datos del cliente ── */}
      <div className="border-b border-dashed border-gray-300 p-4 sm:p-5">
        <p className="text-primary font-bold uppercase tracking-widest text-xs mb-3">Datos del cliente</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          <div>
            <span className="text-gray-400 uppercase text-xs">Nombre del propietario:</span>
            <p className="font-semibold text-gray-800 border-b border-dotted border-gray-300 pb-0.5 mt-0.5">
              {form.nombre}
            </p>
          </div>
          <div>
            <span className="text-gray-400 uppercase text-xs">Tel:</span>
            <p className="font-semibold text-gray-800 border-b border-dotted border-gray-300 pb-0.5 mt-0.5">
              {form.telefono}
            </p>
          </div>
          <div className="col-span-2">
            <span className="text-gray-400 uppercase text-xs">Correo:</span>
            <p className="font-semibold text-gray-800 border-b border-dotted border-gray-300 pb-0.5 mt-0.5">
              {form.email}
            </p>
          </div>
        </div>
      </div>

      {/* ── Datos del vehículo ── */}
      <div className="border-b border-dashed border-gray-300 p-4 sm:p-5">
        <p className="text-primary font-bold uppercase tracking-widest text-xs mb-3">Datos del vehículo</p>
        <div className="grid grid-cols-3 gap-x-4 gap-y-2">
          <div>
            <span className="text-gray-400 uppercase text-xs">Marca:</span>
            <p className="font-semibold text-gray-800 border-b border-dotted border-gray-300 pb-0.5 mt-0.5">{form.marca}</p>
          </div>
          <div>
            <span className="text-gray-400 uppercase text-xs">Modelo:</span>
            <p className="font-semibold text-gray-800 border-b border-dotted border-gray-300 pb-0.5 mt-0.5">{form.modelo}</p>
          </div>
          <div>
            <span className="text-gray-400 uppercase text-xs">Año:</span>
            <p className="font-semibold text-gray-800 border-b border-dotted border-gray-300 pb-0.5 mt-0.5">{form.anio}</p>
          </div>
          <div>
            <span className="text-gray-400 uppercase text-xs">Placas:</span>
            <p className="font-semibold text-gray-800 border-b border-dotted border-gray-300 pb-0.5 mt-0.5">{form.placa}</p>
          </div>
          <div className="col-span-2">
            <span className="text-gray-400 uppercase text-xs">Kilometraje:</span>
            <p className="font-semibold text-gray-800 border-b border-dotted border-gray-300 pb-0.5 mt-0.5">
              {Number(form.kilometraje).toLocaleString()} km
            </p>
          </div>
        </div>
      </div>

      {/* ── Trabajos a ordenar ── */}
      <div className="border-b border-dashed border-gray-300">
        {/* Cabecera tabla */}
        <div className="grid grid-cols-12 bg-primary text-white text-xs uppercase tracking-widest font-bold px-4 sm:px-5 py-2">
          <div className="col-span-2 text-center">Cant.</div>
          <div className="col-span-10 pl-2">Descripción</div>
        </div>
        {/* Filas */}
        {servicios.map((s, i) => (
          <div
            key={i}
            className={`grid grid-cols-12 px-4 sm:px-5 py-2.5 border-b border-dotted border-gray-200 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
          >
            <div className="col-span-2 text-center font-bold text-gray-700">1</div>
            <div className="col-span-10 pl-2 text-gray-800 font-medium">{s}</div>
          </div>
        ))}
        {/* Filas vacías para estética */}
        {Array.from({ length: Math.max(0, 4 - servicios.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="grid grid-cols-12 px-4 sm:px-5 py-2.5 border-b border-dotted border-gray-200">
            <div className="col-span-2 text-center text-gray-200">—</div>
            <div className="col-span-10" />
          </div>
        ))}
      </div>

      {/* ── Observaciones ── */}
      <div className="border-b border-dashed border-gray-300 p-4 sm:p-5">
        <span className="text-gray-400 uppercase text-xs">Observaciones:</span>
        <p className="font-semibold text-gray-800 border-b border-dotted border-gray-300 pb-0.5 mt-1 min-h-[1.5rem]">
          {form.observaciones || ''}
        </p>
      </div>

      {/* ── Pie ── */}
      <div className="p-4 sm:p-5 flex items-center justify-between">
        <div>
          <span className="text-gray-400 uppercase text-xs">Aceptación cliente (F):</span>
          <div className="border-b border-gray-400 w-40 mt-3" />
        </div>
        <div className="text-right">
          <span className="text-gray-400 uppercase text-xs">Nombre:</span>
          <div className="border-b border-gray-400 w-36 mt-3" />
        </div>
      </div>
    </div>
  );
}

export default function NuevaSolicitud() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialState);
  const [errores, setErrores] = useState({});
  const [ordenNum, setOrdenNum] = useState(genOrden);

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
      setForm((prev) => ({ ...prev, [name]: value }));
      if (errores[name]) setErrores((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validarPaso = (paso) => {
    const e = {};
    if (paso === 1) {
      if (!form.nombre.trim()) e.nombre = 'Nombre requerido';
      if (!form.telefono.trim()) e.telefono = 'Teléfono requerido';
      if (!form.email.trim()) {
        e.email = 'Correo requerido';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        e.email = 'Correo no válido';
      }
    }
    if (paso === 2) {
      if (!form.marca.trim()) e.marca = 'Marca requerida';
      if (!form.modelo.trim()) e.modelo = 'Modelo requerido';
      if (!form.anio) {
        e.anio = 'Año requerido';
      } else if (!/^\d{4}$/.test(form.anio) || +form.anio < 1900 || +form.anio > new Date().getFullYear() + 1) {
        e.anio = 'Año no válido';
      }
      if (!form.placa.trim()) e.placa = 'Placa requerida';
      if (!form.kilometraje) {
        e.kilometraje = 'Kilometraje requerido';
      } else if (isNaN(form.kilometraje) || +form.kilometraje < 0) {
        e.kilometraje = 'Kilometraje no válido';
      }
    }
    if (paso === 3) {
      if (!form.tipoServicio) e.tipoServicio = 'Selecciona un tipo de servicio';
    }
    return e;
  };

  const handleNext = () => {
    const e = validarPaso(step);
    if (Object.keys(e).length > 0) { setErrores(e); return; }
    setErrores({});
    setStep((s) => s + 1);
  };

  const handleBack = () => { setErrores({}); setStep((s) => s - 1); };

  const handleSubmit = () => {
    setForm(initialState);
    setOrdenNum(genOrden());
    setStep(1);
    toast.success('¡Solicitud registrada exitosamente!');
  };

  return (
    <div className="flex items-start justify-center px-4 py-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-primary">Nueva Solicitud</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Paso {step} de {STEPS.length} — {STEPS[step - 1].label}
          </p>
        </div>

        <StepIndicator current={step} />

        <div className={step === 4 ? '' : 'bg-white rounded-2xl shadow-sm border border-slate-100'}>

          {/* ── PASO 1: Cliente ── */}
          {step === 1 && (
            <div className="px-6 sm:px-8 py-7 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">Datos del cliente</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="nombre" className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
                  <input id="nombre" name="nombre" type="text" value={form.nombre} onChange={handleChange} placeholder="Juan García" className={inputCls(errores.nombre)} />
                  {errores.nombre && <p className="mt-1 text-xs text-red-500">{errores.nombre}</p>}
                </div>
                <div>
                  <label htmlFor="telefono" className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                  <input id="telefono" name="telefono" type="tel" value={form.telefono} onChange={handleChange} placeholder="+52 000 000 0000" className={inputCls(errores.telefono)} />
                  {errores.telefono && <p className="mt-1 text-xs text-red-500">{errores.telefono}</p>}
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
                  <input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="correo@ejemplo.com" className={inputCls(errores.email)} />
                  {errores.email && <p className="mt-1 text-xs text-red-500">{errores.email}</p>}
                </div>
              </div>
            </div>
          )}

          {/* ── PASO 2: Vehículo ── */}
          {step === 2 && (
            <div className="px-6 sm:px-8 py-7 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">Datos del vehículo</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="marca" className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                  <input id="marca" name="marca" type="text" value={form.marca} onChange={handleChange} placeholder="Toyota" className={inputCls(errores.marca)} />
                  {errores.marca && <p className="mt-1 text-xs text-red-500">{errores.marca}</p>}
                </div>
                <div>
                  <label htmlFor="modelo" className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
                  <input id="modelo" name="modelo" type="text" value={form.modelo} onChange={handleChange} placeholder="Corolla" className={inputCls(errores.modelo)} />
                  {errores.modelo && <p className="mt-1 text-xs text-red-500">{errores.modelo}</p>}
                </div>
                <div>
                  <label htmlFor="anio" className="block text-sm font-medium text-slate-700 mb-1">Año</label>
                  <input id="anio" name="anio" type="number" min="1900" max={new Date().getFullYear() + 1} value={form.anio} onChange={handleChange} placeholder="2020" className={inputCls(errores.anio)} />
                  {errores.anio && <p className="mt-1 text-xs text-red-500">{errores.anio}</p>}
                </div>
                <div>
                  <label htmlFor="placa" className="block text-sm font-medium text-slate-700 mb-1">Placa</label>
                  <input id="placa" name="placa" type="text" value={form.placa} onChange={handleChange} placeholder="ABC-1234" className={inputCls(errores.placa)} />
                  {errores.placa && <p className="mt-1 text-xs text-red-500">{errores.placa}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="kilometraje" className="block text-sm font-medium text-slate-700 mb-1">Kilometraje</label>
                  <input id="kilometraje" name="kilometraje" type="number" min="0" value={form.kilometraje} onChange={handleChange} placeholder="45000" className={inputCls(errores.kilometraje)} />
                  {errores.kilometraje && <p className="mt-1 text-xs text-red-500">{errores.kilometraje}</p>}
                </div>
              </div>
            </div>
          )}

          {/* ── PASO 3: Servicio ── */}
          {step === 3 && (
            <div className="px-6 sm:px-8 py-7 space-y-5">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">Servicio</h3>
              <div>
                <label htmlFor="tipoServicio" className="block text-sm font-medium text-slate-700 mb-1">Tipo de servicio principal</label>
                <select id="tipoServicio" name="tipoServicio" value={form.tipoServicio} onChange={handleChange} className={inputCls(errores.tipoServicio)}>
                  <option value="">Selecciona una opción</option>
                  {tiposServicio.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                {errores.tipoServicio && <p className="mt-1 text-xs text-red-500">{errores.tipoServicio}</p>}
              </div>
              <div>
                <p className="block text-sm font-medium text-slate-700 mb-2">
                  Servicios adicionales <span className="text-gray-400 font-normal">(opcional)</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {tiposServicio.map((serv) => (
                    <label key={serv} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition ${form.adicionales.includes(serv) ? 'border-accent bg-red-50 text-red-700' : 'border-gray-200 bg-slate-50 text-gray-600 hover:border-red-300'}`}>
                      <input type="checkbox" name="adicionales" value={serv} checked={form.adicionales.includes(serv)} onChange={handleChange} className="w-4 h-4 accent-red-600" />
                      <span className="text-sm font-medium">{serv}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="observaciones" className="block text-sm font-medium text-slate-700 mb-1">
                  Observaciones <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea id="observaciones" name="observaciones" value={form.observaciones} onChange={handleChange} rows={3} placeholder="Describe cualquier detalle adicional..." className="w-full rounded-lg px-3 py-2.5 bg-slate-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition resize-none" />
              </div>
            </div>
          )}

          {/* ── PASO 4: Orden de trabajo ── */}
          {step === 4 && (
            <OrdenTrabajo form={form} ordenNum={ordenNum.current} />
          )}
        </div>

        {/* ── Navegación ── */}
        <div className={`mt-4 flex ${step > 1 ? 'justify-between' : 'justify-end'}`}>
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 font-medium text-sm transition shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Anterior
            </button>
          )}

          {step < 4 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 bg-accent hover:bg-red-700 active:bg-red-800 text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all duration-150"
            >
              Siguiente
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 bg-primary hover:bg-[#162048] text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Confirmar registro
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
