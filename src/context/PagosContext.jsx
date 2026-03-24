import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/sheetsApi';

const PagosContext = createContext();

// Mapeo: estado de solicitud → estado del pago
const ESTADO_PAGO = {
  'Completada': 'Pagado',
  'Pendiente':  'Pendiente',
  'En proceso': 'Pendiente',
};

export function PagosProvider({ children }) {
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    api.getPagos()
      .then((data) => { if (mounted) setPagos(Array.isArray(data) ? data : []); })
      .catch((e) => { if (mounted) setError(e.message); })
      .finally(() => { if (mounted) setCargando(false); });
    return () => { mounted = false; };
  }, []);

  // Polling cada 45s para mantener pagos sincronizados (como Solicitudes)
  useEffect(() => {
    const interval = setInterval(() => {
      api.getPagos().then((data) => setPagos(Array.isArray(data) ? data : [])).catch(() => {});
    }, 45_000);
    return () => clearInterval(interval);
  }, []);

  // Crear pago al registrar una nueva solicitud
  const agregarPago = useCallback(async (datos) => {
    const result = await api.crearPago(datos);
    const id = result?.id ?? null;
    const pagoCreado = { ...datos, id };
    setPagos((prev) => [...prev, pagoCreado]);
    return pagoCreado;
  }, []);

  // Actualizar estado del pago cuando cambia el estado de la solicitud
  const sincronizarEstado = useCallback(async (solicitudId, nuevoEstadoSolicitud) => {
    // buscar localmente; si no está, intentar sincronizar trayendo del servidor
    let pago = pagos.find((p) => p.solicitud_id === solicitudId);
    if (!pago) {
      try {
        const all = await api.getPagos();
        setPagos(Array.isArray(all) ? all : []);
        pago = (Array.isArray(all) ? all : []).find((p) => p.solicitud_id === solicitudId);
      } catch (e) {
        console.warn('[pagos] al refrescar para sincronizar estado:', e.message);
      }
    }
    if (!pago?.id) return;
    const nuevoEstadoPago = ESTADO_PAGO[nuevoEstadoSolicitud] ?? 'Pendiente';
    setPagos((prev) =>
      prev.map((p) => p.solicitud_id === solicitudId ? { ...p, estado: nuevoEstadoPago } : p)
    );
    try {
      await api.editarPago(pago.id, { estado: nuevoEstadoPago });
    } catch (e) {
      console.warn('[pagos] no se pudo sincronizar estado:', e.message);
    }
  }, [pagos]);

  // Refrescar manualmente desde servidor
  const refrescar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await api.getPagos();
      setPagos(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  return (
    <PagosContext.Provider value={{ pagos, cargando, error, agregarPago, sincronizarEstado, refrescar }}>
      {children}
    </PagosContext.Provider>
  );
}

export const usePagos = () => useContext(PagosContext);
