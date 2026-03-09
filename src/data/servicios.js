// ── Catálogo real de servicios del taller ──────────────────────────────────
// Moneda: Q (Quetzales - Guatemala)
// Para editar precios: modifica el valor "precio" de cada servicio.

export const MONEDA = 'Q';

export const CATEGORIAS_SERVICIOS = [
  {
    categoria: 'Servicio de Aceites',
    icon: '🛢️',
    color: 'border-amber-200 hover:border-amber-400',
    badgeColor: 'bg-amber-100 text-amber-700',
    descripcion: 'Cambios de aceite y líquidos para motor, caja y sistemas hidráulicos.',
    duracion: '30 min - 1 hr',
    servicios: [
      { nombre: 'Cambio aceite de motor',        precio: 250 },
      { nombre: 'Cambio aceite caja automática',  precio: 350 },
      { nombre: 'Cambio aceite caja mecánica',    precio: 300 },
      { nombre: 'Cambio aceite Catarina',         precio: 275 },
      { nombre: 'Cambio aceite hidráulico',       precio: 325 },
      { nombre: 'Cambio líquido freno',           precio: 200 },
      { nombre: 'Cambio refrigerante',            precio: 175 },
      { nombre: 'Cambio filtro de diesel',        precio: 150 },
    ],
  },
  {
    categoria: 'Servicios de Frenos',
    icon: '🛑',
    color: 'border-red-200 hover:border-red-400',
    badgeColor: 'bg-red-100 text-red-700',
    badge: 'Esencial',
    descripcion: 'Revisión, ajuste y reemplazo de componentes del sistema de frenos.',
    duracion: '1 - 2 hrs',
    servicios: [
      { nombre: 'Servicio general de frenos',           precio: 450 },
      { nombre: 'Cambio pastillas delanteras',          precio: 350 },
      { nombre: 'Cambio pastillas traseras',            precio: 350 },
      { nombre: 'Cambio de bomba central frenos',       precio: 500 },
      { nombre: 'Cambio bomba auxiliar frenos',         precio: 400 },
      { nombre: 'Cambio discos frenos delanteros PAR',  precio: 600 },
      { nombre: 'Cambio discos frenos traseros PAR',    precio: 600 },
    ],
  },
  {
    categoria: 'Suspensión Delantera y Trasera',
    icon: '🚗',
    color: 'border-green-200 hover:border-green-400',
    badgeColor: 'bg-green-100 text-green-700',
    descripcion: 'Amortiguadores, resortes, bujes y soportes de suspensión.',
    duracion: '2 - 4 hrs',
    servicios: [
      { nombre: 'Cambio amortiguadores Delan. resorte C/U', precio: 550 },
      { nombre: 'Cambio amortiguadores Delan. normales',    precio: 450 },
      { nombre: 'Cambio amortiguadores traseros normales',  precio: 400 },
      { nombre: 'Cambio amortiguadores Traseros resorte',   precio: 500 },
      { nombre: 'Cambio bujes amortiguadores C/U',          precio: 175 },
      { nombre: 'Cambio hules de resorte trasero C/LADO',   precio: 200 },
      { nombre: 'Cambio hoja de resorte trasero C/U',       precio: 350 },
      { nombre: 'Cambio de soportes amortiguadores',        precio: 250 },
    ],
  },
  {
    categoria: 'Sistema Eléctrico',
    icon: '⚡',
    color: 'border-yellow-200 hover:border-yellow-400',
    badgeColor: 'bg-yellow-100 text-yellow-700',
    descripcion: 'Luces, arranque, alternador, silbines y componentes eléctricos.',
    duracion: '1 - 3 hrs',
    servicios: [
      { nombre: 'Instalación de luces led',          precio: 350 },
      { nombre: 'Arreglo de silbines',                precio: 150 },
      { nombre: 'Arreglo de bulbo de freno',          precio: 100 },
      { nombre: 'Arreglos de luces de freno',         precio: 150 },
      { nombre: 'Arreglo de encendido estárter',      precio: 250 },
      { nombre: 'Cambio de Flex bocina',              precio: 200 },
      { nombre: 'Quitar y poner motor arranque',      precio: 400 },
      { nombre: 'Quitar y poner alternador',          precio: 450 },
      { nombre: 'Cambiar depósito de limpia brisas',  precio: 175 },
      { nombre: 'Cambio de silbines C/U',             precio: 125 },
    ],
  },
  {
    categoria: 'Tren Delantero y Dirección',
    icon: '🔧',
    color: 'border-blue-200 hover:border-blue-400',
    badgeColor: 'bg-blue-100 text-blue-700',
    descripcion: 'Terminales, cremallera, rótulas, flechas y componentes de dirección.',
    duracion: '2 - 5 hrs',
    servicios: [
      { nombre: 'Cambio de terminales dirección C/U',       precio: 250 },
      { nombre: 'Cambio de rackend',                         precio: 300 },
      { nombre: 'Cambio de cremallera asistida',             precio: 1800 },
      { nombre: 'Cambio cremallera hidráulica',              precio: 2000 },
      { nombre: 'Cambio caja de timón',                      precio: 1500 },
      { nombre: 'Cambio cruces de timón C/U',                precio: 200 },
      { nombre: 'Cambio guardapolvos cremallera',            precio: 250 },
      { nombre: 'Cambio barra central dirección',            precio: 400 },
      { nombre: 'Cambio cacho auxiliar',                     precio: 300 },
      { nombre: 'Cambio cacho central',                      precio: 350 },
      { nombre: 'Cambio amortiguador de dirección',          precio: 400 },
      { nombre: 'Cambio bujes muleta delantera abajo C/U',   precio: 200 },
      { nombre: 'Cambio de buje de muleta arriba PAR',       precio: 350 },
      { nombre: 'Cambio de bujes de muletas abajo 22R',      precio: 275 },
      { nombre: 'Cambio buje muleta abajo C/U',              precio: 200 },
      { nombre: 'Cambio muleta abajo completa',              precio: 600 },
      { nombre: 'Cambio rótulas abajo',                      precio: 350 },
      { nombre: 'Cambio rótula abajo',                       precio: 300 },
      { nombre: 'Cambio rótula arriba',                      precio: 325 },
      { nombre: 'Cambio hules de tornillo estabilidad C/U',  precio: 125 },
      { nombre: 'Cambio hules barra caster',                 precio: 150 },
      { nombre: 'Cambio hule barra estabilidad PAR',         precio: 200 },
      { nombre: 'Cambio cacahuates delanteros C/U',          precio: 175 },
      { nombre: 'Cambio cojinetes de bufa C/U',              precio: 300 },
      { nombre: 'Engrase de cojinetes delanteros C/LADO',    precio: 200 },
      { nombre: 'Cambio de flecha delanteras C/LADO',        precio: 700 },
      { nombre: 'Cambio de punta de flecha C/U',             precio: 400 },
      { nombre: 'Cambio de tripoide de flecha C/U',          precio: 450 },
      { nombre: 'Engrase de flechas C/LADO',                 precio: 175 },
      { nombre: 'Cambio de buje de puente C/U',              precio: 250 },
      { nombre: 'Cambio de espárragos',                      precio: 100 },
    ],
  },
  {
    categoria: 'Tren Trasero',
    icon: '🔩',
    color: 'border-indigo-200 hover:border-indigo-400',
    badgeColor: 'bg-indigo-100 text-indigo-700',
    descripcion: 'Muletas, muñones, cojinetes y componentes del eje trasero.',
    duracion: '2 - 4 hrs',
    servicios: [
      { nombre: 'Cambio de muleta graduable',          precio: 500 },
      { nombre: 'Cambio de muletas fijas',              precio: 400 },
      { nombre: 'Cambio de buje de muñón C/U',          precio: 225 },
      { nombre: 'Cambio de buje de muleta fijas C/U',   precio: 200 },
      { nombre: 'Cambio cojinetes normales C/U',        precio: 275 },
      { nombre: 'Cambio cojinetes sellados',            precio: 350 },
      { nombre: 'Cambio cojinete con bufa C/U',         precio: 400 },
      { nombre: 'Cambio de cacahuates',                 precio: 175 },
      { nombre: 'Cambio de hule barra estabilidad',     precio: 150 },
      { nombre: 'Engrase de flechas C/U',               precio: 175 },
      { nombre: 'Cambio de buje de puente',             precio: 225 },
    ],
  },
  {
    categoria: 'Caja y Transmisión',
    icon: '⚙️',
    color: 'border-purple-200 hover:border-purple-400',
    badgeColor: 'bg-purple-100 text-purple-700',
    descripcion: 'Clutch, cajas automáticas y mecánicas, cruces de transmisión.',
    duracion: '3 - 6 hrs',
    servicios: [
      { nombre: 'Cambio bomba central clutch',            precio: 500 },
      { nombre: 'Cambio bomba auxiliar clutch',            precio: 400 },
      { nombre: 'Cambio kit de clutch',                    precio: 1800 },
      { nombre: 'Cambio de caja automática',               precio: 3500 },
      { nombre: 'Cambio retenedor caja automática',        precio: 350 },
      { nombre: 'Cambio de cruces de transmisión C/U',     precio: 250 },
      { nombre: 'Cambio de retenedor de caja C/U',         precio: 300 },
    ],
  },
  {
    categoria: 'Sistema de Enfriamiento',
    icon: '❄️',
    color: 'border-cyan-200 hover:border-cyan-400',
    badgeColor: 'bg-cyan-100 text-cyan-700',
    descripcion: 'Radiador, termostato, bomba de agua y ventilador.',
    duracion: '1 - 3 hrs',
    servicios: [
      { nombre: 'Cambio de radiador',         precio: 800 },
      { nombre: 'Cambio termostato',          precio: 250 },
      { nombre: 'Cambio ventilador',          precio: 500 },
      { nombre: 'Cambio bomba de agua',        precio: 600 },
      { nombre: 'Cambio de fan clutch',        precio: 450 },
      { nombre: 'Cambio de manguera de agua',  precio: 200 },
    ],
  },
  {
    categoria: 'Motor',
    icon: '🏎️',
    color: 'border-orange-200 hover:border-orange-400',
    badgeColor: 'bg-orange-100 text-orange-700',
    badge: 'Especializado',
    descripcion: 'Reparación, cambio de motor, empaques, fajas, bujías y componentes internos.',
    duracion: '3 - 8 hrs',
    servicios: [
      { nombre: 'Cambio de motor 8 cilindros',          precio: 5500 },
      { nombre: 'Cambio motor completo 4 cilindros',    precio: 4000 },
      { nombre: 'Reparación de motor 4 cilindros',      precio: 3500 },
      { nombre: 'Reparación de motor 6 cilindros',      precio: 4500 },
      { nombre: 'Cambio empaque culata 4 cilindros',    precio: 1200 },
      { nombre: 'Cambio empaque culata 6 cilindros',    precio: 1500 },
      { nombre: 'Cambio kit de tiempo faja',            precio: 1000 },
      { nombre: 'Cambio faja única',                    precio: 350 },
      { nombre: 'Cambio fajas separadas C/U',           precio: 200 },
      { nombre: 'Cambio bobinas de encendido C/U',      precio: 300 },
      { nombre: 'Cambio de candelas',                   precio: 250 },
      { nombre: 'Cambio empaque tapadera válvulas',     precio: 400 },
      { nombre: 'Cambio de tensor de faja única',       precio: 350 },
      { nombre: 'Cambio cojinete de polea loca',        precio: 275 },
      { nombre: 'Cambio válvula VVTI',                  precio: 600 },
      { nombre: 'Cambio bomba hidráulico',              precio: 700 },
    ],
  },
  {
    categoria: 'Accesorios',
    icon: '🪛',
    color: 'border-slate-200 hover:border-slate-400',
    badgeColor: 'bg-slate-100 text-slate-700',
    descripcion: 'Plumillas, guardafangos, retrovisores, manecillas y ajustes generales.',
    duracion: '30 min - 1 hr',
    servicios: [
      { nombre: 'Cambio manecillas puertas C/Lado',    precio: 200 },
      { nombre: 'Cambio de plumillas',                  precio: 100 },
      { nombre: 'Cambio de guardafangos C/U',           precio: 300 },
      { nombre: 'Ajuste de pecheras',                   precio: 150 },
      { nombre: 'Cambio de retrovisores',               precio: 350 },
      { nombre: 'Ajuste de compuertas traseras C/U',    precio: 175 },
    ],
  },
];

// Lista plana de todos los servicios con precio (útil para búsquedas y cálculos)
export const TODOS_LOS_SERVICIOS = CATEGORIAS_SERVICIOS.flatMap((cat) =>
  cat.servicios.map((s) => ({ ...s, categoria: cat.categoria }))
);

// Mapa rápido nombre → precio
export const PRECIOS = Object.fromEntries(
  TODOS_LOS_SERVICIOS.map((s) => [s.nombre, s.precio])
);

// Lista plana solo de nombres (para selects)
export const NOMBRES_SERVICIOS = TODOS_LOS_SERVICIOS.map((s) => s.nombre);

// Lista de nombres de categorías
export const NOMBRES_CATEGORIAS = CATEGORIAS_SERVICIOS.map((cat) => cat.categoria);

// Formateador de moneda
export const formatQ = (valor) => `Q ${valor.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

