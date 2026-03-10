// ── Google Apps Script Web App — cliente fetch v2 ─────────────────────────
const BASE_URL =
  'https://script.google.com/macros/s/AKfycbySAdeeNuPfVMhvnJEFuOYhPELVJiNhB_EOkhnVK5IFAXgRV8lZgK9z5EJA9LVndBe4/exec';

// ── helpers internos ──────────────────────────────────────────────────────

async function get(recurso, id = null) {
  const url = new URL(BASE_URL);
  url.searchParams.set('recurso', recurso);
  if (id) url.searchParams.set('id', id);
  const res  = await fetch(url.toString(), { redirect: 'follow' });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || `Error al obtener ${recurso}`);
  return json.data;
}

async function post(body) {
  // GAS no soporta preflight CORS en POST.
  // Solución: enviar como GET con el payload en ?payload=... (no dispara preflight)
  const url = new URL(BASE_URL);
  url.searchParams.set('payload', JSON.stringify(body));
  const res  = await fetch(url.toString(), { redirect: 'follow' });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || `Error en acción: ${body.accion}`);
  return json.data;
}

// ═══════════════════════════════════════════════════════════════════════════
export const api = {

  // ── Solicitudes ───────────────────────────────────────────────────────
  getSolicitudes:    ()             => get('solicitudes'),
  getSolicitud:      (id)           => get('solicitudes', id),
  crearSolicitud:    (datos)        => post({ accion: 'crearSolicitud',    datos }),
  editarSolicitud:   (id, datos)    => post({ accion: 'editarSolicitud',   id, datos }),
  tomarSolicitud:    (id, mecanico) => post({ accion: 'tomarSolicitud',    id, mecanico }),
  cambiarEstado:     (id, estado)   => post({ accion: 'cambiarEstado',     id, estado }),
  eliminarSolicitud: (id)           => post({ accion: 'eliminarSolicitud', id }),

  // ── Mecánicos ─────────────────────────────────────────────────────────
  getMecanicos:     ()          => get('mecanicos'),
  getMecanico:      (id)        => get('mecanicos', id),
  crearMecanico:    (datos)     => post({ accion: 'crearMecanico',    datos }),
  editarMecanico:   (id, datos) => post({ accion: 'editarMecanico',   id, datos }),
  eliminarMecanico: (id)        => post({ accion: 'eliminarMecanico', id }),

  // ── Clientes ──────────────────────────────────────────────────────────
  getClientes:     ()          => get('clientes'),
  getCliente:      (id)        => get('clientes', id),
  crearCliente:    (datos)     => post({ accion: 'crearCliente',    datos }),
  editarCliente:   (id, datos) => post({ accion: 'editarCliente',   id, datos }),
  eliminarCliente: (id)        => post({ accion: 'eliminarCliente', id }),

  // ── Servicios ─────────────────────────────────────────────────────────
  getServicios:     ()          => get('servicios'),
  crearServicio:    (datos)     => post({ accion: 'crearServicio',    datos }),
  editarServicio:   (id, datos) => post({ accion: 'editarServicio',   id, datos }),
  eliminarServicio: (id)        => post({ accion: 'eliminarServicio', id }),

  // Sube todas las categorías+servicios en lotes de 5 (primera carga)
  sincronizarCatalogoServicios: async (categorias) => {
    const planos = categorias.flatMap(cat =>
      cat.servicios.map(s => ({ nombre: s.nombre, precio: s.precio, categoria: cat.categoria }))
    );
    const TAM = 5;
    for (let i = 0; i < planos.length; i += TAM) {
      await Promise.all(
        planos.slice(i, i + TAM).map(s => post({ accion: 'crearServicio', datos: s }))
      );
    }
  },

  // ── Marcas ────────────────────────────────────────────────────────────
  getMarcas: () => get('marcas'),

  // ── Config ────────────────────────────────────────────────────────────
  getConfig:     ()      => get('config'),
  guardarConfig: (datos) => post({ accion: 'guardarConfig', datos }),

  // ── Usuarios (admin / supervisor) ─────────────────────────────────────
  getUsuarios:     ()             => get('usuarios'),
  getUsuario:      (id)           => get('usuarios', id),
  crearUsuario:    (datos)        => post({ accion: 'crearUsuario',    datos }),
  editarUsuario:   (id, datos)    => post({ accion: 'editarUsuario',   id, datos }),
  eliminarUsuario: (id)           => post({ accion: 'eliminarUsuario', id }),
  loginUsuario:    (email, pass)  => post({ accion: 'loginUsuario',    email, password: pass }),

  // ── Pagos ─────────────────────────────────────────────────────────────
  getPagos:     ()          => get('pagos'),
  getPago:      (id)        => get('pagos', id),
  crearPago:    (datos)     => post({ accion: 'crearPago',    datos }),
  editarPago:   (id, datos) => post({ accion: 'editarPago',   id, datos }),
  eliminarPago: (id)        => post({ accion: 'eliminarPago', id }),

  // ── Repuestos / Inventario ────────────────────────────────────────────
  getRepuestos:     ()              => get('repuestos'),
  getRepuesto:      (id)            => get('repuestos', id),
  crearRepuesto:    (datos)         => post({ accion: 'crearRepuesto',    datos }),
  editarRepuesto:   (id, datos)     => post({ accion: 'editarRepuesto',   id, datos }),
  eliminarRepuesto: (id)            => post({ accion: 'eliminarRepuesto', id }),
  ajustarStock:     (id, cantidad)  => post({ accion: 'ajustarStock',     id, cantidad }),

  // ── Bitácora ──────────────────────────────────────────────────────────
  getBitacora: ()      => get('bitacora'),
  log:         (datos) => post({ accion: 'logBitacora', datos }),
};
