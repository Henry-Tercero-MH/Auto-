// ═══════════════════════════════════════════════════════════════════
// DRIVEBOT — Google Apps Script Web App
// ═══════════════════════════════════════════════════════════════════

const SS = SpreadsheetApp.getActiveSpreadsheet();

// ← PON AQUÍ EL ID DE LA CARPETA DE GOOGLE DRIVE DONDE SE GUARDARÁN LAS FOTOS
// (abre la carpeta en Drive y copia el ID del URL: drive.google.com/drive/folders/ESTE_ID)
const DRIVE_FOLDER_ID = '11z8EqF_DbjMKtLrFIkwqb4WrnR-IWZaS';

const HOJA = {
  solicitudes:    'Solicitudes',
  mecanicos:      'Mecanicos',
  clientes:       'Clientes',
  vehiculos:      'Vehiculos',
  servicios:      'Servicios',
  marcas:         'Marcas',
  config:         'Config',
  usuarios:       'Usuarios',
  pagos:          'Pagos',
  repuestos:      'Repuestos',
  bitacora:       'Bitacora',
  resumenOrdenes: 'ResumenOrdenes',
};

// Headers de la hoja ResumenOrdenes
const RESUMEN_HEADERS = [
  'solicitud_id', 'fecha', 'hora_entrada', 'cliente', 'telefono',
  'vehiculo', 'placa', 'kilometraje', 'estado', 'mecanico', 'notas',
  'servicios', 'total_servicios',
  'mano_obra_extra', 'total_mano_obra',
  'repuestos', 'total_repuestos',
  'inspeccion_visual',
  'total_orden',
  'pago_id', 'pago_metodo', 'pago_estado', 'pago_fecha', 'pago_monto',
];

// ── GET ─────────────────────────────────────────────────────────────
function doGet(e) {
  try {
    if (e.parameter.payload) {
      const body = JSON.parse(e.parameter.payload);
      return jsonOk(despacharAccion(body));
    }

    const recurso = e.parameter.recurso;
    const id      = e.parameter.id || null;

    switch (recurso) {
      case 'solicitudes': return jsonOk(id ? getSolicitud(id)  : getSolicitudes());
      case 'mecanicos':   return jsonOk(id ? getMecanico(id)   : getMecanicos());
      case 'clientes':    return jsonOk(id ? getCliente(id)    : getClientes());
      case 'vehiculos':   return jsonOk(getVehiculos());
      case 'servicios':   return jsonOk(getServicios());
      case 'marcas':      return jsonOk(getMarcas());
      case 'config':      return jsonOk(getConfig());
      case 'usuarios':    return jsonOk(id ? getUsuario(id)    : getUsuarios());
      case 'pagos':       return jsonOk(id ? getPago(id)       : getPagos());
      case 'repuestos':   return jsonOk(id ? getRepuesto(id)   : getRepuestos());
      case 'bitacora':    return jsonOk(getBitacora());
      default:            return jsonErr('Recurso no reconocido: ' + recurso);
    }
  } catch (err) {
    return jsonErr(err.message);
  }
}

// ── POST (para subir archivos — evita límite de URL) ────────────────
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    return jsonOk(despacharAccion(body));
  } catch (err) {
    return jsonErr(err.message);
  }
}

function despacharAccion(body) {
  const { accion, id, datos, cantidad } = body;
  switch (accion) {
    case 'crearSolicitud':    return crearSolicitud(datos);
    case 'editarSolicitud':   return editarSolicitud(id, datos);
    case 'tomarSolicitud':    return tomarSolicitud(id, body.mecanico);
    case 'cambiarEstado':     return cambiarEstado(id, body.estado);
    case 'eliminarSolicitud': return eliminarSolicitudCompleta(id);

    case 'crearMecanico':    return crearMecanico(datos);
    case 'editarMecanico':   return editarMecanico(id, datos);
    case 'eliminarMecanico': return eliminarFila(HOJA.mecanicos, id);

    case 'crearCliente':    return crearCliente(datos);
    case 'editarCliente':   return editarCliente(id, datos);
    case 'eliminarCliente': return eliminarFila(HOJA.clientes, id);

    case 'crearVehiculo':    return crearVehiculo(datos);
    case 'editarVehiculo':   return editarVehiculo(id, datos);
    case 'eliminarVehiculo': return eliminarFila(HOJA.vehiculos, id);

    case 'crearServicio':    return crearServicio(datos);
    case 'editarServicio':   return editarServicio(id, datos);
    case 'eliminarServicio': return eliminarFila(HOJA.servicios, id);

    case 'crearUsuario':    return crearUsuario(datos);
    case 'editarUsuario':   return editarUsuario(id, datos);
    case 'eliminarUsuario': return eliminarFila(HOJA.usuarios, id);
    case 'loginUsuario':    return loginUsuario(body.email, body.password);

    case 'crearPago':    return crearPago(datos);
    case 'editarPago':   return editarPago(id, datos);
    case 'eliminarPago': return eliminarFila(HOJA.pagos, id);

    case 'crearRepuesto':    return crearRepuesto(datos);
    case 'editarRepuesto':   return editarRepuesto(id, datos);
    case 'eliminarRepuesto': return eliminarFila(HOJA.repuestos, id);
    case 'ajustarStock':     return ajustarStock(id, cantidad);

    case 'guardarConfig': return guardarConfig(datos);
    case 'subirArchivo':  return subirArchivo(body.base64, body.nombre, body.tipo);
    case 'logBitacora':   return logBitacora(datos);

    case 'generarResumenOrdenes': return generarResumenOrdenes();
    case 'actualizarFilaResumen': return actualizarFilaResumen(id);

    // ── Hojas y campos dinámicos ──
    case 'crearHojaDinamica':   return crearHojaDinamica(body.nombre, body.headers);
    case 'agregarColumna':      return agregarColumna(body.hoja, body.columna);
    case 'eliminarHoja':        return eliminarHoja(body.nombre);
    case 'getHojasDinamicas':   return getHojasDinamicas();
    case 'insertarRegistro':    return insertarRegistro(body.hoja, datos);
    case 'editarRegistro':      return actualizarRegistro(body.hoja, id, datos);
    case 'eliminarRegistro':    return eliminarFila(body.hoja, id);
    case 'getRegistros':        return hojaToObjetos(body.hoja);

    default: throw new Error('Acción no reconocida: ' + accion);
  }
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function jsonOk(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonErr(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getHoja(nombre) {
  const h = SS.getSheetByName(nombre);
  if (!h) throw new Error('Hoja no encontrada: ' + nombre);
  return h;
}

function hojaToObjetos(nombre) {
  const h = getHoja(nombre);
  const vals = h.getDataRange().getValues();
  if (vals.length < 2) return [];
  const headers = vals[0].map(String);
  return vals.slice(1).map(row =>
    Object.fromEntries(headers.map((k, i) => [k, row[i] === '' ? null : row[i]]))
  );
}

function encontrarFila(nombre, id) {
  const h = getHoja(nombre);
  const vals = h.getDataRange().getValues();
  const headers = vals[0].map(String);
  const colId = headers.indexOf('id');
  if (colId === -1) throw new Error('Columna id no encontrada en ' + nombre);
  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][colId]) === String(id)) return { fila: i + 1, headers };
  }
  throw new Error('Registro no encontrado: ' + id);
}

function eliminarFila(nombre, id) {
  const { fila } = encontrarFila(nombre, id);
  getHoja(nombre).deleteRow(fila);
  return { eliminado: id };
}

function actualizarRegistro(nombre, id, datos) {
  const h = getHoja(nombre);
  const { fila, headers } = encontrarFila(nombre, id);
  Object.entries(datos).forEach(([key, val]) => {
    const col = headers.indexOf(key);
    if (col !== -1) h.getRange(fila, col + 1).setValue(val ?? '');
  });
  return { actualizado: id };
}

// ── Helper: genera el siguiente ID seguro leyendo el máximo existente
// Evita duplicados cuando se eliminan filas intermedias.
function siguienteId(nombreHoja, prefix) {
  const h = getHoja(nombreHoja);
  const lastRow = h.getLastRow();
  if (lastRow < 2) return prefix + '001';
  const headers = h.getRange(1, 1, 1, h.getLastColumn()).getValues()[0].map(String);
  const colId = headers.indexOf('id');
  if (colId === -1) return prefix + '001';
  const ids = h.getRange(2, colId + 1, lastRow - 1, 1).getValues().flat();
  const maxNum = ids
    .map(v => parseInt(String(v).replace(/\D/g, ''), 10))
    .filter(n => !isNaN(n))
    .reduce((max, n) => Math.max(max, n), 0);
  return prefix + String(maxNum + 1).padStart(3, '0');
}

// ═══════════════════════════════════════════════════════════════════
// ARCHIVOS / GOOGLE DRIVE
// ═══════════════════════════════════════════════════════════════════

function subirArchivo(base64, nombre, tipo) {
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const bytes  = Utilities.base64Decode(base64);
  const blob   = Utilities.newBlob(bytes, tipo || 'image/jpeg', nombre || ('foto_' + Date.now() + '.jpg'));
  const file   = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const url = 'https://drive.google.com/uc?export=view&id=' + file.getId();
  return { url, id: file.getId(), nombre: file.getName() };
}

// ═══════════════════════════════════════════════════════════════════
// SOLICITUDES
// ═══════════════════════════════════════════════════════════════════

function getSolicitudes() { return hojaToObjetos(HOJA.solicitudes); }
function getSolicitud(id)  { return hojaToObjetos(HOJA.solicitudes).find(s => String(s.id) === String(id)) || null; }

function crearSolicitud(datos) {
  const h = getHoja(HOJA.solicitudes);
  const headers = h.getRange(1, 1, 1, h.getLastColumn()).getValues()[0].map(String);
  const id = siguienteId(HOJA.solicitudes, 'S');
  const ahora = new Date().toISOString();
  const fila = headers.map(key => {
    if (key === 'id')        return id;
    if (key === 'fecha')     return datos.fecha || ahora;
    if (key === 'estado')    return datos.estado || 'Pendiente';
    if (key === 'creado_en') return ahora;
    return datos[key] !== undefined ? datos[key] : '';
  });
  h.appendRow(fila);
  // Registrar automáticamente en ResumenOrdenes
  try { actualizarFilaResumen(id); } catch(e) { Logger.log('ResumenOrdenes error: ' + e.message); }
  return { id, ...datos, estado: datos.estado || 'Pendiente' };
}

function editarSolicitud(id, datos) {
  const res = actualizarRegistro(HOJA.solicitudes, id, datos);
  try { actualizarFilaResumen(id); } catch(e) { Logger.log('ResumenOrdenes error: ' + e.message); }
  return res;
}

function tomarSolicitud(id, mecanico) {
  const res = actualizarRegistro(HOJA.solicitudes, id, {
    mecanico,
    estado:    'En proceso',
    tomado_en: new Date().toISOString(),
  });
  try { actualizarFilaResumen(id); } catch(e) { Logger.log('ResumenOrdenes error: ' + e.message); }
  return res;
}

function cambiarEstado(id, estado) {
  const datos = { estado };
  if (estado === 'Completada') datos.completado_en = new Date().toISOString();
  const res = actualizarRegistro(HOJA.solicitudes, id, datos);
  try { actualizarFilaResumen(id); } catch(e) { Logger.log('ResumenOrdenes error: ' + e.message); }
  return res;
}

function eliminarSolicitudCompleta(id) {
  eliminarFila(HOJA.solicitudes, id);
  try { eliminarSolicitudResumen(id); } catch(e) { Logger.log('ResumenOrdenes eliminar error: ' + e.message); }
  return { eliminado: id };
}

function eliminarSolicitudResumen(id) {
  const h = SS.getSheetByName(HOJA.resumenOrdenes);
  if (!h) return;
  const datos = h.getDataRange().getValues();
  const colId = RESUMEN_HEADERS.indexOf('solicitud_id');
  for (var i = 1; i < datos.length; i++) {
    if (String(datos[i][colId]) === String(id)) {
      h.deleteRow(i + 1);
      return;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// MECÁNICOS
// ═══════════════════════════════════════════════════════════════════

function getMecanicos() { return hojaToObjetos(HOJA.mecanicos); }
function getMecanico(id){ return hojaToObjetos(HOJA.mecanicos).find(m => String(m.id) === String(id)) || null; }

function crearMecanico(datos) {
  const h = getHoja(HOJA.mecanicos);
  const headers = h.getRange(1, 1, 1, h.getLastColumn()).getValues()[0].map(String);
  const id = siguienteId(HOJA.mecanicos, 'M');  // ← corregido
  const fila = headers.map(key => {
    if (key === 'id')     return id;
    if (key === 'activo') return datos.activo !== undefined ? datos.activo : true;
    return datos[key] !== undefined ? datos[key] : '';
  });
  h.appendRow(fila);
  return { id, ...datos };
}

function editarMecanico(id, datos) { return actualizarRegistro(HOJA.mecanicos, id, datos); }

// ═══════════════════════════════════════════════════════════════════
// CLIENTES
// ═══════════════════════════════════════════════════════════════════

function getClientes() { return hojaToObjetos(HOJA.clientes); }
function getCliente(id){ return hojaToObjetos(HOJA.clientes).find(c => String(c.id) === String(id)) || null; }

function crearCliente(datos) {
  const h = getHoja(HOJA.clientes);
  const headers = h.getRange(1, 1, 1, h.getLastColumn()).getValues()[0].map(String);
  const id = siguienteId(HOJA.clientes, 'C');  // ← corregido
  const fila = headers.map(key => key === 'id' ? id : (datos[key] ?? ''));
  h.appendRow(fila);
  return { id, ...datos };
}

function editarCliente(id, datos) { return actualizarRegistro(HOJA.clientes, id, datos); }

// ═══════════════════════════════════════════════════════════════════
// VEHÍCULOS
// ═══════════════════════════════════════════════════════════════════

function getVehiculos() { return hojaToObjetos(HOJA.vehiculos); }

function crearVehiculo(datos) {
  const h = getHoja(HOJA.vehiculos);
  const headers = h.getRange(1, 1, 1, h.getLastColumn()).getValues()[0].map(String);
  const id = siguienteId(HOJA.vehiculos, 'V');  // ← corregido
  const ahora = new Date().toISOString();
  const fila = headers.map(key => {
    if (key === 'id')        return id;
    if (key === 'creado_en') return ahora;
    return datos[key] !== undefined ? datos[key] : '';
  });
  h.appendRow(fila);
  return { id, ...datos };
}

function editarVehiculo(id, datos) { return actualizarRegistro(HOJA.vehiculos, id, datos); }

// ═══════════════════════════════════════════════════════════════════
// SERVICIOS
// ═══════════════════════════════════════════════════════════════════

function getServicios() { return hojaToObjetos(HOJA.servicios); }

function crearServicio(datos) {
  const h = getHoja(HOJA.servicios);
  const headers = h.getRange(1, 1, 1, h.getLastColumn()).getValues()[0].map(String);
  const id = siguienteId(HOJA.servicios, 'SV');  // ← corregido
  const fila = headers.map(key => {
    if (key === 'id')     return id;
    if (key === 'activo') return datos.activo !== undefined ? datos.activo : true;
    return datos[key] !== undefined ? datos[key] : '';
  });
  h.appendRow(fila);
  return { id, ...datos };
}

function editarServicio(id, datos) { return actualizarRegistro(HOJA.servicios, id, datos); }

// ═══════════════════════════════════════════════════════════════════
// MARCAS
// ═══════════════════════════════════════════════════════════════════

function getMarcas() { return hojaToObjetos(HOJA.marcas); }

// ═══════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════

function getConfig() {
  const filas = hojaToObjetos(HOJA.config);
  return Object.fromEntries(filas.map(f => [f.clave, f.valor]));
}

function guardarConfig(datos) {
  const h = getHoja(HOJA.config);
  const vals = h.getDataRange().getValues();
  const headers = vals[0].map(String);
  const colClave = headers.indexOf('clave');
  const colValor = headers.indexOf('valor');

  Object.entries(datos).forEach(([clave, valor]) => {
    let encontrado = false;
    for (let i = 1; i < vals.length; i++) {
      if (String(vals[i][colClave]) === String(clave)) {
        h.getRange(i + 1, colValor + 1).setValue(valor);
        encontrado = true;
        break;
      }
    }
    if (!encontrado) {
      const fila = headers.map(k => k === 'clave' ? clave : k === 'valor' ? valor : '');
      h.appendRow(fila);
    }
  });
  return { guardado: true };
}

// ═══════════════════════════════════════════════════════════════════
// USUARIOS
// ═══════════════════════════════════════════════════════════════════

function getUsuarios() { return hojaToObjetos(HOJA.usuarios); }
function getUsuario(id){ return hojaToObjetos(HOJA.usuarios).find(u => String(u.id) === String(id)) || null; }

function crearUsuario(datos) {
  const h = getHoja(HOJA.usuarios);
  const headers = h.getRange(1, 1, 1, h.getLastColumn()).getValues()[0].map(String);
  const id = siguienteId(HOJA.usuarios, 'U');  // ← corregido
  const fila = headers.map(key => {
    if (key === 'id')     return id;
    if (key === 'activo') return datos.activo !== undefined ? datos.activo : true;
    return datos[key] !== undefined ? datos[key] : '';
  });
  h.appendRow(fila);
  return { id, ...datos };
}

function editarUsuario(id, datos) { return actualizarRegistro(HOJA.usuarios, id, datos); }

function loginUsuario(email, password) {
  const usuarios = getUsuarios();
  const u = usuarios.find(
    x => x.email === email && String(x.password) === String(password) && x.activo
  );
  if (!u) throw new Error('Credenciales inválidas');
  return { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol };
}

// ═══════════════════════════════════════════════════════════════════
// PAGOS
// ═══════════════════════════════════════════════════════════════════

function getPagos() { return hojaToObjetos(HOJA.pagos); }
function getPago(id){ return hojaToObjetos(HOJA.pagos).find(p => String(p.id) === String(id)) || null; }

function crearPago(datos) {
  const h = getHoja(HOJA.pagos);
  const headers = h.getRange(1, 1, 1, h.getLastColumn()).getValues()[0].map(String);
  const id = siguienteId(HOJA.pagos, 'P');  // ← corregido
  const ahora = new Date().toISOString();
  const fila = headers.map(key => {
    if (key === 'id')        return id;
    if (key === 'fecha')     return datos.fecha || ahora;
    if (key === 'creado_en') return ahora;
    return datos[key] !== undefined ? datos[key] : '';
  });
  h.appendRow(fila);
  return { id, ...datos };
}

function editarPago(id, datos) { return actualizarRegistro(HOJA.pagos, id, datos); }

// ═══════════════════════════════════════════════════════════════════
// REPUESTOS / INVENTARIO
// ═══════════════════════════════════════════════════════════════════

function getRepuestos() { return hojaToObjetos(HOJA.repuestos); }
function getRepuesto(id){ return hojaToObjetos(HOJA.repuestos).find(r => String(r.id) === String(id)) || null; }

function crearRepuesto(datos) {
  const h = getHoja(HOJA.repuestos);
  const headers = h.getRange(1, 1, 1, h.getLastColumn()).getValues()[0].map(String);
  const id = siguienteId(HOJA.repuestos, 'R');  // ← corregido
  const fila = headers.map(key => {
    if (key === 'id')    return id;
    if (key === 'stock') return datos.stock !== undefined ? datos.stock : 0;
    return datos[key] !== undefined ? datos[key] : '';
  });
  h.appendRow(fila);
  return { id, ...datos };
}

function editarRepuesto(id, datos) { return actualizarRegistro(HOJA.repuestos, id, datos); }

function ajustarStock(id, cantidad) {
  const h = getHoja(HOJA.repuestos);
  const { fila, headers } = encontrarFila(HOJA.repuestos, id);
  const colStock = headers.indexOf('stock');
  if (colStock === -1) throw new Error('Columna stock no encontrada');
  const actual = Number(h.getRange(fila, colStock + 1).getValue()) || 0;
  h.getRange(fila, colStock + 1).setValue(actual + Number(cantidad));
  return { id, stock: actual + Number(cantidad) };
}

// ═══════════════════════════════════════════════════════════════════
// BITÁCORA
// ═══════════════════════════════════════════════════════════════════

function getBitacora() { return hojaToObjetos(HOJA.bitacora); }

function logBitacora(datos) {
  const h = getHoja(HOJA.bitacora);
  const headers = h.getRange(1, 1, 1, h.getLastColumn()).getValues()[0].map(String);
  const fila = headers.map(key => {
    if (key === 'fecha') return new Date().toISOString();
    return datos[key] !== undefined ? datos[key] : '';
  });
  h.appendRow(fila);
  return { ok: true };
}

// ═══════════════════════════════════════════════════════════════════
// HOJAS Y CAMPOS DINÁMICOS
// ═══════════════════════════════════════════════════════════════════

// Crea una hoja nueva con los headers indicados.
// Si ya existe, solo devuelve sus headers actuales sin modificarla.
// nombre: string — nombre de la hoja
// headers: string[] — columnas. Siempre se agrega 'id' al inicio si no viene.
function crearHojaDinamica(nombre, headers) {
  if (!nombre || typeof nombre !== 'string') throw new Error('nombre es requerido');
  const cols = Array.isArray(headers) && headers.length ? headers : ['id'];
  if (!cols.includes('id')) cols.unshift('id');

  let h = SS.getSheetByName(nombre);
  if (h) return { existia: true, nombre, headers: h.getRange(1, 1, 1, h.getLastColumn()).getValues()[0] };

  h = SS.insertSheet(nombre);
  h.appendRow(cols);
  const rng = h.getRange(1, 1, 1, cols.length);
  rng.setFontWeight('bold');
  rng.setBackground('#1e3a5f');
  rng.setFontColor('#ffffff');
  h.setFrozenRows(1);
  return { creada: true, nombre, headers: cols };
}

// Agrega una columna nueva al final de una hoja existente.
// Si la columna ya existe no hace nada.
// hoja: string — nombre de la hoja
// columna: string — nombre de la columna nueva
function agregarColumna(hoja, columna) {
  if (!hoja || !columna) throw new Error('hoja y columna son requeridos');
  const h = getHoja(hoja);
  const headers = h.getRange(1, 1, 1, h.getLastColumn()).getValues()[0].map(String);
  if (headers.includes(columna)) return { existia: true, hoja, columna };
  const nuevaCol = headers.length + 1;
  h.getRange(1, nuevaCol).setValue(columna);
  h.getRange(1, nuevaCol).setFontWeight('bold').setBackground('#1e3a5f').setFontColor('#ffffff');
  return { agregada: true, hoja, columna, posicion: nuevaCol };
}

// Elimina una hoja por nombre. Protege las hojas del sistema.
function eliminarHoja(nombre) {
  const PROTEGIDAS = Object.values(HOJA);
  if (PROTEGIDAS.includes(nombre)) throw new Error('No se puede eliminar una hoja del sistema: ' + nombre);
  const h = SS.getSheetByName(nombre);
  if (!h) throw new Error('Hoja no encontrada: ' + nombre);
  SS.deleteSheet(h);
  return { eliminada: nombre };
}

// Lista todas las hojas del spreadsheet con sus headers.
function getHojasDinamicas() {
  return SS.getSheets().map(function(h) {
    const nombre = h.getName();
    const lastCol = h.getLastColumn();
    const headers = lastCol > 0 ? h.getRange(1, 1, 1, lastCol).getValues()[0].map(String) : [];
    const lastRow = h.getLastRow();
    return { nombre, headers, totalFilas: Math.max(0, lastRow - 1) };
  });
}

// Inserta un registro en cualquier hoja por nombre.
// Usa siguienteId automáticamente si la hoja tiene columna 'id'.
function insertarRegistro(hoja, datos) {
  if (!hoja) throw new Error('hoja es requerida');
  const h = getHoja(hoja);
  const headers = h.getRange(1, 1, 1, h.getLastColumn()).getValues()[0].map(String);
  const colId = headers.indexOf('id');
  const id = colId !== -1 ? siguienteId(hoja, hoja.charAt(0).toUpperCase()) : null;
  const ahora = new Date().toISOString();
  const fila = headers.map(function(key) {
    if (key === 'id' && id)        return id;
    if (key === 'creado_en')       return ahora;
    if (key === 'fecha' && !datos.fecha) return ahora;
    return datos[key] !== undefined ? datos[key] : '';
  });
  h.appendRow(fila);
  return { id: id || true, ...datos };
}

function testDrive() {
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  Logger.log('Carpeta: ' + folder.getName());
}

// ═══════════════════════════════════════════════════════════════════
// RESUMEN ÓRDENES — una fila completa por solicitud
// ═══════════════════════════════════════════════════════════════════

// Parsea el campo "marca" y devuelve { servicios, manoObra, repuestos, inspeccion }
function parsarMarca(marca) {
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

  const servicios = [], manoObra = [], repuestos = [], inspeccion = [];

  if (!marca || typeof marca !== 'string' || !marca.trim()) {
    return { servicios, manoObra, repuestos, inspeccion };
  }

  marca.split('|').forEach(function(parte) {
    parte = parte.trim();
    if (!parte) return;

    if (parte.startsWith('S:')) {
      const p = parte.split(':');
      servicios.push({ nombre: p[1] || '', precio: parseFloat(p[2]) || 0 });

    } else if (parte.startsWith('M:')) {
      const p = parte.split(':');
      manoObra.push({ desc: p[1] || '', precio: parseFloat(p[2]) || 0 });

    } else if (parte.startsWith('R:')) {
      const p = parte.split(':');
      repuestos.push({ id: p[1] || '', desc: p[2] || '', precio: parseFloat(p[3]) || 0 });

    } else if (parte.startsWith('I:')) {
      // Normalizar doble :: legacy → __
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

  return { servicios, manoObra, repuestos, inspeccion };
}

// Asegura que la hoja ResumenOrdenes exista con sus headers
function asegurarHojaResumen() {
  let h = SS.getSheetByName(HOJA.resumenOrdenes);
  if (!h) {
    h = SS.insertSheet(HOJA.resumenOrdenes);
    h.appendRow(RESUMEN_HEADERS);
    // Formato del encabezado
    const rng = h.getRange(1, 1, 1, RESUMEN_HEADERS.length);
    rng.setFontWeight('bold');
    rng.setBackground('#1e3a5f');
    rng.setFontColor('#ffffff');
    h.setFrozenRows(1);
  }
  return h;
}

// Construye la fila de resumen para una solicitud dado su id
function construirFilaResumen(sol, pagosMap) {
  const marca   = parsarMarca(sol.marca);
  const pago    = pagosMap[String(sol.id)] || {};

  // Servicios
  const svcTexto   = marca.servicios.map(function(s) { return s.nombre + ' (Q' + s.precio.toFixed(2) + ')'; }).join(' | ');
  const totalSvc   = marca.servicios.reduce(function(t, s) { return t + s.precio; }, 0);

  // Mano de obra extra
  const moTexto    = marca.manoObra.map(function(m) { return m.desc + ' (Q' + m.precio.toFixed(2) + ')'; }).join(' | ');
  const totalMO    = marca.manoObra.reduce(function(t, m) { return t + m.precio; }, 0);

  // Repuestos
  const repTexto   = marca.repuestos.map(function(r) { return r.desc + ' (Q' + r.precio.toFixed(2) + ')'; }).join(' | ');
  const totalRep   = marca.repuestos.reduce(function(t, r) { return t + r.precio; }, 0);

  // Inspección
  const inspTexto  = marca.inspeccion.map(function(d) { return d.zona + ': ' + d.tipo; }).join(' | ');

  // Si no hay S: guardados, usar campo servicio + precio total como fallback
  const svcFinal   = svcTexto || (sol.servicio ? String(sol.servicio) : '—');
  const totalSvcFinal = totalSvc || 0;

  const totalOrden = parseFloat(pago.monto) || parseFloat(sol.precio) || 0;

  const mecanico = sol.mecanico
    ? (typeof sol.mecanico === 'object' ? (sol.mecanico.nombre || sol.mecanico.name || '') : String(sol.mecanico))
    : '—';

  return RESUMEN_HEADERS.map(function(col) {
    switch(col) {
      case 'solicitud_id':    return String(sol.id || '');
      case 'fecha':           return String(sol.fecha || '');
      case 'hora_entrada':    return String(sol.horaEntrada || '');
      case 'cliente':         return String(sol.cliente || '');
      case 'telefono':        return String(sol.telefono || '');
      case 'vehiculo':        return String(sol.vehiculo || '');
      case 'placa':           return String(sol.placa || '');
      case 'kilometraje':     return sol.kilometraje || '';
      case 'estado':          return String(sol.estado || '');
      case 'mecanico':        return mecanico;
      case 'notas':           return String(sol.notas || '');
      case 'servicios':       return svcFinal;
      case 'total_servicios': return totalSvcFinal;
      case 'mano_obra_extra': return moTexto || '—';
      case 'total_mano_obra': return totalMO;
      case 'repuestos':       return repTexto || '—';
      case 'total_repuestos': return totalRep;
      case 'inspeccion_visual': return inspTexto || '—';
      case 'total_orden':     return totalOrden;
      case 'pago_id':         return String(pago.id || '—');
      case 'pago_metodo':     return String(pago.metodo || '—');
      case 'pago_estado':     return String(pago.estado || '—');
      case 'pago_fecha':      return String(pago.fecha || '—');
      case 'pago_monto':      return parseFloat(pago.monto) || 0;
      default:                return '';
    }
  });
}

// Regenera TODA la hoja ResumenOrdenes desde cero (todas las solicitudes)
function generarResumenOrdenes() {
  const h = asegurarHojaResumen();

  // Limpiar filas de datos (mantener header)
  const lastRow = h.getLastRow();
  if (lastRow > 1) h.deleteRows(2, lastRow - 1);

  const solicitudes = hojaToObjetos(HOJA.solicitudes);
  const pagos       = hojaToObjetos(HOJA.pagos);

  // Mapa solicitud_id → pago
  const pagosMap = {};
  pagos.forEach(function(p) {
    if (p.solicitud_id) pagosMap[String(p.solicitud_id)] = p;
  });

  if (!solicitudes.length) return { generadas: 0 };

  const filas = solicitudes
    .sort(function(a, b) { return String(a.id).localeCompare(String(b.id)); })
    .map(function(sol) { return construirFilaResumen(sol, pagosMap); });

  h.getRange(2, 1, filas.length, RESUMEN_HEADERS.length).setValues(filas);

  // Auto-ancho columnas
  for (var i = 1; i <= RESUMEN_HEADERS.length; i++) h.autoResizeColumn(i);

  return { generadas: filas.length };
}

// Agrega o actualiza la fila de una sola solicitud en ResumenOrdenes
function actualizarFilaResumen(id) {
  const h = asegurarHojaResumen();

  const solicitudes = hojaToObjetos(HOJA.solicitudes);
  const sol = solicitudes.find(function(s) { return String(s.id) === String(id); });
  if (!sol) throw new Error('Solicitud no encontrada: ' + id);

  const pagos = hojaToObjetos(HOJA.pagos);
  const pagosMap = {};
  pagos.forEach(function(p) { if (p.solicitud_id) pagosMap[String(p.solicitud_id)] = p; });

  const nuevaFila = construirFilaResumen(sol, pagosMap);

  // Buscar si ya existe la fila
  const datos = h.getDataRange().getValues();
  const colId = RESUMEN_HEADERS.indexOf('solicitud_id');
  for (var i = 1; i < datos.length; i++) {
    if (String(datos[i][colId]) === String(id)) {
      h.getRange(i + 1, 1, 1, RESUMEN_HEADERS.length).setValues([nuevaFila]);
      return { actualizado: id };
    }
  }

  // No existe → agregar al final
  h.appendRow(nuevaFila);
  return { creado: id };
}
