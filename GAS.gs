// ═══════════════════════════════════════════════════════════════════
// DRIVEBOT — Google Apps Script Web App
// ═══════════════════════════════════════════════════════════════════

const SS = SpreadsheetApp.getActiveSpreadsheet();

// ← PON AQUÍ EL ID DE LA CARPETA DE GOOGLE DRIVE DONDE SE GUARDARÁN LAS FOTOS
// (abre la carpeta en Drive y copia el ID del URL: drive.google.com/drive/folders/ESTE_ID)
const DRIVE_FOLDER_ID = '11z8EqF_DbjMKtLrFIkwqb4WrnR-IWZaS';

const HOJA = {
  solicitudes: 'Solicitudes',
  mecanicos:   'Mecanicos',
  clientes:    'Clientes',
  vehiculos:   'Vehiculos',
  servicios:   'Servicios',
  marcas:      'Marcas',
  config:      'Config',
  usuarios:    'Usuarios',
  pagos:       'Pagos',
  repuestos:   'Repuestos',
  bitacora:    'Bitacora',
};

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
    case 'eliminarSolicitud': return eliminarFila(HOJA.solicitudes, id);

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
  const id = siguienteId(HOJA.solicitudes, 'S');  // ← corregido
  const ahora = new Date().toISOString();
  const fila = headers.map(key => {
    if (key === 'id')        return id;
    if (key === 'fecha')     return datos.fecha || ahora;
    if (key === 'estado')    return datos.estado || 'Pendiente';
    if (key === 'creado_en') return ahora;
    return datos[key] !== undefined ? datos[key] : '';
  });
  h.appendRow(fila);
  return { id, ...datos, estado: datos.estado || 'Pendiente' };
}

function editarSolicitud(id, datos)   { return actualizarRegistro(HOJA.solicitudes, id, datos); }

function tomarSolicitud(id, mecanico) {
  return actualizarRegistro(HOJA.solicitudes, id, {
    mecanico,
    estado:    'En proceso',
    tomado_en: new Date().toISOString(),
  });
}

function cambiarEstado(id, estado) {
  const datos = { estado };
  if (estado === 'Completada') datos.completado_en = new Date().toISOString();
  return actualizarRegistro(HOJA.solicitudes, id, datos);
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

function testDrive() {
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  Logger.log('Carpeta: ' + folder.getName());
}
