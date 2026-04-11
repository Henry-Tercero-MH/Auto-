// ── DetalleOrdenes — helper genérico ─────────────────────────────────────────
// Una fila por solicitud con slots fijos para servicios, repuestos, mano de obra e inspección.
// Usa las funciones genéricas del GAS (crearHojaDinamica, insertarRegistro, editarRegistro, eliminarRegistro).

import { api } from './sheetsApi';

const HOJA = 'DetalleOrdenes';

// ── Construir headers ─────────────────────────────────────────────────────────
function buildHeaders() {
  const h = ['id', 'solicitud_id', 'fecha', 'cliente', 'vehiculo', 'placa'];
  for (let i = 1; i <= 20; i++) { h.push(`serv${i}`);  h.push(`precio_serv${i}`);  }
  for (let i = 1; i <= 20; i++) { h.push(`rep${i}`);   h.push(`precio_rep${i}`);   }
  for (let i = 1; i <= 10; i++) { h.push(`mo${i}`);    h.push(`precio_mo${i}`);    }
  for (let i = 1; i <= 10; i++) { h.push(`insp${i}`);  h.push(`tipo_insp${i}`);    }
  h.push('total_orden');
  return h;
}

export const DETALLE_HEADERS = buildHeaders();

// ── Asegurar que la hoja existe ───────────────────────────────────────────────
let hojaAsegurada = false;
async function asegurarHoja() {
  if (hojaAsegurada) return;
  await api.crearHojaDinamica(HOJA, DETALLE_HEADERS);
  hojaAsegurada = true;
}

// ── Construir objeto de datos desde los ítems de la solicitud ─────────────────
// servicios:   [{ nombre, precio }]
// repuestos:   [{ descripcion, precio }]
// manoObra:    [{ descripcion, precio }]
// inspeccion:  [{ zona, tipo }]
export function construirDatos({ solicitudId, fecha, cliente, vehiculo, placa, servicios = [], repuestos = [], manoObra = [], inspeccion = [] }) {
  const datos = {
    solicitud_id: solicitudId,
    fecha:        fecha   || '',
    cliente:      cliente || '',
    vehiculo:     vehiculo || '',
    placa:        placa   || '',
  };

  servicios.forEach((s, i) => {
    const n = i + 1;
    if (n > 20) return;
    datos[`serv${n}`]       = s.nombre  || '';
    datos[`precio_serv${n}`] = s.precio || 0;
  });

  repuestos.forEach((r, i) => {
    const n = i + 1;
    if (n > 20) return;
    datos[`rep${n}`]       = r.descripcion || '';
    datos[`precio_rep${n}`] = r.precio     || 0;
  });

  manoObra.forEach((m, i) => {
    const n = i + 1;
    if (n > 10) return;
    datos[`mo${n}`]       = m.descripcion || '';
    datos[`precio_mo${n}`] = m.precio     || 0;
  });

  inspeccion.forEach((d, i) => {
    const n = i + 1;
    if (n > 10) return;
    datos[`insp${n}`]      = d.zona || '';
    datos[`tipo_insp${n}`] = d.tipo || '';
  });

  datos.total_orden =
    servicios.reduce((s, x) => s + (x.precio  || 0), 0) +
    repuestos.reduce((s, x) => s + (x.precio  || 0), 0) +
    manoObra.reduce((s, x)  => s + (x.precio  || 0), 0);

  return datos;
}

// ── Parsea el campo "marca" de una solicitud y devuelve los ítems separados ───
const ZONA_LABELS = {
  bumper_front: 'Bumper Delantero', bumper_rear: 'Bumper Trasero',
  capot: 'Capot', cajuela: 'Cajuela',
  cristal_front: 'Cristal Delantero', cristal_rear: 'Cristal Trasero',
  techo: 'Techo', faro_izq: 'Faro Izquierdo', faro_der: 'Faro Derecho',
  calavera_izq: 'Calavera Izquierda', calavera_der: 'Calavera Derecha',
  mascara: 'Máscara / Grille',
  salp_del_izq: 'Salpicadera Del. Izq', salp_del_der: 'Salpicadera Del. Der',
  salp_tras_izq: 'Salpicadera Tras. Izq', salp_tras_der: 'Salpicadera Tras. Der',
  puerta_del_izq: 'Puerta Del. Izquierda', puerta_del_der: 'Puerta Del. Derecha',
  puerta_tras_izq: 'Puerta Tras. Izquierda', puerta_tras_der: 'Puerta Tras. Derecha',
  espejo_izq: 'Espejo Izquierdo', espejo_der: 'Espejo Derecho',
};
const TIPO_LABELS = { rayon: 'Rayón', golpe: 'Golpe', rotura: 'Rotura' };

export function parsarMarca(marca) {
  const servicios = [], repuestos = [], manoObra = [], inspeccion = [];
  if (!marca || typeof marca !== 'string' || !marca.trim())
    return { servicios, repuestos, manoObra, inspeccion };

  marca.split('|').forEach((parte) => {
    parte = parte.trim();
    if (!parte) return;
    if (parte.startsWith('S:')) {
      const p = parte.split(':');
      servicios.push({ nombre: p[1] || '', precio: parseFloat(p[2]) || 0 });
    } else if (parte.startsWith('R:')) {
      const p = parte.split(':');
      repuestos.push({ descripcion: p[2] || '', precio: parseFloat(p[3]) || 0 });
    } else if (parte.startsWith('M:')) {
      const p = parte.split(':');
      manoObra.push({ descripcion: p[1] || '', precio: parseFloat(p[2]) || 0 });
    } else if (parte.startsWith('I:')) {
      const normalizado = parte.replace('::', '__');
      const p = normalizado.split(':');
      const claveZona = (p[1] || '').replace('::', '__');
      const zonaId = claveZona.includes('__') ? claveZona.split('__')[1] : claveZona;
      const tipoRaw = p[2] || '';
      inspeccion.push({
        zona: ZONA_LABELS[zonaId] || zonaId,
        tipo: TIPO_LABELS[tipoRaw] || tipoRaw,
      });
    }
  });
  return { servicios, repuestos, manoObra, inspeccion };
}

// ── API pública ───────────────────────────────────────────────────────────────

// Crea o actualiza la fila de una solicitud en DetalleOrdenes
export async function guardarDetalleOrden({ solicitudId, fecha, cliente, vehiculo, placa, marca, extrasServicios = [], extrasRepuestos = [], extrasManoObra = [] }) {
  await asegurarHoja();

  const parsed = parsarMarca(marca);

  // Combinar ítems originales + extras
  const servicios  = [...parsed.servicios,  ...extrasServicios];
  const repuestos  = [...parsed.repuestos,  ...extrasRepuestos];
  const manoObra   = [...parsed.manoObra,   ...extrasManoObra];
  const inspeccion = parsed.inspeccion;

  const datos = construirDatos({ solicitudId, fecha, cliente, vehiculo, placa, servicios, repuestos, manoObra, inspeccion });

  // Buscar si ya existe la fila por solicitud_id
  try {
    const registros = await api.getRegistros(HOJA);
    const existente = (registros || []).find(r => String(r.solicitud_id) === String(solicitudId));
    if (existente?.id) {
      return await api.editarRegistro(HOJA, existente.id, datos);
    }
  } catch (_) { /* si falla la búsqueda, insertar de todas formas */ }

  return await api.insertarRegistro(HOJA, datos);
}

// Elimina la fila de una solicitud en DetalleOrdenes
export async function eliminarDetalleOrden(solicitudId) {
  try {
    const registros = await api.getRegistros(HOJA);
    const existente = (registros || []).find(r => String(r.solicitud_id) === String(solicitudId));
    if (existente?.id) await api.eliminarRegistro(HOJA, existente.id);
  } catch (e) {
    console.warn('[detalleOrden] no se pudo eliminar:', e.message);
  }
}
