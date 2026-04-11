# AUTO+ — Sistema de Gestión de Taller Automotriz

Aplicación web para taller mecánico. Permite registrar solicitudes de servicio, dar seguimiento a órdenes de trabajo, gestionar clientes y vehículos, y generar reportes.

## Stack

- React 19 + Vite 5 + React Router DOM v7
- Tailwind CSS v3 (PostCSS)
- react-hot-toast — notificaciones
- Google Sheets como base de datos (Google Apps Script Web App como backend REST)

## Requisitos

- Node 18 (incompatible con Vite 7 y Tailwind v4)

## Instalación

```bash
npm install
npm run dev
```

## Credenciales de prueba

- Email: `admin@drivebot.com`
- Password: `admin123`

## Paleta de colores

| Token         | Valor     | Uso                              |
|---------------|-----------|----------------------------------|
| `primary`     | `#1F2A56` | Sidebar, headers, nav activo     |
| `accent`      | `#E10600` | Botones CTA, ítems activos       |
| `highlight`   | `#F57C00` | Hover, indicadores               |
| `background`  | `#F4F6F8` | Fondo general                    |
| `text-main`   | `#2B2B2B` | Texto principal                  |

## Estructura de páginas

| Ruta              | Página            | Descripción                                          |
|-------------------|-------------------|------------------------------------------------------|
| `/login`          | Login.jsx         | Pantalla de acceso                                   |
| `/`               | Home.jsx          | Dashboard con stats y tabla de solicitudes recientes |
| `/solicitudes`    | Solicitudes.jsx   | Listado completo de solicitudes                      |
| `/nueva`          | NuevaSolicitud.jsx| Wizard 4 pasos para crear orden de trabajo           |
| `/seguimiento`    | Seguimiento.jsx   | Timeline de estado por vehículo/orden                |
| `/servicios`      | Servicios.jsx     | Catálogo de servicios del taller                     |
| `/catalogos`      | Catalogos.jsx     | Admin: clientes, mecánicos, marcas, servicios        |
| `/reportes`       | Reportes.jsx      | Reportes y métricas                                  |
| `/scaner`         | Scaner.jsx        | Módulo de escaneo                                    |

## Contextos principales

- `AuthContext` — autenticación (mock local + Google Sheets)
- `CatalogosContext` — clientes, vehículos, mecánicos, marcas, servicios, config negocio
- `SolicitudesContext` — CRUD de solicitudes + llama `eliminarDetalleOrden` al borrar
- `PagosContext` — CRUD de pagos vinculados a solicitudes

## Backend (Google Apps Script)

El archivo `src/services/sheetsApi.js` expone el cliente REST que conecta con un Google Apps Script publicado como Web App. Todas las operaciones (crear, editar, eliminar) pasan por ahí.

Recursos disponibles: `solicitudes`, `clientes`, `vehiculos`, `mecanicos`, `servicios`, `marcas`, `pagos`, `repuestos`, `config`, `usuarios`.

URL actual del Web App (actualizar aquí y en `sheetsApi.js` al redesplegar):
```
https://script.google.com/macros/s/AKfycby2GvR3J2L1XXIpFqG8WzoM_MQ7qrTtsL3wxxn3hVuvlRtvYBdAOXsiuHk_5Wx8T9RM/exec
```

## Wizard NuevaSolicitud

1. Datos del cliente (nombre, tel, email)
2. Datos del vehículo (marca, modelo, año, placa, km)
3. Tipo de servicio + adicionales + observaciones + inspección visual
4. Orden de trabajo estilo factura (logo, No. orden auto-generado, tabla de servicios)

---

## Hojas de Google Sheets

| Hoja | Descripción |
|------|-------------|
| `Solicitudes` | Registro principal de órdenes |
| `Clientes` | Catálogo de clientes |
| `Vehiculos` | Vehículos vinculados a clientes |
| `Mecanicos` | Personal mecánico |
| `Servicios` | Catálogo de servicios con precio y categoría |
| `Repuestos` | Inventario con stock |
| `Pagos` | Pagos vinculados a solicitudes |
| `Usuarios` | Admin/supervisor con login |
| `Config` | Configuración del taller |
| `Bitacora` | Log de eventos del sistema |
| `ResumenOrdenes` | Resumen financiero automático (1 fila por solicitud) |
| `DetalleOrdenes` | Detalle itemizado completo (1 fila por solicitud, columnas fijas) |

---

## Campo `marca` (campo clave en Solicitudes)

Almacena los ítems de una orden en formato compacto separado por `|`:

| Prefijo | Formato | Ejemplo |
|---------|---------|---------|
| `S:` | Servicio con precio individual | `S:Pintura completa:1500` |
| `R:` | Repuesto | `R:12:Filtro de aceite:250` |
| `M:` | Mano de obra | `M:Revisión de frenos:300` |
| `I:` | Inspección visual | `I:frontal__capot:rayon` |

**Compatibilidad hacia atrás**: registros anteriores sin prefijo `S:` usan división igual del total entre servicios. El parser lo maneja automáticamente en `detalleOrden.js` y `Reportes.jsx`.

**Bug histórico resuelto**: las claves de inspección se guardaban con `::` doble (ej. `frontal::capot`). El parser normaliza `::` → `__` al leer.

---

## DetalleOrdenes — estructura

Columnas fijas (se crea automáticamente al crear la primera solicitud vía `crearHojaDinamica`):

```
id | solicitud_id | fecha | cliente | vehiculo | placa
serv1..serv20  + precio_serv1..precio_serv20   (20 slots servicios)
rep1..rep20    + precio_rep1..precio_rep20     (20 slots repuestos)
mo1..mo10      + precio_mo1..precio_mo10       (10 slots mano de obra)
insp1..insp10  + tipo_insp1..tipo_insp10       (10 slots inspecciones)
total_orden
```

Helper: `src/services/detalleOrden.js`

---

## ResumenOrdenes

Se actualiza automáticamente en cada `crearSolicitud`, `editarSolicitud`, `tomarSolicitud` y `cambiarEstado` desde el GAS. No requiere acción manual.

---

## Flujo completo por acción

**Crear solicitud**
1. `NuevaSolicitud.jsx` construye `marcaStr` con precios individuales por ítem
2. GAS inserta en `Solicitudes` y actualiza `ResumenOrdenes`
3. Frontend llama `guardarDetalleOrden` → crea fila en `DetalleOrdenes`

**Imprimir factura (Reportes.jsx)**
1. Si hay extras (mano de obra o repuestos agregados en Reportes), se llama `guardarDetalleOrden` con los extras antes de `window.print()`
2. `DetalleOrdenes` queda con el detalle completo + `total_orden`

**Eliminar solicitud**
1. Elimina de `Solicitudes`
2. GAS elimina fila de `ResumenOrdenes`
3. Frontend llama `eliminarDetalleOrden` → elimina fila de `DetalleOrdenes`
4. Frontend elimina pagos vinculados

---

## Funciones genéricas en GAS (sin redespliegue)

| Acción | Descripción |
|--------|-------------|
| `crearHojaDinamica` | Crea hoja con headers si no existe |
| `agregarColumna` | Agrega columna a hoja existente |
| `eliminarHoja` | Elimina hoja (protege hojas del sistema) |
| `getHojasDinamicas` | Lista todas las hojas con headers y total de filas |
| `getRegistros` | Lee todas las filas de una hoja |
| `insertarRegistro` | Inserta fila en cualquier hoja |
| `editarRegistro` | Edita fila por id en cualquier hoja |
| `eliminarRegistro` | Elimina fila por id en cualquier hoja |
