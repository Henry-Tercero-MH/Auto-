import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/sheetsApi';
import toast from 'react-hot-toast';

const NotificacionesContext = createContext();

// ── Sonido de notificación (web audio API — sin archivo externo) ────────────
function playNotifSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch { /* silencio si no soporta audio */ }
}

// ── Pedir permiso para notificaciones del navegador ─────────────────────────
async function pedirPermisoNotificaciones() {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission !== 'denied') {
    return await Notification.requestPermission();
  }
  return Notification.permission;
}

function enviarNotificacionNativa(titulo, cuerpo) {
  if (Notification.permission === 'granted') {
    try {
      new Notification(titulo, {
        body: cuerpo,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        vibrate: [200, 100, 200],
        tag: 'nueva-solicitud',
      });
    } catch { /* SW notification fallback no necesario por ahora */ }
  }
}

// ── Provider ────────────────────────────────────────────────────────────────
const POLL_INTERVAL = 30_000; // 30 segundos
const STORAGE_KEY = 'drivebot_notifs';
const SEEN_KEY = 'drivebot_seen_ids';

export function NotificacionesProvider({ children }) {
  const { user, esAdmin } = useAuth();
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const knownIdsRef = useRef(new Set());
  const firstLoadRef = useRef(true);

  // Cargar IDs conocidos del localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
      saved.forEach((id) => knownIdsRef.current.add(id));
    } catch {}
  }, []);

  // Guardar IDs conocidos
  const persistSeenIds = useCallback(() => {
    const arr = [...knownIdsRef.current].slice(-500); // max 500
    localStorage.setItem(SEEN_KEY, JSON.stringify(arr));
  }, []);

  // Pedir permiso al login de admin
  useEffect(() => {
    if (user && esAdmin) {
      pedirPermisoNotificaciones();
    }
  }, [user, esAdmin]);

  // ── Polling de solicitudes nuevas ─────────────────────────────────────────
  useEffect(() => {
    if (!user || !esAdmin) return;

    const checkNuevas = async () => {
      try {
        const data = await api.getSolicitudes();
        if (!data?.length) return;

        if (firstLoadRef.current) {
          // Primera carga: registrar todas las IDs existentes sin notificar
          data.forEach((s) => knownIdsRef.current.add(s.id));
          persistSeenIds();
          firstLoadRef.current = false;
          return;
        }

        // Detectar IDs nuevas
        const nuevas = data.filter((s) => !knownIdsRef.current.has(s.id));
        if (nuevas.length > 0) {
          nuevas.forEach((s) => knownIdsRef.current.add(s.id));
          persistSeenIds();

          const nuevasNotifs = nuevas.map((s) => ({
            id: `notif-${s.id}-${Date.now()}`,
            solicitudId: s.id,
            titulo: 'Nueva solicitud',
            mensaje: `#${s.id} — ${s.cliente} · ${s.vehiculo}`,
            fecha: new Date().toISOString(),
            leida: false,
          }));

          setNotificaciones((prev) => [...nuevasNotifs, ...prev].slice(0, 50));

          // Notificación nativa + sonido + toast
          nuevas.forEach((s) => {
            const titulo = `Nueva solicitud #${s.id}`;
            const cuerpo = `${s.cliente} — ${s.vehiculo} · ${s.servicio}`;
            enviarNotificacionNativa(titulo, cuerpo);
            toast(cuerpo, {
              icon: '🔔',
              duration: 6000,
              style: { borderLeft: '4px solid #e53935' },
            });
          });

          playNotifSound();
        }
      } catch { /* silencio en error de red */ }
    };

    checkNuevas();
    const interval = setInterval(checkNuevas, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [user, esAdmin, persistSeenIds]);

  // ── Contar no leídas ──────────────────────────────────────────────────────
  useEffect(() => {
    setNoLeidas(notificaciones.filter((n) => !n.leida).length);
  }, [notificaciones]);

  // ── Acciones ──────────────────────────────────────────────────────────────
  const marcarLeida = useCallback((id) => {
    setNotificaciones((prev) => prev.map((n) => n.id === id ? { ...n, leida: true } : n));
  }, []);

  const marcarTodasLeidas = useCallback(() => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
  }, []);

  const limpiarNotificaciones = useCallback(() => {
    setNotificaciones([]);
  }, []);

  return (
    <NotificacionesContext.Provider value={{
      notificaciones,
      noLeidas,
      marcarLeida,
      marcarTodasLeidas,
      limpiarNotificaciones,
    }}>
      {children}
    </NotificacionesContext.Provider>
  );
}

export const useNotificaciones = () => useContext(NotificacionesContext);
