// ── Google Apps Script Web App — cliente fetch v2 ─────────────────────────
const BASE_URL =
  'https://script.google.com/macros/s/AKfycbzYkVBTdfVImSG4SzYh-Vl2KSfrH45jox5Ha27rrHoDHMhgcqf3ttxzv7jmVXM0659M/exec';

// URL pública del Web App (se exporta para abrir/imprimir el libro completo desde el frontend)
export const APP_SCRIPT_URL = BASE_URL;

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

// Comprime una imagen antes de subirla (máx 1024px, calidad 0.75)
function _comprimirImagen(file, maxPx = 1024, calidad = 0.75) {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) { resolve(file); return; }
    const img    = new Image();
    const objUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objUrl);
      const scale  = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w      = Math.round(img.width  * scale);
      const h      = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })),
        'image/jpeg',
        calidad,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objUrl); resolve(file); };
    img.src = objUrl;
  });
}

// Para archivos grandes (fotos): usa POST real con body text/plain (sin preflight CORS)
async function postArchivo(body) {
  const res = await fetch(BASE_URL, {
    method:   'POST',
    redirect: 'follow',
    body:     JSON.stringify(body),
    // Sin Content-Type explícito → text/plain → no dispara preflight CORS
  });
  // Leer como texto primero para poder diagnosticar respuestas no-JSON
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    // GAS devolvió HTML u otra respuesta no-JSON
    const preview = text.replace(/<[^>]+>/g, '').trim().slice(0, 120);
    throw new Error(`Respuesta inesperada del servidor: ${preview}`);
  }
  if (!json.ok) throw new Error(json.error || 'Error al subir archivo');
  return json.data;
}

// ═══════════════════════════════════════════════════════════════════════════
export const api = {

  // ── Solicitudes ───────────────────────────────────────────────────────
  getSolicitudes: () => get('solicitudes').then((data) =>
    data.map((s) => ({ ...s, fecha: (s.fecha || '').slice(0, 10) }))
  ),
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

  // ── Vehículos ─────────────────────────────────────────────────────────
  getVehiculos:     ()          => get('vehiculos'),
  crearVehiculo:    (datos)     => post({ accion: 'crearVehiculo',    datos }),
  editarVehiculo:   (id, datos) => post({ accion: 'editarVehiculo',   id, datos }),
  eliminarVehiculo: (id)        => post({ accion: 'eliminarVehiculo', id }),

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

  // ── Archivos / Fotos (Drive) ──────────────────────────────────────────
  // archivo: File object del input[type=file]
  // Retorna: { url, id, nombre }
  subirFoto: async (archivo) => {
    const comprimido = await _comprimirImagen(archivo);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = e.target.result.split(',')[1];
          const data = await postArchivo({
            accion: 'subirArchivo',
            base64,
            nombre: comprimido.name || `foto_${Date.now()}.jpg`,
            tipo:   'image/jpeg',
          });
          resolve(data);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(comprimido);
    });
  },

  // ── Bitácora ──────────────────────────────────────────────────────────
  getBitacora: ()      => get('bitacora'),
  log:         (datos) => post({ accion: 'logBitacora', datos }),
};
