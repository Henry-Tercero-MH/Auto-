import { useState, useMemo } from 'react';
import { useCatalogos } from '../context/CatalogosContext';
import SpinnerBolitas from '../components/SpinnerBolitas';
import { formatQ, CategoryIcon, ICON_MAP } from '../data/servicios';
import toast from 'react-hot-toast';

/* ═══════════════════════════════════════════════════════════════════════════════
   ICONOS SVG
   ═══════════════════════════════════════════════════════════════════════════════ */
const I = ({ d, className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);
const icons = {
  plus:    'M12 4v16m8-8H4',
  search:  'M21 21l-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
  edit:    'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  trash:   'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  x:       'M6 18L18 6M6 6l12 12',
  chevron: 'M19 9l-7 7-7-7',
  users:   'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  car:     'M8 17h.01M16 17h.01M7.5 12h9l1.5-5H6l1.5 5zM5 17a2 2 0 01-2-2v-2h18v2a2 2 0 01-2 2H5z',
  wrench:  'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z',
  reset:   'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  warn:    'M12 9v2m0 4h.01M10.29 3.86l-8.9 15.54A1 1 0 002.27 21h19.46a1 1 0 00.88-1.6l-8.9-15.54a1.14 1.14 0 00-2.02 0z',
  flag:    'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z',
  mec:     'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
  box:     'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  damage:  'M13 10V3L4 14h7v7l9-11h-7z',
  config:  'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
  save:    'M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4',
};

/* ═══════════════════════════════════════════════════════════════════════════════
   COMPONENTES COMPARTIDOS
   ═══════════════════════════════════════════════════════════════════════════════ */
const TABS = [
  { key: 'clientes',    label: 'Clientes',       iconPath: icons.users  },
  { key: 'vehiculos',   label: 'Vehículos',      iconPath: icons.car    },
  { key: 'servicios',   label: 'Servicios',      iconPath: icons.wrench },
  { key: 'estados',     label: 'Estados',        iconPath: icons.flag   },
  { key: 'mecanicos',   label: 'Mecánicos',      iconPath: icons.mec    },
  { key: 'tiposdano',   label: 'Tipos de Daño',  iconPath: icons.damage },
  { key: 'repuestos',   label: 'Repuestos',      iconPath: icons.box    },
  { key: 'config',      label: 'Configuración',  iconPath: icons.config },
];

const inputCls = 'w-full border border-slate-300 rounded-md px-3 py-2 text-[13px] text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition';
const labelCls = 'block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1';
const btnPrimary = 'inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/90 text-white text-[13px] font-semibold px-4 py-2 rounded-md shadow-sm transition';
const btnSecondary = 'inline-flex items-center justify-center gap-1.5 border border-slate-300 text-slate-600 hover:bg-slate-50 text-[13px] font-medium px-4 py-2 rounded-md transition';
const btnDanger = 'inline-flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-[13px] font-semibold px-4 py-2 rounded-md shadow-sm transition';

/* ── Modal genérico ────────────────────────────────────────────────────────── */
function Modal({ open, onClose, title, width = 'max-w-lg', children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] sm:pt-[10vh] px-3 sm:px-4 bg-black/50 backdrop-blur-[2px]" onClick={onClose}>
      <div className={`bg-white rounded-lg shadow-2xl w-full ${width} max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/80 rounded-t-lg">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition">
            <I d={icons.x} className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  return (
    <Modal open={open} onClose={onCancel} title={title} width="max-w-sm">
      <div className="flex items-start gap-3 mb-5">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
          <I d={icons.warn} className="w-5 h-5 text-red-600" />
        </div>
        <p className="text-sm text-slate-600 pt-1.5">{message}</p>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className={btnSecondary}>Cancelar</button>
        <button onClick={onConfirm} className={btnDanger}>Eliminar</button>
      </div>
    </Modal>
  );
}

/* ── Toolbar ───────────────────────────────────────────────────────────────── */
function Toolbar({ busqueda, onBusqueda, placeholder, count, onAdd, addLabel }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[150px] sm:min-w-[200px]">
        <I d={icons.search} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input className={`${inputCls} !pl-9`} placeholder={placeholder} value={busqueda} onChange={(e) => onBusqueda(e.target.value)} />
      </div>
      <span className="text-[11px] text-slate-400 font-medium tabular-nums whitespace-nowrap">{count}</span>
      {onAdd && (
        <button onClick={onAdd} className={btnPrimary}>
          <I d={icons.plus} className="w-4 h-4" />
          <span className="hidden sm:inline">{addLabel}</span>
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TAB: CLIENTES
   ═══════════════════════════════════════════════════════════════════════════════ */
function TabClientes() {
  const { clientes, agregarCliente, editarCliente, eliminarCliente } = useCatalogos();
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ nombre: '', telefono: '', email: '', direccion: '' });
  const [confirm, setConfirm] = useState(null);

  const filtrados = useMemo(
    () => clientes.filter((c) =>
      String(c.nombre ?? '').toLowerCase().includes(busqueda.toLowerCase()) ||
      String(c.telefono ?? '').includes(busqueda)
    ),
    [clientes, busqueda]
  );

  const openNew  = () => { setForm({ nombre: '', telefono: '', email: '', direccion: '' }); setModal('nuevo'); };
  const openEdit = (c) => { setForm({ nombre: c.nombre || '', telefono: c.telefono || '', email: c.email || '', direccion: c.direccion || '' }); setModal(c); };
  const closeModal = () => setModal(null);

  const handleSave = () => {
    if (!form.nombre.trim()) return toast.error('El nombre es obligatorio');
    if (modal === 'nuevo') {
      const nombreNorm = form.nombre.trim().toLowerCase();
      const existe = clientes.some((c) => (c.nombre || '').trim().toLowerCase() === nombreNorm);
      if (existe) return toast.error(`Ya existe un cliente con el nombre "${form.nombre.trim()}"`);
      agregarCliente({ ...form, activo: true });
      toast.success('Cliente registrado');
    } else {
      editarCliente(modal.id, form);
      toast.success('Cliente actualizado');
    }
    closeModal();
  };

  const toggleActivo = (c) => {
    editarCliente(c.id, { activo: !c.activo });
    toast.success(c.activo ? 'Cliente desactivado' : 'Cliente activado');
  };

  return (
    <div className="space-y-4">
      <Toolbar busqueda={busqueda} onBusqueda={setBusqueda} placeholder="Buscar por nombre o teléfono…" count={`${filtrados.length} registro(s)`} onAdd={openNew} addLabel="Nuevo cliente" />

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider hidden sm:table-cell">Código</th>
              <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider">Nombre</th>
              <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider hidden sm:table-cell">Teléfono</th>
              <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider w-24">Estado</th>
              <th className="px-4 py-2.5 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtrados.map((c) => (
              <tr key={c.id} className={`hover:bg-slate-50/70 transition-colors ${!c.activo ? 'opacity-50' : ''}`}>
                <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400 hidden sm:table-cell">{c.id}</td>
                <td className="px-4 py-2.5 font-medium text-slate-800">
                  <span className="uppercase">{c.nombre}</span>
                  <span className="sm:hidden block text-[11px] text-slate-400">{c.telefono || ''}</span>
                </td>
                <td className="px-4 py-2.5 text-slate-600 hidden sm:table-cell">{c.telefono || '—'}</td>
                <td className="px-4 py-2.5">
                  <button onClick={() => toggleActivo(c)} title={c.activo ? 'Desactivar' : 'Activar'}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${c.activo ? 'bg-green-500' : 'bg-slate-300'}`}>
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${c.activo ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openEdit(c)} title="Editar" className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition"><I d={icons.edit} className="w-4 h-4" /></button>
                    <button onClick={() => setConfirm(c.id)} title="Eliminar" className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition"><I d={icons.trash} className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr><td colSpan={5} className="text-center py-10 text-slate-400 text-sm">Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={!!modal} onClose={closeModal} title={modal === 'nuevo' ? 'Nuevo cliente' : 'Editar cliente'}>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Nombre completo *</label>
            <input className={inputCls} placeholder="Ej: Juan Pérez" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Teléfono</label>
              <input className={inputCls} placeholder="Ej: 5555-1234" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" className={inputCls} placeholder="Ej: correo@mail.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Dirección</label>
            <input className={inputCls} placeholder="Ej: Zona 1, Ciudad" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={closeModal} className={btnSecondary}>Cancelar</button>
            <button onClick={handleSave} className={btnPrimary}>{modal === 'nuevo' ? 'Guardar' : 'Actualizar'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!confirm} title="Eliminar cliente" message="¿Eliminar este cliente? Esta acción no se puede deshacer."
        onConfirm={() => { eliminarCliente(confirm); toast.success('Cliente eliminado'); setConfirm(null); }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TAB: VEHÍCULOS (MARCAS / MODELOS)
   ═══════════════════════════════════════════════════════════════════════════════ */
const FORM_VEH_INIT = { cliente_id: '', marca: '', modelo: '', anio: '', placa: '', km: '' };

function TabVehiculos() {
  const { vehiculos, clientes, agregarVehiculo, editarVehiculoCat, eliminarVehiculoCat } = useCatalogos();
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal]       = useState(null); // null | 'nuevo' | vehiculo-obj
  const [form, setForm]         = useState(FORM_VEH_INIT);
  const [confirm, setConfirm]   = useState(null);
  const [guardando, setGuardando] = useState(false);

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return vehiculos.filter((v) =>
      String(v.marca   ?? '').toLowerCase().includes(q) ||
      String(v.modelo  ?? '').toLowerCase().includes(q) ||
      String(v.placa   ?? '').toLowerCase().includes(q) ||
      String(v.cliente_id ?? '').toLowerCase().includes(q) ||
      clientes.find((c) => c.id === v.cliente_id && (c.nombre || '').toLowerCase().includes(q))
    );
  }, [vehiculos, clientes, busqueda]);

  const nombreCliente = (id) => clientes.find((c) => c.id === id)?.nombre || id || '—';

  const openNuevo = () => { setForm(FORM_VEH_INIT); setModal('nuevo'); };
  const openEditar = (v) => {
    setForm({ cliente_id: v.cliente_id || '', marca: v.marca || '', modelo: v.modelo || '',
              anio: v.anio || '', placa: v.placa || '', km: v.km || '' });
    setModal(v);
  };

  const handleGuardar = async () => {
    if (!form.marca.trim() || !form.modelo.trim()) return toast.error('Marca y modelo son obligatorios');
    setGuardando(true);
    try {
      const datos = {
        cliente_id: form.cliente_id,
        marca:      form.marca.trim(),
        modelo:     form.modelo.trim(),
        anio:       form.anio ? Number(form.anio) : '',
        placa:      form.placa.trim().toUpperCase(),
        km:         form.km ? Number(form.km) : '',
        creado_en:  new Date().toISOString(),
      };
      if (modal === 'nuevo') {
        await agregarVehiculo(datos);
        toast.success('Vehículo agregado');
      } else {
        await editarVehiculoCat(modal.id, datos);
        toast.success('Vehículo actualizado');
      }
      setModal(null);
    } catch (e) {
      toast.error(e.message || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    await eliminarVehiculoCat(confirm.id);
    toast.success('Vehículo eliminado');
    setConfirm(null);
  };

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      <Toolbar busqueda={busqueda} onBusqueda={setBusqueda} placeholder="Buscar marca, modelo o placa…"
        count={`${filtrados.length} vehículo${filtrados.length !== 1 ? 's' : ''}`}
        onAdd={openNuevo} addLabel="Nuevo vehículo" />

      {/* Tarjetas móvil */}
      <div className="sm:hidden space-y-2">
        {filtrados.map((v) => (
          <div key={v.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-slate-800 text-[13px] uppercase">{v.marca} {v.modelo} {v.anio}</span>
              <div className="flex gap-1">
                <button onClick={() => openEditar(v)} className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition"><I d={icons.edit} className="w-3.5 h-3.5" /></button>
                <button onClick={() => setConfirm(v)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition"><I d={icons.trash} className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">Cliente: <span className="text-slate-600">{nombreCliente(v.cliente_id)}</span></p>
            {v.placa && <p className="text-[11px] text-slate-400">Placa: <span className="text-slate-600">{v.placa}</span></p>}
            {v.km    && <p className="text-[11px] text-slate-400">Km: <span className="text-slate-600">{Number(v.km).toLocaleString()}</span></p>}
          </div>
        ))}
        {filtrados.length === 0 && <p className="text-center py-14 text-slate-400 text-sm">Sin resultados</p>}
      </div>

      {/* Tabla desktop */}
      <div className="hidden sm:block bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wide">
              <th className="text-left px-4 py-3">Marca / Modelo</th>
              <th className="text-left px-4 py-3">Año</th>
              <th className="text-left px-4 py-3">Placa</th>
              <th className="text-left px-4 py-3">Km</th>
              <th className="text-left px-4 py-3">Cliente</th>
              <th className="px-4 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtrados.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-2.5 font-semibold text-slate-800 uppercase">{v.marca} {v.modelo}</td>
                <td className="px-4 py-2.5 text-slate-500">{v.anio || '—'}</td>
                <td className="px-4 py-2.5 text-slate-600 font-mono">{v.placa || '—'}</td>
                <td className="px-4 py-2.5 text-slate-500">{v.km ? Number(v.km).toLocaleString() : '—'}</td>
                <td className="px-4 py-2.5 text-slate-600">{nombreCliente(v.cliente_id)}</td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => openEditar(v)} className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition"><I d={icons.edit} className="w-4 h-4" /></button>
                    <button onClick={() => setConfirm(v)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition"><I d={icons.trash} className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-14 text-center text-slate-400">Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal nuevo / editar */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'nuevo' ? 'Nuevo vehículo' : 'Editar vehículo'}>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Cliente</label>
            <select className={inputCls} value={form.cliente_id} onChange={f('cliente_id')}>
              <option value="">Sin asignar</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Marca *</label><input className={inputCls} placeholder="Toyota" value={form.marca} onChange={f('marca')} autoFocus /></div>
            <div><label className={labelCls}>Modelo *</label><input className={inputCls} placeholder="Yaris" value={form.modelo} onChange={f('modelo')} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={labelCls}>Año</label><input type="number" className={inputCls} placeholder="2008" value={form.anio} onChange={f('anio')} /></div>
            <div><label className={labelCls}>Placa</label><input className={inputCls} placeholder="P123ABC" value={form.placa} onChange={f('placa')} /></div>
            <div><label className={labelCls}>Km</label><input type="number" className={inputCls} placeholder="85000" value={form.km} onChange={f('km')} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setModal(null)} className={btnSecondary} disabled={guardando}>Cancelar</button>
            <button onClick={handleGuardar} className={btnPrimary} disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!confirm}
        title="Eliminar vehículo"
        message={`¿Eliminar ${confirm?.marca} ${confirm?.modelo}${confirm?.placa ? ` (${confirm.placa})` : ''}?`}
        onConfirm={handleEliminar}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TAB: SERVICIOS
   ═══════════════════════════════════════════════════════════════════════════════ */
function TabServicios() {
  const { servicios, agregarCategoria, eliminarCategoria, agregarServicio, editarServicio, eliminarServicio } = useCatalogos();
  const [busqueda, setBusqueda] = useState('');
  const [catAbierta, setCatAbierta] = useState(null);
  const [modal, setModal] = useState(null);
  const [formCat, setFormCat] = useState({ nombre: '', icon: '', descripcion: '' });
  const [formServ, setFormServ] = useState({ categoria: '', nombre: '', precio: '' });
  const [editando, setEditando] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const filteredCats = useMemo(
    () => servicios.filter((c) => c?.categoria).filter((c) =>
      c.categoria.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.servicios?.some((s) => s.nombre?.toLowerCase().includes(busqueda.toLowerCase()))
    ),
    [servicios, busqueda]
  );
  const totalServicios = servicios.reduce((a, c) => a + (c.servicios?.length ?? 0), 0);

  const openCat = () => { setFormCat({ nombre: '', icon: '', descripcion: '' }); setModal('cat'); };
  const openServ = (preselect) => { setFormServ({ categoria: preselect || '', nombre: '', precio: '' }); setModal('serv'); };

  const handleSaveCat = () => {
    if (!formCat.nombre.trim()) return toast.error('Nombre requerido');
    if (servicios.some((c) => c.categoria === formCat.nombre.trim())) return toast.error('Ya existe');
    agregarCategoria({ nombre: formCat.nombre.trim(), icon: formCat.icon || '📋', descripcion: formCat.descripcion });
    toast.success('Categoría creada'); setModal(null);
  };

  const handleSaveServ = () => {
    const { categoria, nombre, precio } = formServ;
    if (!categoria || !nombre.trim()) return toast.error('Complete todos los campos');
    if (Number(precio) <= 0) return toast.error('Precio inválido');
    agregarServicio(categoria, { nombre: nombre.trim(), precio: Number(precio) });
    toast.success('Servicio agregado'); setModal(null);
  };

  const startEditServ = (cat, s) => setEditando({ cat, nombreOrig: s.nombre, nombre: s.nombre, precio: s.precio });
  const saveEditServ = () => {
    if (!editando.nombre.trim() || Number(editando.precio) <= 0) return toast.error('Complete los campos');
    editarServicio(editando.cat, editando.nombreOrig, { nombre: editando.nombre.trim(), precio: Number(editando.precio) });
    toast.success('Servicio actualizado'); setEditando(null);
  };

  return (
    <div className="space-y-4">
      <Toolbar busqueda={busqueda} onBusqueda={setBusqueda} placeholder="Buscar categoría o servicio…" count={`${filteredCats.length} categorías · ${totalServicios} servicios`} onAdd={openCat} addLabel="Nueva categoría" />

      <div className="flex justify-end">
        <button onClick={() => openServ('')} className={btnSecondary}>
          <I d={icons.plus} className="w-4 h-4" />
          <span className="hidden sm:inline">Agregar servicio</span>
          <span className="sm:hidden">Servicio</span>
        </button>
      </div>

      <div className="space-y-1">
        {filteredCats.map((cat) => {
          const isOpen = catAbierta === cat.categoria;
          return (
            <div key={cat.categoria} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setCatAbierta(isOpen ? null : cat.categoria)}>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center flex-shrink-0"><CategoryIcon name={cat.icon} className="w-4 h-4 text-primary" /></div>
                  <span className="text-[13px] font-semibold text-slate-800">{cat.categoria}</span>
                  <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{cat.servicios.length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); openServ(cat.categoria); }} title="Agregar servicio" className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition"><I d={icons.plus} className="w-4 h-4" /></button>
                  <button onClick={(e) => { e.stopPropagation(); setConfirm({ tipo: 'categoria', nombre: cat.categoria }); }} title="Eliminar" className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition"><I d={icons.trash} className="w-4 h-4" /></button>
                  <svg className={`w-4 h-4 text-slate-400 transition-transform ml-1 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={icons.chevron} /></svg>
                </div>
              </div>
              {isOpen && (
                <div className="border-t border-slate-100">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="bg-slate-50/80">
                        <th className="text-left px-4 py-2 font-semibold text-slate-500 uppercase text-[11px] tracking-wider">Servicio</th>
                        <th className="text-right px-4 py-2 font-semibold text-slate-500 uppercase text-[11px] tracking-wider w-28">Precio</th>
                        <th className="px-4 py-2 w-24"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cat.servicios.map((s) => {
                        const isE = editando && editando.cat === cat.categoria && editando.nombreOrig === s.nombre;
                        return (
                          <tr key={s.nombre} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-4 py-2">
                              {isE ? <input className={`${inputCls} !py-1`} value={editando.nombre} onChange={(e) => setEditando({ ...editando, nombre: e.target.value })} /> : <span className="text-slate-700">{s.nombre}</span>}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {isE ? <input type="number" className={`${inputCls} !py-1 !w-24 text-right ml-auto`} value={editando.precio} onChange={(e) => setEditando({ ...editando, precio: e.target.value })} /> : <span className="font-semibold text-slate-700 tabular-nums">{formatQ(s.precio)}</span>}
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex justify-end gap-1">
                                {isE ? (
                                  <>
                                    <button onClick={saveEditServ} className="text-[11px] px-2 py-1 rounded bg-primary text-white hover:bg-primary/90 font-semibold">Guardar</button>
                                    <button onClick={() => setEditando(null)} className="text-[11px] px-2 py-1 rounded border border-slate-300 text-slate-500 hover:bg-slate-50 font-medium">Cancelar</button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => startEditServ(cat.categoria, s)} title="Editar" className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition"><I d={icons.edit} className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => setConfirm({ tipo: 'servicio', cat: cat.categoria, nombre: s.nombre })} title="Eliminar" className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition"><I d={icons.trash} className="w-3.5 h-3.5" /></button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {cat.servicios.length === 0 && <tr><td colSpan={3} className="text-center py-8 text-slate-400 text-sm italic">Sin servicios</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
        {filteredCats.length === 0 && <div className="text-center py-14 text-slate-400 text-sm">Sin resultados</div>}
      </div>

      <Modal open={modal === 'cat'} onClose={() => setModal(null)} title="Nueva categoría">
        <div className="space-y-4">
          <div className="grid grid-cols-[90px_1fr] gap-3">
            <div>
              <label className={labelCls}>Icono</label>
              <select className={`${inputCls} text-center`} value={formCat.icon} onChange={(e) => setFormCat({ ...formCat, icon: e.target.value })}>
                {Object.keys(ICON_MAP).map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
              <div className="flex justify-center mt-1.5"><CategoryIcon name={formCat.icon || 'ClipboardList'} className="w-6 h-6 text-primary" /></div>
            </div>
            <div><label className={labelCls}>Nombre *</label><input className={inputCls} placeholder="Ej: Mantenimiento General" value={formCat.nombre} onChange={(e) => setFormCat({ ...formCat, nombre: e.target.value })} autoFocus /></div>
          </div>
          <div><label className={labelCls}>Descripción</label><input className={inputCls} placeholder="Breve descripción (opcional)" value={formCat.descripcion} onChange={(e) => setFormCat({ ...formCat, descripcion: e.target.value })} /></div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setModal(null)} className={btnSecondary}>Cancelar</button>
            <button onClick={handleSaveCat} className={btnPrimary}>Guardar</button>
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'serv'} onClose={() => setModal(null)} title="Nuevo servicio">
        <div className="space-y-4">
          <div><label className={labelCls}>Categoría *</label>
            <select className={inputCls} value={formServ.categoria} onChange={(e) => setFormServ({ ...formServ, categoria: e.target.value })}>
              <option value="">Seleccionar…</option>
              {servicios.map((c) => <option key={c.categoria} value={c.categoria}>{c.categoria}</option>)}
            </select>
          </div>
          <div><label className={labelCls}>Nombre del servicio *</label><input className={inputCls} placeholder="Ej: Cambio de aceite motor" value={formServ.nombre} onChange={(e) => setFormServ({ ...formServ, nombre: e.target.value })} /></div>
          <div><label className={labelCls}>Precio (Q) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-slate-400 font-semibold">Q</span>
              <input type="number" className={`${inputCls} !pl-7`} placeholder="0.00" value={formServ.precio} onChange={(e) => setFormServ({ ...formServ, precio: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setModal(null)} className={btnSecondary}>Cancelar</button>
            <button onClick={handleSaveServ} className={btnPrimary}>Guardar</button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!confirm} title={confirm?.tipo === 'categoria' ? 'Eliminar categoría' : 'Eliminar servicio'}
        message={confirm?.tipo === 'categoria' ? `Se eliminará "${confirm?.nombre}" y todos sus servicios.` : `Se eliminará "${confirm?.nombre}".`}
        onConfirm={() => {
          if (confirm.tipo === 'categoria') { eliminarCategoria(confirm.nombre); toast.success('Categoría eliminada'); if (catAbierta === confirm.nombre) setCatAbierta(null); }
          else { eliminarServicio(confirm.cat, confirm.nombre); toast.success('Servicio eliminado'); }
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TAB: ESTADOS DE SOLICITUD
   ═══════════════════════════════════════════════════════════════════════════════ */
function TabEstados() {
  const { estados, agregarEstado, editarEstado, eliminarEstado } = useCatalogos();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ nombre: '', color: '#f59e0b', bgClass: 'bg-amber-100 text-amber-700', dotClass: 'bg-amber-500', timelineLabel: '', timelineDesc: '' });
  const [confirm, setConfirm] = useState(null);

  const COLORES_PRESET = [
    { label: 'Ámbar',    color: '#f59e0b', bgClass: 'bg-amber-100 text-amber-700',   dotClass: 'bg-amber-500'  },
    { label: 'Naranja',  color: '#f97316', bgClass: 'bg-orange-100 text-orange-700', dotClass: 'bg-orange-500' },
    { label: 'Verde',    color: '#22c55e', bgClass: 'bg-green-100 text-green-700',   dotClass: 'bg-green-500'  },
    { label: 'Azul',     color: '#3b82f6', bgClass: 'bg-blue-100 text-blue-700',     dotClass: 'bg-blue-500'   },
    { label: 'Rojo',     color: '#ef4444', bgClass: 'bg-red-100 text-red-700',       dotClass: 'bg-red-500'    },
    { label: 'Morado',   color: '#8b5cf6', bgClass: 'bg-purple-100 text-purple-700', dotClass: 'bg-purple-500' },
    { label: 'Cyan',     color: '#06b6d4', bgClass: 'bg-cyan-100 text-cyan-700',     dotClass: 'bg-cyan-500'   },
  ];

  const openNew = () => { setForm({ nombre: '', color: '#f59e0b', bgClass: 'bg-amber-100 text-amber-700', dotClass: 'bg-amber-500', timelineLabel: '', timelineDesc: '' }); setModal('nuevo'); };
  const openEdit = (e) => { setForm({ nombre: e.nombre, color: e.color, bgClass: e.bgClass, dotClass: e.dotClass, timelineLabel: e.timelineLabel || '', timelineDesc: e.timelineDesc || '' }); setModal(e); };
  const closeModal = () => setModal(null);

  const handleSave = () => {
    if (!form.nombre.trim()) return toast.error('El nombre es obligatorio');
    if (!form.timelineLabel.trim()) return toast.error('La etiqueta de timeline es obligatoria');
    if (modal === 'nuevo') {
      agregarEstado(form);
      toast.success('Estado creado');
    } else {
      editarEstado(modal.id, form);
      toast.success('Estado actualizado');
    }
    closeModal();
  };

  const selectColor = (preset) => {
    setForm({ ...form, color: preset.color, bgClass: preset.bgClass, dotClass: preset.dotClass });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-slate-400">Define los estados posibles para las órdenes de servicio. Se usan en Solicitudes, Seguimiento y Dashboard.</p>
        <button onClick={openNew} className={btnPrimary}><I d={icons.plus} className="w-4 h-4" />Nuevo estado</button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider w-12 hidden sm:table-cell">Orden</th>
              <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider">Nombre</th>
              <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider hidden md:table-cell">Color</th>
              <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider hidden sm:table-cell">Timeline</th>
              <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider hidden lg:table-cell">Vista previa</th>
              <th className="px-4 py-2.5 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {estados.map((e, i) => (
              <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400 text-center hidden sm:table-cell">{i + 1}</td>
                <td className="px-4 py-2.5 font-medium text-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0 md:hidden" style={{ backgroundColor: e.color }}></div>
                    {e.nombre}
                  </div>
                </td>
                <td className="px-4 py-2.5 hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: e.color }}></div>
                    <span className="text-[11px] text-slate-400">{e.color}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-slate-600 text-[12px] hidden sm:table-cell">{e.timelineLabel}</td>
                <td className="px-4 py-2.5 hidden lg:table-cell">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${e.bgClass}`}>{e.nombre}</span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openEdit(e)} title="Editar" className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition"><I d={icons.edit} className="w-4 h-4" /></button>
                    <button onClick={() => setConfirm(e.id)} title="Eliminar" className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition"><I d={icons.trash} className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {estados.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-slate-400 text-sm">Sin estados registrados</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={!!modal} onClose={closeModal} title={modal === 'nuevo' ? 'Nuevo estado' : 'Editar estado'}>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Nombre del estado *</label>
            <input className={inputCls} placeholder="Ej: Esperando repuestos" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} autoFocus />
          </div>
          <div>
            <label className={labelCls}>Etiqueta en timeline *</label>
            <input className={inputCls} placeholder="Ej: En espera" value={form.timelineLabel} onChange={(e) => setForm({ ...form, timelineLabel: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Descripción del timeline</label>
            <input className={inputCls} placeholder="Ej: Esperando la llegada de repuestos" value={form.timelineDesc} onChange={(e) => setForm({ ...form, timelineDesc: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Color</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {COLORES_PRESET.map((p) => (
                <button key={p.label} onClick={() => selectColor(p)}
                  className={`w-8 h-8 rounded-full border-2 transition ${form.color === p.color ? 'border-slate-800 scale-110' : 'border-transparent hover:border-slate-300'}`}
                  style={{ backgroundColor: p.color }} title={p.label} />
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Vista previa</label>
            <span className={`inline-block px-3 py-1 rounded-full text-[12px] font-semibold ${form.bgClass}`}>{form.nombre || 'Nombre del estado'}</span>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={closeModal} className={btnSecondary}>Cancelar</button>
            <button onClick={handleSave} className={btnPrimary}>{modal === 'nuevo' ? 'Guardar' : 'Actualizar'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!confirm} title="Eliminar estado" message="¿Eliminar este estado? Las solicitudes existentes con este estado no se verán afectadas."
        onConfirm={() => { eliminarEstado(confirm); toast.success('Estado eliminado'); setConfirm(null); }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TAB: MECÁNICOS / TÉCNICOS
   ═══════════════════════════════════════════════════════════════════════════════ */
function TabMecanicos() {
  const { mecanicos, agregarMecanico, editarMecanico, eliminarMecanico } = useCatalogos();
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ nombre: '', especialidad: '', pin: '', telefono: '' });
  const [confirm, setConfirm] = useState(null);

  const filtrados = useMemo(
    () => mecanicos.filter((m) =>
      String(m.nombre ?? '').toLowerCase().includes(busqueda.toLowerCase()) ||
      String(m.especialidad ?? '').toLowerCase().includes(busqueda.toLowerCase())
    ),
    [mecanicos, busqueda]
  );

  const openNew = () => { setForm({ nombre: '', especialidad: '', pin: '', telefono: '' }); setModal('nuevo'); };
  const openEdit = (m) => { setForm({ nombre: m.nombre, especialidad: m.especialidad, pin: m.pin || '', telefono: m.telefono }); setModal(m); };
  const closeModal = () => setModal(null);

  const handleSave = () => {
    if (!form.nombre.trim()) return toast.error('El nombre es obligatorio');
    if (!form.pin.trim()) return toast.error('El PIN es obligatorio');
    const pin = form.pin;
    if (pin.length < 6) return toast.error('El PIN debe tener al menos 6 caracteres');
    if (!/[A-Z]/.test(pin)) return toast.error('El PIN debe incluir al menos una mayúscula');
    if (!/[a-z]/.test(pin)) return toast.error('El PIN debe incluir al menos una minúscula');
    if (!/[0-9]/.test(pin)) return toast.error('El PIN debe incluir al menos un número');
    const tel = String(form.telefono ?? '').replace(/\D/g, '');
    if (tel.length !== 8) return toast.error('El teléfono debe tener exactamente 8 dígitos');
    if (modal === 'nuevo') {
      const nombreNorm = form.nombre.trim().toLowerCase();
      const existe = mecanicos.some((m) => (m.nombre || '').trim().toLowerCase() === nombreNorm);
      if (existe) return toast.error(`Ya existe un mecánico con el nombre "${form.nombre.trim()}"`);
      agregarMecanico(form);
      toast.success('Mecánico registrado');
    } else {
      editarMecanico(modal.id, form);
      toast.success('Mecánico actualizado');
    }
    closeModal();
  };

  const toggleActivo = (m) => {
    editarMecanico(m.id, { activo: !m.activo });
    toast.success(m.activo ? 'Mecánico desactivado' : 'Mecánico activado');
  };

  return (
    <div className="space-y-4">
      <Toolbar busqueda={busqueda} onBusqueda={setBusqueda} placeholder="Buscar por nombre o especialidad…" count={`${filtrados.length} mecánico(s)`} onAdd={openNew} addLabel="Nuevo mecánico" />

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider hidden sm:table-cell">Código</th>
              <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider">Nombre</th>
              <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider hidden md:table-cell">Especialidad</th>
              <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider hidden lg:table-cell">Teléfono</th>
              <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider w-20">Estado</th>
              <th className="px-4 py-2.5 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtrados.map((m) => (
              <tr key={m.id} className={`hover:bg-slate-50/70 transition-colors ${!m.activo ? 'opacity-50' : ''}`}>
                <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400 hidden sm:table-cell">{m.id}</td>
                <td className="px-4 py-2.5 font-medium text-slate-800">{m.nombre}</td>
                <td className="px-4 py-2.5 text-slate-600 hidden md:table-cell">{m.especialidad || '—'}</td>
                <td className="px-4 py-2.5 text-slate-600 hidden lg:table-cell">{m.telefono || '—'}</td>
                <td className="px-4 py-2.5">
                  <button onClick={() => toggleActivo(m)} title={m.activo ? 'Desactivar' : 'Activar'}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${m.activo ? 'bg-green-500' : 'bg-slate-300'}`}>
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${m.activo ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openEdit(m)} title="Editar" className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition"><I d={icons.edit} className="w-4 h-4" /></button>
                    <button onClick={() => setConfirm(m.id)} title="Eliminar" className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition"><I d={icons.trash} className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-slate-400 text-sm">Sin resultados</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={!!modal} onClose={closeModal} title={modal === 'nuevo' ? 'Nuevo mecánico' : 'Editar mecánico'}>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Nombre completo *</label>
            <input className={inputCls} placeholder="Ej: Pedro Hernández" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} autoFocus />
          </div>
          <div>
            <label className={labelCls}>Especialidad</label>
            <input className={inputCls} placeholder="Ej: Motor y transmisión" value={form.especialidad} onChange={(e) => setForm({ ...form, especialidad: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>PIN de acceso *</label>
            <input className={inputCls} placeholder="Mínimo 6 caracteres, mayúsculas, minúsculas y números (Ej: Taller2024)" value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Teléfono</label>
            <input className={inputCls} placeholder="Ej: 5555-2001" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={closeModal} className={btnSecondary}>Cancelar</button>
            <button
              onClick={() => {
                let letraInput = '';
                toast((t) => (
                  <div className="flex flex-col gap-3 min-w-[220px]">
                    <p className="text-sm font-semibold text-slate-700">Palabra clave para el PIN</p>
                    <input
                      autoFocus
                      maxLength={12}
                      placeholder="Ej: Taller"
                      className="border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 uppercase tracking-widest"
                      onChange={(e) => { letraInput = e.target.value; }}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter') return;
                        const letra = letraInput.trim();
                        if (!letra || !/^[A-Za-z]+$/.test(letra)) { toast.error('Solo letras, sin espacios ni caracteres especiales'); return; }
                        const mayus = Array.from({ length: 2 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
                        const minus = Array.from({ length: 2 }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('');
                        const nums = Array.from({ length: 2 }, () => Math.floor(Math.random() * 10)).join('');
                        let pin = letra + mayus + minus + nums;
                        pin = pin.split('').sort(() => Math.random() - 0.5).join('');
                        setForm((prev) => ({ ...prev, pin }));
                        toast.dismiss(t.id);
                        toast.success('PIN generado automáticamente');
                      }}
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => toast.dismiss(t.id)}
                        className="text-xs px-3 py-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                      >Cancelar</button>
                      <button
                        onClick={() => {
                          const letra = letraInput.trim();
                          if (!letra || !/^[A-Za-z]+$/.test(letra)) { toast.error('Solo letras, sin espacios ni caracteres especiales'); return; }
                          const mayus = Array.from({ length: 2 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
                          const minus = Array.from({ length: 2 }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('');
                          const nums = Array.from({ length: 2 }, () => Math.floor(Math.random() * 10)).join('');
                          let pin = letra + mayus + minus + nums;
                          pin = pin.split('').sort(() => Math.random() - 0.5).join('');
                          setForm((prev) => ({ ...prev, pin }));
                          toast.dismiss(t.id);
                          toast.success('PIN generado automáticamente');
                        }}
                        className="text-xs px-3 py-1.5 rounded bg-[#1F2A56] text-white hover:bg-[#1F2A56]/90 transition"
                      >Generar</button>
                    </div>
                  </div>
                ), { duration: Infinity });
              }}
              className={btnSecondary}
            >Generar PIN automático</button>
            <button onClick={handleSave} className={btnPrimary}>{modal === 'nuevo' ? 'Guardar' : 'Actualizar'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!confirm} title="Eliminar mecánico" message="¿Eliminar este mecánico? Esta acción no se puede deshacer."
        onConfirm={() => { eliminarMecanico(confirm); toast.success('Mecánico eliminado'); setConfirm(null); }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TAB: TIPOS DE DAÑO (INSPECCIÓN)
   ═══════════════════════════════════════════════════════════════════════════════ */
function TabTiposDano() {
  const { tiposDano, agregarTipoDano, editarTipoDano, eliminarTipoDano } = useCatalogos();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ clave: '', label: '', fill: '#fef9c3', stroke: '#ca8a04', dot: '#ca8a04' });
  const [confirm, setConfirm] = useState(null);

  const openNew = () => { setForm({ clave: '', label: '', fill: '#fef9c3', stroke: '#ca8a04', dot: '#ca8a04' }); setModal('nuevo'); };
  const openEdit = (t) => { setForm({ clave: t.clave, label: t.label, fill: t.fill, stroke: t.stroke, dot: t.dot }); setModal(t); };
  const closeModal = () => setModal(null);

  const handleSave = () => {
    if (!form.clave.trim() || !form.label.trim()) return toast.error('Clave y nombre son obligatorios');
    if (modal === 'nuevo') { agregarTipoDano(form); toast.success('Tipo de daño creado'); }
    else { editarTipoDano(modal.id, form); toast.success('Tipo de daño actualizado'); }
    closeModal();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-slate-400">Tipos de daño usados en la inspección visual del vehículo. Cada tipo tiene colores para el mapa interactivo.</p>
        <button onClick={openNew} className={btnPrimary}><I d={icons.plus} className="w-4 h-4" />Nuevo tipo</button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider hidden sm:table-cell">Clave</th>
              <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider">Nombre</th>
              <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider hidden md:table-cell">Colores</th>
              <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider hidden sm:table-cell">Vista previa</th>
              <th className="px-4 py-2.5 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tiposDano.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400 hidden sm:table-cell">{t.clave}</td>
                <td className="px-4 py-2.5 font-medium text-slate-800">{t.label}</td>
                <td className="px-4 py-2.5 hidden md:table-cell">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded border border-slate-200" style={{ backgroundColor: t.fill }} title="Fill"></div>
                    <div className="w-5 h-5 rounded border border-slate-200" style={{ backgroundColor: t.stroke }} title="Stroke"></div>
                    <div className="w-5 h-5 rounded-full border border-slate-200" style={{ backgroundColor: t.dot }} title="Dot"></div>
                  </div>
                </td>
                <td className="px-4 py-2.5 hidden sm:table-cell">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold" style={{ backgroundColor: t.fill, color: t.stroke, border: `1px solid ${t.stroke}` }}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.dot }}></div>
                    {t.label}
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openEdit(t)} title="Editar" className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition"><I d={icons.edit} className="w-4 h-4" /></button>
                    <button onClick={() => setConfirm(t.id)} title="Eliminar" className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition"><I d={icons.trash} className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {tiposDano.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-slate-400 text-sm">Sin tipos de daño registrados</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={!!modal} onClose={closeModal} title={modal === 'nuevo' ? 'Nuevo tipo de daño' : 'Editar tipo de daño'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Clave (id interno) *</label>
              <input className={inputCls} placeholder="Ej: abolladura" value={form.clave} onChange={(e) => setForm({ ...form, clave: e.target.value.toLowerCase().replace(/\s/g, '_') })} autoFocus />
            </div>
            <div>
              <label className={labelCls}>Nombre visible *</label>
              <input className={inputCls} placeholder="Ej: Abolladura" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Color fondo (fill)</label>
              <div className="flex items-center gap-2">
                <input type="color" className="w-8 h-8 rounded cursor-pointer border border-slate-200" value={form.fill} onChange={(e) => setForm({ ...form, fill: e.target.value })} />
                <span className="text-[11px] text-slate-400">{form.fill}</span>
              </div>
            </div>
            <div>
              <label className={labelCls}>Color borde (stroke)</label>
              <div className="flex items-center gap-2">
                <input type="color" className="w-8 h-8 rounded cursor-pointer border border-slate-200" value={form.stroke} onChange={(e) => setForm({ ...form, stroke: e.target.value })} />
                <span className="text-[11px] text-slate-400">{form.stroke}</span>
              </div>
            </div>
            <div>
              <label className={labelCls}>Color punto (dot)</label>
              <div className="flex items-center gap-2">
                <input type="color" className="w-8 h-8 rounded cursor-pointer border border-slate-200" value={form.dot} onChange={(e) => setForm({ ...form, dot: e.target.value })} />
                <span className="text-[11px] text-slate-400">{form.dot}</span>
              </div>
            </div>
          </div>
          <div>
            <label className={labelCls}>Vista previa</label>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold" style={{ backgroundColor: form.fill, color: form.stroke, border: `1px solid ${form.stroke}` }}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: form.dot }}></div>
              {form.label || 'Nombre del tipo'}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={closeModal} className={btnSecondary}>Cancelar</button>
            <button onClick={handleSave} className={btnPrimary}>{modal === 'nuevo' ? 'Guardar' : 'Actualizar'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!confirm} title="Eliminar tipo de daño" message="¿Eliminar este tipo de daño?"
        onConfirm={() => { eliminarTipoDano(confirm); toast.success('Tipo de daño eliminado'); setConfirm(null); }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TAB: CONFIGURACIÓN DEL NEGOCIO
   ═══════════════════════════════════════════════════════════════════════════════ */
const DIAS_SEMANA = [
  { val: 0, label: 'Dom' },
  { val: 1, label: 'Lun' },
  { val: 2, label: 'Mar' },
  { val: 3, label: 'Mié' },
  { val: 4, label: 'Jue' },
  { val: 5, label: 'Vie' },
  { val: 6, label: 'Sáb' },
];

function TabConfig() {
  const { configNegocio, actualizarConfigNegocio, horarioAcceso, actualizarHorarioAcceso } = useCatalogos();
  const [form, setForm] = useState({ ...configNegocio });
  const [changed, setChanged] = useState(false);
  // null = sin edits; si es null, se usa el valor del contexto directamente
  const [horarioDraft, setHorarioDraft] = useState(null);
  const horario = horarioDraft ?? horarioAcceso;
  const horarioChanged = horarioDraft !== null;

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setChanged(true);
  };

  const handleSave = () => {
    actualizarConfigNegocio(form);
    setChanged(false);
    toast.success('Configuración guardada');
  };

  const setHorario = (updater) => {
    setHorarioDraft((prev) => {
      const base = prev ?? horarioAcceso;
      return typeof updater === 'function' ? updater(base) : { ...base, ...updater };
    });
  };

  const toggleDia = (val) => {
    setHorario((prev) => {
      const dias = prev.dias.includes(val) ? prev.dias.filter((d) => d !== val) : [...prev.dias, val];
      return { ...prev, dias };
    });
  };

  const handleHorarioSave = () => {
    actualizarHorarioAcceso(horario);
    setHorarioDraft(null);
    toast.success('Horario de acceso guardado');
  };

  return (
    <div className="space-y-5">
      <p className="text-[12px] text-slate-400">Datos generales del negocio. Se usan en la orden de trabajo impresa, encabezados y otros documentos.</p>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 max-w-2xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nombre del negocio</label>
              <input className={inputCls} value={form.nombre} onChange={(e) => handleChange('nombre', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>NIT</label>
              <input className={inputCls} placeholder="Ej: 12345678-9" value={form.nit} onChange={(e) => handleChange('nit', e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Dirección</label>
            <input className={inputCls} value={form.direccion} onChange={(e) => handleChange('direccion', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Teléfono</label>
              <input className={inputCls} value={form.telefono} onChange={(e) => handleChange('telefono', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Moneda</label>
              <input className={inputCls} value={form.moneda} onChange={(e) => handleChange('moneda', e.target.value)} placeholder="Q" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Slogan</label>
            <input className={inputCls} value={form.slogan} onChange={(e) => handleChange('slogan', e.target.value)} />
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
          <div>
            {changed && <span className="text-[11px] text-amber-600 font-medium">Tienes cambios sin guardar</span>}
          </div>
          <button onClick={handleSave} disabled={!changed} className={`${btnPrimary} ${!changed ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <I d={icons.save} className="w-4 h-4" />Guardar configuración
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 max-w-2xl">
        <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Vista previa (encabezado de orden)</h4>
        <div className="border border-dashed border-slate-300 rounded-lg p-4 bg-slate-50/50 text-center">
          <p className="text-lg font-bold text-primary">{form.nombre || '—'}</p>
          <p className="text-[11px] text-slate-500">{form.slogan}</p>
          <p className="text-[11px] text-slate-400 mt-1">{form.direccion}</p>
          <p className="text-[11px] text-slate-400">Tel: {form.telefono} {form.nit && `· NIT: ${form.nit}`}</p>
        </div>
      </div>

      {/* Horario de acceso */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-[13px] font-bold text-slate-800">Horario de acceso</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Restringe el ingreso al sistema fuera de este horario</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={horario.activo}
              onChange={(e) => { setHorario((p) => ({ ...p, activo: e.target.checked })); }}
            />
            <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
          </label>
        </div>

        <div className={`space-y-4 ${!horario.activo ? 'opacity-40 pointer-events-none' : ''}`}>
          {/* Horas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Hora inicio</label>
              <input
                type="time"
                className={inputCls}
                value={horario.hora_inicio}
                onChange={(e) => { setHorario((p) => ({ ...p, hora_inicio: e.target.value })); }}
              />
            </div>
            <div>
              <label className={labelCls}>Hora fin</label>
              <input
                type="time"
                className={inputCls}
                value={horario.hora_fin}
                onChange={(e) => { setHorario((p) => ({ ...p, hora_fin: e.target.value })); }}
              />
            </div>
          </div>

          {/* Días */}
          <div>
            <label className={labelCls}>Días permitidos</label>
            <div className="flex gap-1.5 flex-wrap mt-1">
              {DIAS_SEMANA.map((d) => {
                const activo = horario.dias.includes(d.val);
                return (
                  <button
                    key={d.val}
                    type="button"
                    onClick={() => toggleDia(d.val)}
                    className={`px-3 py-1.5 rounded-md text-[12px] font-semibold border transition-colors ${activo ? 'bg-primary text-white border-primary' : 'bg-white text-slate-500 border-slate-300 hover:border-primary'}`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resumen */}
          {horario.activo && (
            <p className="text-[11px] text-slate-500 bg-slate-50 rounded-md px-3 py-2 border border-slate-200">
              Acceso permitido de <strong>{horario.hora_inicio}</strong> a <strong>{horario.hora_fin}</strong> los días:{' '}
              <strong>{DIAS_SEMANA.filter((d) => horario.dias.includes(d.val)).map((d) => d.label).join(', ') || 'ninguno'}</strong>
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
          <div>
            {horarioChanged && <span className="text-[11px] text-amber-600 font-medium">Tienes cambios sin guardar</span>}
          </div>
          <button onClick={handleHorarioSave} disabled={!horarioChanged} className={`${btnPrimary} ${!horarioChanged ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <I d={icons.save} className="w-4 h-4" />Guardar horario
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TAB: REPUESTOS
   ═══════════════════════════════════════════════════════════════════════════════ */
function TabRepuestos() {
  const { repuestos, agregarRepuesto, editarRepuesto, eliminarRepuesto } = useCatalogos();
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal]       = useState(null); // null | 'nuevo' | objeto repuesto
  const [form, setForm]         = useState({ nombre: '', descripcion: '', categoria: '', precio: '', stock: '' });
  const [confirm, setConfirm]   = useState(null);

  const filtrados = useMemo(
    () => repuestos.filter((r) =>
      String(r.nombre    ?? '').toLowerCase().includes(busqueda.toLowerCase()) ||
      String(r.categoria ?? '').toLowerCase().includes(busqueda.toLowerCase()) ||
      String(r.id        ?? '').toLowerCase().includes(busqueda.toLowerCase())
    ),
    [repuestos, busqueda]
  );

  const openNew  = () => { setForm({ nombre: '', descripcion: '', categoria: '', precio: '', stock: '' }); setModal('nuevo'); };
  const openEdit = (r) => { setForm({ nombre: r.nombre || '', descripcion: r.descripcion || '', categoria: r.categoria || '', precio: r.precio || '', stock: r.stock ?? '' }); setModal(r); };
  const closeModal = () => setModal(null);

  const handleSave = () => {
    if (!form.nombre.trim()) return toast.error('El nombre es obligatorio');
    if (!form.precio || Number(form.precio) <= 0) return toast.error('Ingresa un precio válido');
    const payload = {
      nombre:      form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      categoria:   form.categoria.trim(),
      precio:      Number(form.precio),
      stock:       Number(form.stock) || 0,
    };
    if (modal === 'nuevo') {
      const existe = repuestos.some((r) => r.nombre.trim().toLowerCase() === form.nombre.trim().toLowerCase());
      if (existe) return toast.error('Ya existe un repuesto con ese nombre');
      agregarRepuesto(payload);
      toast.success('Repuesto agregado');
    } else {
      editarRepuesto(modal.id, payload);
      toast.success('Repuesto actualizado');
    }
    closeModal();
  };

  return (
    <div className="space-y-4">
      <Toolbar busqueda={busqueda} onBusqueda={setBusqueda} placeholder="Buscar por nombre, categoría o ID…" count={`${filtrados.length} repuesto(s)`} onAdd={openNew} addLabel="Nuevo repuesto" />

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider hidden sm:table-cell">ID</th>
              <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider">Nombre</th>
              <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider hidden sm:table-cell">Categoría</th>
              <th className="text-right px-4 py-2.5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider w-20 hidden md:table-cell">Stock</th>
              <th className="text-right px-4 py-2.5 font-semibold text-slate-500 uppercase text-[11px] tracking-wider w-28">Precio</th>
              <th className="px-4 py-2.5 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtrados.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400 hidden sm:table-cell">{r.id || '—'}</td>
                <td className="px-4 py-2.5 font-medium text-slate-800">
                  {r.nombre}
                  <span className="sm:hidden block text-[11px] text-slate-400">{r.categoria || ''}</span>
                </td>
                <td className="px-4 py-2.5 text-slate-500 hidden sm:table-cell">{r.categoria || '—'}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-600 hidden md:table-cell">{r.stock ?? 0}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-slate-700 tabular-nums">Q {Number(r.precio).toFixed(2)}</td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openEdit(r)} title="Editar" className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition"><I d={icons.edit} className="w-4 h-4" /></button>
                    <button onClick={() => setConfirm(r.id)} title="Eliminar" className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition"><I d={icons.trash} className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-slate-400 text-sm">Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={!!modal} onClose={closeModal} title={modal === 'nuevo' ? 'Nuevo repuesto' : 'Editar repuesto'}>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Nombre *</label>
            <input className={inputCls} placeholder="Ej: Filtro de aceite" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} autoFocus />
          </div>
          <div>
            <label className={labelCls}>Descripción</label>
            <input className={inputCls} placeholder="Ej: Filtro para motor 1.6L" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Categoría</label>
              <input className={inputCls} placeholder="Ej: Motor, Frenos…" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Stock</label>
              <input type="number" min="0" className={inputCls} placeholder="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Precio (Q) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-slate-400 font-semibold">Q</span>
              <input type="number" min="0" step="0.01" className={`${inputCls} !pl-7`} placeholder="0.00" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={closeModal} className={btnSecondary}>Cancelar</button>
            <button onClick={handleSave} className={btnPrimary}>{modal === 'nuevo' ? 'Guardar' : 'Actualizar'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!confirm} title="Eliminar repuesto" message="¿Eliminar este repuesto? Esta acción no se puede deshacer."
        onConfirm={() => { eliminarRepuesto(confirm); toast.success('Repuesto eliminado'); setConfirm(null); }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL — CATÁLOGOS
   ═══════════════════════════════════════════════════════════════════════════════ */
export default function Catalogos() {
  const [tab, setTab] = useState('clientes');
  const { cargando, resetCatalogos, clientes, vehiculos, servicios, estados, mecanicos, tiposDano, repuestos } = useCatalogos();

  if (cargando) return <SpinnerBolitas texto="Cargando catálogos..." />;

  const totalServ = servicios.reduce((a, c) => a + (c.servicios?.length ?? 0), 0);
  const kpis = [
    { label: 'Clientes',   value: clientes.length,  iconPath: icons.users  },
    { label: 'Vehículos',  value: vehiculos.length,  iconPath: icons.car    },
    { label: 'Servicios', value: totalServ,         iconPath: icons.wrench },
    { label: 'Estados',   value: estados.length,    iconPath: icons.flag   },
    { label: 'Mecánicos', value: mecanicos.length,  iconPath: icons.mec    },
    { label: 'T. Daño',   value: tiposDano.length,  iconPath: icons.damage },
    { label: 'Repuestos', value: repuestos.length,  iconPath: icons.box    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-slate-500 text-sm">Administración central de catálogos del taller</p>
        <button onClick={() => { if (window.confirm('¿Restaurar catálogos a valores iniciales?')) { resetCatalogos(); toast.success('Catálogos restaurados'); } }} className={btnSecondary}>
          <I d={icons.reset} className="w-4 h-4" />Restaurar
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2 sm:gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-lg border border-slate-200 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><I d={k.iconPath} className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /></div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-bold text-slate-800 leading-none tabular-nums">{k.value}</p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium uppercase tracking-wide mt-0.5 truncate">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-0 -mb-px">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} title={t.label}
              className={`flex flex-1 sm:flex-none items-center justify-center sm:justify-start gap-0 sm:gap-2 px-2 sm:px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-colors ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-300'}`}>
              <I d={t.iconPath} className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">{t.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div>
        {tab === 'clientes'  && <TabClientes />}
        {tab === 'vehiculos' && <TabVehiculos />}
        {tab === 'servicios' && <TabServicios />}
        {tab === 'estados'   && <TabEstados />}
        {tab === 'mecanicos' && <TabMecanicos />}
        {tab === 'tiposdano' && <TabTiposDano />}
        {tab === 'repuestos' && <TabRepuestos />}
        {tab === 'config'    && <TabConfig />}
      </div>
    </div>
  );
}
