import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/sheetsApi';
import { toast } from 'sonner';

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

// ── Notificaciones nativas del navegador ────────────────────────────────────
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
    } catch { /* fallback silencioso */ }
  }
}

// ── Constantes ──────────────────────────────────────────────────────────────
const POLL_INTERVAL = 30_000;
const NOTIFS_KEY = 'drivebot_notifs';
const SEEN_KEY = 'drivebot_seen_ids';
const STALE_ALERTED_KEY = 'drivebot_stale_alerted';
const STALE_THRESHOLD_HOURS = 24;

// ── Helpers localStorage ────────────────────────────────────────────────────
function loadFromStorage(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
}
function saveToStorage(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

// ── Provider ────────────────────────────────────────────────────────────────
export function NotificacionesProvider({ children }) {
  const { user, esAdmin } = useAuth();
  const [notificaciones, setNotificaciones] = useState(() => loadFromStorage(NOTIFS_KEY, []));
  const [noLeidas, setNoLeidas] = useState(0);
  const knownIdsRef = useRef(new Set());
  const firstLoadRef = useRef(true);
  const alertedStaleRef = useRef(new Set());

  // Cargar IDs conocidos del localStorage
  useEffect(() => {
    loadFromStorage(SEEN_KEY, []).forEach((id) => knownIdsRef.current.add(id));
    loadFromStorage(STALE_ALERTED_KEY, []).forEach((id) => alertedStaleRef.current.add(id));
  }, []);

  // Persistir notificaciones cada vez que cambien
  useEffect(() => {
    saveToStorage(NOTIFS_KEY, notificaciones.slice(0, 100));
    setNoLeidas(notificaciones.filter((n) => !n.leida).length);
  }, [notificaciones]);

  const persistSeenIds = useCallback(() => {
    saveToStorage(SEEN_KEY, [...knownIdsRef.current].slice(-500));
  }, []);

  // Pedir permiso al login de admin
  useEffect(() => {
    if (user && esAdmin) pedirPermisoNotificaciones();
  }, [user, esAdmin]);

  // ── Polling de solicitudes nuevas ─────────────────────────────────────────
  useEffect(() => {
    if (!user || !esAdmin) return;

    const checkNuevas = async () => {
      try {
        const data = await api.getSolicitudes();
        if (!data?.length) return;

        if (firstLoadRef.current) {
          data.forEach((s) => knownIdsRef.current.add(s.id));
          persistSeenIds();
          firstLoadRef.current = false;
          return;
        }

        const nuevas = data.filter((s) => !knownIdsRef.current.has(s.id));
        if (nuevas.length > 0) {
          nuevas.forEach((s) => knownIdsRef.current.add(s.id));
          persistSeenIds();

          const nuevasNotifs = nuevas.map((s) => ({
            id: `notif-${s.id}-${Date.now()}`,
            solicitudId: s.id,
            titulo: 'Nueva solicitud',
            mensaje: `#${s.id} — ${s.cliente} · ${s.vehiculo}`,
            detalle: s.servicio || '',
            fecha: new Date().toISOString(),
            leida: false,
          }));

          setNotificaciones((prev) => [...nuevasNotifs, ...prev].slice(0, 100));

          // Sonner toast + nativa + sonido
          nuevas.forEach((s) => {
            const titulo = `Nueva solicitud #${s.id}`;
            const cuerpo = `${s.cliente} — ${s.vehiculo} · ${s.servicio}`;
            enviarNotificacionNativa(titulo, cuerpo);
            toast.info(titulo, {
              description: cuerpo,
              duration: 8000,
              icon: '🔔',
            });
          });
          playNotifSound();
        }

        // ── Detección de órdenes estancadas (> STALE_THRESHOLD_HOURS en proceso) ──
        const ahora = new Date();
        const stales = data.filter((s) => {
          if (s.estado !== 'En proceso') return false;
          if (alertedStaleRef.current.has(s.id)) return false;
          const fechaIngreso = new Date((s.fecha || '') + 'T00:00:00');
          if (isNaN(fechaIngreso.getTime())) return false;
          const horas = (ahora - fechaIngreso) / (1000 * 60 * 60);
          return horas >= STALE_THRESHOLD_HOURS;
        });

        if (stales.length > 0) {
          stales.forEach((s) => alertedStaleRef.current.add(s.id));
          saveToStorage(STALE_ALERTED_KEY, [...alertedStaleRef.current].slice(-500));

          const staleNotifs = stales.map((s) => ({
            id: `stale-${s.id}-${Date.now()}`,
            solicitudId: s.id,
            titulo: 'Orden sin actualizar',
            mensaje: `#${s.id} — ${s.cliente} · ${s.vehiculo}`,
            detalle: `Lleva más de ${STALE_THRESHOLD_HOURS}h en proceso`,
            fecha: new Date().toISOString(),
            leida: false,
          }));

          setNotificaciones((prev) => [...staleNotifs, ...prev].slice(0, 100));

          stales.forEach((s) => {
            toast.warning(`Orden #${s.id} sin actualizar`, {
              description: `${s.cliente} lleva más de ${STALE_THRESHOLD_HOURS}h en proceso`,
              duration: 8000,
              icon: '⚠️',
            });
          });
        }
      } catch { /* silencio en error de red */ }
    };

    checkNuevas();
    const interval = setInterval(checkNuevas, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [user, esAdmin, persistSeenIds]);

  // ── Acciones ──────────────────────────────────────────────────────────────
  const toggleLeida = useCallback((id) => {
    setNotificaciones((prev) =>
      prev.map((n) => n.id === id ? { ...n, leida: !n.leida } : n)
    );
  }, []);

  const marcarLeida = useCallback((id) => {
    setNotificaciones((prev) =>
      prev.map((n) => n.id === id ? { ...n, leida: true } : n)
    );
  }, []);

  const marcarTodasLeidas = useCallback(() => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
  }, []);

  const marcarTodasNoLeidas = useCallback(() => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: false })));
  }, []);

  const eliminarNotificacion = useCallback((id) => {
    setNotificaciones((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const limpiarNotificaciones = useCallback(() => {
    setNotificaciones([]);
  }, []);

  return (
    <NotificacionesContext.Provider value={{
      notificaciones,
      noLeidas,
      toggleLeida,
      marcarLeida,
      marcarTodasLeidas,
      marcarTodasNoLeidas,
      eliminarNotificacion,
      limpiarNotificaciones,
    }}>
      {children}
    </NotificacionesContext.Provider>
  );
}

export const useNotificaciones = () => useContext(NotificacionesContext);
