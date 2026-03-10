import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CATEGORIAS_SERVICIOS as SERV_INICIAL } from '../data/servicios';
import { MARCAS_INICIAL } from '../data/marcas';
import { api } from '../services/sheetsApi';

const CatalogosContext = createContext();

// ── Estados de solicitud (no vienen de Sheets, se mantienen locales) ───────
const ESTADOS_INICIAL = [
  { id: 'E01', nombre: 'Pendiente',  color: '#f59e0b', bgClass: 'bg-amber-100 text-amber-700',   dotClass: 'bg-amber-500',  orden: 1, timelineLabel: 'Recibido',   timelineDesc: 'Vehículo ingresado al taller' },
  { id: 'E02', nombre: 'En proceso', color: '#f97316', bgClass: 'bg-orange-100 text-orange-700', dotClass: 'bg-orange-500', orden: 2, timelineLabel: 'En proceso', timelineDesc: 'Diagnóstico y reparación en curso' },
  { id: 'E03', nombre: 'Completada', color: '#22c55e', bgClass: 'bg-green-100 text-green-700',   dotClass: 'bg-green-500',  orden: 3, timelineLabel: 'Listo',      timelineDesc: 'Vehículo listo para entrega' },
];

// ── Tipos de daño (locales) ────────────────────────────────────────────────
const TIPOS_DANO_INICIAL = [
  { id: 'D01', clave: 'rayon',  label: 'Rayón',  fill: '#fef9c3', stroke: '#ca8a04', dot: '#ca8a04' },
  { id: 'D02', clave: 'golpe',  label: 'Golpe',  fill: '#ffedd5', stroke: '#ea580c', dot: '#ea580c' },
  { id: 'D03', clave: 'rotura', label: 'Rotura', fill: '#fee2e2', stroke: '#dc2626', dot: '#dc2626' },
];

// ── Config negocio defaults ────────────────────────────────────────────────
const CONFIG_NEGOCIO_INICIAL = {
  nombre:    'AUTO+',
  direccion: 'Ciudad de Guatemala, Guatemala',
  telefono:  '555-0000',
  moneda:    'Q',
  nit:       '',
  slogan:    'Servicio automotriz profesional',
};

// ── Horario de acceso defaults ─────────────────────────────────────────────
const HORARIO_INICIAL = {
  activo:      false,
  hora_inicio: '08:00',
  hora_fin:    '18:00',
  dias:        [1, 2, 3, 4, 5, 6], // 0=Dom 1=Lun ... 6=Sáb
};

// ── Provider ──────────────────────────────────────────────────────────────
export function CatalogosProvider({ children }) {
  // ── Estado local: algunos datos siguen siendo locales (estados, tiposDano, marcas)
  const [estados,        setEstados]        = useState(ESTADOS_INICIAL);
  const [tiposDano,      setTiposDano]      = useState(TIPOS_DANO_INICIAL);
  const [configNegocio,  setConfigNegocio]  = useState(CONFIG_NEGOCIO_INICIAL);
  const [horarioAcceso,  setHorarioAcceso]  = useState(HORARIO_INICIAL);

  // ── Estado conectado a Sheets ──────────────────────────────────────────
  const [clientes,  setClientes]  = useState([]);
  const [mecanicos, setMecanicos] = useState([]);
  const [marcas,    setMarcas]    = useState(MARCAS_INICIAL);
  const [servicios, setServicios] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);

  // ── Carga inicial desde Google Sheets ─────────────────────────────────
  useEffect(() => {
    // Clientes
    api.getClientes()
      .then((data) => { if (data?.length) setClientes(data); })
      .catch(() => {});

    // Mecánicos
    api.getMecanicos()
      .then((data) => { if (data?.length) setMecanicos(data); })
      .catch(() => {});

    // Marcas
    api.getMarcas()
      .then((data) => { if (data && Object.keys(data).length) setMarcas(data); })
      .catch(() => {});

    // Config negocio + horario
    api.getConfig()
      .then((cfg) => {
        if (!cfg) return;
        if (cfg.taller_nombre) {
          setConfigNegocio((prev) => ({
            ...prev,
            nombre: cfg.taller_nombre || prev.nombre,
            moneda: cfg.moneda        || prev.moneda,
          }));
        }
        if (cfg.horario_activo !== undefined) {
          // Sheets serializa celdas de tiempo como ISO — convertir a HH:MM
          const isoAHHMM = (val) => {
            const s = String(val || '');
            if (!s.includes('T')) return s;
            const d = new Date(s);
            return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
          };
          setHorarioAcceso({
            activo:      cfg.horario_activo === 'true' || cfg.horario_activo === true,
            hora_inicio: isoAHHMM(cfg.horario_inicio || '08:00'),
            hora_fin:    isoAHHMM(cfg.horario_fin    || '18:00'),
            dias:        cfg.horario_dias
              ? String(cfg.horario_dias).split(',').map(Number)
              : [1, 2, 3, 4, 5, 6],
          });
        }
      })
      .catch(() => {});

    // Vehículos
    api.getVehiculos()
      .then((data) => { if (data?.length) setVehiculos(data); })
      .catch(() => {});

    // Servicios desde Sheets — si está vacío se auto-sube el catálogo local (primera vez)
    const SYNC_KEY = 'drivebot_servicios_sync';
    api.getServicios()
      .then((data) => {
        console.log('[Servicios] data recibida:', data);
        console.log('[Servicios] primer item completo:', JSON.stringify(data[0]));
        if (!data?.length) {
          // Auto-subir catálogo si aún no se ha hecho
          if (!localStorage.getItem(SYNC_KEY)) {
            localStorage.setItem(SYNC_KEY, '1');
            api.sincronizarCatalogoServicios(SERV_INICIAL).catch(() => {});
          }
          return; // mantiene estado vacío
        }
        // Lookup nombre→categoría desde catálogo local (por si Sheets no tiene categoría)
        const nombreToCat = {};
        SERV_INICIAL.forEach(cat => {
          (cat.servicios || []).forEach(sv => { nombreToCat[sv.nombre] = cat.categoria; });
        });

        // Reconstruir categorías preservando metadata visual del catálogo local
        const catMap = {};
        data.forEach((s) => {
          const cat = s.categoria || nombreToCat[s.nombre] || 'Sin categoría';
          if (!catMap[cat]) {
            const local = SERV_INICIAL.find(c => c.categoria === cat);
            catMap[cat] = {
              categoria:   cat,
              icon:        local?.icon        || 'ClipboardList',
              color:       local?.color       || 'border-gray-200 hover:border-gray-400',
              badgeColor:  local?.badgeColor  || 'bg-gray-100 text-gray-700',
              descripcion: local?.descripcion || '',
              duracion:    local?.duracion    || '',
              servicios:   [],
            };
          }
          catMap[cat].servicios.push({ nombre: s.nombre, precio: s.precio });
        });
        console.log('[Servicios] catMap keys:', Object.keys(catMap));
        setServicios(Object.values(catMap));
      })
      .catch((err) => console.error('[Servicios] error:', err));
  }, []);

  // ─────────────────────────────────────────────────────────────────────
  // CLIENTES — CRUD con Sheets
  // ─────────────────────────────────────────────────────────────────────
  const agregarCliente = useCallback(async (cliente) => {
    try {
      const { id } = await api.crearCliente(cliente);
      setClientes((prev) => [...prev, { ...cliente, id }]);
    } catch {
      // fallback local
      setClientes((prev) => [
        ...prev,
        { ...cliente, id: `C${String(prev.length + 1).padStart(3, '0')}` },
      ]);
    }
  }, []);

  const editarCliente = useCallback(async (id, data) => {
    setClientes((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
    try { await api.editarCliente(id, data); } catch {}
  }, []);

  const eliminarCliente = useCallback(async (id) => {
    setClientes((prev) => prev.filter((c) => c.id !== id));
    try { await api.eliminarCliente(id); } catch {}
  }, []);

  // ─────────────────────────────────────────────────────────────────────
  // VEHÍCULOS — CRUD con Sheets
  // ─────────────────────────────────────────────────────────────────────
  const agregarVehiculo = useCallback(async (v) => {
    try {
      const { id } = await api.crearVehiculo(v);
      setVehiculos((prev) => [...prev, { ...v, id }]);
      return id;
    } catch {
      const id = `V${String(Date.now()).slice(-6)}`;
      setVehiculos((prev) => [...prev, { ...v, id }]);
      return id;
    }
  }, []);

  const editarVehiculoCat = useCallback(async (id, data) => {
    setVehiculos((prev) => prev.map((v) => (v.id === id ? { ...v, ...data } : v)));
    try { await api.editarVehiculo(id, data); } catch {}
  }, []);

  const eliminarVehiculoCat = useCallback(async (id) => {
    setVehiculos((prev) => prev.filter((v) => v.id !== id));
    try { await api.eliminarVehiculo(id); } catch {}
  }, []);

  const vehiculosPorCliente = useCallback((clienteId) =>
    vehiculos.filter((v) => v.cliente_id === clienteId),
  [vehiculos]);

  // ─────────────────────────────────────────────────────────────────────
  // MECÁNICOS — CRUD con Sheets
  // ─────────────────────────────────────────────────────────────────────
  const agregarMecanico = useCallback(async (mec) => {
    try {
      const { id } = await api.crearMecanico(mec);
      setMecanicos((prev) => [...prev, { ...mec, id, activo: true }]);
    } catch {
      setMecanicos((prev) => [
        ...prev,
        { ...mec, id: `M${String(prev.length + 1).padStart(3, '0')}`, activo: true },
      ]);
    }
  }, []);

  const editarMecanico = useCallback(async (id, data) => {
    setMecanicos((prev) => prev.map((m) => (m.id === id ? { ...m, ...data } : m)));
    try { await api.editarMecanico(id, data); } catch {}
  }, []);

  const eliminarMecanico = useCallback(async (id) => {
    setMecanicos((prev) => prev.filter((m) => m.id !== id));
    try { await api.eliminarMecanico(id); } catch {}
  }, []);

  // ─────────────────────────────────────────────────────────────────────
  // MARCAS / MODELOS — solo local (Sheets tiene copia de referencia)
  // ─────────────────────────────────────────────────────────────────────
  const agregarMarca = useCallback((nombre) => {
    setMarcas((prev) => ({ ...prev, [nombre]: {} }));
  }, []);

  const eliminarMarca = useCallback((nombre) => {
    setMarcas((prev) => { const n = { ...prev }; delete n[nombre]; return n; });
  }, []);

  const agregarModelo = useCallback((marca, modelo, desde, hasta) => {
    setMarcas((prev) => ({
      ...prev,
      [marca]: { ...prev[marca], [modelo]: { desde, ...(hasta ? { hasta } : {}) } },
    }));
  }, []);

  const eliminarModelo = useCallback((marca, modelo) => {
    setMarcas((prev) => {
      const n = { ...prev, [marca]: { ...prev[marca] } };
      delete n[marca][modelo];
      return n;
    });
  }, []);

  // ─────────────────────────────────────────────────────────────────────
  // SERVICIOS — CRUD con Sheets
  // ─────────────────────────────────────────────────────────────────────
  const agregarCategoria = useCallback((categoria) => {
    setServicios((prev) => [
      ...prev,
      {
        categoria: categoria.nombre,
        icon: categoria.icon || 'ClipboardList',
        color: 'border-gray-200 hover:border-gray-400',
        badgeColor: 'bg-gray-100 text-gray-700',
        descripcion: categoria.descripcion || '',
        duracion: categoria.duracion || '1 - 2 hrs',
        servicios: [],
      },
    ]);
  }, []);

  const editarCategoria = useCallback((catNombre, data) => {
    setServicios((prev) =>
      prev.map((c) => (c.categoria === catNombre ? { ...c, ...data } : c))
    );
  }, []);

  const eliminarCategoria = useCallback((catNombre) => {
    setServicios((prev) => prev.filter((c) => c.categoria !== catNombre));
  }, []);

  const agregarServicio = useCallback(async (catNombre, servicio) => {
    setServicios((prev) =>
      prev.map((c) =>
        c.categoria === catNombre
          ? { ...c, servicios: [...c.servicios, servicio] }
          : c
      )
    );
    try { await api.crearServicio({ ...servicio, categoria: catNombre }); } catch {}
  }, []);

  const editarServicio = useCallback(async (catNombre, nombreOriginal, data) => {
    setServicios((prev) =>
      prev.map((c) =>
        c.categoria === catNombre
          ? { ...c, servicios: c.servicios.map((s) => s.nombre === nombreOriginal ? { ...s, ...data } : s) }
          : c
      )
    );
    // En Sheets, buscar por nombre — se actualiza vía editarServicio con id si lo tuviéramos
    // Por ahora la actualización local es suficiente
  }, []);

  const eliminarServicio = useCallback((catNombre, nombre) => {
    setServicios((prev) =>
      prev.map((c) =>
        c.categoria === catNombre
          ? { ...c, servicios: c.servicios.filter((s) => s.nombre !== nombre) }
          : c
      )
    );
  }, []);

  // ─────────────────────────────────────────────────────────────────────
  // ESTADOS DE SOLICITUD (locales)
  // ─────────────────────────────────────────────────────────────────────
  const agregarEstado = useCallback((estado) => {
    setEstados((prev) => [
      ...prev,
      { ...estado, id: `E${String(prev.length + 1).padStart(2, '0')}`, orden: prev.length + 1 },
    ]);
  }, []);

  const editarEstado = useCallback((id, data) => {
    setEstados((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e)));
  }, []);

  const eliminarEstado = useCallback((id) => {
    setEstados((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // ─────────────────────────────────────────────────────────────────────
  // TIPOS DE DAÑO (locales)
  // ─────────────────────────────────────────────────────────────────────
  const agregarTipoDano = useCallback((tipo) => {
    setTiposDano((prev) => [...prev, { ...tipo, id: `D${String(prev.length + 1).padStart(2, '0')}` }]);
  }, []);

  const editarTipoDano = useCallback((id, data) => {
    setTiposDano((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
  }, []);

  const eliminarTipoDano = useCallback((id) => {
    setTiposDano((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ─────────────────────────────────────────────────────────────────────
  // CONFIG NEGOCIO — sincronizada con Sheets
  // ─────────────────────────────────────────────────────────────────────
  const actualizarConfigNegocio = useCallback(async (data) => {
    setConfigNegocio((prev) => ({ ...prev, ...data }));
    try {
      await api.guardarConfig({
        taller_nombre: data.nombre,
        moneda:        data.moneda,
      });
    } catch {}
  }, []);

  const actualizarHorarioAcceso = useCallback(async (data) => {
    setHorarioAcceso((prev) => ({ ...prev, ...data }));
    try {
      await api.guardarConfig({
        horario_activo: String(data.activo),
        horario_inicio: data.hora_inicio,
        horario_fin:    data.hora_fin,
        horario_dias:   data.dias.join(','),
      });
    } catch {}
  }, []);

  // ─────────────────────────────────────────────────────────────────────
  // RESET
  // ─────────────────────────────────────────────────────────────────────
  const resetCatalogos = useCallback(() => {
    setClientes([]);
    setMarcas(MARCAS_INICIAL);
    setServicios([]);
    setEstados(ESTADOS_INICIAL);
    setMecanicos([]);
    setTiposDano(TIPOS_DANO_INICIAL);
    setConfigNegocio(CONFIG_NEGOCIO_INICIAL);
  }, []);

  // ─────────────────────────────────────────────────────────────────────
  // Mapa rápido precio
  // ─────────────────────────────────────────────────────────────────────
  const preciosMap = {};
  servicios.forEach((cat) => {
    cat.servicios?.forEach((s) => { preciosMap[s.nombre] = s.precio; });
  });

  return (
    <CatalogosContext.Provider
      value={{
        clientes, marcas, servicios, preciosMap, estados, mecanicos, tiposDano, configNegocio, horarioAcceso,
        vehiculos, agregarVehiculo, editarVehiculoCat, eliminarVehiculoCat, vehiculosPorCliente,
        agregarCliente, editarCliente, eliminarCliente,
        agregarMarca, eliminarMarca, agregarModelo, eliminarModelo,
        agregarCategoria, editarCategoria, eliminarCategoria,
        agregarServicio, editarServicio, eliminarServicio,
        agregarEstado, editarEstado, eliminarEstado,
        agregarMecanico, editarMecanico, eliminarMecanico,
        agregarTipoDano, editarTipoDano, eliminarTipoDano,
        actualizarConfigNegocio, actualizarHorarioAcceso,
        resetCatalogos,
      }}
    >
      {children}
    </CatalogosContext.Provider>
  );
}

export const useCatalogos = () => useContext(CatalogosContext);
