// ── Metadatos de categorías de servicio ────────────────────────────────────
// Los servicios (nombre + precio) viven en Google Sheets.
// Este archivo solo conserva la metadata visual de cada categoría.

export const MONEDA = 'Q';

// Metadata de categorías — usada para enriquecer los datos que llegan de Sheets
export const CATEGORIAS_SERVICIOS = [
  { categoria: 'Servicio de Aceites',         icon: '🛢️', color: 'border-amber-200 hover:border-amber-400',   badgeColor: 'bg-amber-100 text-amber-700',   descripcion: 'Cambios de aceite y líquidos para motor, caja y sistemas hidráulicos.', duracion: '30 min - 1 hr', servicios: [] },
  { categoria: 'Servicios de Frenos',          icon: '🛑', color: 'border-red-200 hover:border-red-400',       badgeColor: 'bg-red-100 text-red-700',       descripcion: 'Revisión, ajuste y reemplazo de componentes del sistema de frenos.',     duracion: '1 - 2 hrs',    servicios: [] },
  { categoria: 'Suspensión Delantera y Trasera', icon: '🚗', color: 'border-green-200 hover:border-green-400', badgeColor: 'bg-green-100 text-green-700',   descripcion: 'Amortiguadores, resortes, bujes y soportes de suspensión.',             duracion: '2 - 4 hrs',    servicios: [] },
  { categoria: 'Sistema Eléctrico',            icon: '⚡', color: 'border-yellow-200 hover:border-yellow-400', badgeColor: 'bg-yellow-100 text-yellow-700', descripcion: 'Luces, arranque, alternador, silbines y componentes eléctricos.',       duracion: '1 - 3 hrs',    servicios: [] },
  { categoria: 'Tren Delantero y Dirección',   icon: '🔧', color: 'border-blue-200 hover:border-blue-400',     badgeColor: 'bg-blue-100 text-blue-700',     descripcion: 'Terminales, cremallera, rótulas, flechas y componentes de dirección.',  duracion: '2 - 5 hrs',    servicios: [] },
  { categoria: 'Tren Trasero',                 icon: '🔩', color: 'border-indigo-200 hover:border-indigo-400', badgeColor: 'bg-indigo-100 text-indigo-700', descripcion: 'Muletas, muñones, cojinetes y componentes del eje trasero.',            duracion: '2 - 4 hrs',    servicios: [] },
  { categoria: 'Caja y Transmisión',           icon: '⚙️', color: 'border-purple-200 hover:border-purple-400', badgeColor: 'bg-purple-100 text-purple-700', descripcion: 'Clutch, cajas automáticas y mecánicas, cruces de transmisión.',        duracion: '3 - 6 hrs',    servicios: [] },
  { categoria: 'Sistema de Enfriamiento',      icon: '❄️', color: 'border-cyan-200 hover:border-cyan-400',     badgeColor: 'bg-cyan-100 text-cyan-700',     descripcion: 'Radiador, termostato, bomba de agua y ventilador.',                    duracion: '1 - 3 hrs',    servicios: [] },
  { categoria: 'Motor',                        icon: '🏎️', color: 'border-orange-200 hover:border-orange-400', badgeColor: 'bg-orange-100 text-orange-700', descripcion: 'Reparación, cambio de motor, empaques, fajas, bujías y componentes.',  duracion: '3 - 8 hrs',    servicios: [] },
  { categoria: 'Accesorios',                   icon: '🪛', color: 'border-slate-200 hover:border-slate-400',   badgeColor: 'bg-slate-100 text-slate-700',   descripcion: 'Plumillas, guardafangos, retrovisores, manecillas y ajustes generales.', duracion: '30 min - 1 hr', servicios: [] },
];

// Formateador de moneda
export const formatQ = (valor) => `Q ${Number(valor).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
