// ── RBAC – Control de acceso a módulos del Sidebar ─────────────────────────
// Cada clave corresponde al `path` de un item de navegación.
//
//   enabled : true → el usuario puede acceder al módulo.
//             false → el item aparece con candado y al hacer clic
//                     se muestra el modal "Adquiere este servicio".
//
// Para activar o desactivar un módulo basta con cambiar `enabled`.
// ────────────────────────────────────────────────────────────────────────────

const FEATURES = {
  '/':                { enabled: true,  label: 'Dashboard' },
  '/solicitudes':     { enabled: true,  label: 'Solicitudes' },
  '/nueva-solicitud': { enabled: true,  label: 'Nueva Solicitud' },
  '/servicios':       { enabled: true,  label: 'Servicios' },
  '/seguimiento':     { enabled: true,  label: 'Seguimiento' },
  '/catalogos':       { enabled: false, label: 'Catálogos',       description: 'Gestiona clientes, vehículos y mecánicos del taller.' },
  '/reportes':        { enabled: false, label: 'Reportes',         description: 'Genera reportes de ingresos, servicios y rendimiento del taller.' },
  'notificaciones':   { enabled: false, label: 'Notificaciones',   description: 'Recibe alertas en tiempo real sobre el estado de las solicitudes.' },
  'fotos':            { enabled: false, label: 'Fotos de solicitud', description: 'Adjunta y visualiza fotos del vehículo en cada solicitud.' },
};

// ── Datos de contacto del desarrollador (se muestran en el modal) ──────────
export const DEV_CONTACT = {
  nombre: 'Henry Tercero',
  telefono: '+502 4070-5002',
  whatsapp: 'https://wa.me/50240705002',
};

// ── Helpers ────────────────────────────────────────────────────────────────

/** Verifica si una ruta/módulo está habilitado */
export function isFeatureEnabled(path) {
  const feature = FEATURES[path];
  // Si la ruta no está registrada, se permite por defecto
  return feature ? feature.enabled : true;
}

/** Devuelve la etiqueta legible de un módulo */
export function getFeatureLabel(path) {
  return FEATURES[path]?.label ?? path;
}

/** Devuelve la descripción de un módulo bloqueado */
export function getFeatureDescription(path) {
  return FEATURES[path]?.description ?? '';
}

/** Devuelve el mapa completo (útil para un panel de admin futuro) */
export function getAllFeatures() {
  return { ...FEATURES };
}

export default FEATURES;
