import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/sheetsApi';

const SolicitudesContext = createContext();

// Datos dummy usados SOLO como fallback offline / primera carga
const DUMMY = [
  { id: '0128', cliente: 'Carlos Medina',     tel: '555-1001', vehiculo: 'Toyota Corolla 2021',   placa: 'ABC-001', servicio: 'Cambio de aceite',     estado: 'Completada', fecha: '2026-02-28', mecanico: { id: 'M001', name: 'Pedro Hernández' } },
  { id: '0127', cliente: 'María López',       tel: '555-1002', vehiculo: 'Honda Civic 2019',      placa: 'DEF-202', servicio: 'Revisión de frenos',    estado: 'En proceso', fecha: '2026-03-01', mecanico: { id: 'M002', name: 'Juan Carlos López' } },
  { id: '0126', cliente: 'Roberto García',    tel: '555-1003', vehiculo: 'Nissan Sentra 2020',    placa: 'GHI-303', servicio: 'Scaner',                estado: 'En proceso', fecha: '2026-03-01', mecanico: { id: 'M003', name: 'Marco Tulio Reyes' } },
  { id: '0125', cliente: 'Ana Torres',        tel: '555-1004', vehiculo: 'Chevrolet Spark 2022',  placa: 'JKL-404', servicio: 'Alineación y balanceo', estado: 'Pendiente',  fecha: '2026-03-02', mecanico: null },
  { id: '0124', cliente: 'Luis Ramírez',      tel: '555-1005', vehiculo: 'Ford Focus 2018',       placa: 'MNO-505', servicio: 'Suspensión',            estado: 'Completada', fecha: '2026-02-25', mecanico: { id: 'M004', name: 'José Alfredo Ruiz' } },
  { id: '0123', cliente: 'Patricia Vega',     tel: '555-1006', vehiculo: 'Kia Sportage 2020',     placa: 'PQR-606', servicio: 'Servicio completo',     estado: 'Pendiente',  fecha: '2026-03-02', mecanico: null },
  { id: '0122', cliente: 'Jorge Castillo',    tel: '555-1007', vehiculo: 'Hyundai Tucson 2021',   placa: 'STU-707', servicio: 'Ruido delantero',       estado: 'En proceso', fecha: '2026-03-01', mecanico: { id: 'M001', name: 'Pedro Hernández' } },
  { id: '0121', cliente: 'Sandra Morales',    tel: '555-1008', vehiculo: 'Volkswagen Jetta 2019', placa: 'VWX-808', servicio: 'Servicio motor',        estado: 'Completada', fecha: '2026-02-27', mecanico: { id: 'M002', name: 'Juan Carlos López' } },
  { id: '0120', cliente: 'Eduardo Flores',    tel: '555-1009', vehiculo: 'Mazda CX-5 2022',       placa: 'YZA-909', servicio: 'Servicio frenos',       estado: 'Pendiente',  fecha: '2026-03-02', mecanico: null },
  { id: '0119', cliente: 'Claudia Herrera',   tel: '555-1010', vehiculo: 'Renault Logan 2018',    placa: 'BCD-010', servicio: 'Ruido trasero',         estado: 'Completada', fecha: '2026-02-26', mecanico: { id: 'M003', name: 'Marco Tulio Reyes' } },
];

export function SolicitudesProvider({ children }) {
  const [solicitudes, setSolicitudes] = useState(DUMMY);
  const [cargando, setCargando]       = useState(true);
  const [error, setError]             = useState(null);

  // ── Carga inicial desde Sheets ──────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    api.getSolicitudes()
      .then((data) => { if (mounted) setSolicitudes(data); })
      .catch((e)   => { if (mounted) setError(e.message); })
      .finally(()  => { if (mounted) setCargando(false); });
    return () => { mounted = false; };
  }, []);

  // ── Cambiar estado ──────────────────────────────────────────────────────
  const cambiarEstado = useCallback(async (id, nuevoEstado) => {
    // optimista
    setSolicitudes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, estado: nuevoEstado } : s))
    );
    try {
      await api.cambiarEstado(id, nuevoEstado);
    } catch (e) {
      setError(e.message);
      // revertir en error: recargar desde Sheets
      api.getSolicitudes().then(setSolicitudes).catch(() => {});
    }
  }, []);

  // ── Tomar solicitud (mecánico se asigna) ────────────────────────────────
  const tomarSolicitud = useCallback(async (id, mecanico) => {
    setSolicitudes((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, mecanico, estado: 'En proceso' } : s
      )
    );
    try {
      await api.tomarSolicitud(id, mecanico);
    } catch (e) {
      setError(e.message);
      api.getSolicitudes().then(setSolicitudes).catch(() => {});
    }
  }, []);

  // ── Agregar nueva solicitud ─────────────────────────────────────────────
  const agregarSolicitud = useCallback(async (datos) => {
    try {
      const { id } = await api.crearSolicitud(datos);
      // agregar al inicio con el id real devuelto por Sheets
      setSolicitudes((prev) => [
        { ...datos, id, mecanico: datos.mecanico ?? null },
        ...prev,
      ]);
      return id;
    } catch (e) {
      setError(e.message);
      throw e;
    }
  }, []);

  // ── Editar solicitud ────────────────────────────────────────────────────
  const editarSolicitud = useCallback(async (id, datos) => {
    setSolicitudes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...datos } : s))
    );
    try {
      await api.editarSolicitud(id, datos);
    } catch (e) {
      setError(e.message);
      api.getSolicitudes().then(setSolicitudes).catch(() => {});
    }
  }, []);

  // ── Eliminar solicitud ──────────────────────────────────────────────────
  const eliminarSolicitud = useCallback(async (id) => {
    setSolicitudes((prev) => prev.filter((s) => s.id !== id));
    try {
      await api.eliminarSolicitud(id);
    } catch (e) {
      setError(e.message);
      api.getSolicitudes().then(setSolicitudes).catch(() => {});
    }
  }, []);

  // ── Refrescar manualmente ───────────────────────────────────────────────
  const refrescar = useCallback(() => {
    setCargando(true);
    api.getSolicitudes()
      .then(setSolicitudes)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  return (
    <SolicitudesContext.Provider
      value={{
        solicitudes,
        cargando,
        error,
        cambiarEstado,
        tomarSolicitud,
        agregarSolicitud,
        editarSolicitud,
        eliminarSolicitud,
        refrescar,
      }}
    >
      {children}
    </SolicitudesContext.Provider>
  );
}

export const useSolicitudes = () => useContext(SolicitudesContext);
