import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CATEGORIAS_SERVICIOS as SERV_INICIAL } from '../data/servicios';
import { MARCAS_INICIAL } from '../data/marcas';

const CatalogosContext = createContext();
const STORAGE_KEY = 'drivebot_catalogos';

// ── helpers para persistencia ────────────────────────────────────────────────
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ── Clientes iniciales (demo) ─────────────────────────────────────────────
const CLIENTES_INICIAL = [
  { id: 'C001', nombre: 'Carlos Medina',     telefono: '555-1001' },
  { id: 'C002', nombre: 'María López',       telefono: '555-1002' },
  { id: 'C003', nombre: 'Roberto García',    telefono: '555-1003' },
  { id: 'C004', nombre: 'Ana Torres',        telefono: '555-1004' },
  { id: 'C005', nombre: 'Luis Ramírez',      telefono: '555-1005' },
];

// ── Estados de solicitud iniciales ────────────────────────────────────────
const ESTADOS_INICIAL = [
  { id: 'E01', nombre: 'Pendiente',   color: '#f59e0b', bgClass: 'bg-amber-100 text-amber-700',   dotClass: 'bg-amber-500',  orden: 1, timelineLabel: 'Recibido',    timelineDesc: 'Vehículo ingresado al taller' },
  { id: 'E02', nombre: 'En proceso',  color: '#f97316', bgClass: 'bg-orange-100 text-orange-700', dotClass: 'bg-orange-500', orden: 2, timelineLabel: 'En proceso',  timelineDesc: 'Diagnóstico y reparación en curso' },
  { id: 'E03', nombre: 'Completada',  color: '#22c55e', bgClass: 'bg-green-100 text-green-700',   dotClass: 'bg-green-500',  orden: 3, timelineLabel: 'Listo',        timelineDesc: 'Vehículo listo para entrega' },
];

// ── Mecánicos iniciales (demo) ────────────────────────────────────────────
const MECANICOS_INICIAL = [
  { id: 'M001', nombre: 'Pedro Hernández',   especialidad: 'Motor y transmisión', telefono: '555-2001', activo: true },
  { id: 'M002', nombre: 'Juan Carlos López', especialidad: 'Frenos y suspensión', telefono: '555-2002', activo: true },
  { id: 'M003', nombre: 'Marco Tulio Reyes', especialidad: 'Sistema eléctrico',   telefono: '555-2003', activo: true },
  { id: 'M004', nombre: 'José Alfredo Ruiz', especialidad: 'Tren delantero',      telefono: '555-2004', activo: true },
];

// ── Tipos de daño para inspección ─────────────────────────────────────────
const TIPOS_DANO_INICIAL = [
  { id: 'D01', clave: 'rayon',      label: 'Rayón',       fill: '#fef9c3', stroke: '#ca8a04', dot: '#ca8a04' },
  { id: 'D02', clave: 'golpe',      label: 'Golpe',       fill: '#ffedd5', stroke: '#ea580c', dot: '#ea580c' },
  { id: 'D03', clave: 'rotura',     label: 'Rotura',      fill: '#fee2e2', stroke: '#dc2626', dot: '#dc2626' },
];

// ── Configuración del negocio ─────────────────────────────────────────────
const CONFIG_NEGOCIO_INICIAL = {
  nombre:    'AUTO+',
  direccion: 'Ciudad de Guatemala, Guatemala',
  telefono:  '555-0000',
  moneda:    'Q',
  nit:       '',
  slogan:    'Servicio automotriz profesional',
};

// ── Provider ──────────────────────────────────────────────────────────────
export function CatalogosProvider({ children }) {
  const saved = loadFromStorage();

  const [clientes, setClientes]         = useState(saved?.clientes       ?? CLIENTES_INICIAL);
  const [marcas, setMarcas]             = useState(saved?.marcas         ?? MARCAS_INICIAL);
  const [servicios, setServicios]       = useState(saved?.servicios      ?? SERV_INICIAL);
  const [estados, setEstados]           = useState(saved?.estados        ?? ESTADOS_INICIAL);
  const [mecanicos, setMecanicos]       = useState(saved?.mecanicos      ?? MECANICOS_INICIAL);
  const [tiposDano, setTiposDano]       = useState(saved?.tiposDano      ?? TIPOS_DANO_INICIAL);
  const [configNegocio, setConfigNegocio] = useState(saved?.configNegocio ?? CONFIG_NEGOCIO_INICIAL);

  // persistir cada cambio
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ clientes, marcas, servicios, estados, mecanicos, tiposDano, configNegocio }));
  }, [clientes, marcas, servicios, estados, mecanicos, tiposDano, configNegocio]);

  // ── CLIENTES ──────────────────────────────────────────────────────────
  const agregarCliente = useCallback((cliente) => {
    setClientes((prev) => [...prev, { ...cliente, id: `C${String(prev.length + 1).padStart(3, '0')}` }]);
  }, []);

  const editarCliente = useCallback((id, data) => {
    setClientes((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  }, []);

  const eliminarCliente = useCallback((id) => {
    setClientes((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // ── MARCAS / MODELOS ─────────────────────────────────────────────────
  const agregarMarca = useCallback((nombre) => {
    setMarcas((prev) => ({ ...prev, [nombre]: {} }));
  }, []);

  const eliminarMarca = useCallback((nombre) => {
    setMarcas((prev) => {
      const next = { ...prev };
      delete next[nombre];
      return next;
    });
  }, []);

  const agregarModelo = useCallback((marca, modelo, desde, hasta) => {
    setMarcas((prev) => ({
      ...prev,
      [marca]: {
        ...prev[marca],
        [modelo]: { desde, ...(hasta ? { hasta } : {}) },
      },
    }));
  }, []);

  const eliminarModelo = useCallback((marca, modelo) => {
    setMarcas((prev) => {
      const next = { ...prev, [marca]: { ...prev[marca] } };
      delete next[marca][modelo];
      return next;
    });
  }, []);

  // ── SERVICIOS (por categoría) ─────────────────────────────────────────
  const agregarCategoria = useCallback((categoria) => {
    setServicios((prev) => [
      ...prev,
      {
        categoria: categoria.nombre,
        icon: categoria.icon || '📋',
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

  const agregarServicio = useCallback((catNombre, servicio) => {
    setServicios((prev) =>
      prev.map((c) =>
        c.categoria === catNombre
          ? { ...c, servicios: [...c.servicios, servicio] }
          : c
      )
    );
  }, []);

  const editarServicio = useCallback((catNombre, nombreOriginal, data) => {
    setServicios((prev) =>
      prev.map((c) =>
        c.categoria === catNombre
          ? {
              ...c,
              servicios: c.servicios.map((s) =>
                s.nombre === nombreOriginal ? { ...s, ...data } : s
              ),
            }
          : c
      )
    );
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

  // ── RESET ─────────────────────────────────────────────────────────────
  const resetCatalogos = useCallback(() => {
    setClientes(CLIENTES_INICIAL);
    setMarcas(MARCAS_INICIAL);
    setServicios(SERV_INICIAL);
    setEstados(ESTADOS_INICIAL);
    setMecanicos(MECANICOS_INICIAL);
    setTiposDano(TIPOS_DANO_INICIAL);
    setConfigNegocio(CONFIG_NEGOCIO_INICIAL);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // ── ESTADOS DE SOLICITUD ──────────────────────────────────────────────
  const agregarEstado = useCallback((estado) => {
    setEstados((prev) => [...prev, { ...estado, id: `E${String(prev.length + 1).padStart(2, '0')}`, orden: prev.length + 1 }]);
  }, []);

  const editarEstado = useCallback((id, data) => {
    setEstados((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e)));
  }, []);

  const eliminarEstado = useCallback((id) => {
    setEstados((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // ── MECÁNICOS ─────────────────────────────────────────────────────────
  const agregarMecanico = useCallback((mec) => {
    setMecanicos((prev) => [...prev, { ...mec, id: `M${String(prev.length + 1).padStart(3, '0')}`, activo: true }]);
  }, []);

  const editarMecanico = useCallback((id, data) => {
    setMecanicos((prev) => prev.map((m) => (m.id === id ? { ...m, ...data } : m)));
  }, []);

  const eliminarMecanico = useCallback((id) => {
    setMecanicos((prev) => prev.filter((m) => m.id !== id));
  }, []);

  // ── TIPOS DE DAÑO ─────────────────────────────────────────────────────
  const agregarTipoDano = useCallback((tipo) => {
    setTiposDano((prev) => [...prev, { ...tipo, id: `D${String(prev.length + 1).padStart(2, '0')}` }]);
  }, []);

  const editarTipoDano = useCallback((id, data) => {
    setTiposDano((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
  }, []);

  const eliminarTipoDano = useCallback((id) => {
    setTiposDano((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── CONFIGURACIÓN DEL NEGOCIO ────────────────────────────────────────
  const actualizarConfigNegocio = useCallback((data) => {
    setConfigNegocio((prev) => ({ ...prev, ...data }));
  }, []);

  // ── Mapa rápido de precios (recalculado cuando cambian servicios) ─────
  const preciosMap = {};
  servicios.forEach((cat) => {
    cat.servicios.forEach((s) => {
      preciosMap[s.nombre] = s.precio;
    });
  });

  return (
    <CatalogosContext.Provider
      value={{
        // datos
        clientes,
        marcas,
        servicios,
        preciosMap,
        estados,
        mecanicos,
        tiposDano,
        configNegocio,
        // clientes
        agregarCliente,
        editarCliente,
        eliminarCliente,
        // marcas
        agregarMarca,
        eliminarMarca,
        agregarModelo,
        eliminarModelo,
        // servicios
        agregarCategoria,
        editarCategoria,
        eliminarCategoria,
        agregarServicio,
        editarServicio,
        eliminarServicio,
        // estados
        agregarEstado,
        editarEstado,
        eliminarEstado,
        // mecanicos
        agregarMecanico,
        editarMecanico,
        eliminarMecanico,
        // tipos de daño
        agregarTipoDano,
        editarTipoDano,
        eliminarTipoDano,
        // config negocio
        actualizarConfigNegocio,
        // reset
        resetCatalogos,
      }}
    >
      {children}
    </CatalogosContext.Provider>
  );
}

export const useCatalogos = () => useContext(CatalogosContext);
