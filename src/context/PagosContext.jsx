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

  useEffect(() => {
    api.getPagos().then(setPagos).catch(() => {});
  }, []);

  // Crear pago al registrar una nueva solicitud
  const agregarPago = useCallback(async (datos) => {
    const result = await api.crearPago(datos);
    const id = result?.id ?? null;
    setPagos((prev) => [...prev, { ...datos, id }]);
  }, []);

  // Actualizar estado del pago cuando cambia el estado de la solicitud
  const sincronizarEstado = useCallback(async (solicitudId, nuevoEstadoSolicitud) => {
    const pago = pagos.find((p) => p.solicitud_id === solicitudId);
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

  return (
    <PagosContext.Provider value={{ pagos, agregarPago, sincronizarEstado }}>
      {children}
    </PagosContext.Provider>
  );
}

export const usePagos = () => useContext(PagosContext);
