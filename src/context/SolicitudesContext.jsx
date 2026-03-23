import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/sheetsApi';

const SolicitudesContext = createContext();

export function SolicitudesProvider({ children }) {
  const [solicitudes, setSolicitudes] = useState([]);
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

  // ── Polling automático cada 45 s (sincroniza todas las instancias) ──────
  useEffect(() => {
    const interval = setInterval(() => {
      api.getSolicitudes().then(setSolicitudes).catch(() => {});
    }, 45_000);
    return () => clearInterval(interval);
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
